// @ts-check
/**
 * 通知日志仓库
 *
 * 用途：每次发送通知（成功 / 失败）都记录一条；用于"通知历史"页和
 * "为什么没收到通知"自助排查。
 *
 * Key 规则：
 *   notify_log:{ymdh}:{subId}:{ruleId}:{channel}
 *     ymdh    = "YYYYMMDDHH"（UTC，方便按时间区间 list）
 *     subId   = 订阅 ID
 *     ruleId  = 触发的规则 ID（手动触发可填 'manual'，第三方 API 可填 'thirdparty'）
 *     channel = 通知渠道（telegram, bark, ...）
 *
 *   一条 KV 同时还存储进 metadata 里 ymdhmsRand，避免同小时内重复 key 覆盖。
 *
 * 默认 TTL：30 天，过期自动清理。失败日志可单独配置更长 TTL（这里统一 30 天即可，
 * 后续如需可改 writeLog 接受 ttl 参数）。
 *
 */

const PREFIX = 'notify_log:';
const DEFAULT_TTL_SEC = 30 * 24 * 3600;

/**
 * @typedef {Object} NotifyLogEntry
 * @property {string} key 完整 KV key
 * @property {string} timestamp ISO 时间
 * @property {string} subId
 * @property {string|null} ruleId 触发规则；手动 / 第三方为占位字符串
 * @property {string} channel
 * @property {'success'|'failed'} status
 * @property {string} [title]
 * @property {string} [content]
 * @property {string} [error] 失败原因
 * @property {any} [raw] 三方原始返回，便于排查
 */

/**
 * 把 Date 转成 'YYYYMMDDHH' UTC 字符串。
 *
 * @param {Date | string | number} date
 * @returns {string}
 */
