import { getKVJson, putKVJson } from './kv.js';

const DEFAULT_CONFIG = {
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'password',
  TG_BOT_TOKEN: '',
  TG_CHAT_ID: '',
  TG_TOPIC_ID: '',
  NOTIFYX_API_KEY: '',
  WEBHOOK_URL: '',
  WEBHOOK_METHOD: 'POST',
  WEBHOOK_HEADERS: '',
  WEBHOOK_TEMPLATE: '',
  SHOW_LUNAR: false,
  WECHATBOT_WEBHOOK: '',
  WECHATBOT_MSG_TYPE: 'text',
  WECHATBOT_AT_MOBILES: '',
  WECHATBOT_AT_ALL: 'false',
  RESEND_API_KEY: '',
  EMAIL_FROM: '',
  EMAIL_FROM_NAME: '订阅提醒系统',
  EMAIL_TO: '',
  BARK_DEVICE_KEY: '',
  BARK_SERVER: 'https://api.day.app',
  BARK_IS_ARCHIVE: 'false',
  ENABLED_NOTIFIERS: ['notifyx'],
  THEME_MODE: 'system',
  TIMEZONE: 'Asia/Shanghai',
  NOTIFICATION_HOURS: [],
  THIRD_PARTY_API_TOKEN: '',
  DEBUG_LOGS: false,
  PAYMENT_HISTORY_LIMIT: 100,
  GOTIFY_SERVER_URL: '',
  GOTIFY_APP_TOKEN: '',
  SERVERCHAN_SENDKEY: '',
  PUSHPLUS_TOKEN: '',
  PUSHPLUS_TOPIC: '',
  PUSHPLUS_CHANNEL: '',
  NTFY_SERVER: 'https://ntfy.sh',
  NTFY_TOPIC: '',
  NTFY_TOKEN: '',
  WPUSH_APIKEY: '',
  WPUSH_CHANNEL: '',
  WPUSH_TOPIC_CODE: '',
  DINGTALK_WEBHOOK: '',
  DINGTALK_SECRET: '',
  DINGTALK_MSG_TYPE: 'text',
  DINGTALK_AT_MOBILES: '',
  DINGTALK_AT_ALL: 'false'
};

/**
 * isolate 级配置缓存。
 *
 * 背景：config 是全站最高频的 KV key（登录校验、各 handler、定时任务都会读），
 * 每次请求都 `KV.get('config')` 造成大量热读。这里用 30s TTL 的内存缓存
 * 吸收读峰值；setConfig 写时同步更新缓存，保证"保存后立即可见"。
 *
 * 一致性说明：跨数据中心 / isolate 的传播延迟 ≤30s，与 KV 自身的最终一致性
 * 同量级，个人单用户场景可接受。
 */
let cachedConfig = null;
let cachedAt = 0;
const CONFIG_CACHE_TTL_MS = 30 * 1000;

async function getConfig(env) {
  if (!env.SUBSCRIPTIONS_KV) {
    console.error('[配置] KV存储未绑定');
    throw new Error('KV存储未绑定');
  }
  const now = Date.now();
  if (cachedConfig && now - cachedAt < CONFIG_CACHE_TTL_MS) {
    return { ...cachedConfig };
  }

  const data = await env.SUBSCRIPTIONS_KV.get('config');
  console.log('[配置] 从KV读取配置:', data ? '成功' : '空配置');
  const config = data ? JSON.parse(data) : {};

  let jwtSecret = config.JWT_SECRET;
  if (!jwtSecret) {
    console.log('[配置] 生成新的JWT密钥');
    jwtSecret = crypto.randomUUID();
    const updatedConfig = { ...config, JWT_SECRET: jwtSecret };
    await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));
  }

  const result = {
    ...DEFAULT_CONFIG,
    ...config,
    JWT_SECRET: jwtSecret
  };
  cachedConfig = result;
  cachedAt = now;
  return { ...result };
}

async function setConfig(env, config) {
  await putKVJson(env, 'config', config);

  // 写时同步缓存：JWT_SECRET 缺失时从旧缓存 / 旧 KV 继承，避免会话失效
  let secret = config.JWT_SECRET;
  if (!secret) {
    if (cachedConfig && cachedConfig.JWT_SECRET) {
      secret = cachedConfig.JWT_SECRET;
    } else {
      try {
        const prev = await env.SUBSCRIPTIONS_KV.get('config');
        if (prev) {
          const parsed = JSON.parse(prev);
          if (parsed.JWT_SECRET) secret = parsed.JWT_SECRET;
        }
      } catch (err) {
        console.error('[配置] 读取旧 JWT_SECRET 失败:', err);
      }
    }
  }
  const merged = { ...DEFAULT_CONFIG, ...config };
  if (secret) merged.JWT_SECRET = secret;
  cachedConfig = merged;
  cachedAt = Date.now();
  return merged;
}

/** 测试用：清除内存缓存，强制下次重新读取 KV。 */
export function _resetConfigCache() {
  cachedConfig = null;
  cachedAt = 0;
}

export {
  DEFAULT_CONFIG,
  getConfig,
  setConfig
};
