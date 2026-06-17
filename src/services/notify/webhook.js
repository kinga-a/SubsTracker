// @ts-check
/**
 * Webhook 通知渠道（已支持钉钉SEC加签）
 *
 * 支持自定义请求方法、Header、消息模板（{{title}} / {{content}} / {{tags}} 等）。
 * 新增：钉钉机器人加签支持，配置 WEBHOOK_DING_SECRET 即可自动携带 timestamp + sign 请求头
 */
import { ok, fail, errorMessage } from './channel.js';
import { formatLocalDate } from '../../core/time.js';
import crypto from 'crypto';

/**
 * 钉钉加签算法：根据密钥 + 毫秒时间戳 计算签名
 * @param {string} secret SEC开头密钥
 * @param {string} timestamp 毫秒时间戳
 * @returns {string} base64编码签名
 */
function dingTalkSign(secret, timestamp) {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign, 'utf8');
  return hmac.digest('base64');
}

/**
 * 把 value 转成可嵌入 JSON 字符串的安全片段。
 *
 * @param {any} value
 */
function escapeForJsonString(value) {
  if (value === null || value === undefined) return '';
  return JSON.stringify(String(value)).slice(1, -1);
}

/**
 * @param {any} template
 * @param {Record<string,any>} data
 */
function applyTemplate(template, data) {
  const templateString = JSON.stringify(template);
  const replaced = templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return escapeForJsonString(data[key]);
    }
    return '';
  });
  return JSON.parse(replaced);
}

/**
 * 构造可供模板替换的变量集合。
 *
 * @param {import('./channel.js').ChannelPayload} payload
 * @param {any} config
 */
function buildTemplateData(payload, config) {
  const tagsArray = Array.isArray(payload.metadata?.tags)
    ? payload.metadata.tags
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
    : [];
  const tagsBlock = tagsArray.length ? tagsArray.map((t) => `- ${t}`).join('\n') : '';
  const tagsLine = tagsArray.length ? '标签：' + tagsArray.join('、') : '';
  const timestamp = formatLocalDate(new Date(), config?.TIMEZONE || 'UTC', 'datetime');
  const formattedMessage = [
    payload.title,
    payload.content,
    tagsLine,
    `发送时间：${timestamp}`
  ]
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n');

  return {
    title: payload.title,
    content: payload.content,
    tags: tagsBlock,
    tagsLine,
    rawTags: tagsArray,
    timestamp,
    formattedMessage,
    message: formattedMessage,
    // 扩展字段，便于规则化模板
    daysRemaining: payload.metadata?.daysRemaining ?? '',
    ruleType: payload.metadata?.ruleType ?? '',
    ruleValue: payload.metadata?.ruleValue ?? ''
  };
}

/** @type {import('./channel.js').Channel} */
export const webhookChannel = {
  name: 'webhook',

  validateConfig(config) {
    if (!config.WEBHOOK_URL) return { ok: false, error: '缺少 WEBHOOK_URL' };
    return { ok: true };
  },

  async send(payload, config) {
    const v = webhookChannel.validateConfig(config);
    if (!v.ok) return fail('webhook', v.error || '配置无效');

    let headers = { 'Content-Type': 'application/json' };

    // ========== 新增钉钉加签逻辑 ==========
    // 如果配置了钉钉SEC密钥，自动计算签名并塞入请求头
    if (config.WEBHOOK_DING_SECRET && config.WEBHOOK_DING_SECRET.trim() !== '') {
      const timestampMs = Date.now().toString(); // 毫秒时间戳
      const sign = dingTalkSign(config.WEBHOOK_DING_SECRET.trim(), timestampMs);
      headers['timestamp'] = timestampMs;
      headers['sign'] = sign;
    }

    // 合并用户自定义请求头
    if (config.WEBHOOK_HEADERS) {
      try {
        const customHeaders = JSON.parse(config.WEBHOOK_HEADERS);
        headers = { ...headers, ...customHeaders };
      } catch {
        console.warn('[Webhook] 自定义请求头格式错误，使用默认请求头');
      }
    }

    const data = buildTemplateData(payload, config);
    let requestBody;
    if (config.WEBHOOK_TEMPLATE) {
      try {
        const template = JSON.parse(config.WEBHOOK_TEMPLATE);
        requestBody = applyTemplate(template, data);
      } catch {
        console.warn('[Webhook] 消息模板格式错误，使用默认格式');
        requestBody = { ...data };
      }
    } else {
      requestBody = { ...data };
    }

    try {
      const r = await fetch(config.WEBHOOK_URL, {
        method: config.WEBHOOK_METHOD || 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      const text = await r.text().catch(() => '');
      return r.ok ? ok('webhook', text) : fail('webhook', `HTTP ${r.status}`, text);
    } catch (err) {
      return fail('webhook', errorMessage(err));
    }
  },

  async test(config) {
    return webhookChannel.send(
      { title: '订阅管理 - 测试通知', content: '这是一条 Webhook 测试通知。' },
      config
    );
  }
};

/** @deprecated 旧版兼容函数 */
export async function sendWebhookNotification(title, content, config, metadata = {}) {
  const r = await webhookChannel.send({ title, content, metadata }, config);
  if (!r.success) console.error('[Webhook]', r.error);
  return r.success;
}