export function ymdhUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return ymdhUtc(new Date());
  }
  const yyyy = String(d.getUTCFullYear()).padStart(4, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}`;
}

/**
 * 写入一条通知日志。
 *
 * @param {{ SUBSCRIPTIONS_KV: KVNamespace }} env
 * @param {{
 *   subId: string,
 *   ruleId?: string|null,
 *   channel: string,
 *   status: 'success'|'failed',
 *   title?: string,
 *   content?: string,
 *   error?: string,
 *   raw?: any,
 *   timestamp?: string|Date|number,
 *   ttlSec?: number
 * }} entry
 * @returns {Promise<NotifyLogEntry>}
 */
export async function writeLog(env, entry) {
  const ts = entry.timestamp ? new Date(entry.timestamp) : new Date();
  // 增加随机后缀避免同小时同 sub/rule/channel 多次发送相互覆盖
  const rand = Math.floor(ts.getTime() % 100000)
    .toString(36)
    .padStart(4, '0');
  const ruleId = entry.ruleId || 'none';
  const key = `${PREFIX}${ymdhUtc(ts)}:${entry.subId}:${ruleId}:${entry.channel}:${rand}`;

  const stored = {
    timestamp: ts.toISOString(),
    subId: entry.subId,
    ruleId,
    channel: entry.channel,
    status: entry.status,
    title: entry.title,
    content: entry.content,
    error: entry.error,
    raw: entry.raw
  };

  await env.SUBSCRIPTIONS_KV.put(key, JSON.stringify(stored), {
    expirationTtl: Math.max(60, entry.ttlSec || DEFAULT_TTL_SEC)
  });

  return { key, ...stored };
}

/**
 * 查询通知日志。
 *
 * 返回数组（与历史签名完全兼容，见 queryPage 获取游标分页）。
 *
 * @param {{ SUBSCRIPTIONS_KV: KVNamespace }} env
 * @param {{
 *   subId?: string,
 *   channel?: string,
 *   status?: 'success'|'failed',
 *   since?: string|Date|number,
 *   until?: string|Date|number,
 *   limit?: number,
 *   cursor?: string
 * }} [filter]
 * @returns {Promise<NotifyLogEntry[]>}
 */
export async function query(env, filter = {}) {
  const { items } = await queryInternal(env, filter);
  return items;
}

/**
 * 游标分页查询通知日志。
 *
 * 返回 { items, nextCursor }：
 *   - items      本页日志（按时间倒序）
 *   - nextCursor 下一页的游标（ymdh UTC 字符串）；null 表示没有更多
 *
 * 实现：key 前缀 `notify_log:{ymdh}` 按 UTC 小时分桶，字典序天然按时间升序。
 * 从最新小时（或 cursor 指定小时）开始逐小时 `KV.list` 下钻，
 * 只扫描到凑够 limit 就停，不再像旧实现那样全量扫前缀（最多 5000 key）后内存排序。
 *
 * @param {{ SUBSCRIPTIONS_KV: KVNamespace }} env
 * @param {{
 *   subId?: string,
 *   channel?: string,
 *   status?: 'success'|'failed',
 *   since?: string|Date|number,
 *   until?: string|Date|number,
 *   limit?: number,
 *   cursor?: string
 * }} [filter]
 * @returns {Promise<{ items: NotifyLogEntry[], nextCursor: string|null }>}
 */
export async function queryPage(env, filter = {}) {
  return queryInternal(env, filter);
}

/**
 * query / queryPage 的公共实现。
 */
async function queryInternal(env, filter = {}) {
  const limit = Math.min(500, Math.max(1, filter.limit || 100));
  const sinceMs = filter.since ? new Date(filter.since).getTime() : 0;
  const untilMs = filter.until ? new Date(filter.until).getTime() : Number.POSITIVE_INFINITY;

  const out = [];

  // 起始小时：优先 cursor（含该小时），否则从 until / 当前时刻所在小时开始
  let currentHour;
  if (filter.cursor && /^\d{10}$/.test(String(filter.cursor))) {
    currentHour = String(filter.cursor);
  } else {
    const anchor = untilMs === Number.POSITIVE_INFINITY ? Date.now() : Math.min(Date.now(), untilMs);
    currentHour = ymdhUtc(new Date(anchor));
  }

  // 最多扫 30 天 × 24 小时 = 720 个小时桶；逐页翻时可继续（nextCursor 仍有效）
  const MAX_SCAN = 720;
  let guard = 0;

  while (out.length < limit && guard < MAX_SCAN) {
    guard++;
    const res = await env.SUBSCRIPTIONS_KV.list({
      prefix: PREFIX + currentHour,
      limit: 1000
    });
    // 同小时桶内按 key 倒序（rand 后缀近似时间倒序）
    const keys = res.keys.map((k) => k.name).sort((a, b) => b.localeCompare(a));
    for (const key of keys) {
      if (out.length >= limit) break;
      const raw = await env.SUBSCRIPTIONS_KV.get(key);
      if (!raw) continue;
      try {
        const obj = JSON.parse(raw);
        if (filter.subId && obj.subId !== filter.subId) continue;
        if (filter.channel && obj.channel !== filter.channel) continue;
        if (filter.status && obj.status !== filter.status) continue;
        const tsMs = new Date(obj.timestamp).getTime();
        if (tsMs < sinceMs || tsMs > untilMs) continue;
        out.push({ key, ...obj });
      } catch {
        /* skip */
      }
    }

    // 前移一小时（UTC）
    const prev = hourMinus1(currentHour);
    if (prev === currentHour) {
      currentHour = null;
      break;
    }
    // since 下界：下一小时完全早于 since 时不再往前扫
    if (sinceMs > 0) {
      const hourStartMs = Date.UTC(
        Number(prev.slice(0, 4)),
        Number(prev.slice(4, 6)) - 1,
        Number(prev.slice(6, 8)),
        Number(prev.slice(8, 10))
      );
      if (hourStartMs < sinceMs) {
        currentHour = null;
        break;
      }
    }
    currentHour = prev;
  }

  return { items: out, nextCursor: currentHour };
}

/**
 * UTC ymdh 字符串减一小时；越界返回原值（调用方据此判定终止）。
 * @param {string} ymdh 'YYYYMMDDHH'
 * @returns {string}
 */
function hourMinus1(ymdh) {
  const d = new Date(Date.UTC(
    Number(ymdh.slice(0, 4)),
    Number(ymdh.slice(4, 6)) - 1,
    Number(ymdh.slice(6, 8)),
    Number(ymdh.slice(8, 10))
  ));
  d.setUTCHours(d.getUTCHours() - 1);
  const next = ymdhUtc(d);
  return next === ymdh ? ymdh : next;
}

/**
 * 取某订阅最近 N 条日志（仪表盘 / 详情页用）。
 *
 * @param {{ SUBSCRIPTIONS_KV: KVNamespace }} env
 * @param {string} subId
 * @param {number} [limit=20]
 */
export async function recentForSubscription(env, subId, limit = 20) {
  return query(env, { subId, limit });
}
