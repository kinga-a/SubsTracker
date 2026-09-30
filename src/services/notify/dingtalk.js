// @ts-check
/**
 * 钉钉通知渠道
 *
 * 支持钉钉群机器人：
 * - 文本 / Markdown 两种消息类型
 * - @指定手机号 / @所有人
 * - 「加签」安全设置：配置 DINGTALK_SECRET 后自动计算 timestamp + sign（HMAC-SHA256）
 *   并追加到 Webhook URL（参考钉钉官方加签文档）。
 */
import { ok, fail, errorMessage } from './channel.js';

/**
 * 计算钉钉加签所需的 sign。
 *
 * 算法（官方文档）：
 *   stringToSign = `${timestamp}\n${secret}`
 *   sign = base64( HMAC-SHA256( key=secret, msg=stringToSign ) )
 *
 * @param {number} timestamp 毫秒时间戳
 * @param {string} secret 加签密钥（SEC 开头）
 * @returns {Promise<string>} base64 签名（未做 URL 编码）
 */
export async function computeDingTalkSign(timestamp, secret) {
  const encoder = new TextEncoder();
  const stringToSign = `${timestamp}\n${secret}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(stringToSign));
  const bytes = new Uint8Array(signature);

  // btoa 在 Worker 运行时可用；手工拼 base64 避免引入依赖
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * 构造钉钉机器人请求体。
 *
 * @param {string} title
 * @param {string} content
 * @param {any} config
 * @returns {any} 钉钉消息 JSON
 */
function buildMessageData(title, content, config) {
  const msgType = config.DINGTALK_MSG_TYPE || 'text';
  /** @type {any} */
  let messageData;
  if (msgType === 'markdown') {
    messageData = {
      msgtype: 'markdown',
      markdown: {
        title,
        text: `# ${title}\n\n${content}`
      }
    };
  } else {
    messageData = {
      msgtype: 'text',
      text: {
        content: `${title}\n\n${content}`
      }
    };
  }

  if (config.DINGTALK_AT_ALL === 'true') {
    messageData.at = { isAtAll: true };
  } else if (config.DINGTALK_AT_MOBILES) {
    const mobiles = String(config.DINGTALK_AT_MOBILES)
      .split(/[,，\s]+/)
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    if (mobiles.length > 0) {
      messageData.at = { atMobiles: mobiles };
    }
  }
  return messageData;
}

/** @type {import('./channel.js').Channel} */
export const dingtalkChannel = {
  name: 'dingtalk',

  validateConfig(config) {
    if (!config.DINGTALK_WEBHOOK) return { ok: false, error: '缺少 DINGTALK_WEBHOOK' };
    return { ok: true };
  },

  async send(payload, config) {
    const v = dingtalkChannel.validateConfig(config);
    if (!v.ok) return fail('dingtalk', v.error || '配置无效');

    const messageData = buildMessageData(payload.title, payload.content, config);

    let webhookUrl = config.DINGTALK_WEBHOOK;
    if (config.DINGTALK_SECRET) {
      const timestamp = Date.now();
      const sign = await computeDingTalkSign(timestamp, config.DINGTALK_SECRET);
      const separator = webhookUrl.includes('?') ? '&' : '?';
      webhookUrl = `${webhookUrl}${separator}timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }

    try {
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      const text = await r.text().catch(() => '');
      if (!r.ok) return fail('dingtalk', `HTTP ${r.status}`, text);

      // 钉钉接口即使业务失败也返回 HTTP 200，需检查 errcode
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        return ok('dingtalk', text);
      }
      if (parsed.errcode === 0) return ok('dingtalk', parsed);
      return fail('dingtalk', parsed.errmsg || `钉钉错误码 ${parsed.errcode}`, parsed);
    } catch (err) {
      return fail('dingtalk', errorMessage(err));
    }
  },

  async test(config) {
    return dingtalkChannel.send(
      { title: '订阅管理 - 测试通知', content: '这是一条钉钉测试通知，用于验证加签与消息格式。' },
      config
    );
  }
};

/** @deprecated 旧版兼容函数 */
export async function sendDingTalkNotification(title, content, config) {
  const r = await dingtalkChannel.send({ title, content }, config);
  if (!r.success) console.error('[钉钉]', r.error, r.raw || '');
  return r.success;
}
