var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/data/kv.js
async function getKVJson(env, key, defaultValue = null) {
  const raw2 = await env.SUBSCRIPTIONS_KV.get(key);
  if (!raw2) return defaultValue;
  try {
    return JSON.parse(raw2);
  } catch (error) {
    console.error(`[KV] \u89E3\u6790 ${key} \u5931\u8D25:`, error);
    return defaultValue;
  }
}
async function putKVJson(env, key, value) {
  await env.SUBSCRIPTIONS_KV.put(key, JSON.stringify(value));
}
var init_kv = __esm({
  "src/data/kv.js"() {
    "use strict";
  }
});

// src/data/config.js
async function getConfig(env) {
  if (!env.SUBSCRIPTIONS_KV) {
    console.error("[\u914D\u7F6E] KV\u5B58\u50A8\u672A\u7ED1\u5B9A");
    throw new Error("KV\u5B58\u50A8\u672A\u7ED1\u5B9A");
  }
  const now = Date.now();
  if (cachedConfig && now - cachedAt < CONFIG_CACHE_TTL_MS) {
    return { ...cachedConfig };
  }
  const data = await env.SUBSCRIPTIONS_KV.get("config");
  console.log("[\u914D\u7F6E] \u4ECEKV\u8BFB\u53D6\u914D\u7F6E:", data ? "\u6210\u529F" : "\u7A7A\u914D\u7F6E");
  const config = data ? JSON.parse(data) : {};
  let jwtSecret = config.JWT_SECRET;
  if (!jwtSecret) {
    console.log("[\u914D\u7F6E] \u751F\u6210\u65B0\u7684JWT\u5BC6\u94A5");
    jwtSecret = crypto.randomUUID();
    const updatedConfig = { ...config, JWT_SECRET: jwtSecret };
    await env.SUBSCRIPTIONS_KV.put("config", JSON.stringify(updatedConfig));
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
  await putKVJson(env, "config", config);
  let secret = config.JWT_SECRET;
  if (!secret) {
    if (cachedConfig && cachedConfig.JWT_SECRET) {
      secret = cachedConfig.JWT_SECRET;
    } else {
      try {
        const prev = await env.SUBSCRIPTIONS_KV.get("config");
        if (prev) {
          const parsed = JSON.parse(prev);
          if (parsed.JWT_SECRET) secret = parsed.JWT_SECRET;
        }
      } catch (err) {
        console.error("[\u914D\u7F6E] \u8BFB\u53D6\u65E7 JWT_SECRET \u5931\u8D25:", err);
      }
    }
  }
  const merged = { ...DEFAULT_CONFIG, ...config };
  if (secret) merged.JWT_SECRET = secret;
  cachedConfig = merged;
  cachedAt = Date.now();
  return merged;
}
var DEFAULT_CONFIG, cachedConfig, cachedAt, CONFIG_CACHE_TTL_MS;
var init_config = __esm({
  "src/data/config.js"() {
    "use strict";
    init_kv();
    DEFAULT_CONFIG = {
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "password",
      TG_BOT_TOKEN: "",
      TG_CHAT_ID: "",
      TG_TOPIC_ID: "",
      NOTIFYX_API_KEY: "",
      WEBHOOK_URL: "",
      WEBHOOK_METHOD: "POST",
      WEBHOOK_HEADERS: "",
      WEBHOOK_TEMPLATE: "",
      SHOW_LUNAR: false,
      WECHATBOT_WEBHOOK: "",
      WECHATBOT_MSG_TYPE: "text",
      WECHATBOT_AT_MOBILES: "",
      WECHATBOT_AT_ALL: "false",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      EMAIL_FROM_NAME: "\u8BA2\u9605\u63D0\u9192\u7CFB\u7EDF",
      EMAIL_TO: "",
      BARK_DEVICE_KEY: "",
      BARK_SERVER: "https://api.day.app",
      BARK_IS_ARCHIVE: "false",
      ENABLED_NOTIFIERS: ["notifyx"],
      THEME_MODE: "system",
      TIMEZONE: "Asia/Shanghai",
      NOTIFICATION_HOURS: [],
      THIRD_PARTY_API_TOKEN: "",
      DEBUG_LOGS: false,
      PAYMENT_HISTORY_LIMIT: 100,
      GOTIFY_SERVER_URL: "",
      GOTIFY_APP_TOKEN: "",
      SERVERCHAN_SENDKEY: "",
      PUSHPLUS_TOKEN: "",
      PUSHPLUS_TOPIC: "",
      PUSHPLUS_CHANNEL: "",
      NTFY_SERVER: "https://ntfy.sh",
      NTFY_TOPIC: "",
      NTFY_TOKEN: "",
      WPUSH_APIKEY: "",
      WPUSH_CHANNEL: "",
      WPUSH_TOPIC_CODE: "",
      DINGTALK_WEBHOOK: "",
      DINGTALK_SECRET: "",
      DINGTALK_MSG_TYPE: "text",
      DINGTALK_AT_MOBILES: "",
      DINGTALK_AT_ALL: "false"
    };
    cachedConfig = null;
    cachedAt = 0;
    CONFIG_CACHE_TTL_MS = 30 * 1e3;
  }
});

// src/api/utils.js
function getCookieValue(cookieString, key) {
  if (!cookieString) return null;
  const match2 = cookieString.match(new RegExp("(^| )" + key + "=([^;]+)"));
  return match2 ? match2[2] : null;
}
function generateRandomSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const buffer = new Uint8Array(64);
  crypto.getRandomValues(buffer);
  let result = "";
  for (let i = 0; i < buffer.length; i++) {
    result += chars.charAt(buffer[i] % chars.length);
  }
  return result;
}
function extractTagsFromSubscriptions(subscriptions = []) {
  const tagSet = /* @__PURE__ */ new Set();
  (subscriptions || []).forEach((sub) => {
    if (!sub || typeof sub !== "object") return;
    if (Array.isArray(sub.tags)) {
      sub.tags.forEach((tag) => {
        if (typeof tag === "string" && tag.trim().length > 0) {
          tagSet.add(tag.trim());
        }
      });
    }
    if (typeof sub.category === "string") {
      sub.category.split(CATEGORY_SEPARATOR_REGEX).map((tag) => tag.trim()).filter((tag) => tag.length > 0).forEach((tag) => tagSet.add(tag));
    }
    if (typeof sub.customType === "string" && sub.customType.trim().length > 0) {
      tagSet.add(sub.customType.trim());
    }
  });
  return Array.from(tagSet);
}
function sanitizeNotificationHours(input) {
  const raw2 = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];
  return raw2.map((value) => String(value).trim()).filter((value) => value.length > 0).map((value) => {
    const upperValue = value.toUpperCase();
    if (upperValue === "*" || upperValue === "ALL") {
      return "*";
    }
    const numeric = Number(upperValue);
    if (!isNaN(numeric)) {
      return String(Math.max(0, Math.min(23, Math.floor(numeric)))).padStart(2, "0");
    }
    return upperValue;
  });
}
var CATEGORY_SEPARATOR_REGEX;
var init_utils = __esm({
  "src/api/utils.js"() {
    "use strict";
    CATEGORY_SEPARATOR_REGEX = /[\/，,\s]+/;
  }
});

// src/api/handlers/config.js
function isConfiguredSecret(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function buildSafeConfig(config) {
  const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
  const response = { ...safeConfig };
  SECRET_FIELDS.forEach((key) => {
    response[`${key}_CONFIGURED`] = isConfiguredSecret(safeConfig[key]);
    response[key] = "";
  });
  return response;
}
function normalizeClearSecretFields(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  }
  if (typeof value === "string") {
    return value.split(/[,，\s]+/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}
function mergeSecretField(existingConfig, newConfig, key, clearSecretFields = []) {
  if (clearSecretFields.includes(key)) return "";
  const incoming = newConfig?.[key];
  if (typeof incoming !== "string") return existingConfig?.[key] || "";
  const trimmed = incoming.trim();
  if (trimmed === "********") return existingConfig?.[key] || "";
  if (!trimmed) return existingConfig?.[key] || "";
  return trimmed;
}
async function handleGetConfig(env) {
  const config = await getConfig(env);
  return new Response(
    JSON.stringify(buildSafeConfig(config)),
    { headers: { "Content-Type": "application/json" } }
  );
}
async function handleUpdateConfig(request, env) {
  try {
    const config = await getConfig(env);
    const newConfig = await request.json();
    const clearSecretFields = normalizeClearSecretFields(newConfig?.CLEAR_SECRET_FIELDS);
    const updatedConfig = {
      ...config,
      ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
      THEME_MODE: newConfig.THEME_MODE || "system",
      TG_BOT_TOKEN: mergeSecretField(config, newConfig, "TG_BOT_TOKEN", clearSecretFields),
      TG_CHAT_ID: newConfig.TG_CHAT_ID || "",
      TG_TOPIC_ID: (newConfig.TG_TOPIC_ID != null ? String(newConfig.TG_TOPIC_ID) : "").trim(),
      NOTIFYX_API_KEY: mergeSecretField(config, newConfig, "NOTIFYX_API_KEY", clearSecretFields),
      WEBHOOK_URL: mergeSecretField(config, newConfig, "WEBHOOK_URL", clearSecretFields),
      WEBHOOK_METHOD: newConfig.WEBHOOK_METHOD || "POST",
      WEBHOOK_HEADERS: mergeSecretField(config, newConfig, "WEBHOOK_HEADERS", clearSecretFields),
      WEBHOOK_TEMPLATE: newConfig.WEBHOOK_TEMPLATE || "",
      SHOW_LUNAR: newConfig.SHOW_LUNAR === true,
      WECHATBOT_WEBHOOK: mergeSecretField(config, newConfig, "WECHATBOT_WEBHOOK", clearSecretFields),
      WECHATBOT_MSG_TYPE: newConfig.WECHATBOT_MSG_TYPE || "text",
      WECHATBOT_AT_MOBILES: newConfig.WECHATBOT_AT_MOBILES || "",
      WECHATBOT_AT_ALL: newConfig.WECHATBOT_AT_ALL || "false",
      RESEND_API_KEY: mergeSecretField(config, newConfig, "RESEND_API_KEY", clearSecretFields),
      EMAIL_FROM: newConfig.EMAIL_FROM || "",
      EMAIL_FROM_NAME: newConfig.EMAIL_FROM_NAME || "",
      EMAIL_TO: newConfig.EMAIL_TO || "",
      BARK_DEVICE_KEY: mergeSecretField(config, newConfig, "BARK_DEVICE_KEY", clearSecretFields),
      BARK_SERVER: newConfig.BARK_SERVER || "https://api.day.app",
      BARK_IS_ARCHIVE: newConfig.BARK_IS_ARCHIVE || "false",
      GOTIFY_SERVER_URL: (newConfig.GOTIFY_SERVER_URL || "").trim(),
      GOTIFY_APP_TOKEN: mergeSecretField(config, newConfig, "GOTIFY_APP_TOKEN", clearSecretFields),
      SERVERCHAN_SENDKEY: mergeSecretField(config, newConfig, "SERVERCHAN_SENDKEY", clearSecretFields),
      PUSHPLUS_TOKEN: mergeSecretField(config, newConfig, "PUSHPLUS_TOKEN", clearSecretFields),
      PUSHPLUS_TOPIC: (newConfig.PUSHPLUS_TOPIC || "").trim(),
      PUSHPLUS_CHANNEL: (newConfig.PUSHPLUS_CHANNEL || "").trim(),
      NTFY_SERVER: (newConfig.NTFY_SERVER || "https://ntfy.sh").trim() || "https://ntfy.sh",
      NTFY_TOPIC: (newConfig.NTFY_TOPIC || "").trim(),
      NTFY_TOKEN: mergeSecretField(config, newConfig, "NTFY_TOKEN", clearSecretFields),
      WPUSH_APIKEY: mergeSecretField(config, newConfig, "WPUSH_APIKEY", clearSecretFields),
      WPUSH_CHANNEL: (newConfig.WPUSH_CHANNEL || "").trim(),
      WPUSH_TOPIC_CODE: (newConfig.WPUSH_TOPIC_CODE || "").trim(),
      DINGTALK_WEBHOOK: mergeSecretField(config, newConfig, "DINGTALK_WEBHOOK", clearSecretFields),
      DINGTALK_SECRET: mergeSecretField(config, newConfig, "DINGTALK_SECRET", clearSecretFields),
      DINGTALK_MSG_TYPE: newConfig.DINGTALK_MSG_TYPE || "text",
      DINGTALK_AT_MOBILES: (newConfig.DINGTALK_AT_MOBILES || "").trim(),
      DINGTALK_AT_ALL: newConfig.DINGTALK_AT_ALL || "false",
      ENABLED_NOTIFIERS: newConfig.ENABLED_NOTIFIERS || ["notifyx"],
      TIMEZONE: newConfig.TIMEZONE || config.TIMEZONE || "UTC",
      THIRD_PARTY_API_TOKEN: mergeSecretField(config, newConfig, "THIRD_PARTY_API_TOKEN", clearSecretFields),
      DEBUG_LOGS: newConfig.DEBUG_LOGS === true,
      PAYMENT_HISTORY_LIMIT: Number.isFinite(Number(newConfig.PAYMENT_HISTORY_LIMIT)) ? Math.min(1e3, Math.max(10, Math.floor(Number(newConfig.PAYMENT_HISTORY_LIMIT)))) : config.PAYMENT_HISTORY_LIMIT || 100
    };
    updatedConfig.NOTIFICATION_HOURS = sanitizeNotificationHours(newConfig.NOTIFICATION_HOURS);
    if (newConfig.ADMIN_PASSWORD) {
      updatedConfig.ADMIN_PASSWORD = newConfig.ADMIN_PASSWORD;
    }
    if (!updatedConfig.JWT_SECRET || updatedConfig.JWT_SECRET === "your-secret-key") {
      updatedConfig.JWT_SECRET = generateRandomSecret();
      console.log("[\u5B89\u5168] \u751F\u6210\u65B0\u7684JWT\u5BC6\u94A5");
    }
    await setConfig(env, updatedConfig);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u914D\u7F6E\u4FDD\u5B58\u9519\u8BEF:", error);
    return new Response(
      JSON.stringify({ success: false, message: "\u66F4\u65B0\u914D\u7F6E\u5931\u8D25: " + error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
var SECRET_FIELDS;
var init_config2 = __esm({
  "src/api/handlers/config.js"() {
    "use strict";
    init_config();
    init_utils();
    SECRET_FIELDS = [
      "TG_BOT_TOKEN",
      "NOTIFYX_API_KEY",
      "WEBHOOK_URL",
      "WEBHOOK_HEADERS",
      "WECHATBOT_WEBHOOK",
      "RESEND_API_KEY",
      "BARK_DEVICE_KEY",
      "THIRD_PARTY_API_TOKEN",
      "GOTIFY_APP_TOKEN",
      "SERVERCHAN_SENDKEY",
      "PUSHPLUS_TOKEN",
      "NTFY_TOKEN",
      "WPUSH_APIKEY",
      "DINGTALK_WEBHOOK",
      "DINGTALK_SECRET"
    ];
  }
});

// src/core/time.js
function isValidTimezone(timezone) {
  if (typeof timezone !== "string" || timezone.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
function safeTimezone(timezone) {
  if (timezone && isValidTimezone(timezone)) return timezone;
  return "UTC";
}
function getTimezoneDateParts(date, timezone = "UTC") {
  const tz = safeTimezone(timezone);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return getTimezoneDateParts(/* @__PURE__ */ new Date(), tz);
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = formatter.formatToParts(d);
    const pick = (type) => {
      const part = parts.find((item) => item.type === type);
      return part ? Number(part.value) : 0;
    };
    let hour = pick("hour");
    if (hour === 24) hour = 0;
    return {
      year: pick("year"),
      month: pick("month"),
      day: pick("day"),
      hour,
      minute: pick("minute"),
      second: pick("second")
    };
  } catch {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds()
    };
  }
}
function getNowInTimezone(timezone = "UTC", now) {
  const tz = safeTimezone(timezone);
  const utc = now instanceof Date ? new Date(utcMillis(now)) : /* @__PURE__ */ new Date();
  const parts = getTimezoneDateParts(utc, tz);
  const hourString = String(parts.hour).padStart(2, "0");
  const isoLocal = formatPartsAsIsoLocal(parts);
  return { utc, parts, hourString, isoLocal, timezone: tz };
}
function getDaysBetween(from, to, timezone = "UTC") {
  const tz = safeTimezone(timezone);
  const fromMid = getTimezoneMidnightTimestamp(from, tz);
  const toMid = getTimezoneMidnightTimestamp(to, tz);
  return Math.round((toMid - fromMid) / MS_PER_DAY);
}
function getTimezoneMidnightTimestamp(date, timezone = "UTC") {
  const tz = safeTimezone(timezone);
  const { year, month, day } = getTimezoneDateParts(date, tz);
  const t0 = Date.UTC(year, month - 1, day, 0, 0, 0);
  const probeParts = getTimezoneDateParts(new Date(t0), tz);
  const probeAsUtc = Date.UTC(
    probeParts.year,
    probeParts.month - 1,
    probeParts.day,
    probeParts.hour,
    probeParts.minute,
    probeParts.second
  );
  const offsetMs = probeAsUtc - t0;
  return t0 - offsetMs;
}
function formatPartsAsIsoLocal(parts) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}
function utcMillis(d) {
  return d instanceof Date ? d.getTime() : Number(d);
}
function getTimestampForTimezoneParts(parts, timezone = "UTC") {
  const tz = safeTimezone(timezone);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour || 0);
  const minute = Number(parts.minute || 0);
  const second = Number(parts.second || 0);
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (Number.isNaN(probe.getTime()) || probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day || probe.getUTCHours() !== hour || probe.getUTCMinutes() !== minute || probe.getUTCSeconds() !== second) {
    return Number.NaN;
  }
  const t0 = probe.getTime();
  const probeParts = getTimezoneDateParts(probe, tz);
  const probeAsUtc = Date.UTC(
    probeParts.year,
    probeParts.month - 1,
    probeParts.day,
    probeParts.hour,
    probeParts.minute,
    probeParts.second
  );
  const offsetMs = probeAsUtc - t0;
  return t0 - offsetMs;
}
function parseDateInputInTimezone(value, timezone = "UTC") {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match2 = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match2) {
      const ts = getTimestampForTimezoneParts(
        {
          year: Number(match2[1]),
          month: Number(match2[2]),
          day: Number(match2[3]),
          hour: 0,
          minute: 0,
          second: 0
        },
        timezone
      );
      return new Date(ts);
    }
  }
  return new Date(value);
}
function addCalendarPeriodInTimezone(value, amount, unit, timezone = "UTC", options = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return new Date(Number.NaN);
  const parts = getTimezoneDateParts(d, timezone);
  let year = parts.year;
  let month = parts.month;
  let day = parts.day;
  if (unit === "day") {
    const temp = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    temp.setUTCDate(temp.getUTCDate() + amount);
    year = temp.getUTCFullYear();
    month = temp.getUTCMonth() + 1;
    day = temp.getUTCDate();
  } else if (unit === "month") {
    const targetMonthIndex = month - 1 + amount;
    if (options && options.endOfMonth) {
      const last = new Date(Date.UTC(year, targetMonthIndex + 1, 0));
      year = last.getUTCFullYear();
      month = last.getUTCMonth() + 1;
      day = last.getUTCDate();
    } else {
      const temp = new Date(Date.UTC(year, targetMonthIndex, day, 0, 0, 0));
      year = temp.getUTCFullYear();
      month = temp.getUTCMonth() + 1;
      day = temp.getUTCDate();
    }
  } else if (unit === "year") {
    if (options && options.endOfMonth && month === 2 && day >= 28) {
      const last = new Date(Date.UTC(year + amount, month, 0));
      year = last.getUTCFullYear();
      month = last.getUTCMonth() + 1;
      day = last.getUTCDate();
    } else {
      const temp = new Date(Date.UTC(year + amount, month - 1, day, 0, 0, 0));
      year = temp.getUTCFullYear();
      month = temp.getUTCMonth() + 1;
      day = temp.getUTCDate();
    }
  }
  const ts = getTimestampForTimezoneParts(
    {
      year,
      month,
      day,
      hour: 0,
      minute: 0,
      second: 0
    },
    timezone
  );
  return new Date(ts);
}
function formatLocalDate(time, timezone = "UTC", format = "full") {
  const tz = safeTimezone(timezone);
  const d = time instanceof Date ? time : new Date(time);
  if (Number.isNaN(d.getTime())) return "";
  if (format === "isoLocal") {
    return formatPartsAsIsoLocal(getTimezoneDateParts(d, tz));
  }
  try {
    if (format === "date") {
      return d.toLocaleDateString("zh-CN", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    }
    if (format === "datetime") {
      return d.toLocaleString("zh-CN", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    }
    return d.toLocaleString("zh-CN", { timeZone: tz });
  } catch {
    return d.toISOString();
  }
}
function formatTimeInTimezone(time, timezone = "UTC", format = "full") {
  return formatLocalDate(time, timezone, format);
}
function getTimezoneOffset(timezone = "UTC") {
  const tz = safeTimezone(timezone);
  try {
    const now = /* @__PURE__ */ new Date();
    const parts = getTimezoneDateParts(now, tz);
    const zoned = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    return Math.round((zoned - now.getTime()) / MS_PER_HOUR) + 0;
  } catch {
    return 0;
  }
}
function formatTimezoneDisplay(timezone = "UTC") {
  const tz = safeTimezone(timezone);
  try {
    const offset = getTimezoneOffset(tz);
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    const names = {
      UTC: "\u4E16\u754C\u6807\u51C6\u65F6\u95F4",
      "Asia/Shanghai": "\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4",
      "Asia/Hong_Kong": "\u9999\u6E2F\u65F6\u95F4",
      "Asia/Taipei": "\u53F0\u5317\u65F6\u95F4",
      "Asia/Singapore": "\u65B0\u52A0\u5761\u65F6\u95F4",
      "Asia/Tokyo": "\u65E5\u672C\u65F6\u95F4",
      "Asia/Seoul": "\u97E9\u56FD\u65F6\u95F4",
      "America/New_York": "\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4",
      "America/Los_Angeles": "\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4",
      "America/Chicago": "\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4",
      "America/Denver": "\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4",
      "Europe/London": "\u82F1\u56FD\u65F6\u95F4",
      "Europe/Paris": "\u5DF4\u9ECE\u65F6\u95F4",
      "Europe/Berlin": "\u67CF\u6797\u65F6\u95F4",
      "Europe/Moscow": "\u83AB\u65AF\u79D1\u65F6\u95F4",
      "Australia/Sydney": "\u6089\u5C3C\u65F6\u95F4",
      "Australia/Melbourne": "\u58A8\u5C14\u672C\u65F6\u95F4",
      "Pacific/Auckland": "\u5965\u514B\u5170\u65F6\u95F4"
    };
    const cn = names[tz] || tz;
    return `${cn} (UTC${offsetStr})`;
  } catch {
    return tz;
  }
}
function formatBeijingTime(date = /* @__PURE__ */ new Date(), format = "full") {
  return formatLocalDate(date, "Asia/Shanghai", format);
}
function getCurrentTimeInTimezone(timezone = "UTC") {
  void timezone;
  return /* @__PURE__ */ new Date();
}
var MS_PER_HOUR, MS_PER_DAY;
var init_time = __esm({
  "src/core/time.js"() {
    "use strict";
    MS_PER_HOUR = 1e3 * 60 * 60;
    MS_PER_DAY = MS_PER_HOUR * 24;
  }
});

// src/core/lunar.js
var lunarCalendar, lunarBiz;
var init_lunar = __esm({
  "src/core/lunar.js"() {
    "use strict";
    lunarCalendar = {
      lunarInfo: [
        19416,
        19168,
        42352,
        21717,
        53856,
        55632,
        91476,
        22176,
        39632,
        21970,
        19168,
        42422,
        42192,
        53840,
        119381,
        46400,
        54944,
        44450,
        38320,
        84343,
        18800,
        42160,
        46261,
        27216,
        27968,
        109396,
        11104,
        38256,
        21234,
        18800,
        25958,
        54432,
        59984,
        28309,
        23248,
        11104,
        100067,
        37600,
        116951,
        51536,
        54432,
        120998,
        46416,
        22176,
        107956,
        9680,
        37584,
        53938,
        43344,
        46423,
        27808,
        46416,
        86869,
        19872,
        42416,
        83315,
        21168,
        43432,
        59728,
        27296,
        44710,
        43856,
        19296,
        43748,
        42352,
        21088,
        62051,
        55632,
        23383,
        22176,
        38608,
        19925,
        19152,
        42192,
        54484,
        53840,
        54616,
        46400,
        46752,
        103846,
        38320,
        18864,
        43380,
        42160,
        45690,
        27216,
        27968,
        44870,
        43872,
        38256,
        19189,
        18800,
        25776,
        29859,
        59984,
        27480,
        21952,
        43872,
        38613,
        37600,
        51552,
        55636,
        54432,
        55888,
        30034,
        22176,
        43959,
        9680,
        37584,
        51893,
        43344,
        46240,
        47780,
        44368,
        21977,
        19360,
        42416,
        86390,
        21168,
        43312,
        31060,
        27296,
        44368,
        23378,
        19296,
        42726,
        42208,
        53856,
        60005,
        54576,
        23200,
        30371,
        38608,
        19195,
        19152,
        42192,
        118966,
        53840,
        54560,
        56645,
        46496,
        22224,
        21938,
        18864,
        42359,
        42160,
        43600,
        111189,
        27936,
        44448,
        84835,
        37744,
        84536,
        18800,
        25776,
        92326,
        59984,
        108920,
        92832,
        42688,
        43616,
        93539,
        53856,
        55632,
        54612,
        54432,
        55888,
        30034,
        22176,
        43959,
        9680,
        37584,
        51893,
        43344,
        46240,
        47780,
        44368,
        21977,
        19360,
        42416,
        86390,
        21168,
        43312,
        31060,
        27296,
        44368,
        23378,
        19296,
        42726,
        42208,
        53856,
        60005,
        54576,
        23200,
        30371,
        38608,
        19195,
        107707,
        42192,
        53424,
        53840
      ],
      gan: ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"],
      zhi: ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"],
      months: ["\u6B63", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D", "\u5341", "\u51AC", "\u814A"],
      days: [
        "\u521D\u4E00",
        "\u521D\u4E8C",
        "\u521D\u4E09",
        "\u521D\u56DB",
        "\u521D\u4E94",
        "\u521D\u516D",
        "\u521D\u4E03",
        "\u521D\u516B",
        "\u521D\u4E5D",
        "\u521D\u5341",
        "\u5341\u4E00",
        "\u5341\u4E8C",
        "\u5341\u4E09",
        "\u5341\u56DB",
        "\u5341\u4E94",
        "\u5341\u516D",
        "\u5341\u4E03",
        "\u5341\u516B",
        "\u5341\u4E5D",
        "\u4E8C\u5341",
        "\u5EFF\u4E00",
        "\u5EFF\u4E8C",
        "\u5EFF\u4E09",
        "\u5EFF\u56DB",
        "\u5EFF\u4E94",
        "\u5EFF\u516D",
        "\u5EFF\u4E03",
        "\u5EFF\u516B",
        "\u5EFF\u4E5D",
        "\u4E09\u5341"
      ],
      lunarYearDays(year) {
        let sum = 348;
        for (let i = 32768; i > 8; i >>= 1) {
          sum += this.lunarInfo[year - 1900] & i ? 1 : 0;
        }
        return sum + this.leapDays(year);
      },
      leapDays(year) {
        if (this.leapMonth(year)) {
          return this.lunarInfo[year - 1900] & 65536 ? 30 : 29;
        }
        return 0;
      },
      leapMonth(year) {
        return this.lunarInfo[year - 1900] & 15;
      },
      monthDays(year, month) {
        return this.lunarInfo[year - 1900] & 65536 >> month ? 30 : 29;
      },
      solar2lunar(year, month, day) {
        if (year < 1900 || year > 2100) return null;
        const baseDate = Date.UTC(1900, 0, 31);
        const objDate = Date.UTC(year, month - 1, day);
        let offset = Math.round((objDate - baseDate) / 864e5);
        let temp = 0;
        let lunarYear = 1900;
        for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
          temp = this.lunarYearDays(lunarYear);
          offset -= temp;
        }
        if (offset < 0) {
          offset += temp;
          lunarYear--;
        }
        let lunarMonth = 1;
        let leap = this.leapMonth(lunarYear);
        let isLeap = false;
        for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
          if (leap > 0 && lunarMonth === leap + 1 && !isLeap) {
            --lunarMonth;
            isLeap = true;
            temp = this.leapDays(lunarYear);
          } else {
            temp = this.monthDays(lunarYear, lunarMonth);
          }
          if (isLeap && lunarMonth === leap + 1) isLeap = false;
          offset -= temp;
        }
        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
          if (isLeap) {
            isLeap = false;
          } else {
            isLeap = true;
            --lunarMonth;
          }
        }
        if (offset < 0) {
          offset += temp;
          --lunarMonth;
        }
        const lunarDay = offset + 1;
        const ganIndex = (lunarYear - 4) % 10;
        const zhiIndex = (lunarYear - 4) % 12;
        const yearStr = this.gan[ganIndex] + this.zhi[zhiIndex] + "\u5E74";
        const monthStr = (isLeap ? "\u95F0" : "") + this.months[lunarMonth - 1] + "\u6708";
        const dayStr = this.days[lunarDay - 1];
        return {
          year: lunarYear,
          month: lunarMonth,
          day: lunarDay,
          isLeap,
          yearStr,
          monthStr,
          dayStr,
          fullStr: yearStr + monthStr + dayStr
        };
      }
    };
    lunarBiz = {
      addLunarPeriod(lunar, periodValue, periodUnit) {
        let { year, month, day, isLeap } = lunar;
        if (periodUnit === "year") {
          year += periodValue;
          const leap = lunarCalendar.leapMonth(year);
          if (isLeap && leap === month) {
            isLeap = true;
          } else {
            isLeap = false;
          }
        } else if (periodUnit === "month") {
          let totalMonths = (year - 1900) * 12 + (month - 1) + periodValue;
          year = Math.floor(totalMonths / 12) + 1900;
          month = totalMonths % 12 + 1;
          const leap = lunarCalendar.leapMonth(year);
          if (isLeap && leap === month) {
            isLeap = true;
          } else {
            isLeap = false;
          }
        } else if (periodUnit === "day") {
          const solar = lunarBiz.lunar2solar(lunar);
          const date = new Date(solar.year, solar.month - 1, solar.day + periodValue);
          return lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
        }
        let maxDay = isLeap ? lunarCalendar.leapDays(year) : lunarCalendar.monthDays(year, month);
        let targetDay = Math.min(day, maxDay);
        while (targetDay > 0) {
          let solar = lunarBiz.lunar2solar({ year, month, day: targetDay, isLeap });
          if (solar) {
            return { year, month, day: targetDay, isLeap };
          }
          targetDay--;
        }
        return { year, month, day, isLeap };
      },
      lunar2solar(lunar) {
        for (let y = lunar.year - 1; y <= lunar.year + 1; y++) {
          for (let m = 1; m <= 12; m++) {
            for (let d = 1; d <= 31; d++) {
              const date = new Date(y, m - 1, d);
              if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) continue;
              const l = lunarCalendar.solar2lunar(y, m, d);
              if (l && l.year === lunar.year && l.month === lunar.month && l.day === lunar.day && l.isLeap === lunar.isLeap) {
                return { year: y, month: m, day: d };
              }
            }
          }
        }
        return null;
      }
    };
  }
});

// src/core/currency-format.js
function getCurrencySymbol(currency = "CNY") {
  const code = String(currency || "CNY").toUpperCase();
  return CURRENCY_SYMBOLS[code] || code + " ";
}
function formatAmount(amount, currency = "CNY", opts = {}) {
  if (amount === null || amount === void 0 || amount === "") return "";
  const n = Number(amount);
  if (Number.isNaN(n)) return "";
  const sym = getCurrencySymbol(currency);
  const fixed = opts.withDecimal === false ? String(Math.round(n)) : n.toFixed(2);
  return sym + fixed;
}
var CURRENCY_SYMBOLS;
var init_currency_format = __esm({
  "src/core/currency-format.js"() {
    "use strict";
    CURRENCY_SYMBOLS = {
      CNY: "\xA5",
      USD: "$",
      HKD: "HK$",
      TWD: "NT$",
      JPY: "JP\xA5",
      EUR: "\u20AC",
      GBP: "\xA3",
      KRW: "\u20A9",
      TRY: "\u20BA"
    };
  }
});

// src/services/notify/reminder.js
function formatLunarExpiryText(expiry, timezone) {
  const parts = getTimezoneDateParts(expiry, timezone || "UTC");
  const lunarExpiry = lunarCalendar.solar2lunar(parts.year, parts.month, parts.day);
  return lunarExpiry ? `
\u519C\u5386\u65E5\u671F: ${lunarExpiry.fullStr}` : "";
}
function resolveReminderSetting(subscription) {
  const defaultDays = subscription && subscription.reminderDays !== void 0 ? Number(subscription.reminderDays) : 7;
  let unit = subscription && subscription.reminderUnit === "hour" ? "hour" : "day";
  let value;
  if (unit === "hour") {
    if (subscription && subscription.reminderValue !== void 0 && subscription.reminderValue !== null && !isNaN(Number(subscription.reminderValue))) {
      value = Number(subscription.reminderValue);
    } else if (subscription && subscription.reminderHours !== void 0 && subscription.reminderHours !== null && !isNaN(Number(subscription.reminderHours))) {
      value = Number(subscription.reminderHours);
    } else {
      value = 0;
    }
  } else {
    if (subscription && subscription.reminderValue !== void 0 && subscription.reminderValue !== null && !isNaN(Number(subscription.reminderValue))) {
      value = Number(subscription.reminderValue);
    } else if (!isNaN(defaultDays)) {
      value = Number(defaultDays);
    } else {
      value = 7;
    }
  }
  if (value < 0 || isNaN(value)) {
    value = 0;
  }
  return { unit, value };
}
function formatMatchedReminderRule(rule) {
  if (rule.type === "on_expiry") return "\u5230\u671F\u5F53\u5929";
  if (rule.type === "after_expiry") {
    return `\u5230\u671F\u540E\u6BCF ${rule.repeatInterval || 24} \u5C0F\u65F6`;
  }
  if (rule.value === 0) return rule.unit === "hours" ? "\u5230\u671F\u5F53\u5C0F\u65F6" : "\u5230\u671F\u5F53\u5929";
  return `\u63D0\u524D ${rule.value} ${rule.unit === "hours" ? "\u5C0F\u65F6" : "\u5929"}`;
}
function formatNotificationContent(subscriptions, config) {
  const showLunar = config.SHOW_LUNAR === true;
  const timezone = config?.TIMEZONE || "UTC";
  let content = "";
  for (const sub of subscriptions) {
    const typeText = sub.customType || "\u5176\u4ED6";
    const periodText = sub.periodValue && sub.periodUnit ? `(\u5468\u671F: ${sub.periodValue} ${{ day: "\u5929", month: "\u6708", year: "\u5E74" }[sub.periodUnit] || sub.periodUnit})` : "";
    const categoryText = sub.category ? sub.category : "\u672A\u5206\u7C7B";
    const reminderSetting = sub.matchedReminderRule ? null : resolveReminderSetting(sub);
    const expiryDateObj = new Date(sub.expiryDate);
    const formattedExpiryDate = formatTimeInTimezone(expiryDateObj, timezone, "date");
    let lunarExpiryText = "";
    if (showLunar) {
      lunarExpiryText = formatLunarExpiryText(expiryDateObj, timezone);
    }
    let statusText = "";
    let statusEmoji = "";
    if (sub.daysRemaining === 0) {
      statusEmoji = "\u26A0\uFE0F";
      statusText = "\u4ECA\u5929\u5230\u671F\uFF01";
    } else if (sub.daysRemaining < 0) {
      statusEmoji = "\u{1F6A8}";
      statusText = `\u5DF2\u8FC7\u671F ${Math.abs(sub.daysRemaining)} \u5929`;
    } else {
      statusEmoji = "\u{1F4C5}";
      statusText = `\u5C06\u5728 ${sub.daysRemaining} \u5929\u540E\u5230\u671F`;
    }
    const reminderSuffix = reminderSetting?.value === 0 ? "\uFF08\u4EC5\u5230\u671F\u65F6\u63D0\u9192\uFF09" : reminderSetting?.unit === "hour" ? "\uFF08\u5C0F\u65F6\u7EA7\u63D0\u9192\uFF09" : "";
    const reminderText = sub.matchedReminderRule ? `\u63D0\u9192\u7B56\u7565: ${formatMatchedReminderRule(sub.matchedReminderRule)}` : `\u63D0\u9192\u7B56\u7565: \u63D0\u524D ${reminderSetting.value} ${reminderSetting.unit === "hour" ? "\u5C0F\u65F6" : "\u5929"}${reminderSuffix}`;
    const calendarType = sub.useLunar ? "\u519C\u5386" : "\u516C\u5386";
    const autoRenewText = sub.autoRenew ? "\u662F" : "\u5426";
    const formattedAmount = formatAmount(sub.amount, sub.currency || "CNY");
    const amountText = formattedAmount ? `
\u91D1\u989D: ${formattedAmount}/\u5468\u671F` : "";
    const subscriptionContent = `${statusEmoji} **${sub.name}**
\u7C7B\u578B: ${typeText} ${periodText}
\u5206\u7C7B: ${categoryText}${amountText}
\u65E5\u5386\u7C7B\u578B: ${calendarType}
\u5230\u671F\u65E5\u671F: ${formattedExpiryDate}${lunarExpiryText}
\u81EA\u52A8\u7EED\u671F: ${autoRenewText}
${reminderText}
\u5230\u671F\u72B6\u6001: ${statusText}`;
    let finalContent = sub.notes ? subscriptionContent + `
\u5907\u6CE8: ${sub.notes}` : subscriptionContent;
    content += finalContent + "\n\n";
  }
  const currentTime = formatTimeInTimezone(/* @__PURE__ */ new Date(), timezone, "datetime");
  content += `\u53D1\u9001\u65F6\u95F4: ${currentTime}
\u5F53\u524D\u65F6\u533A: ${formatTimezoneDisplay(timezone)}`;
  return content;
}
var init_reminder = __esm({
  "src/services/notify/reminder.js"() {
    "use strict";
    init_time();
    init_lunar();
    init_currency_format();
  }
});

// src/data/subscriptions.repo.js
async function listIds(env) {
  const raw2 = await env.SUBSCRIPTIONS_KV.get(KEY_INDEX);
  if (!raw2) return [];
  try {
    const parsed = JSON.parse(raw2);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
async function writeIds(env, ids) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const id of ids) {
    if (typeof id === "string" && !seen.has(id)) {
      seen.add(id);
      deduped.push(id);
    }
  }
  await env.SUBSCRIPTIONS_KV.put(KEY_INDEX, JSON.stringify(deduped));
}
async function getById(env, id) {
  if (!id) return null;
  const raw2 = await env.SUBSCRIPTIONS_KV.get(KEY_PREFIX + id);
  if (!raw2) return null;
  try {
    return JSON.parse(raw2);
  } catch (err) {
    console.error("[sub-repo] \u53CD\u5E8F\u5217\u5316\u5931\u8D25:", id, err);
    return null;
  }
}
async function listAll(env) {
  const ids = await listIds(env);
  if (ids.length === 0) return [];
  const items = await Promise.all(ids.map((id) => getById(env, id)));
  return items.filter((it) => it != null);
}
async function save(env, subscription) {
  if (!subscription || typeof subscription.id !== "string" || subscription.id === "") {
    throw new Error("\u8BA2\u9605\u7F3A\u5C11\u6709\u6548 id");
  }
  await env.SUBSCRIPTIONS_KV.put(
    KEY_PREFIX + subscription.id,
    JSON.stringify(subscription)
  );
  const ids = await listIds(env);
  if (!ids.includes(subscription.id)) {
    ids.push(subscription.id);
    await writeIds(env, ids);
  }
  return subscription;
}
async function saveMany(env, subs) {
  if (!Array.isArray(subs) || subs.length === 0) return;
  await Promise.all(
    subs.map((s) => env.SUBSCRIPTIONS_KV.put(KEY_PREFIX + s.id, JSON.stringify(s)))
  );
  const idsExisting = await listIds(env);
  const set = new Set(idsExisting);
  for (const s of subs) {
    if (typeof s.id === "string") set.add(s.id);
  }
  if (set.size !== idsExisting.length) {
    await writeIds(env, Array.from(set));
  }
}
async function deleteById(env, id) {
  if (!id) return false;
  const before = await env.SUBSCRIPTIONS_KV.get(KEY_PREFIX + id);
  if (!before) {
    const ids2 = await listIds(env);
    if (ids2.includes(id)) {
      await writeIds(env, ids2.filter((x) => x !== id));
    }
    return false;
  }
  await env.SUBSCRIPTIONS_KV.delete(KEY_PREFIX + id);
  const ids = await listIds(env);
  if (ids.includes(id)) {
    await writeIds(env, ids.filter((x) => x !== id));
  }
  return true;
}
async function replaceAll(env, subs) {
  const oldIds = await listIds(env);
  await Promise.all(
    oldIds.map((id) => env.SUBSCRIPTIONS_KV.delete(KEY_PREFIX + id))
  );
  if (Array.isArray(subs) && subs.length > 0) {
    await Promise.all(
      subs.map(
        (s) => env.SUBSCRIPTIONS_KV.put(KEY_PREFIX + s.id, JSON.stringify(s))
      )
    );
    await writeIds(env, subs.map((s) => s.id));
  } else {
    await writeIds(env, []);
  }
}
var KEY_INDEX, KEY_PREFIX;
var init_subscriptions_repo = __esm({
  "src/data/subscriptions.repo.js"() {
    "use strict";
    KEY_INDEX = "sub_index";
    KEY_PREFIX = "sub:";
  }
});

// src/data/categories.js
async function getCategories(env) {
  return await getKVJson(env, KEY) || [];
}
async function addCategory(env, category) {
  const trimmed = category.trim();
  if (!trimmed) return;
  const list = await getCategories(env);
  if (!list.includes(trimmed)) {
    list.push(trimmed);
    list.sort();
    await putKVJson(env, KEY, list);
  }
}
var KEY;
var init_categories = __esm({
  "src/data/categories.js"() {
    "use strict";
    init_kv();
    KEY = "categories";
  }
});

// src/data/reminders.repo.js
var reminders_repo_exports = {};
__export(reminders_repo_exports, {
  addRule: () => addRule,
  clearForSubscription: () => clearForSubscription,
  defaultPresetRules: () => defaultPresetRules,
  deleteRule: () => deleteRule,
  deriveLegacyFromRules: () => deriveLegacyFromRules,
  formatRulesSummary: () => formatRulesSummary,
  legacyFieldToRule: () => legacyFieldToRule,
  listForSubscription: () => listForSubscription,
  makeRuleId: () => makeRuleId,
  normalizeRule: () => normalizeRule,
  replaceForSubscription: () => replaceForSubscription,
  updateRule: () => updateRule
});
function makeRuleId() {
  return crypto.randomUUID();
}
function defaultPresetRules() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return [
    { id: makeRuleId(), type: "before_expiry", value: 7, unit: "days", repeatInterval: null, repeatUntil: "renewed", isEnabled: true, createdAt: now },
    { id: makeRuleId(), type: "before_expiry", value: 3, unit: "days", repeatInterval: null, repeatUntil: "renewed", isEnabled: true, createdAt: now },
    { id: makeRuleId(), type: "before_expiry", value: 1, unit: "days", repeatInterval: null, repeatUntil: "renewed", isEnabled: true, createdAt: now },
    { id: makeRuleId(), type: "on_expiry", value: 0, unit: "days", repeatInterval: null, repeatUntil: "renewed", isEnabled: true, createdAt: now }
  ];
}
function legacyFieldToRule(sub) {
  const unitRaw = String(sub.reminderUnit || "day").toLowerCase();
  const unit = unitRaw === "hour" || unitRaw === "hours" ? "hours" : "days";
  const fallback = unit === "hours" ? sub.reminderHours : sub.reminderDays;
  const value = Number(
    sub.reminderValue !== void 0 && sub.reminderValue !== null ? sub.reminderValue : fallback
  );
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 7;
  return {
    id: makeRuleId(),
    type: safeValue === 0 ? "on_expiry" : "before_expiry",
    value: safeValue,
    unit,
    repeatInterval: null,
    repeatUntil: "renewed",
    isEnabled: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function normalizeRule(raw2) {
  const r = raw2 || {};
  const type = ["before_expiry", "on_expiry", "after_expiry"].includes(r.type) ? r.type : "before_expiry";
  const unit = r.unit === "hours" ? "hours" : "days";
  const value = Number.isFinite(r.value) && r.value >= 0 ? Math.floor(r.value) : 0;
  const repeatInterval = type === "after_expiry" && Number.isFinite(r.repeatInterval) && r.repeatInterval > 0 ? Math.floor(r.repeatInterval) : null;
  const repeatUntil = ["renewed", "acknowledged", "never"].includes(r.repeatUntil) ? r.repeatUntil : "renewed";
  return {
    id: typeof r.id === "string" && r.id !== "" ? r.id : makeRuleId(),
    type,
    value,
    unit,
    repeatInterval,
    repeatUntil,
    isEnabled: r.isEnabled !== false,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function listForSubscription(env, subId) {
  const raw2 = await env.SUBSCRIPTIONS_KV.get(KEY_PREFIX2 + subId);
  if (!raw2) return [];
  try {
    const parsed = JSON.parse(raw2);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRule);
  } catch {
    return [];
  }
}
async function replaceForSubscription(env, subId, rules) {
  const safe = Array.isArray(rules) ? rules.map(normalizeRule) : [];
  await env.SUBSCRIPTIONS_KV.put(KEY_PREFIX2 + subId, JSON.stringify(safe));
}
async function addRule(env, subId, rule) {
  const list = await listForSubscription(env, subId);
  const normalized = normalizeRule({ ...rule, id: rule.id || makeRuleId() });
  list.push(normalized);
  await replaceForSubscription(env, subId, list);
  return normalized;
}
async function updateRule(env, subId, ruleId, patch) {
  const list = await listForSubscription(env, subId);
  const idx = list.findIndex((r) => r.id === ruleId);
  if (idx === -1) return null;
  list[idx] = normalizeRule({ ...list[idx], ...patch, id: ruleId });
  await replaceForSubscription(env, subId, list);
  return list[idx];
}
async function deleteRule(env, subId, ruleId) {
  const list = await listForSubscription(env, subId);
  const next = list.filter((r) => r.id !== ruleId);
  if (next.length === list.length) return false;
  await replaceForSubscription(env, subId, next);
  return true;
}
async function clearForSubscription(env, subId) {
  await env.SUBSCRIPTIONS_KV.delete(KEY_PREFIX2 + subId);
}
function deriveLegacyFromRules(rules) {
  const list = Array.isArray(rules) ? rules.filter((r) => r && r.isEnabled !== false) : [];
  if (list.length === 0) return { unit: "day", value: 7 };
  const befores = list.filter((r) => r.type === "before_expiry");
  if (befores.length > 0) {
    const sorted = [...befores].sort((a, b) => Number(b.value) - Number(a.value));
    const top = sorted[0];
    const unit2 = top.unit === "hours" ? "hour" : "day";
    return { unit: unit2, value: Number.isFinite(top.value) ? top.value : 7 };
  }
  const on = list.find((r) => r.type === "on_expiry");
  if (on) return { unit: "day", value: 0 };
  const first = list[0];
  const unit = first.unit === "hours" ? "hour" : "day";
  return { unit, value: Number.isFinite(first.value) ? first.value : 7 };
}
function formatRulesSummary(rules) {
  const list = Array.isArray(rules) ? rules.filter((r) => r && r.isEnabled !== false) : [];
  if (list.length === 0) return "\u672A\u8BBE\u7F6E\u63D0\u9192";
  const parts = [];
  const beforeDays = list.filter((r) => r.type === "before_expiry" && r.unit !== "hours").map((r) => r.value).filter((v) => Number.isFinite(v)).sort((a, b) => b - a);
  const beforeHours = list.filter((r) => r.type === "before_expiry" && r.unit === "hours").map((r) => r.value).filter((v) => Number.isFinite(v)).sort((a, b) => b - a);
  if (beforeDays.length > 0) {
    parts.push(`\u63D0\u524D ${beforeDays.join("/")} \u5929`);
  }
  if (beforeHours.length > 0) {
    parts.push(`\u63D0\u524D ${beforeHours.join("/")} \u5C0F\u65F6`);
  }
  if (list.some((r) => r.type === "on_expiry" || r.type === "before_expiry" && r.value === 0)) {
    parts.push("\u5230\u671F\u5F53\u5929");
  }
  const after = list.find((r) => r.type === "after_expiry");
  if (after) {
    const interval = after.repeatInterval && after.repeatInterval > 0 ? after.repeatInterval : 24;
    parts.push(`\u5230\u671F\u540E\u6BCF ${interval} \u5C0F\u65F6`);
  }
  return parts.length > 0 ? parts.join(" \xB7 ") : "\u672A\u8BBE\u7F6E\u63D0\u9192";
}
var KEY_PREFIX2;
var init_reminders_repo = __esm({
  "src/data/reminders.repo.js"() {
    "use strict";
    KEY_PREFIX2 = "reminder_rules:";
  }
});

// src/data/subscriptions.js
var subscriptions_exports = {};
__export(subscriptions_exports, {
  createSubscription: () => createSubscription,
  deletePaymentRecord: () => deletePaymentRecord,
  deleteSubscription: () => deleteSubscription,
  getAllSubscriptions: () => getAllSubscriptions,
  getSubscription: () => getSubscription,
  manualRenewSubscription: () => manualRenewSubscription,
  syncLegacyReminderFields: () => syncLegacyReminderFields,
  toggleSubscriptionStatus: () => toggleSubscriptionStatus,
  updatePaymentRecord: () => updatePaymentRecord,
  updateSubscription: () => updateSubscription
});
function trimPaymentHistory(records = [], limit = 100) {
  const safeLimit = Math.min(1e3, Math.max(10, Number(limit) || 100));
  if (!Array.isArray(records)) return [];
  if (records.length <= safeLimit) return records;
  const initialRecords = records.filter((item) => item && item.type === "initial");
  const otherRecords = records.filter((item) => item && item.type !== "initial");
  const keptOther = otherRecords.slice(-(safeLimit - Math.min(initialRecords.length, 1)));
  const keptInitial = initialRecords.length > 0 ? [initialRecords[0]] : [];
  return [...keptInitial, ...keptOther];
}
function parseOptionalDateInTimezone(value, timezone) {
  if (value == null || value === "") return null;
  const parsed = parseDateInputInTimezone(value, timezone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function buildTimezoneDate(year, month, day, timezone) {
  return parseDateInputInTimezone(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    timezone
  );
}
async function getAllSubscriptions(env) {
  try {
    const subs = await listAll(env);
    return Promise.all(
      subs.map(async (sub) => {
        let summary = sub.reminderRulesSummary;
        if (!summary) {
          const { listForSubscription: listForSubscription2, formatRulesSummary: formatRulesSummary2, legacyFieldToRule: legacyFieldToRule2 } = await Promise.resolve().then(() => (init_reminders_repo(), reminders_repo_exports));
          let rules = await listForSubscription2(env, sub.id);
          if (rules.length === 0) {
            rules = [legacyFieldToRule2(sub)];
          }
          summary = formatRulesSummary2(rules);
        }
        return {
          ...sub,
          reminderRulesSummary: summary
        };
      })
    );
  } catch (error) {
    console.error("[subscriptions] \u8BFB\u53D6\u5217\u8868\u5931\u8D25:", error);
    return [];
  }
}
async function syncLegacyReminderFields(env, subId, rules) {
  try {
    const { deriveLegacyFromRules: deriveLegacyFromRules2, formatRulesSummary: formatRulesSummary2 } = await Promise.resolve().then(() => (init_reminders_repo(), reminders_repo_exports));
    const existing = await getById(env, subId);
    if (!existing) return;
    const legacy = deriveLegacyFromRules2(rules);
    await save(env, {
      ...existing,
      reminderUnit: legacy.unit,
      reminderValue: legacy.value,
      reminderDays: legacy.unit === "day" ? legacy.value : void 0,
      reminderHours: legacy.unit === "hour" ? legacy.value : void 0,
      reminderRulesSummary: formatRulesSummary2(rules),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("[subscriptions] \u540C\u6B65 legacy \u63D0\u9192\u5B57\u6BB5\u5931\u8D25:", error);
  }
}
async function getSubscription(id, env) {
  return getById(env, id);
}
async function createSubscription(subscription, env) {
  try {
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" };
    }
    const config = await getConfig(env);
    const timezone = config.TIMEZONE || "Asia/Shanghai";
    const now = getNowInTimezone(timezone);
    const todayMidnight = getTimezoneMidnightTimestamp(now.utc, timezone);
    const startDate = parseOptionalDateInTimezone(subscription.startDate, timezone);
    let expiryDate = parseOptionalDateInTimezone(subscription.expiryDate, timezone);
    if (!expiryDate) {
      return { success: false, message: "\u5230\u671F\u65E5\u671F\u683C\u5F0F\u65E0\u6548" };
    }
    let useLunar = !!subscription.useLunar;
    if (useLunar) {
      const expiryParts = getTimezoneDateParts(expiryDate, timezone);
      let lunar = lunarCalendar.solar2lunar(
        expiryParts.year,
        expiryParts.month,
        expiryParts.day
      );
      if (lunar && subscription.periodValue && subscription.periodUnit) {
        while (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight) {
          lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
          const solar = lunarBiz.lunar2solar(lunar);
          expiryDate = buildTimezoneDate(solar.year, solar.month, solar.day, timezone);
        }
      }
    } else {
      if (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight && subscription.periodValue && subscription.periodUnit) {
        while (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight) {
          const endOfMonth = !!subscription.endOfMonth && !useLunar;
          expiryDate = addCalendarPeriodInTimezone(
            expiryDate,
            subscription.periodValue,
            subscription.periodUnit,
            timezone,
            { endOfMonth }
          );
        }
      }
    }
    const reminderSetting = resolveReminderSetting(subscription);
    const normalizedStartDate = startDate ? startDate.toISOString() : null;
    const normalizedExpiryDate = expiryDate.toISOString();
    const endOfMonthFlag = !!subscription.endOfMonth && !useLunar;
    const initialPaymentDate = normalizedStartDate || now.utc.toISOString();
    const newSubscription = {
      id: Date.now().toString(),
      name: subscription.name,
      subscriptionMode: subscription.subscriptionMode || "cycle",
      customType: subscription.customType || "",
      category: subscription.category ? subscription.category.trim() : "",
      startDate: normalizedStartDate,
      expiryDate: normalizedExpiryDate,
      periodValue: subscription.periodValue || 1,
      periodUnit: subscription.periodUnit || "month",
      endOfMonth: endOfMonthFlag,
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === "day" ? reminderSetting.value : void 0,
      reminderHours: reminderSetting.unit === "hour" ? reminderSetting.value : void 0,
      notes: subscription.notes || "",
      amount: subscription.amount !== void 0 && subscription.amount !== null ? subscription.amount : null,
      currency: subscription.currency || "CNY",
      lastPaymentDate: initialPaymentDate,
      paymentHistory: subscription.amount !== void 0 && subscription.amount !== null ? [
        {
          id: Date.now().toString(),
          date: initialPaymentDate,
          amount: subscription.amount,
          currency: subscription.currency || "CNY",
          type: "initial",
          note: "\u521D\u59CB\u8BA2\u9605",
          periodStart: normalizedStartDate || initialPaymentDate,
          periodEnd: normalizedExpiryDate
        }
      ] : [],
      isActive: subscription.isActive !== false,
      autoRenew: subscription.autoRenew !== false,
      useLunar,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await save(env, newSubscription);
    if (newSubscription.category) await addCategory(env, newSubscription.category);
    return { success: true, subscription: newSubscription };
  } catch (error) {
    console.error("\u521B\u5EFA\u8BA2\u9605\u5F02\u5E38\uFF1A", error && error.stack ? error.stack : error);
    return { success: false, message: error && error.message ? error.message : "\u521B\u5EFA\u8BA2\u9605\u5931\u8D25" };
  }
}
async function updateSubscription(id, subscription, env) {
  try {
    const existing = await getById(env, id);
    if (!existing) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" };
    }
    const config = await getConfig(env);
    const timezone = config.TIMEZONE || "Asia/Shanghai";
    const now = getNowInTimezone(timezone);
    const todayMidnight = getTimezoneMidnightTimestamp(now.utc, timezone);
    const incomingStartDate = parseOptionalDateInTimezone(subscription.startDate, timezone);
    let expiryDate = parseOptionalDateInTimezone(subscription.expiryDate, timezone);
    if (!expiryDate) {
      return { success: false, message: "\u5230\u671F\u65E5\u671F\u683C\u5F0F\u65E0\u6548" };
    }
    let useLunar = !!subscription.useLunar;
    if (useLunar) {
      const expiryParts = getTimezoneDateParts(expiryDate, timezone);
      let lunar = lunarCalendar.solar2lunar(
        expiryParts.year,
        expiryParts.month,
        expiryParts.day
      );
      if (!lunar) {
        return { success: false, message: "\u519C\u5386\u65E5\u671F\u8D85\u51FA\u652F\u6301\u8303\u56F4\uFF081900-2100\u5E74\uFF09" };
      }
      if (lunar && getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight && subscription.periodValue && subscription.periodUnit) {
        do {
          lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
          const solar = lunarBiz.lunar2solar(lunar);
          expiryDate = buildTimezoneDate(solar.year, solar.month, solar.day, timezone);
        } while (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight);
      }
    } else {
      const endOfMonth = subscription.endOfMonth !== void 0 ? !!subscription.endOfMonth && !useLunar : !!existing.endOfMonth && !useLunar;
      if (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight && subscription.periodValue && subscription.periodUnit) {
        while (getTimezoneMidnightTimestamp(expiryDate, timezone) < todayMidnight) {
          expiryDate = addCalendarPeriodInTimezone(
            expiryDate,
            subscription.periodValue,
            subscription.periodUnit,
            timezone,
            { endOfMonth }
          );
        }
      }
    }
    const reminderSource = {
      reminderUnit: subscription.reminderUnit !== void 0 ? subscription.reminderUnit : existing.reminderUnit,
      reminderValue: subscription.reminderValue !== void 0 ? subscription.reminderValue : existing.reminderValue,
      reminderHours: subscription.reminderHours !== void 0 ? subscription.reminderHours : existing.reminderHours,
      reminderDays: subscription.reminderDays !== void 0 ? subscription.reminderDays : existing.reminderDays
    };
    const reminderSetting = resolveReminderSetting(reminderSource);
    const newAmount = subscription.amount !== void 0 ? subscription.amount : existing.amount;
    let paymentHistory = existing.paymentHistory || [];
    const hasInitialPayment = paymentHistory.some((p) => p.type === "initial");
    const amountChanged = newAmount !== existing.amount || subscription.currency !== void 0 && subscription.currency !== existing.currency;
    if (amountChanged && hasInitialPayment) {
      const idx = paymentHistory.findIndex((p) => p.type === "initial");
      paymentHistory[idx] = {
        ...paymentHistory[idx],
        amount: newAmount,
        currency: subscription.currency || existing.currency || "CNY"
      };
    } else if (!hasInitialPayment && newAmount !== null && newAmount !== void 0 && newAmount > 0) {
      const initialDate = existing.startDate || existing.createdAt || (/* @__PURE__ */ new Date()).toISOString();
      paymentHistory.unshift({
        id: Date.now().toString(),
        date: initialDate,
        amount: newAmount,
        currency: subscription.currency || existing.currency || "CNY",
        type: "initial",
        note: "\u521D\u59CB\u8BA2\u9605",
        periodStart: existing.startDate || initialDate,
        periodEnd: existing.expiryDate || initialDate
      });
    }
    const merged = {
      ...existing,
      name: subscription.name,
      subscriptionMode: subscription.subscriptionMode || existing.subscriptionMode || "cycle",
      customType: subscription.customType || existing.customType || "",
      category: subscription.category !== void 0 ? subscription.category.trim() : existing.category || "",
      startDate: subscription.startDate !== void 0 ? incomingStartDate ? incomingStartDate.toISOString() : existing.startDate : existing.startDate,
      expiryDate: expiryDate.toISOString(),
      periodValue: subscription.periodValue || existing.periodValue || 1,
      periodUnit: subscription.periodUnit || existing.periodUnit || "month",
      endOfMonth: subscription.endOfMonth !== void 0 ? !!subscription.endOfMonth && !useLunar : !!existing.endOfMonth && !useLunar,
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === "day" ? reminderSetting.value : void 0,
      reminderHours: reminderSetting.unit === "hour" ? reminderSetting.value : void 0,
      notes: subscription.notes || "",
      amount: newAmount,
      currency: subscription.currency || existing.currency || "CNY",
      lastPaymentDate: existing.lastPaymentDate || existing.startDate || existing.createdAt || now.utc.toISOString(),
      paymentHistory,
      isActive: subscription.isActive !== void 0 ? subscription.isActive : existing.isActive,
      autoRenew: subscription.autoRenew !== void 0 ? subscription.autoRenew : existing.autoRenew !== void 0 ? existing.autoRenew : true,
      useLunar,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await save(env, merged);
    if (merged.category) await addCategory(env, merged.category);
    return { success: true, subscription: merged };
  } catch (error) {
    console.error("[subscriptions] \u66F4\u65B0\u8BA2\u9605\u5931\u8D25:", error);
    return { success: false, message: "\u66F4\u65B0\u8BA2\u9605\u5931\u8D25" };
  }
}
async function deleteSubscription(id, env) {
  try {
    const ok2 = await deleteById(env, id);
    if (!ok2) return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    try {
      const remindersRepo = await Promise.resolve().then(() => (init_reminders_repo(), reminders_repo_exports));
      await remindersRepo.clearForSubscription(env, id);
    } catch (err) {
      console.error("[subscriptions] \u6E05\u7406\u63D0\u9192\u89C4\u5219\u5931\u8D25\uFF08\u8BA2\u9605\u5DF2\u5220\u9664\uFF09:", err);
    }
    return { success: true };
  } catch (error) {
    console.error("[subscriptions] \u5220\u9664\u8BA2\u9605\u5931\u8D25:", error);
    return { success: false, message: "\u5220\u9664\u8BA2\u9605\u5931\u8D25" };
  }
}
async function manualRenewSubscription(id, env, options = {}) {
  try {
    const subscription = await getById(env, id);
    if (!subscription) return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    if (!subscription.periodValue || !subscription.periodUnit) {
      return { success: false, message: "\u8BA2\u9605\u672A\u8BBE\u7F6E\u7EED\u8BA2\u5468\u671F" };
    }
    const config = await getConfig(env);
    const timezone = config.TIMEZONE || "Asia/Shanghai";
    const now = getNowInTimezone(timezone);
    const paymentDate = options.paymentDate ? parseDateInputInTimezone(options.paymentDate, timezone) : now.utc;
    const amount = options.amount !== void 0 ? options.amount : subscription.amount || 0;
    const periodMultiplier = options.periodMultiplier || 1;
    const note = options.note || "\u624B\u52A8\u7EED\u8BA2";
    const mode = subscription.subscriptionMode || "cycle";
    let newStartDate;
    const currentExpiryDate = new Date(subscription.expiryDate);
    if (mode === "reset") {
      newStartDate = new Date(paymentDate);
    } else {
      newStartDate = currentExpiryDate.getTime() > paymentDate.getTime() ? new Date(currentExpiryDate) : new Date(paymentDate);
    }
    let newExpiryDate;
    if (subscription.useLunar) {
      const solarStart = getTimezoneDateParts(newStartDate, timezone);
      let lunar = lunarCalendar.solar2lunar(solarStart.year, solarStart.month, solarStart.day);
      let nextLunar = lunar;
      for (let i = 0; i < periodMultiplier; i++) {
        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
      }
      const solar = lunarBiz.lunar2solar(nextLunar);
      newExpiryDate = buildTimezoneDate(solar.year, solar.month, solar.day, timezone);
    } else {
      const totalPeriodValue = subscription.periodValue * periodMultiplier;
      newExpiryDate = addCalendarPeriodInTimezone(
        newStartDate,
        totalPeriodValue,
        subscription.periodUnit,
        timezone,
        { endOfMonth: !!subscription.endOfMonth }
      );
    }
    const paymentRecord = {
      id: Date.now().toString(),
      date: paymentDate.toISOString(),
      amount,
      currency: subscription.currency || "CNY",
      type: "manual",
      note,
      periodStart: newStartDate.toISOString(),
      periodEnd: newExpiryDate.toISOString()
    };
    const paymentHistoryLimit = config.PAYMENT_HISTORY_LIMIT || 100;
    const paymentHistory = [...subscription.paymentHistory || [], paymentRecord];
    const trimmedPaymentHistory = trimPaymentHistory(paymentHistory, paymentHistoryLimit);
    const updated = {
      ...subscription,
      startDate: newStartDate.toISOString(),
      expiryDate: newExpiryDate.toISOString(),
      lastPaymentDate: paymentDate.toISOString(),
      paymentHistory: trimmedPaymentHistory
    };
    await save(env, updated);
    return { success: true, subscription: updated, message: "\u7EED\u8BA2\u6210\u529F" };
  } catch (error) {
    console.error("\u624B\u52A8\u7EED\u8BA2\u5931\u8D25:", error);
    return { success: false, message: "\u7EED\u8BA2\u5931\u8D25: " + (error && error.message ? error.message : error) };
  }
}
async function deletePaymentRecord(subscriptionId, paymentId, env) {
  try {
    const subscription = await getById(env, subscriptionId);
    if (!subscription) return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) return { success: false, message: "\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728" };
    const deletedPayment = paymentHistory[paymentIndex];
    paymentHistory.splice(paymentIndex, 1);
    let newExpiryDate = subscription.expiryDate;
    let newLastPaymentDate = subscription.lastPaymentDate;
    if (paymentHistory.length > 0) {
      const sortedByPeriodEnd = [...paymentHistory].sort((a, b) => {
        const dateA = a.periodEnd ? new Date(a.periodEnd) : /* @__PURE__ */ new Date(0);
        const dateB = b.periodEnd ? new Date(b.periodEnd) : /* @__PURE__ */ new Date(0);
        return Number(dateB) - Number(dateA);
      });
      if (sortedByPeriodEnd[0].periodEnd) {
        newExpiryDate = sortedByPeriodEnd[0].periodEnd;
      }
      const sortedByDate = [...paymentHistory].sort(
        (a, b) => Number(new Date(b.date)) - Number(new Date(a.date))
      );
      newLastPaymentDate = sortedByDate[0].date;
    } else {
      if (deletedPayment.periodStart) newExpiryDate = deletedPayment.periodStart;
      newLastPaymentDate = subscription.startDate || subscription.createdAt || subscription.expiryDate;
    }
    const updated = {
      ...subscription,
      expiryDate: newExpiryDate,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };
    await save(env, updated);
    return { success: true, subscription: updated, message: "\u652F\u4ED8\u8BB0\u5F55\u5DF2\u5220\u9664" };
  } catch (error) {
    console.error("\u5220\u9664\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:", error);
    return {
      success: false,
      message: "\u5220\u9664\u5931\u8D25: " + (error && error.message ? error.message : error)
    };
  }
}
async function updatePaymentRecord(subscriptionId, paymentId, paymentData, env) {
  try {
    const subscription = await getById(env, subscriptionId);
    if (!subscription) return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    const config = await getConfig(env);
    const timezone = config.TIMEZONE || "Asia/Shanghai";
    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) return { success: false, message: "\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728" };
    const normalizedPaymentDate = parseOptionalDateInTimezone(paymentData.date, timezone);
    paymentHistory[paymentIndex] = {
      ...paymentHistory[paymentIndex],
      date: normalizedPaymentDate ? normalizedPaymentDate.toISOString() : paymentHistory[paymentIndex].date,
      amount: paymentData.amount !== void 0 ? paymentData.amount : paymentHistory[paymentIndex].amount,
      currency: paymentData.currency || paymentHistory[paymentIndex].currency || subscription.currency || "CNY",
      note: paymentData.note !== void 0 ? paymentData.note : paymentHistory[paymentIndex].note
    };
    const sortedPayments = [...paymentHistory].sort(
      (a, b) => Number(new Date(b.date)) - Number(new Date(a.date))
    );
    const newLastPaymentDate = sortedPayments[0].date;
    const updated = {
      ...subscription,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };
    await save(env, updated);
    return { success: true, subscription: updated, message: "\u652F\u4ED8\u8BB0\u5F55\u5DF2\u66F4\u65B0" };
  } catch (error) {
    console.error("\u66F4\u65B0\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:", error);
    return {
      success: false,
      message: "\u66F4\u65B0\u5931\u8D25: " + (error && error.message ? error.message : error)
    };
  }
}
async function toggleSubscriptionStatus(id, isActive, env) {
  try {
    const existing = await getById(env, id);
    if (!existing) return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    const updated = {
      ...existing,
      isActive: !!isActive,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await save(env, updated);
    return { success: true, subscription: updated };
  } catch (error) {
    console.error("[subscriptions] \u5207\u6362\u72B6\u6001\u5931\u8D25:", error);
    return { success: false, message: "\u66F4\u65B0\u8BA2\u9605\u72B6\u6001\u5931\u8D25" };
  }
}
var init_subscriptions = __esm({
  "src/data/subscriptions.js"() {
    "use strict";
    init_config();
    init_time();
    init_lunar();
    init_reminder();
    init_subscriptions_repo();
    init_categories();
  }
});

// src/data/scheduler-logs.repo.js
async function writeLog(env, entry, opts = {}) {
  const key = PREFIX + (entry.startedAt || (/* @__PURE__ */ new Date()).toISOString());
  const stored = {
    startedAt: entry.startedAt || (/* @__PURE__ */ new Date()).toISOString(),
    finishedAt: entry.finishedAt || (/* @__PURE__ */ new Date()).toISOString(),
    timezone: entry.timezone || "UTC",
    currentHour: entry.currentHour || "00",
    configuredHours: entry.configuredHours || [],
    inWindow: !!entry.inWindow,
    checkedCount: entry.checkedCount || 0,
    matchedCount: entry.matchedCount || 0,
    dedupedCount: entry.dedupedCount || 0,
    sentCount: entry.sentCount || 0,
    autoRenewedCount: entry.autoRenewedCount || 0,
    status: entry.status || "ok",
    reason: entry.reason,
    extra: entry.extra
  };
  await env.SUBSCRIPTIONS_KV.put(key, JSON.stringify(stored), {
    expirationTtl: Math.max(60, opts.ttlSec || DEFAULT_TTL_SEC)
  });
  return { key, ...stored };
}
async function getRecent(env, limit = 20) {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
  const allKeys = [];
  let cursor;
  do {
    const res = await env.SUBSCRIPTIONS_KV.list({
      prefix: PREFIX,
      cursor,
      limit: 1e3
    });
    for (const k of res.keys) allKeys.push(k.name);
    cursor = res.list_complete ? void 0 : res.cursor;
  } while (cursor && allKeys.length < 5e3);
  allKeys.sort((a, b) => b.localeCompare(a));
  const top = allKeys.slice(0, safeLimit);
  const items = await Promise.all(
    top.map(async (key) => {
      const raw2 = await env.SUBSCRIPTIONS_KV.get(key);
      if (!raw2) return null;
      try {
        return { key, ...JSON.parse(raw2) };
      } catch {
        return null;
      }
    })
  );
  return items.filter((x) => x != null);
}
var PREFIX, DEFAULT_TTL_SEC;
var init_scheduler_logs_repo = __esm({
  "src/data/scheduler-logs.repo.js"() {
    "use strict";
    PREFIX = "sched_log:";
    DEFAULT_TTL_SEC = 30 * 24 * 3600;
  }
});

// src/data/notification-logs.repo.js
function ymdhUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return ymdhUtc(/* @__PURE__ */ new Date());
  }
  const yyyy = String(d.getUTCFullYear()).padStart(4, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}`;
}
async function writeLog2(env, entry) {
  const ts = entry.timestamp ? new Date(entry.timestamp) : /* @__PURE__ */ new Date();
  const rand = Math.floor(ts.getTime() % 1e5).toString(36).padStart(4, "0");
  const ruleId = entry.ruleId || "none";
  const key = `${PREFIX2}${ymdhUtc(ts)}:${entry.subId}:${ruleId}:${entry.channel}:${rand}`;
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
    expirationTtl: Math.max(60, entry.ttlSec || DEFAULT_TTL_SEC2)
  });
  return { key, ...stored };
}
async function queryPage(env, filter = {}) {
  return queryInternal(env, filter);
}
async function queryInternal(env, filter = {}) {
  const limit = Math.min(500, Math.max(1, filter.limit || 100));
  const sinceMs = filter.since ? new Date(filter.since).getTime() : 0;
  const untilMs = filter.until ? new Date(filter.until).getTime() : Number.POSITIVE_INFINITY;
  const out = [];
  let currentHour;
  if (filter.cursor && /^\d{10}$/.test(String(filter.cursor))) {
    currentHour = String(filter.cursor);
  } else {
    const anchor = untilMs === Number.POSITIVE_INFINITY ? Date.now() : Math.min(Date.now(), untilMs);
    currentHour = ymdhUtc(new Date(anchor));
  }
  const MAX_SCAN = 720;
  let guard = 0;
  while (out.length < limit && guard < MAX_SCAN) {
    guard++;
    const res = await env.SUBSCRIPTIONS_KV.list({
      prefix: PREFIX2 + currentHour,
      limit: 1e3
    });
    const keys = res.keys.map((k) => k.name).sort((a, b) => b.localeCompare(a));
    for (const key of keys) {
      if (out.length >= limit) break;
      const raw2 = await env.SUBSCRIPTIONS_KV.get(key);
      if (!raw2) continue;
      try {
        const obj = JSON.parse(raw2);
        if (filter.subId && obj.subId !== filter.subId) continue;
        if (filter.channel && obj.channel !== filter.channel) continue;
        if (filter.status && obj.status !== filter.status) continue;
        const tsMs = new Date(obj.timestamp).getTime();
        if (tsMs < sinceMs || tsMs > untilMs) continue;
        out.push({ key, ...obj });
      } catch {
      }
    }
    const prev = hourMinus1(currentHour);
    if (prev === currentHour) {
      currentHour = null;
      break;
    }
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
var PREFIX2, DEFAULT_TTL_SEC2;
var init_notification_logs_repo = __esm({
  "src/data/notification-logs.repo.js"() {
    "use strict";
    PREFIX2 = "notify_log:";
    DEFAULT_TTL_SEC2 = 30 * 24 * 3600;
  }
});

// src/services/notify/reminder-engine.js
function shouldFire(rule, ctx) {
  if (!rule || rule.isEnabled === false) {
    return { fire: false, reason: "rule_disabled" };
  }
  const { daysDiff, hoursDiff } = ctx;
  if (!Number.isFinite(daysDiff) || !Number.isFinite(hoursDiff)) {
    return { fire: false, reason: "invalid_diff" };
  }
  switch (rule.type) {
    case "before_expiry":
      return decideBeforeExpiry(rule, ctx);
    case "on_expiry":
      return decideOnExpiry(rule, ctx);
    case "after_expiry":
      return decideAfterExpiry(rule, ctx);
    default:
      return { fire: false, reason: "unknown_rule_type" };
  }
}
function decideBeforeExpiry(rule, ctx) {
  const { daysDiff, hoursDiff } = ctx;
  if (rule.unit === "hours") {
    if (rule.value === 0) {
      return hoursDiff >= 0 && hoursDiff < 1 ? { fire: true, reason: "within_hour" } : { fire: false, reason: "not_within_hour" };
    }
    if (hoursDiff < 0) return { fire: false, reason: "already_expired" };
    if (Math.round(hoursDiff) === rule.value) {
      return { fire: true, reason: `hours_diff_eq_${rule.value}` };
    }
    return { fire: false, reason: `hours_diff=${hoursDiff}_not_match_${rule.value}` };
  }
  if (rule.value === 0) {
    return daysDiff === 0 ? { fire: true, reason: "days_diff_zero" } : { fire: false, reason: `days_diff=${daysDiff}_not_zero` };
  }
  if (daysDiff === rule.value) {
    return { fire: true, reason: `days_diff_eq_${rule.value}` };
  }
  return { fire: false, reason: `days_diff=${daysDiff}_not_match_${rule.value}` };
}
function decideOnExpiry(rule, ctx) {
  void rule;
  return ctx.daysDiff === 0 ? { fire: true, reason: "on_expiry_day" } : { fire: false, reason: `days_diff=${ctx.daysDiff}_not_today` };
}
function decideAfterExpiry(rule, ctx) {
  if (ctx.daysDiff >= 0) return { fire: false, reason: "not_expired_yet" };
  const interval = Number.isFinite(rule.repeatInterval) && rule.repeatInterval > 0 ? rule.repeatInterval : 24;
  if (!ctx.lastFireAtIso) {
    return { fire: true, reason: "after_expiry_first_fire" };
  }
  const last = new Date(ctx.lastFireAtIso).getTime();
  const now = ctx.nowIso ? new Date(ctx.nowIso).getTime() : Date.now();
  if (Number.isNaN(last) || Number.isNaN(now)) {
    return { fire: true, reason: "invalid_last_fire_assume_due" };
  }
  const elapsedHours = (now - last) / (3600 * 1e3);
  if (elapsedHours >= interval) {
    return { fire: true, reason: `after_expiry_interval_${interval}h_elapsed` };
  }
  return { fire: false, reason: `after_expiry_within_${interval}h_window` };
}
function getNextFireTime(rule, expiryDateIso, nowIso) {
  if (!rule || rule.isEnabled === false) return null;
  const expiry = new Date(expiryDateIso).getTime();
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  if (Number.isNaN(expiry)) return null;
  const MS_HOUR = 36e5;
  const MS_DAY = 864e5;
  if (rule.type === "before_expiry") {
    let fireAt;
    if (rule.unit === "hours") {
      fireAt = expiry - rule.value * MS_HOUR;
    } else {
      fireAt = expiry - rule.value * MS_DAY;
    }
    return fireAt >= now ? new Date(fireAt).toISOString() : null;
  }
  if (rule.type === "on_expiry") {
    return expiry >= now ? new Date(expiry).toISOString() : null;
  }
  if (rule.type === "after_expiry") {
    if (now < expiry) return new Date(expiry).toISOString();
    const interval = rule.repeatInterval && rule.repeatInterval > 0 ? rule.repeatInterval : 24;
    const elapsed = now - expiry;
    const periods = Math.ceil(elapsed / (interval * MS_HOUR));
    const nextFire = expiry + periods * interval * MS_HOUR;
    return new Date(nextFire).toISOString();
  }
  return null;
}
var init_reminder_engine = __esm({
  "src/services/notify/reminder-engine.js"() {
    "use strict";
  }
});

// src/api/handlers/extras.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function syncLegacyAfterRulesChange(env, subId, rules) {
  try {
    const { syncLegacyReminderFields: syncLegacyReminderFields2 } = await Promise.resolve().then(() => (init_subscriptions(), subscriptions_exports));
    const list = rules || await listForSubscription(env, subId);
    await syncLegacyReminderFields2(env, subId, list);
  } catch (err) {
    console.error("[reminders] \u540C\u6B65 legacy \u5B57\u6BB5\u5931\u8D25:", err);
  }
}
async function handleExtraRoutes(request, env, path) {
  const method = request.method;
  const remMatch = path.match(/^\/subscriptions\/([^/]+)\/reminders(?:\/([^/]+))?\/?$/);
  if (remMatch) {
    const [, subId, ruleId] = remMatch;
    return handleReminderRoute(request, env, method, subId, ruleId);
  }
  const nrMatch = path.match(/^\/subscriptions\/([^/]+)\/next-reminder\/?$/);
  if (nrMatch && method === "GET") {
    const [, subId] = nrMatch;
    const { getSubscription: getSubscription2 } = await Promise.resolve().then(() => (init_subscriptions(), subscriptions_exports));
    const sub = await getSubscription2(subId, env);
    if (!sub) return json({ success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" }, 404);
    const rules = await listForSubscription(env, subId);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const times = rules.map((r) => ({ ruleId: r.id, type: r.type, value: r.value, unit: r.unit, nextFireTime: getNextFireTime(r, sub.expiryDate, nowIso) })).filter((t) => t.nextFireTime !== null).sort((a, b) => new Date(a.nextFireTime).getTime() - new Date(b.nextFireTime).getTime());
    return json({ success: true, nextReminder: times[0] || null, allUpcoming: times });
  }
  if (path === "/notification-logs" && method === "GET") {
    return handleNotifyLogsList(request, env);
  }
  if (path === "/scheduler-logs" && method === "GET") {
    return handleSchedLogsList(request, env);
  }
  if (path === "/version" && method === "GET") {
    return json({ success: true, version: VERSION });
  }
  if (path === "/categories") {
    if (method === "GET") {
      return json({ success: true, categories: await getCategories(env) });
    }
    if (method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }, 400);
      }
      const name = body && body.name;
      if (!name || !name.trim()) return json({ success: false, message: "\u5206\u7C7B\u540D\u4E0D\u80FD\u4E3A\u7A7A" }, 400);
      await addCategory(env, name);
      return json({ success: true });
    }
  }
  return null;
}
async function handleReminderRoute(request, env, method, subId, ruleId) {
  if (method === "GET" && !ruleId) {
    const list = await listForSubscription(env, subId);
    return json({ success: true, rules: list });
  }
  if (method === "POST" && !ruleId) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }, 400);
    }
    if (body && body.preset === true) {
      const presets = defaultPresetRules();
      await replaceForSubscription(env, subId, presets);
      await syncLegacyAfterRulesChange(env, subId);
      return json({ success: true, rules: presets });
    }
    const rule = await addRule(env, subId, body || {});
    await syncLegacyAfterRulesChange(env, subId);
    return json({ success: true, rule });
  }
  if (method === "PUT" && !ruleId) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }, 400);
    }
    const rules = Array.isArray(body && body.rules) ? body.rules : [];
    await replaceForSubscription(env, subId, rules);
    const saved = await listForSubscription(env, subId);
    await syncLegacyAfterRulesChange(env, subId, saved);
    return json({ success: true, rules: saved });
  }
  if (method === "PUT" && ruleId) {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }, 400);
    }
    const updated = await updateRule(env, subId, ruleId, body || {});
    if (!updated) return json({ success: false, message: "\u89C4\u5219\u4E0D\u5B58\u5728" }, 404);
    await syncLegacyAfterRulesChange(env, subId);
    return json({ success: true, rule: updated });
  }
  if (method === "DELETE" && ruleId) {
    const ok2 = await deleteRule(env, subId, ruleId);
    if (!ok2) return json({ success: false, message: "\u89C4\u5219\u4E0D\u5B58\u5728" }, 404);
    await syncLegacyAfterRulesChange(env, subId);
    return json({ success: true });
  }
  return json({ success: false, message: "Method Not Allowed" }, 405);
}
async function handleNotifyLogsList(request, env) {
  const url = new URL(request.url);
  const filter = {
    subId: url.searchParams.get("subId") || void 0,
    channel: url.searchParams.get("channel") || void 0,
    status: (
      /** @type {'success'|'failed'|undefined} */
      url.searchParams.get("status") || void 0
    ),
    since: url.searchParams.get("since") || void 0,
    until: url.searchParams.get("until") || void 0,
    limit: Number(url.searchParams.get("limit") || 100),
    cursor: url.searchParams.get("cursor") || void 0
  };
  const { items, nextCursor } = await queryPage(env, filter);
  return json({ success: true, logs: items, nextCursor });
}
async function handleSchedLogsList(request, env) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 20);
  const logs = await getRecent(env, limit);
  return json({ success: true, logs });
}
var VERSION;
var init_extras = __esm({
  "src/api/handlers/extras.js"() {
    "use strict";
    init_reminders_repo();
    init_notification_logs_repo();
    init_scheduler_logs_repo();
    init_categories();
    init_reminder_engine();
    VERSION = "3.0.0";
  }
});

// src/api/handlers/backup.js
var backup_exports = {};
__export(backup_exports, {
  handleExportBackup: () => handleExportBackup,
  handleImportBackup: () => handleImportBackup
});
function json2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function buildExportConfig(config, includeSecrets) {
  const out = { ...config };
  delete out.JWT_SECRET;
  if (!includeSecrets) {
    delete out.ADMIN_PASSWORD;
    for (const key of SECRET_FIELDS) {
      if (key in out) out[key] = "";
    }
  } else {
    delete out.JWT_SECRET;
  }
  return out;
}
async function handleExportBackup(request, env) {
  try {
    const url = new URL(request.url);
    const includeSecrets = url.searchParams.get("includeSecrets") === "1" || url.searchParams.get("includeSecrets") === "true";
    const config = await getConfig(env);
    const categories = await getCategories(env);
    const subscriptions = await listAll(env);
    const reminderRules = {};
    for (const sub of subscriptions) {
      if (!sub || !sub.id) continue;
      let rules = await listForSubscription(env, sub.id);
      if (rules.length === 0) {
        rules = [legacyFieldToRule(sub)];
      }
      reminderRules[sub.id] = rules;
    }
    const cleanSubs = subscriptions.map((sub) => {
      const { reminderRules: _rr, reminderRulesSummary: _rs, ...rest } = sub || {};
      return rest;
    });
    const backup = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      appVersion: VERSION,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      includeSecrets,
      config: buildExportConfig(config, includeSecrets),
      categories,
      subscriptions: cleanSubs,
      reminderRules
    };
    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="substracker-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json"`
      }
    });
  } catch (error) {
    console.error("[backup] \u5BFC\u51FA\u5931\u8D25:", error);
    return json2(
      { success: false, message: "\u5BFC\u51FA\u5931\u8D25: " + (error && error.message ? error.message : String(error)) },
      500
    );
  }
}
function validateSubscriptionEntry(sub, index) {
  if (!sub || typeof sub !== "object") {
    return `subscriptions[${index}] \u4E0D\u662F\u5BF9\u8C61`;
  }
  if (typeof sub.id !== "string" || !sub.id.trim()) {
    return `subscriptions[${index}] \u7F3A\u5C11\u6709\u6548 id`;
  }
  if (typeof sub.name !== "string" || !sub.name.trim()) {
    return `subscriptions[${index}] \u7F3A\u5C11 name`;
  }
  if (!sub.expiryDate || Number.isNaN(new Date(sub.expiryDate).getTime())) {
    return `subscriptions[${index}] \u7F3A\u5C11\u6709\u6548 expiryDate`;
  }
  return null;
}
function validateBackup(raw2) {
  if (!raw2 || typeof raw2 !== "object") {
    return { ok: false, message: "\u5907\u4EFD\u5185\u5BB9\u4E0D\u662F\u6709\u6548 JSON \u5BF9\u8C61" };
  }
  if (raw2.format && raw2.format !== BACKUP_FORMAT) {
    return { ok: false, message: `\u4E0D\u652F\u6301\u7684\u5907\u4EFD\u683C\u5F0F: ${raw2.format}` };
  }
  if (raw2.version != null && Number(raw2.version) > BACKUP_VERSION) {
    return { ok: false, message: `\u5907\u4EFD\u7248\u672C\u8FC7\u9AD8 (${raw2.version})\uFF0C\u8BF7\u5347\u7EA7\u5E94\u7528\u540E\u518D\u5BFC\u5165` };
  }
  if (!Array.isArray(raw2.subscriptions)) {
    return { ok: false, message: "\u5907\u4EFD\u7F3A\u5C11 subscriptions \u6570\u7EC4" };
  }
  for (let i = 0; i < raw2.subscriptions.length; i++) {
    const err = validateSubscriptionEntry(raw2.subscriptions[i], i);
    if (err) return { ok: false, message: err };
  }
  if (raw2.reminderRules != null && typeof raw2.reminderRules !== "object") {
    return { ok: false, message: "reminderRules \u5FC5\u987B\u662F\u5BF9\u8C61" };
  }
  return { ok: true, backup: raw2 };
}
function mergeConfig(current, incoming, includeSecrets) {
  if (!incoming || typeof incoming !== "object") return current;
  const next = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (NEVER_EXPORT_FIELDS.includes(key) || key === "JWT_SECRET") continue;
    if (SECRET_FIELDS.includes(key) || key === "ADMIN_PASSWORD") {
      if (!includeSecrets) continue;
      if (typeof value === "string" && value.trim() !== "") {
        next[key] = value;
      }
      continue;
    }
    if (value !== void 0) {
      next[key] = value;
    }
  }
  next.JWT_SECRET = current.JWT_SECRET;
  return next;
}
async function handleImportBackup(request, env) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json2({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }, 400);
    }
    const rawBackup = body && body.backup ? body.backup : body;
    const mode = body && body.mode === "replace" ? "replace" : "merge";
    const includeSecrets = !!(body && body.includeSecrets);
    const validated = validateBackup(rawBackup);
    if (!validated.ok) {
      return json2({ success: false, message: (
        /** @type {any} */
        validated.message
      ) }, 400);
    }
    const backup = (
      /** @type {any} */
      validated.backup
    );
    const incomingSubs = backup.subscriptions.filter((s) => s && typeof s.id === "string" && s.id);
    if (mode === "replace" && incomingSubs.length === 0) {
      return json2(
        { success: false, message: "\u8986\u76D6\u6A21\u5F0F\u62D2\u7EDD\u7A7A\u8BA2\u9605\u5217\u8868\uFF08\u8BF7\u786E\u8BA4\u5907\u4EFD\u5B8C\u6574\u6216\u6539\u7528\u5408\u5E76\u6A21\u5F0F\uFF09" },
        400
      );
    }
    const rulesMap = backup.reminderRules && typeof backup.reminderRules === "object" ? backup.reminderRules : {};
    let importedSubs = 0;
    let importedRules = 0;
    if (mode === "replace") {
      const existing = await listAll(env);
      for (const sub of existing) {
        if (sub && sub.id) {
          await clearForSubscription(env, sub.id);
        }
      }
      await replaceAll(env, incomingSubs);
      importedSubs = incomingSubs.length;
    } else {
      for (const sub of incomingSubs) {
        await save(env, sub);
        importedSubs++;
      }
    }
    for (const sub of incomingSubs) {
      let rules = Array.isArray(rulesMap[sub.id]) ? rulesMap[sub.id] : null;
      if (!rules && Array.isArray(sub.reminderRules)) rules = sub.reminderRules;
      if (rules && rules.length > 0) {
        const normalized = rules.map((r) => normalizeRule(r));
        await replaceForSubscription(env, sub.id, normalized);
        importedRules += normalized.length;
        try {
          const { syncLegacyReminderFields: syncLegacyReminderFields2 } = await Promise.resolve().then(() => (init_subscriptions(), subscriptions_exports));
          await syncLegacyReminderFields2(env, sub.id, normalized);
        } catch {
        }
      }
    }
    if (Array.isArray(backup.categories)) {
      const cats = backup.categories.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim());
      if (mode === "replace") {
        await putKVJson(env, "categories", [...new Set(cats)].sort());
      } else {
        const existing = await getCategories(env);
        const set = /* @__PURE__ */ new Set([...existing, ...cats]);
        await putKVJson(env, "categories", [...set].sort());
      }
    }
    const currentConfig = await getConfig(env);
    if (backup.config && typeof backup.config === "object") {
      const merged = mergeConfig(currentConfig, backup.config, includeSecrets);
      await setConfig(env, merged);
    }
    return json2({
      success: true,
      message: `\u6062\u590D\u5B8C\u6210\uFF08\u6A21\u5F0F: ${mode === "replace" ? "\u8986\u76D6" : "\u5408\u5E76"}\uFF09`,
      stats: {
        subscriptions: importedSubs,
        reminderRules: importedRules,
        categories: Array.isArray(backup.categories) ? backup.categories.length : 0,
        configRestored: !!backup.config,
        secretsApplied: includeSecrets
      }
    });
  } catch (error) {
    console.error("[backup] \u5BFC\u5165\u5931\u8D25:", error);
    return json2(
      { success: false, message: "\u5BFC\u5165\u5931\u8D25: " + (error && error.message ? error.message : String(error)) },
      500
    );
  }
}
var BACKUP_FORMAT, BACKUP_VERSION, NEVER_EXPORT_FIELDS;
var init_backup = __esm({
  "src/api/handlers/backup.js"() {
    "use strict";
    init_config();
    init_subscriptions_repo();
    init_reminders_repo();
    init_categories();
    init_kv();
    init_config2();
    init_extras();
    BACKUP_FORMAT = "substracker-backup";
    BACKUP_VERSION = 1;
    NEVER_EXPORT_FIELDS = ["JWT_SECRET", "ADMIN_PASSWORD"];
  }
});

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch2(0);
    async function dispatch2(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch2(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/core/auth.js
var CryptoJS = {
  HmacSHA256: function(message, key) {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);
    return Promise.resolve().then(() => {
      return crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );
    }).then((cryptoKey) => {
      return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
    }).then((buffer) => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    });
  }
};
async function generateJWT(username, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { username, exp: Math.floor(Date.now() / 1e3) + 86400 };
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  const signatureInput = base64Header + "." + base64Payload;
  const signature = await CryptoJS.HmacSHA256(signatureInput, secret);
  return signatureInput + "." + signature;
}
async function verifyJWT(token, secret) {
  try {
    if (!token || !secret) {
      console.log("[JWT] Token\u6216Secret\u4E3A\u7A7A");
      return null;
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("[JWT] Token\u683C\u5F0F\u9519\u8BEF\uFF0C\u90E8\u5206\u6570\u91CF:", parts.length);
      return null;
    }
    const [headerBase64, payloadBase64, signature] = parts;
    const signatureInput = headerBase64 + "." + payloadBase64;
    const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);
    if (signature !== expectedSignature) {
      console.log("[JWT] \u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25");
      return null;
    }
    const payload = JSON.parse(atob(payloadBase64));
    if (payload.exp != null) {
      const exp = Number(payload.exp);
      if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1e3)) {
        console.log("[JWT] Token \u5DF2\u8FC7\u671F");
        return null;
      }
    }
    console.log("[JWT] \u9A8C\u8BC1\u6210\u529F\uFF0C\u7528\u6237:", payload.username);
    return payload;
  } catch (error) {
    console.error("[JWT] \u9A8C\u8BC1\u8FC7\u7A0B\u51FA\u9519:", error);
    return null;
  }
}

// src/api/handlers/auth.js
init_config();
init_utils();
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_SECONDS = 300;
async function checkRateLimit(env, ip) {
  const key = `login_attempts:${ip}`;
  const raw2 = await env.SUBSCRIPTIONS_KV.get(key);
  const attempts = raw2 ? parseInt(raw2, 10) : 0;
  return attempts >= MAX_LOGIN_ATTEMPTS;
}
async function recordFailedAttempt(env, ip) {
  const key = `login_attempts:${ip}`;
  const raw2 = await env.SUBSCRIPTIONS_KV.get(key);
  const attempts = (raw2 ? parseInt(raw2, 10) : 0) + 1;
  await env.SUBSCRIPTIONS_KV.put(key, String(attempts), { expirationTtl: LOCKOUT_SECONDS });
  return attempts;
}
async function clearAttempts(env, ip) {
  await env.SUBSCRIPTIONS_KV.delete(`login_attempts:${ip}`);
}
async function handleLogin(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  if (await checkRateLimit(env, ip)) {
    return new Response(
      JSON.stringify({ success: false, message: "\u767B\u5F55\u5C1D\u8BD5\u8FC7\u591A\uFF0C\u8BF7 5 \u5206\u949F\u540E\u518D\u8BD5" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: "\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const config = await getConfig(env);
  if (body.username === config.ADMIN_USERNAME && body.password === config.ADMIN_PASSWORD) {
    await clearAttempts(env, ip);
    const token = await generateJWT(body.username, config.JWT_SECRET);
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "token=" + token + "; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=86400"
        }
      }
    );
  }
  const attempts = await recordFailedAttempt(env, ip);
  const remaining = MAX_LOGIN_ATTEMPTS - attempts;
  const message = remaining > 0 ? `\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF\uFF08\u8FD8\u53EF\u5C1D\u8BD5 ${remaining} \u6B21\uFF09` : "\u767B\u5F55\u5C1D\u8BD5\u8FC7\u591A\uFF0C\u8BF7 5 \u5206\u949F\u540E\u518D\u8BD5";
  return new Response(
    JSON.stringify({ success: false, message }),
    { status: remaining > 0 ? 200 : 429, headers: { "Content-Type": "application/json" } }
  );
}
function handleLogout() {
  return new Response("", {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "token=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0"
    }
  });
}
async function getUserFromRequest(request, env) {
  const token = getCookieValue(request.headers.get("Cookie"), "token");
  const config = await getConfig(env);
  const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
  return { user, config };
}

// src/api/router.js
init_config2();

// src/api/handlers/dashboard.js
init_subscriptions();

// src/core/currency.js
init_time();
var CATEGORY_SEPARATOR_REGEX2 = /[\/，,\s]+/;
var FALLBACK_RATES = {
  "CNY": 1,
  "USD": 6.98,
  "HKD": 0.9,
  "TWD": 0.22,
  "JPY": 0.044,
  "EUR": 8.16,
  "GBP": 9.4,
  "KRW": 48e-4,
  "TRY": 0.16
};
async function getDynamicRates(env) {
  const CACHE_KEY = "SYSTEM_EXCHANGE_RATES";
  const CACHE_TTL = 864e5;
  try {
    const cached = await env.SUBSCRIPTIONS_KV.get(CACHE_KEY, { type: "json" });
    if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) {
      return cached.rates;
    }
    const response = await fetch("https://api.frankfurter.dev/v1/latest?base=CNY");
    if (response.ok) {
      const data = await response.json();
      const newRates = {
        ...FALLBACK_RATES,
        ...data.rates,
        "CNY": 1
      };
      await env.SUBSCRIPTIONS_KV.put(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        rates: newRates
      }));
      return newRates;
    } else {
      console.warn("[\u6C47\u7387] API \u8BF7\u6C42\u5931\u8D25\uFF0C\u4F7F\u7528\u515C\u5E95\u6C47\u7387");
    }
  } catch (error) {
    console.error("[\u6C47\u7387] \u83B7\u53D6\u8FC7\u7A0B\u51FA\u9519:", error);
  }
  return FALLBACK_RATES;
}
function convertToCNY(amount, currency, rates) {
  if (!amount || amount <= 0) return 0;
  const code = currency || "CNY";
  if (code === "CNY") return amount;
  const rate = rates[code];
  if (!rate) return amount;
  return amount / rate;
}
function calculateMonthlyExpense(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const currentMonth = parts.month;
  let amount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear && paymentParts.month === currentMonth) {
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  let lastMonthAmount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === lastMonthYear && paymentParts.month === lastMonth) {
        lastMonthAmount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  let trend = 0;
  let trendDirection = "flat";
  if (lastMonthAmount > 0) {
    trend = Math.round((amount - lastMonthAmount) / lastMonthAmount * 100);
    if (trend > 0) trendDirection = "up";
    else if (trend < 0) trendDirection = "down";
  } else if (amount > 0) {
    trend = 100;
    trendDirection = "up";
  }
  return { amount, trend: Math.abs(trend), trendDirection };
}
function calculateYearlyExpense(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  let amount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  const monthlyAverage = amount / parts.month;
  return { amount, monthlyAverage };
}
function getRecentPayments(subscriptions, timezone) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const recentPayments = [];
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      if (paymentDate >= sevenDaysAgo && paymentDate <= now) {
        recentPayments.push({
          name: sub.name,
          amount: payment.amount,
          currency: sub.currency || "CNY",
          customType: sub.customType,
          paymentDate: payment.date,
          note: payment.note
        });
      }
    });
  });
  return recentPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
}
function getUpcomingRenewals(subscriptions, timezone) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);
  return subscriptions.filter((sub) => {
    if (!sub.isActive) return false;
    const renewalDate = new Date(sub.expiryDate);
    return renewalDate >= now && renewalDate <= sevenDaysLater;
  }).map((sub) => {
    const renewalDate = new Date(sub.expiryDate);
    const daysUntilRenewal = Math.ceil((renewalDate - now) / MS_PER_DAY);
    return {
      name: sub.name,
      amount: sub.amount || 0,
      currency: sub.currency || "CNY",
      customType: sub.customType,
      renewalDate: sub.expiryDate,
      daysUntilRenewal
    };
  }).sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}
function getExpenseByType(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const typeMap = {};
  let total = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        const type = sub.customType || "\u672A\u5206\u7C7B";
        const amountCNY = convertToCNY(payment.amount, sub.currency, rates);
        typeMap[type] = (typeMap[type] || 0) + amountCNY;
        total += amountCNY;
      }
    });
  });
  return Object.entries(typeMap).map(([type, amount]) => ({
    type,
    amount,
    percentage: total > 0 ? Math.round(amount / total * 100) : 0
  })).sort((a, b) => b.amount - a.amount);
}
function getExpenseByCategory(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const categoryMap = {};
  let total = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        const categories = sub.category ? sub.category.split(CATEGORY_SEPARATOR_REGEX2).filter((c) => c.trim()) : ["\u672A\u5206\u7C7B"];
        const amountCNY = convertToCNY(payment.amount, sub.currency, rates);
        categories.forEach((category) => {
          const cat = category.trim() || "\u672A\u5206\u7C7B";
          categoryMap[cat] = (categoryMap[cat] || 0) + amountCNY / categories.length;
        });
        total += amountCNY;
      }
    });
  });
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round(amount / total * 100) : 0
  })).sort((a, b) => b.amount - a.amount);
}

// src/api/handlers/dashboard.js
init_time();
init_scheduler_logs_repo();
async function handleDashboardStats(env, config) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const timezone = config && config.TIMEZONE || "UTC";
    let schedulerStatus = null;
    let schedulerStatusHistory = [];
    try {
      const recent = await getRecent(env, 10);
      schedulerStatusHistory = recent;
      if (recent.length > 0) {
        const head = recent[0];
        schedulerStatus = {
          lastRunAt: head.startedAt,
          timezone: head.timezone,
          currentHour: head.currentHour,
          configuredHours: head.configuredHours,
          shouldNotifyThisHour: head.inWindow,
          checkedSubscriptions: head.checkedCount,
          activeSubscriptions: head.checkedCount,
          expiringMatched: head.matchedCount,
          dedupeSkipped: head.dedupedCount,
          updatedSubscriptions: head.autoRenewedCount,
          sent: head.sentCount > 0,
          reason: head.reason,
          status: head.status,
          extra: head.extra
        };
      }
    } catch (error) {
      console.error("\u8BFB\u53D6\u8C03\u5EA6\u65E5\u5FD7\u5931\u8D25:", error);
    }
    const rates = await getDynamicRates(env);
    const monthlyExpense = calculateMonthlyExpense(subscriptions, timezone, rates);
    const yearlyExpense = calculateYearlyExpense(subscriptions, timezone, rates);
    const recentPayments = getRecentPayments(subscriptions, timezone);
    const upcomingRenewals = getUpcomingRenewals(subscriptions, timezone);
    const expenseByType = getExpenseByType(subscriptions, timezone, rates);
    const expenseByCategory = getExpenseByCategory(subscriptions, timezone, rates);
    const activeSubscriptions = subscriptions.filter((s) => s.isActive);
    const now = getCurrentTimeInTimezone(timezone);
    const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);
    const expiringSoon = activeSubscriptions.filter((s) => {
      const expiryDate = new Date(s.expiryDate);
      return expiryDate >= now && expiryDate <= sevenDaysLater;
    }).length;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          monthlyExpense,
          yearlyExpense,
          activeSubscriptions: {
            active: activeSubscriptions.length,
            total: subscriptions.length,
            expiringSoon
          },
          recentPayments,
          upcomingRenewals,
          expenseByType,
          expenseByCategory,
          schedulerStatus,
          schedulerStatusHistory,
          /** 新增：用户时区（前端可据此显示） */
          timezone
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u83B7\u53D6\u4EEA\u8868\u76D8\u7EDF\u8BA1\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "\u83B7\u53D6\u7EDF\u8BA1\u6570\u636E\u5931\u8D25: " + (error && error.message ? error.message : error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// src/api/handlers/notify.js
init_config();

// src/services/notify/channel.js
function escapeMarkdownV2(text = "") {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
function stripMarkdown(text = "") {
  return String(text).replace(/(\*\*|\*|##|#|`)/g, "");
}
function ok(name, raw2) {
  return { success: true, channel: name, raw: raw2 };
}
function fail(name, error, raw2) {
  return { success: false, channel: name, error, raw: raw2 };
}
function errorMessage(err) {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return String(err.message);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// src/services/notify/telegram.js
function resolveTopicId(config) {
  const raw2 = config && config.TG_TOPIC_ID != null ? String(config.TG_TOPIC_ID).trim() : "";
  if (!raw2) return void 0;
  const n = Number(raw2);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : void 0;
}
function buildSendBody(config, text, parseMode) {
  const body = {
    chat_id: config.TG_CHAT_ID,
    text
  };
  if (parseMode) body.parse_mode = parseMode;
  const topicId = resolveTopicId(config);
  if (topicId !== void 0) body.message_thread_id = topicId;
  return body;
}
var telegramChannel = {
  name: "telegram",
  validateConfig(config) {
    if (!config.TG_BOT_TOKEN) return { ok: false, error: "\u7F3A\u5C11 TG_BOT_TOKEN" };
    if (!config.TG_CHAT_ID) return { ok: false, error: "\u7F3A\u5C11 TG_CHAT_ID" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = telegramChannel.validateConfig(config);
    if (!v.ok) return fail("telegram", v.error || "\u914D\u7F6E\u65E0\u6548");
    const url = `https://api.telegram.org/bot${config.TG_BOT_TOKEN}/sendMessage`;
    const fullText = payload.title ? `*${payload.title}*

${payload.content}` : String(payload.content || "");
    const escaped = escapeMarkdownV2(fullText);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSendBody(config, escaped, "MarkdownV2"))
      });
      const result = await r.json();
      if (result.ok) return ok("telegram", result);
      if (result.description && /parse entities/i.test(result.description)) {
        const r2 = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildSendBody(config, fullText))
        });
        const result2 = await r2.json();
        return result2.ok ? ok("telegram", result2) : fail("telegram", `Telegram \u62D2\u7EDD: ${result2.description || "\u672A\u77E5"}`, result2);
      }
      return fail("telegram", `Telegram \u62D2\u7EDD: ${result.description || "\u672A\u77E5"}`, result);
    } catch (err) {
      return fail("telegram", errorMessage(err));
    }
  },
  async test(config) {
    return telegramChannel.send(
      {
        title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5",
        content: "\u8FD9\u662F\u4E00\u6761\u6765\u81EA\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF\u7684\u6D4B\u8BD5\u6D88\u606F\u3002\u5982\u679C\u4F60\u6536\u5230\u6B64\u6D88\u606F\uFF0C\u8BF4\u660E Telegram \u914D\u7F6E\u6B63\u5E38\u3002"
      },
      config
    );
  }
};
async function sendTelegramNotification(message, config) {
  const r = await telegramChannel.send({ title: "", content: message }, config);
  if (!r.success) console.error("[Telegram]", r.error);
  return r.success;
}

// src/services/notify/notifyx.js
var notifyxChannel = {
  name: "notifyx",
  validateConfig(config) {
    if (!config.NOTIFYX_API_KEY) return { ok: false, error: "\u7F3A\u5C11 NOTIFYX_API_KEY" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = notifyxChannel.validateConfig(config);
    if (!v.ok) return fail("notifyx", v.error || "\u914D\u7F6E\u65E0\u6548");
    const url = `https://www.notifyx.cn/api/v1/send/${config.NOTIFYX_API_KEY}`;
    const body = JSON.stringify({
      title: payload.title || "\u8BA2\u9605\u63D0\u9192",
      content: `## ${payload.title || "\u8BA2\u9605\u63D0\u9192"}

${payload.content || ""}`,
      description: "\u8BA2\u9605\u63D0\u9192"
    });
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const result = await r.json();
      return result.status === "queued" ? ok("notifyx", result) : fail("notifyx", `NotifyX \u8FD4\u56DE ${result.status || "unknown"}`, result);
    } catch (err) {
      return fail("notifyx", errorMessage(err));
    }
  },
  async test(config) {
    return notifyxChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 NotifyX \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendNotifyXNotification(title, content, _description, config) {
  void _description;
  const r = await notifyxChannel.send({ title, content }, config);
  if (!r.success) console.error("[NotifyX]", r.error);
  return r.success;
}

// src/services/notify/webhook.js
init_time();
function escapeForJsonString(value) {
  if (value === null || value === void 0) return "";
  return JSON.stringify(String(value)).slice(1, -1);
}
function applyTemplate(template, data) {
  const templateString = JSON.stringify(template);
  const replaced = templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return escapeForJsonString(data[key]);
    }
    return "";
  });
  return JSON.parse(replaced);
}
function buildTemplateData(payload, config) {
  const tagsArray = Array.isArray(payload.metadata?.tags) ? payload.metadata.tags.filter((t) => typeof t === "string" && t.trim().length > 0).map((t) => t.trim()) : [];
  const tagsBlock = tagsArray.length ? tagsArray.map((t) => `- ${t}`).join("\n") : "";
  const tagsLine = tagsArray.length ? "\u6807\u7B7E\uFF1A" + tagsArray.join("\u3001") : "";
  const timestamp = formatLocalDate(/* @__PURE__ */ new Date(), config?.TIMEZONE || "UTC", "datetime");
  const formattedMessage = [
    payload.title,
    payload.content,
    tagsLine,
    `\u53D1\u9001\u65F6\u95F4\uFF1A${timestamp}`
  ].filter((s) => s && s.trim().length > 0).join("\n\n");
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
    daysRemaining: payload.metadata?.daysRemaining ?? "",
    ruleType: payload.metadata?.ruleType ?? "",
    ruleValue: payload.metadata?.ruleValue ?? ""
  };
}
var webhookChannel = {
  name: "webhook",
  validateConfig(config) {
    if (!config.WEBHOOK_URL) return { ok: false, error: "\u7F3A\u5C11 WEBHOOK_URL" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = webhookChannel.validateConfig(config);
    if (!v.ok) return fail("webhook", v.error || "\u914D\u7F6E\u65E0\u6548");
    let headers = { "Content-Type": "application/json" };
    if (config.WEBHOOK_HEADERS) {
      try {
        const customHeaders = JSON.parse(config.WEBHOOK_HEADERS);
        headers = { ...headers, ...customHeaders };
      } catch {
        console.warn("[Webhook] \u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\u683C\u5F0F\u9519\u8BEF\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u8BF7\u6C42\u5934");
      }
    }
    const data = buildTemplateData(payload, config);
    let requestBody;
    if (config.WEBHOOK_TEMPLATE) {
      try {
        const template = JSON.parse(config.WEBHOOK_TEMPLATE);
        requestBody = applyTemplate(template, data);
      } catch {
        console.warn("[Webhook] \u6D88\u606F\u6A21\u677F\u683C\u5F0F\u9519\u8BEF\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u683C\u5F0F");
        requestBody = { ...data };
      }
    } else {
      requestBody = { ...data };
    }
    try {
      const r = await fetch(config.WEBHOOK_URL, {
        method: config.WEBHOOK_METHOD || "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      const text = await r.text().catch(() => "");
      return r.ok ? ok("webhook", text) : fail("webhook", `HTTP ${r.status}`, text);
    } catch (err) {
      return fail("webhook", errorMessage(err));
    }
  },
  async test(config) {
    return webhookChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 Webhook \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendWebhookNotification(title, content, config, metadata = {}) {
  const r = await webhookChannel.send({ title, content, metadata }, config);
  if (!r.success) console.error("[Webhook]", r.error);
  return r.success;
}

// src/services/notify/wechat.js
var wecomChannel = {
  name: "wechatbot",
  validateConfig(config) {
    if (!config.WECHATBOT_WEBHOOK) return { ok: false, error: "\u7F3A\u5C11 WECHATBOT_WEBHOOK" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = wecomChannel.validateConfig(config);
    if (!v.ok) return fail("wechatbot", v.error || "\u914D\u7F6E\u65E0\u6548");
    const msgType = config.WECHATBOT_MSG_TYPE || "text";
    let messageData;
    if (msgType === "markdown") {
      const markdownContent = `# ${payload.title}

${payload.content}`;
      messageData = { msgtype: "markdown", markdown: { content: markdownContent } };
    } else {
      const textContent = `${payload.title}

${stripMarkdown(payload.content)}`;
      messageData = { msgtype: "text", text: { content: textContent } };
    }
    if (config.WECHATBOT_AT_ALL === "true" && msgType === "text") {
      messageData.text.mentioned_list = ["@all"];
    } else if (config.WECHATBOT_AT_MOBILES) {
      const mobiles = String(config.WECHATBOT_AT_MOBILES).split(",").map((m) => m.trim()).filter(Boolean);
      if (mobiles.length > 0 && msgType === "text") {
        messageData.text.mentioned_mobile_list = mobiles;
      }
    }
    try {
      const r = await fetch(config.WECHATBOT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData)
      });
      const text = await r.text();
      if (!r.ok) return fail("wechatbot", `HTTP ${r.status}`, text);
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        return fail("wechatbot", "\u54CD\u5E94\u975E JSON", text);
      }
      return result.errcode === 0 ? ok("wechatbot", result) : fail("wechatbot", `\u4F01\u4E1A\u5FAE\u4FE1\u8FD4\u56DE errcode=${result.errcode} ${result.errmsg || ""}`, result);
    } catch (err) {
      return fail("wechatbot", errorMessage(err));
    }
  },
  async test(config) {
    return wecomChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761\u4F01\u4E1A\u5FAE\u4FE1\u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendWechatBotNotification(title, content, config) {
  const r = await wecomChannel.send({ title, content }, config);
  if (!r.success) console.error("[\u4F01\u4E1A\u5FAE\u4FE1]", r.error);
  return r.success;
}

// src/services/notify/email.js
init_time();
function buildHtml(title, content, timezone) {
  const safe = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c);
  const ts = formatLocalDate(/* @__PURE__ */ new Date(), timezone || "UTC", "datetime");
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safe(title)}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
.container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
.header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px 20px; text-align: center; }
.header h1 { color: white; margin: 0; font-size: 24px; }
.content { padding: 30px 20px; }
.highlight { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
.footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>\u{1F4C5} ${safe(title)}</h1></div>
  <div class="content">
    <div class="highlight">${safe(stripMarkdown(content)).replace(/\n/g, "<br>")}</div>
    <p style="color:#666;line-height:1.6;">\u6B64\u90AE\u4EF6\u7531\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u53CA\u65F6\u5904\u7406\u76F8\u5173\u8BA2\u9605\u4E8B\u52A1\u3002</p>
  </div>
  <div class="footer"><p>\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF | \u53D1\u9001\u65F6\u95F4: ${safe(ts)}</p></div>
</div>
</body></html>`;
}
var emailChannel = {
  name: "email",
  validateConfig(config) {
    if (!config.RESEND_API_KEY) return { ok: false, error: "\u7F3A\u5C11 RESEND_API_KEY" };
    if (!config.EMAIL_FROM) return { ok: false, error: "\u7F3A\u5C11 EMAIL_FROM" };
    if (!config.EMAIL_TO) return { ok: false, error: "\u7F3A\u5C11 EMAIL_TO" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = emailChannel.validateConfig(config);
    if (!v.ok) return fail("email", v.error || "\u914D\u7F6E\u65E0\u6548");
    const fromEmail = config.EMAIL_FROM_NAME ? `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>` : config.EMAIL_FROM;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: config.EMAIL_TO,
          subject: payload.title,
          html: buildHtml(payload.title, payload.content, config.TIMEZONE),
          text: stripMarkdown(payload.content)
        })
      });
      const result = await r.json().catch(() => ({}));
      return r.ok && result && result.id ? ok("email", result) : fail("email", result?.message || `HTTP ${r.status}`, result);
    } catch (err) {
      return fail("email", errorMessage(err));
    }
  },
  async test(config) {
    return emailChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761\u90AE\u4EF6\u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendEmailNotification(title, content, config) {
  const r = await emailChannel.send({ title, content }, config);
  if (!r.success) console.error("[Email]", r.error);
  return r.success;
}

// src/services/notify/bark.js
var barkChannel = {
  name: "bark",
  validateConfig(config) {
    if (!config.BARK_SERVER && !config.BARK_DEVICE_KEY) {
      return { ok: false, error: "\u7F3A\u5C11 BARK_DEVICE_KEY \u6216 BARK_SERVER" };
    }
    return { ok: true };
  },
  async send(payload, config) {
    const v = barkChannel.validateConfig(config);
    if (!v.ok) return fail("bark", v.error || "\u914D\u7F6E\u65E0\u6548");
    const serverUrl = (config.BARK_SERVER || "https://api.day.app").replace(/\/+$/, "");
    let url, headers = { "Content-Type": "application/json; charset=utf-8" }, body;
    try {
      const parsed = new URL(serverUrl);
      const isCustomUrl = parsed.pathname && parsed.pathname !== "/";
      if (parsed.username) {
        const credentials = `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password || "")}`;
        headers["Authorization"] = `Basic ${btoa(credentials)}`;
        parsed.username = "";
        parsed.password = "";
      }
      if (isCustomUrl) {
        url = parsed.href.replace(/\/+$/, "");
        body = { title: payload.title, body: stripMarkdown(payload.content) };
      } else {
        if (!config.BARK_DEVICE_KEY) return fail("bark", "\u6807\u51C6 Bark API \u7F3A\u5C11 BARK_DEVICE_KEY");
        url = `${parsed.href.replace(/\/+$/, "")}/push`;
        body = {
          title: payload.title,
          body: stripMarkdown(payload.content),
          device_key: config.BARK_DEVICE_KEY
        };
      }
    } catch {
      return fail("bark", `BARK_SERVER \u4E0D\u662F\u5408\u6CD5 URL: ${serverUrl}`);
    }
    if (config.BARK_IS_ARCHIVE === "true") body.isArchive = 1;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const result = await r.json().catch(() => ({}));
      return result && result.code === 200 ? ok("bark", result) : fail("bark", `Bark \u8FD4\u56DE code=${result?.code}`, result);
    } catch (err) {
      return fail("bark", errorMessage(err));
    }
  },
  async test(config) {
    return barkChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 Bark \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendBarkNotification(title, content, config) {
  const r = await barkChannel.send({ title, content }, config);
  if (!r.success) console.error("[Bark]", r.error);
  return r.success;
}

// src/services/notify/gotify.js
var gotifyChannel = {
  name: "gotify",
  validateConfig(config) {
    if (!config.GOTIFY_SERVER_URL) return { ok: false, error: "\u7F3A\u5C11 GOTIFY_SERVER_URL" };
    if (!config.GOTIFY_APP_TOKEN) return { ok: false, error: "\u7F3A\u5C11 GOTIFY_APP_TOKEN" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = gotifyChannel.validateConfig(config);
    if (!v.ok) return fail("gotify", v.error || "\u914D\u7F6E\u65E0\u6548");
    const url = String(config.GOTIFY_SERVER_URL).replace(/\/+$/, "") + "/message?token=" + encodeURIComponent(String(config.GOTIFY_APP_TOKEN));
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title || "\u901A\u77E5",
          message: stripMarkdown(payload.content) || "",
          priority: 5
        })
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        return fail("gotify", `HTTP ${r.status}`, text);
      }
      return ok("gotify");
    } catch (err) {
      return fail("gotify", errorMessage(err));
    }
  },
  async test(config) {
    return gotifyChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 Gotify \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendGotifyNotification(title, content, config) {
  const r = await gotifyChannel.send({ title, content }, config);
  if (!r.success) console.error("[Gotify]", r.error);
  return r.success;
}

// src/services/notify/serverchan.js
var serverChanChannel = {
  name: "serverchan",
  validateConfig(config) {
    if (!config.SERVERCHAN_SENDKEY) return { ok: false, error: "\u7F3A\u5C11 SERVERCHAN_SENDKEY" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = serverChanChannel.validateConfig(config);
    if (!v.ok) return fail("serverchan", v.error || "\u914D\u7F6E\u65E0\u6548");
    const endpoint = `https://sctapi.ftqq.com/${config.SERVERCHAN_SENDKEY}.send`;
    const body = new URLSearchParams({
      title: payload.title || "\u8BA2\u9605\u63D0\u9192",
      desp: `## ${payload.title || "\u8BA2\u9605\u63D0\u9192"}

${payload.content || ""}`
    });
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      const result = await r.json().catch(() => ({}));
      return result && result.code === 0 ? ok("serverchan", result) : fail("serverchan", `Server\u9171\u8FD4\u56DE code=${result?.code} ${result?.message || ""}`, result);
    } catch (err) {
      return fail("serverchan", errorMessage(err));
    }
  },
  async test(config) {
    return serverChanChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 Server\u9171 \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendServerChanNotification(title, content, config) {
  const r = await serverChanChannel.send({ title, content }, config);
  if (!r.success) console.error("[Server\u9171]", r.error);
  return r.success;
}

// src/services/notify/pushplus.js
var pushplusChannel = {
  name: "pushplus",
  validateConfig(config) {
    if (!config.PUSHPLUS_TOKEN) return { ok: false, error: "\u7F3A\u5C11 PUSHPLUS_TOKEN" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = pushplusChannel.validateConfig(config);
    if (!v.ok) return fail("pushplus", v.error || "\u914D\u7F6E\u65E0\u6548");
    const body = {
      token: config.PUSHPLUS_TOKEN,
      title: payload.title || "\u8BA2\u9605\u63D0\u9192",
      content: `## ${payload.title || "\u8BA2\u9605\u63D0\u9192"}

${payload.content || ""}`,
      template: "markdown"
    };
    if (config.PUSHPLUS_TOPIC) body.topic = config.PUSHPLUS_TOPIC;
    if (config.PUSHPLUS_CHANNEL) body.channel = config.PUSHPLUS_CHANNEL;
    try {
      const r = await fetch("https://www.pushplus.plus/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await r.json().catch(() => ({}));
      return result && result.code === 200 ? ok("pushplus", result) : fail("pushplus", `PushPlus \u8FD4\u56DE code=${result?.code} ${result?.msg || ""}`, result);
    } catch (err) {
      return fail("pushplus", errorMessage(err));
    }
  },
  async test(config) {
    return pushplusChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 PushPlus \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendPushPlusNotification(title, content, config) {
  const r = await pushplusChannel.send({ title, content }, config);
  if (!r.success) console.error("[PushPlus]", r.error);
  return r.success;
}

// src/services/notify/ntfy.js
var ntfyChannel = {
  name: "ntfy",
  validateConfig(config) {
    if (!config.NTFY_TOPIC || !String(config.NTFY_TOPIC).trim()) {
      return { ok: false, error: "\u7F3A\u5C11 NTFY_TOPIC" };
    }
    return { ok: true };
  },
  async send(payload, config) {
    const v = ntfyChannel.validateConfig(config);
    if (!v.ok) return fail("ntfy", v.error || "\u914D\u7F6E\u65E0\u6548");
    const server = String(config.NTFY_SERVER || "https://ntfy.sh").replace(/\/+$/, "");
    const topic = String(config.NTFY_TOPIC).trim().replace(/^\/+/, "");
    const url = `${server}/${encodeURIComponent(topic)}`;
    const headers = {
      Title: payload.title || "\u8BA2\u9605\u63D0\u9192",
      "Content-Type": "text/plain; charset=utf-8"
    };
    const token = config.NTFY_TOKEN ? String(config.NTFY_TOKEN).trim() : "";
    if (token) {
      headers.Authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
    }
    const body = stripMarkdown(payload.content || "") || (payload.title || "\u901A\u77E5");
    try {
      const r = await fetch(url, {
        method: "POST",
        headers,
        body
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        return fail("ntfy", `HTTP ${r.status}`, text);
      }
      const raw2 = await r.json().catch(() => ({}));
      return ok("ntfy", raw2);
    } catch (err) {
      return fail("ntfy", errorMessage(err));
    }
  },
  async test(config) {
    return ntfyChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 ntfy \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendNtfyNotification(title, content, config) {
  const r = await ntfyChannel.send({ title, content }, config);
  if (!r.success) console.error("[ntfy]", r.error);
  return r.success;
}

// src/services/notify/wpush.js
var wpushChannel = {
  name: "wpush",
  validateConfig(config) {
    if (!config.WPUSH_APIKEY || !String(config.WPUSH_APIKEY).trim()) {
      return { ok: false, error: "\u7F3A\u5C11 WPUSH_APIKEY" };
    }
    return { ok: true };
  },
  async send(payload, config) {
    const v = wpushChannel.validateConfig(config);
    if (!v.ok) return fail("wpush", v.error || "\u914D\u7F6E\u65E0\u6548");
    const body = {
      apikey: String(config.WPUSH_APIKEY).trim(),
      title: payload.title || "\u8BA2\u9605\u63D0\u9192",
      content: payload.content || payload.title || "\u8BA2\u9605\u63D0\u9192"
    };
    if (config.WPUSH_CHANNEL && String(config.WPUSH_CHANNEL).trim()) {
      body.channel = String(config.WPUSH_CHANNEL).trim();
    }
    if (config.WPUSH_TOPIC_CODE && String(config.WPUSH_TOPIC_CODE).trim()) {
      body.topic_code = String(config.WPUSH_TOPIC_CODE).trim();
    }
    try {
      const r = await fetch("https://api.wpush.cn/api/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await r.json().catch(() => ({}));
      const responseCode = typeof result?.code === "number" ? result.code : null;
      const diagnostic = { httpStatus: r.status, code: responseCode };
      return r.ok && responseCode === 0 ? ok("wpush", diagnostic) : fail("wpush", `WPUSH \u8FD4\u56DE HTTP ${r.status}\uFF0Ccode=${responseCode ?? "\u672A\u77E5"}`, diagnostic);
    } catch (err) {
      const apiKey = String(config.WPUSH_APIKEY).trim();
      return fail("wpush", errorMessage(err).replaceAll(apiKey, "[REDACTED]"));
    }
  },
  async test(config) {
    return wpushChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761 WPUSH \u6D4B\u8BD5\u901A\u77E5\u3002" },
      config
    );
  }
};
async function sendWPushNotification(title, content, config) {
  const r = await wpushChannel.send({ title, content }, config);
  if (!r.success) console.error("[WPUSH]", r.error);
  return r.success;
}

// src/services/notify/dingtalk.js
async function computeDingTalkSign(timestamp, secret) {
  const encoder = new TextEncoder();
  const stringToSign = `${timestamp}
${secret}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(stringToSign));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
function buildMessageData(title, content, config) {
  const msgType = config.DINGTALK_MSG_TYPE || "text";
  let messageData;
  if (msgType === "markdown") {
    messageData = {
      msgtype: "markdown",
      markdown: {
        title,
        text: `# ${title}

${content}`
      }
    };
  } else {
    messageData = {
      msgtype: "text",
      text: {
        content: `${title}

${content}`
      }
    };
  }
  if (config.DINGTALK_AT_ALL === "true") {
    messageData.at = { isAtAll: true };
  } else if (config.DINGTALK_AT_MOBILES) {
    const mobiles = String(config.DINGTALK_AT_MOBILES).split(/[,，\s]+/).map((m) => m.trim()).filter((m) => m.length > 0);
    if (mobiles.length > 0) {
      messageData.at = { atMobiles: mobiles };
    }
  }
  return messageData;
}
var dingtalkChannel = {
  name: "dingtalk",
  validateConfig(config) {
    if (!config.DINGTALK_WEBHOOK) return { ok: false, error: "\u7F3A\u5C11 DINGTALK_WEBHOOK" };
    return { ok: true };
  },
  async send(payload, config) {
    const v = dingtalkChannel.validateConfig(config);
    if (!v.ok) return fail("dingtalk", v.error || "\u914D\u7F6E\u65E0\u6548");
    const messageData = buildMessageData(payload.title, payload.content, config);
    let webhookUrl = config.DINGTALK_WEBHOOK;
    if (config.DINGTALK_SECRET) {
      const timestamp = Date.now();
      const sign = await computeDingTalkSign(timestamp, config.DINGTALK_SECRET);
      const separator = webhookUrl.includes("?") ? "&" : "?";
      webhookUrl = `${webhookUrl}${separator}timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }
    try {
      const r = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData)
      });
      const text = await r.text().catch(() => "");
      if (!r.ok) return fail("dingtalk", `HTTP ${r.status}`, text);
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        return ok("dingtalk", text);
      }
      if (parsed.errcode === 0) return ok("dingtalk", parsed);
      return fail("dingtalk", parsed.errmsg || `\u9489\u9489\u9519\u8BEF\u7801 ${parsed.errcode}`, parsed);
    } catch (err) {
      return fail("dingtalk", errorMessage(err));
    }
  },
  async test(config) {
    return dingtalkChannel.send(
      { title: "\u8BA2\u9605\u7BA1\u7406 - \u6D4B\u8BD5\u901A\u77E5", content: "\u8FD9\u662F\u4E00\u6761\u9489\u9489\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u52A0\u7B7E\u4E0E\u6D88\u606F\u683C\u5F0F\u3002" },
      config
    );
  }
};
async function sendDingTalkNotification(title, content, config) {
  const r = await dingtalkChannel.send({ title, content }, config);
  if (!r.success) console.error("[\u9489\u9489]", r.error, r.raw || "");
  return r.success;
}

// src/services/notify/dispatch.js
init_notification_logs_repo();
var ALL_CHANNELS = {
  telegram: telegramChannel,
  notifyx: notifyxChannel,
  webhook: webhookChannel,
  wechatbot: wecomChannel,
  email: emailChannel,
  bark: barkChannel,
  gotify: gotifyChannel,
  serverchan: serverChanChannel,
  pushplus: pushplusChannel,
  ntfy: ntfyChannel,
  wpush: wpushChannel,
  dingtalk: dingtalkChannel
};
async function dispatch(payload, config, options = {}) {
  const enabled = Array.isArray(config.ENABLED_NOTIFIERS) ? config.ENABLED_NOTIFIERS : [];
  const prefix = options.logPrefix || "[notify]";
  const channels = enabled.map((name) => ALL_CHANNELS[name]).filter((ch) => ch != null);
  if (channels.length === 0) {
    console.log(`${prefix} \u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053`);
    return { attempted: 0, successCount: 0, failedCount: 0, results: [], channelResults: {} };
  }
  const settled = await Promise.allSettled(
    channels.map(
      (ch) => ch.send({ ...payload, metadata: options.metadata }, config).catch((err) => ({
        success: false,
        channel: ch.name,
        error: err && err.message ? err.message : String(err)
      }))
    )
  );
  const results = settled.map((r, idx) => {
    if (r.status === "fulfilled") {
      return (
        /** @type {any} */
        r.value
      );
    }
    return {
      success: false,
      channel: channels[idx].name,
      error: r.reason && r.reason.message ? r.reason.message : String(r.reason)
    };
  });
  const channelResults = {};
  let successCount = 0;
  let failedCount = 0;
  for (const r of results) {
    channelResults[r.channel] = r.success;
    if (r.success) {
      successCount++;
      console.log(`${prefix} ${r.channel} \u53D1\u9001\u6210\u529F`);
    } else {
      failedCount++;
      console.log(`${prefix} ${r.channel} \u53D1\u9001\u5931\u8D25: ${r.error}`);
    }
    if (options.env && options.subId) {
      try {
        await writeLog2(options.env, {
          subId: options.subId,
          ruleId: options.ruleId || null,
          channel: r.channel,
          status: r.success ? "success" : "failed",
          title: payload.title,
          content: payload.content,
          error: r.error,
          raw: r.raw
        });
      } catch (err) {
        console.warn(`${prefix} \u5199\u901A\u77E5\u65E5\u5FD7\u5931\u8D25:`, err);
      }
    }
  }
  return {
    attempted: results.length,
    successCount,
    failedCount,
    results,
    channelResults
  };
}

// src/services/notify/index.js
async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = "[\u5B9A\u65F6\u4EFB\u52A1]", options = {}) {
  const result = await dispatch(
    { title, content: commonContent },
    config,
    {
      logPrefix,
      env: options.env,
      subId: options.subId,
      ruleId: options.ruleId,
      metadata: options.metadata
    }
  );
  return {
    attempted: result.attempted,
    successCount: result.successCount,
    failedCount: result.failedCount,
    channelResults: result.channelResults
  };
}

// src/api/handlers/notify.js
async function handleThirdPartyNotify(request, env, config, url) {
  const path = url.pathname.slice(4);
  if (!path.startsWith("/notify/")) return null;
  const pathSegments = path.split("/");
  const tokenFromPath = pathSegments[2] || "";
  const tokenFromHeader = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const tokenFromQuery = url.searchParams.get("token") || "";
  const providedToken = tokenFromPath || tokenFromHeader || tokenFromQuery;
  const expectedToken = config.THIRD_PARTY_API_TOKEN || "";
  if (!expectedToken) {
    return new Response(
      JSON.stringify({ message: "\u7B2C\u4E09\u65B9 API \u5DF2\u7981\u7528\uFF0C\u8BF7\u5728\u540E\u53F0\u914D\u7F6E\u8BBF\u95EE\u4EE4\u724C\u540E\u4F7F\u7528" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!providedToken || providedToken !== expectedToken) {
    return new Response(
      JSON.stringify({ message: "\u8BBF\u95EE\u672A\u6388\u6743\uFF0C\u4EE4\u724C\u65E0\u6548\u6216\u7F3A\u5931" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  if (request.method !== "POST") return null;
  try {
    const body = await request.json();
    const title = body.title || "\u7B2C\u4E09\u65B9\u901A\u77E5";
    const content = body.content || "";
    if (!content) {
      return new Response(
        JSON.stringify({ message: "\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 content" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const config2 = await getConfig(env);
    const bodyTagsRaw = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(/[,，\s]+/) : [];
    const bodyTags = Array.isArray(bodyTagsRaw) ? bodyTagsRaw.filter((tag) => typeof tag === "string" && tag.trim().length > 0).map((tag) => tag.trim()) : [];
    await sendNotificationToAllChannels(title, content, config2, "[\u7B2C\u4E09\u65B9API]", {
      metadata: { tags: bodyTags }
    });
    return new Response(
      JSON.stringify({
        message: "\u53D1\u9001\u6210\u529F",
        response: {
          errcode: 0,
          errmsg: "ok",
          msgid: "MSGID" + Date.now()
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[\u7B2C\u4E09\u65B9API] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({
        message: "\u53D1\u9001\u5931\u8D25",
        response: {
          errcode: 1,
          errmsg: error.message
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// src/api/handlers/subscriptions.js
init_subscriptions();
init_config();
init_lunar();
init_time();
init_currency_format();
init_utils();
async function testSingleSubscriptionNotification(id, env) {
  try {
    const subscription = await getSubscription(id, env);
    if (!subscription) {
      return { success: false, message: "\u672A\u627E\u5230\u8BE5\u8BA2\u9605" };
    }
    const config = await getConfig(env);
    const title = `\u624B\u52A8\u6D4B\u8BD5\u901A\u77E5: ${subscription.name}`;
    const showLunar = config.SHOW_LUNAR === true;
    let lunarExpiryText = "";
    if (showLunar) {
      const timezoneForLunar = config?.TIMEZONE || "UTC";
      const expiryParts = getTimezoneDateParts(subscription.expiryDate, timezoneForLunar);
      const lunarExpiry = lunarCalendar.solar2lunar(expiryParts.year, expiryParts.month, expiryParts.day);
      lunarExpiryText = lunarExpiry ? ` (\u519C\u5386: ${lunarExpiry.fullStr})` : "";
    }
    const timezone = config?.TIMEZONE || "UTC";
    const formattedExpiryDate = formatTimeInTimezone(new Date(subscription.expiryDate), timezone, "date");
    const currentTime = formatTimeInTimezone(/* @__PURE__ */ new Date(), timezone, "datetime");
    const calendarType = subscription.useLunar ? "\u519C\u5386" : "\u516C\u5386";
    const autoRenewText = subscription.autoRenew ? "\u662F" : "\u5426";
    const formattedAmount = formatAmount(subscription.amount, subscription.currency || "CNY");
    const amountText = formattedAmount ? `
\u91D1\u989D: ${formattedAmount}/\u5468\u671F` : "";
    const categoryText = subscription.category ? subscription.category : "\u672A\u5206\u7C7B";
    const commonContent = `**\u8BA2\u9605\u8BE6\u60C5**
\u7C7B\u578B: ${subscription.customType || "\u5176\u4ED6"}${amountText}
\u5206\u7C7B: ${categoryText}
\u65E5\u5386\u7C7B\u578B: ${calendarType}
\u5230\u671F\u65E5\u671F: ${formattedExpiryDate}${lunarExpiryText}
\u81EA\u52A8\u7EED\u671F: ${autoRenewText}
\u5907\u6CE8: ${subscription.notes || "\u65E0"}
\u53D1\u9001\u65F6\u95F4: ${currentTime}
\u5F53\u524D\u65F6\u533A: ${formatTimezoneDisplay(timezone)}`;
    const tags = extractTagsFromSubscriptions([subscription]);
    const notifyResult = await sendNotificationToAllChannels(title, commonContent, config, "[\u624B\u52A8\u6D4B\u8BD5]", {
      env,
      subId: id,
      ruleId: "manual-test",
      metadata: { tags }
    });
    const attempted = notifyResult?.attempted || 0;
    const successCount = notifyResult?.successCount || 0;
    const failedCount = notifyResult?.failedCount || 0;
    if (attempted === 0) {
      return { success: false, message: "\u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053\uFF0C\u8BF7\u5148\u5728\u7CFB\u7EDF\u914D\u7F6E\u4E2D\u5F00\u542F\u81F3\u5C11\u4E00\u79CD\u901A\u77E5\u65B9\u5F0F" };
    }
    if (successCount === 0) {
      return { success: false, message: `\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF08\u5DF2\u5C1D\u8BD5 ${attempted} \u4E2A\u6E20\u9053\uFF09` };
    }
    if (failedCount > 0) {
      return { success: true, message: `\u6D4B\u8BD5\u901A\u77E5\u5DF2\u53D1\u9001\uFF1A\u6210\u529F ${successCount} \u4E2A\uFF0C\u5931\u8D25 ${failedCount} \u4E2A\u6E20\u9053` };
    }
    return { success: true, message: `\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u6210\u529F\uFF08\u5171 ${successCount} \u4E2A\u6E20\u9053\uFF09` };
  } catch (error) {
    console.error("[\u624B\u52A8\u6D4B\u8BD5] \u53D1\u9001\u5931\u8D25:", error);
    return { success: false, message: "\u53D1\u9001\u65F6\u53D1\u751F\u9519\u8BEF: " + error.message };
  }
}
async function handleSubscriptions(request, env, path) {
  const method = request.method;
  if (path === "/subscriptions") {
    if (method === "GET") {
      const subscriptions = await getAllSubscriptions(env);
      return new Response(JSON.stringify(subscriptions), { headers: { "Content-Type": "application/json" } });
    }
    if (method === "POST") {
      let subscription;
      try {
        subscription = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const result = await createSubscription(subscription, env);
      if (result.success && result.subscription) {
        try {
          const remindersRepo = await Promise.resolve().then(() => (init_reminders_repo(), reminders_repo_exports));
          const { syncLegacyReminderFields: syncLegacyReminderFields2 } = await Promise.resolve().then(() => (init_subscriptions(), subscriptions_exports));
          const incoming = Array.isArray(subscription.reminderRules) ? subscription.reminderRules : null;
          const rules = incoming && incoming.length > 0 ? incoming.map(remindersRepo.normalizeRule) : remindersRepo.defaultPresetRules();
          await remindersRepo.replaceForSubscription(env, result.subscription.id, rules);
          await syncLegacyReminderFields2(env, result.subscription.id, rules);
        } catch (err) {
          console.error("[subscriptions] \u5199\u5165\u63D0\u9192\u89C4\u5219\u5931\u8D25\uFF08\u8BA2\u9605\u672C\u8EAB\u5DF2\u521B\u5EFA\uFF09:", err);
        }
      }
      return new Response(JSON.stringify(result), {
        status: result.success ? 201 : 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  if (path.startsWith("/subscriptions/")) {
    const parts = path.split("/");
    const id = parts[2];
    if (parts[3] === "toggle-status" && method === "POST") {
      const body = await request.json();
      const result = await toggleSubscriptionStatus(id, body.isActive, env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (parts[3] === "test-notify" && method === "POST") {
      const result = await testSingleSubscriptionNotification(id, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "renew" && method === "POST") {
      let options = {};
      try {
        const body = await request.json();
        options = body || {};
      } catch (e) {
      }
      const result = await manualRenewSubscription(id, env, options);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && method === "GET") {
      const subscription = await getSubscription(id, env);
      if (!subscription) {
        return new Response(JSON.stringify({ success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, payments: subscription.paymentHistory || [] }), { headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && parts[4] && method === "DELETE") {
      const paymentId = parts[4];
      const result = await deletePaymentRecord(id, paymentId, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && parts[4] && method === "PUT") {
      const paymentId = parts[4];
      const paymentData = await request.json();
      const result = await updatePaymentRecord(id, paymentId, paymentData, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (method === "GET") {
      const subscription = await getSubscription(id, env);
      if (!subscription) {
        return new Response(
          JSON.stringify({ success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify(subscription), { headers: { "Content-Type": "application/json" } });
    }
    if (method === "PUT") {
      let subscription;
      try {
        subscription = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, message: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const result = await updateSubscription(id, subscription, env);
      if (result.success && Array.isArray(subscription.reminderRules)) {
        try {
          const remindersRepo = await Promise.resolve().then(() => (init_reminders_repo(), reminders_repo_exports));
          const { syncLegacyReminderFields: syncLegacyReminderFields2 } = await Promise.resolve().then(() => (init_subscriptions(), subscriptions_exports));
          const rules = subscription.reminderRules.map(remindersRepo.normalizeRule);
          await remindersRepo.replaceForSubscription(env, id, rules);
          await syncLegacyReminderFields2(env, id, rules);
        } catch (err) {
          console.error("[subscriptions] \u66F4\u65B0\u63D0\u9192\u89C4\u5219\u5931\u8D25\uFF08\u8BA2\u9605\u672C\u4F53\u5DF2\u66F4\u65B0\uFF09:", err);
        }
      }
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (method === "DELETE") {
      const result = await deleteSubscription(id, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
  }
  return null;
}

// src/api/router.js
init_config();

// src/api/handlers/test-notification.js
init_config();
init_time();
async function handleTestNotification(request, env) {
  try {
    const config = await getConfig(env);
    const body = await request.json();
    let success = false;
    let message = "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const supportedTypes = ["telegram", "notifyx", "webhook", "wechatbot", "email", "bark", "gotify", "serverchan", "pushplus", "ntfy", "wpush", "dingtalk"];
    if (!type) {
      return new Response(
        JSON.stringify({ success: false, message: "\u7F3A\u5C11\u6D4B\u8BD5\u7C7B\u578B\u53C2\u6570 type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!supportedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ success: false, message: "\u4E0D\u652F\u6301\u7684\u6D4B\u8BD5\u7C7B\u578B: " + type }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (type === "telegram") {
      const testConfig = {
        ...config,
        TG_BOT_TOKEN: typeof body.TG_BOT_TOKEN === "string" && body.TG_BOT_TOKEN.trim().length > 0 ? body.TG_BOT_TOKEN.trim() : config.TG_BOT_TOKEN,
        TG_CHAT_ID: typeof body.TG_CHAT_ID === "string" && body.TG_CHAT_ID.trim().length > 0 ? body.TG_CHAT_ID.trim() : config.TG_CHAT_ID,
        TG_TOPIC_ID: typeof body.TG_TOPIC_ID === "string" && body.TG_TOPIC_ID.trim().length > 0 ? body.TG_TOPIC_ID.trim() : config.TG_TOPIC_ID
      };
      const content = "*\u6D4B\u8BD5\u901A\u77E5*\n\n\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Telegram\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendTelegramNotification(content, testConfig);
      message = success ? "Telegram\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Telegram\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "notifyx") {
      const testConfig = {
        ...config,
        NOTIFYX_API_KEY: typeof body.NOTIFYX_API_KEY === "string" && body.NOTIFYX_API_KEY.trim().length > 0 ? body.NOTIFYX_API_KEY.trim() : config.NOTIFYX_API_KEY
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "## \u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\n\n\u7528\u4E8E\u9A8C\u8BC1NotifyX\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      const description = "\u6D4B\u8BD5NotifyX\u901A\u77E5\u529F\u80FD";
      success = await sendNotifyXNotification(title, content, description, testConfig);
      message = success ? "NotifyX\u901A\u77E5\u53D1\u9001\u6210\u529F" : "NotifyX\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "webhook") {
      const testConfig = {
        ...config,
        WEBHOOK_URL: typeof body.WEBHOOK_URL === "string" && body.WEBHOOK_URL.trim().length > 0 ? body.WEBHOOK_URL.trim() : config.WEBHOOK_URL,
        WEBHOOK_METHOD: body.WEBHOOK_METHOD || config.WEBHOOK_METHOD,
        WEBHOOK_HEADERS: typeof body.WEBHOOK_HEADERS === "string" && body.WEBHOOK_HEADERS.trim().length > 0 ? body.WEBHOOK_HEADERS.trim() : config.WEBHOOK_HEADERS,
        WEBHOOK_TEMPLATE: body.WEBHOOK_TEMPLATE || config.WEBHOOK_TEMPLATE
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Webhook \u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendWebhookNotification(title, content, testConfig);
      message = success ? "Webhook \u901A\u77E5\u53D1\u9001\u6210\u529F" : "Webhook \u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "wechatbot") {
      const testConfig = {
        ...config,
        WECHATBOT_WEBHOOK: typeof body.WECHATBOT_WEBHOOK === "string" && body.WECHATBOT_WEBHOOK.trim().length > 0 ? body.WECHATBOT_WEBHOOK.trim() : config.WECHATBOT_WEBHOOK,
        WECHATBOT_MSG_TYPE: body.WECHATBOT_MSG_TYPE || config.WECHATBOT_MSG_TYPE,
        WECHATBOT_AT_MOBILES: body.WECHATBOT_AT_MOBILES || config.WECHATBOT_AT_MOBILES,
        WECHATBOT_AT_ALL: body.WECHATBOT_AT_ALL || config.WECHATBOT_AT_ALL
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendWechatBotNotification(title, content, testConfig);
      message = success ? "\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u901A\u77E5\u53D1\u9001\u6210\u529F" : "\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "email") {
      const testConfig = {
        ...config,
        RESEND_API_KEY: typeof body.RESEND_API_KEY === "string" && body.RESEND_API_KEY.trim().length > 0 ? body.RESEND_API_KEY.trim() : config.RESEND_API_KEY,
        EMAIL_FROM: body.EMAIL_FROM || config.EMAIL_FROM,
        EMAIL_FROM_NAME: body.EMAIL_FROM_NAME || config.EMAIL_FROM_NAME,
        EMAIL_TO: body.EMAIL_TO || config.EMAIL_TO
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u90AE\u4EF6\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendEmailNotification(title, content, testConfig);
      message = success ? "\u90AE\u4EF6\u901A\u77E5\u53D1\u9001\u6210\u529F" : "\u90AE\u4EF6\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "bark") {
      const testConfig = {
        ...config,
        BARK_SERVER: body.BARK_SERVER || config.BARK_SERVER,
        BARK_DEVICE_KEY: typeof body.BARK_DEVICE_KEY === "string" && body.BARK_DEVICE_KEY.trim().length > 0 ? body.BARK_DEVICE_KEY.trim() : config.BARK_DEVICE_KEY,
        BARK_IS_ARCHIVE: body.BARK_IS_ARCHIVE || config.BARK_IS_ARCHIVE
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Bark\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendBarkNotification(title, content, testConfig);
      message = success ? "Bark\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Bark\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "gotify") {
      const testConfig = {
        ...config,
        GOTIFY_SERVER_URL: body.GOTIFY_SERVER_URL || config.GOTIFY_SERVER_URL,
        GOTIFY_APP_TOKEN: typeof body.GOTIFY_APP_TOKEN === "string" && body.GOTIFY_APP_TOKEN.trim().length > 0 ? body.GOTIFY_APP_TOKEN.trim() : config.GOTIFY_APP_TOKEN
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Gotify\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendGotifyNotification(title, content, testConfig);
      message = success ? "Gotify\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Gotify\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "serverchan") {
      const testConfig = {
        ...config,
        SERVERCHAN_SENDKEY: typeof body.SERVERCHAN_SENDKEY === "string" && body.SERVERCHAN_SENDKEY.trim().length > 0 ? body.SERVERCHAN_SENDKEY.trim() : config.SERVERCHAN_SENDKEY
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Server\u9171\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendServerChanNotification(title, content, testConfig);
      message = success ? "Server\u9171\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Server\u9171\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "pushplus") {
      const testConfig = {
        ...config,
        PUSHPLUS_TOKEN: typeof body.PUSHPLUS_TOKEN === "string" && body.PUSHPLUS_TOKEN.trim().length > 0 ? body.PUSHPLUS_TOKEN.trim() : config.PUSHPLUS_TOKEN,
        PUSHPLUS_TOPIC: body.PUSHPLUS_TOPIC || config.PUSHPLUS_TOPIC,
        PUSHPLUS_CHANNEL: body.PUSHPLUS_CHANNEL || config.PUSHPLUS_CHANNEL
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1PushPlus\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendPushPlusNotification(title, content, testConfig);
      message = success ? "PushPlus\u901A\u77E5\u53D1\u9001\u6210\u529F" : "PushPlus\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "ntfy") {
      const testConfig = {
        ...config,
        NTFY_SERVER: body.NTFY_SERVER || config.NTFY_SERVER,
        NTFY_TOPIC: body.NTFY_TOPIC || config.NTFY_TOPIC,
        NTFY_TOKEN: typeof body.NTFY_TOKEN === "string" && body.NTFY_TOKEN.trim().length > 0 ? body.NTFY_TOKEN.trim() : config.NTFY_TOKEN
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1 ntfy \u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendNtfyNotification(title, content, testConfig);
      message = success ? "ntfy \u901A\u77E5\u53D1\u9001\u6210\u529F" : "ntfy \u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "wpush") {
      const testConfig = {
        ...config,
        WPUSH_APIKEY: typeof body.WPUSH_APIKEY === "string" && body.WPUSH_APIKEY.trim().length > 0 ? body.WPUSH_APIKEY.trim() : config.WPUSH_APIKEY,
        WPUSH_CHANNEL: typeof body.WPUSH_CHANNEL === "string" ? body.WPUSH_CHANNEL.trim() : config.WPUSH_CHANNEL,
        WPUSH_TOPIC_CODE: typeof body.WPUSH_TOPIC_CODE === "string" ? body.WPUSH_TOPIC_CODE.trim() : config.WPUSH_TOPIC_CODE
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1 WPUSH \u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendWPushNotification(title, content, testConfig);
      message = success ? "WPUSH \u901A\u77E5\u53D1\u9001\u6210\u529F" : "WPUSH \u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "dingtalk") {
      const testConfig = {
        ...config,
        DINGTALK_WEBHOOK: typeof body.DINGTALK_WEBHOOK === "string" && body.DINGTALK_WEBHOOK.trim().length > 0 ? body.DINGTALK_WEBHOOK.trim() : config.DINGTALK_WEBHOOK,
        DINGTALK_SECRET: typeof body.DINGTALK_SECRET === "string" && body.DINGTALK_SECRET.trim().length > 0 ? body.DINGTALK_SECRET.trim() : config.DINGTALK_SECRET,
        DINGTALK_MSG_TYPE: body.DINGTALK_MSG_TYPE || config.DINGTALK_MSG_TYPE,
        DINGTALK_AT_MOBILES: body.DINGTALK_AT_MOBILES || config.DINGTALK_AT_MOBILES,
        DINGTALK_AT_ALL: body.DINGTALK_AT_ALL || config.DINGTALK_AT_ALL
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u9489\u9489\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendDingTalkNotification(title, content, testConfig);
      message = success ? "\u9489\u9489\u901A\u77E5\u53D1\u9001\u6210\u529F" : "\u9489\u9489\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    }
    return new Response(
      JSON.stringify({ success, message }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({ success: false, message: "\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// src/api/router.js
init_extras();
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.slice(4);
  const method = request.method;
  const config = await getConfig(env);
  if (path === "/login" && method === "POST") {
    return handleLogin(request, env);
  }
  if (path === "/logout" && (method === "GET" || method === "POST")) {
    return handleLogout();
  }
  if (path.startsWith("/notify/")) {
    const thirdPartyResponse2 = await handleThirdPartyNotify(request, env, config, url);
    if (thirdPartyResponse2) return thirdPartyResponse2;
  }
  const { user } = await getUserFromRequest(request, env);
  if (!user && path !== "/login") {
    return new Response(
      JSON.stringify({ success: false, message: "\u672A\u6388\u6743\u8BBF\u95EE" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  if (path === "/config") {
    if (method === "GET") return handleGetConfig(env);
    if (method === "POST") return handleUpdateConfig(request, env);
  }
  if (path === "/dashboard/stats" && method === "GET") {
    return handleDashboardStats(env, config);
  }
  if (path === "/test-notification" && method === "POST") {
    return handleTestNotification(request, env);
  }
  if (path === "/backup" && method === "GET") {
    const { handleExportBackup: handleExportBackup2 } = await Promise.resolve().then(() => (init_backup(), backup_exports));
    return handleExportBackup2(request, env);
  }
  if (path === "/restore" && method === "POST") {
    const { handleImportBackup: handleImportBackup2 } = await Promise.resolve().then(() => (init_backup(), backup_exports));
    return handleImportBackup2(request, env);
  }
  const extraResponse = await handleExtraRoutes(request, env, path);
  if (extraResponse) return extraResponse;
  const subscriptionResponse = await handleSubscriptions(request, env, path);
  if (subscriptionResponse) return subscriptionResponse;
  const thirdPartyResponse = await handleThirdPartyNotify(request, env, config, url);
  if (thirdPartyResponse) return thirdPartyResponse;
  return new Response(
    JSON.stringify({ success: false, message: "\u672A\u627E\u5230\u8BF7\u6C42\u7684\u8D44\u6E90" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}

// src/api/admin.js
init_config();
init_utils();

// src/views/theme-resources.html
var theme_resources_default = "\n<style>\n  /* === \u5168\u5C40\u6697\u9ED1\u6A21\u5F0F\u6838\u5FC3\u53D8\u91CF\u4E0E\u8986\u76D6 === */\n  :root {\n    --dark-bg-primary: #111827;   /* \u6DF1\u7070/\u9ED1\u80CC\u666F */\n    --dark-bg-secondary: #1f2937; /* \u5361\u7247/\u5BB9\u5668\u80CC\u666F */\n    --dark-border: #374151;       /* \u8FB9\u6846\u989C\u8272 */\n    --dark-text-main: #f9fafb;    /* \u4E3B\u8981\u6587\u5B57 */\n    --dark-text-muted: #9ca3af;   /* \u6B21\u8981\u6587\u5B57 */\n  }\n  html.dark body { background-color: var(--dark-bg-primary); color: var(--dark-text-muted); }\n  html.dark .bg-white { background-color: var(--dark-bg-secondary) !important; color: var(--dark-text-main); }\n  html.dark .bg-gray-50 { background-color: var(--dark-bg-primary) !important; }\n  html.dark .bg-gray-100 { background-color: var(--dark-border) !important; }\n  html.dark .shadow-md, html.dark .shadow-lg, html.dark .shadow-xl { \n    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3); \n  }\n  html.dark .text-gray-900, html.dark .text-gray-800 { color: var(--dark-text-main) !important; }\n  html.dark .text-gray-700 { color: #d1d5db !important; }\n  html.dark .text-gray-600, html.dark .text-gray-500 { color: var(--dark-text-muted) !important; }\n  html.dark .text-indigo-600 { color: #818cf8 !important; }\n  html.dark .border-gray-200, html.dark .border-gray-300 { border-color: var(--dark-border) !important; }\n  html.dark .divide-y > :not([hidden]) ~ :not([hidden]) { border-color: var(--dark-border) !important; }\n  html.dark .divide-gray-200 > :not([hidden]) ~ :not([hidden]) { border-color: var(--dark-border) !important; }\n  html.dark input, html.dark select, html.dark textarea {\n    background-color: #374151 !important;\n    border-color: #4b5563 !important;\n    color: white !important;\n  }\n  html.dark input[readonly] {\n    background-color: #1f2937 !important;\n    color: #9ca3af !important;\n  }\n  html.dark .readonly-input { background-color: #1f2937 !important; border-color: #374151 !important; color: #9ca3af !important; }\n  html.dark input::placeholder, html.dark textarea::placeholder { color: #9ca3af; }\n  html.dark input:focus, html.dark select:focus, html.dark textarea:focus {\n    border-color: #818cf8 !important;\n    background-color: #4b5563 !important;\n  }\n  html.dark nav { background-color: var(--dark-bg-secondary) !important; border-bottom: 1px solid var(--dark-border); }\n  html.dark thead {\n    background-color: #111827 !important;\n    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);\n  }\n  html.dark thead th {\n    color: #f9fafb !important;\n    background-color: #111827 !important;\n    border-bottom: 1px solid #4b5563 !important;\n    letter-spacing: 0.08em;\n  }\n  html.dark tbody tr:hover { background-color: #374151 !important; }\n  html.dark tbody tr.bg-gray-100 { background-color: #374151 !important; }\n  /* \u5F39\u7A97\u4E0E\u65E5\u671F\u9009\u62E9\u5668 */\n  html.dark .custom-date-picker { background-color: var(--dark-bg-secondary); border-color: var(--dark-border); }\n  html.dark .custom-date-picker .calendar-day { color: #e5e7eb; }\n  html.dark .custom-date-picker .calendar-day:hover { background-color: #374151; }\n  html.dark .custom-date-picker .calendar-day.other-month { color: #4b5563; }\n  html.dark .month-option, html.dark .year-option { color: #e5e7eb; }\n  html.dark .month-option:hover, html.dark .year-option:hover { background-color: #374151 !important; }\n  html.dark .custom-dropdown-list { background-color: var(--dark-bg-secondary); border-color: var(--dark-border); }\n  html.dark .dropdown-item { color: #d1d5db; border-bottom-color: var(--dark-border); }\n  html.dark .dropdown-item:hover { background-color: #374151; color: #818cf8; }\n  html.dark #mobile-menu { background-color: var(--dark-bg-secondary); border-color: var(--dark-border); }\n  html.dark #mobile-menu a { color: #e5e7eb; }\n  html.dark #mobile-menu a:hover { background-color: #374151; }\n  html.dark #mobile-menu-btn { color: #e5e7eb; }\n  html.dark #mobile-menu-btn:hover { background-color: #374151; }\n  html.dark .loading-skeleton { background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%); }\n  html.dark .table-container { box-shadow: 0 6px 12px rgba(0,0,0,0.4); }\n  html.dark .hover-tooltip, html.dark .notes-tooltip {\n    background: #111827;\n    border: 1px solid #374151;\n  }\n  html.dark .hover-tooltip::before, html.dark .notes-tooltip::before {\n    border-bottom-color: #111827;\n  }\n  html.dark .hover-text:hover, html.dark .notes-text:hover { color: #93c5fd; }\n\n  /* === \u7EDF\u4E00\u6309\u94AE\u6837\u5F0F tokens === */\n  .btn-primary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(99, 102, 241, 0.25); }\n  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(99, 102, 241, 0.35); }\n  .btn-secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(107, 114, 128, 0.25); }\n  .btn-secondary:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(107, 114, 128, 0.35); }\n  .btn-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(16, 185, 129, 0.25); }\n  .btn-success:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(16, 185, 129, 0.35); }\n  .btn-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(245, 158, 11, 0.25); }\n  .btn-warning:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(245, 158, 11, 0.35); }\n  .btn-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(239, 68, 68, 0.25); }\n  .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(239, 68, 68, 0.35); }\n  .btn-info { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(59, 130, 246, 0.25); }\n  .btn-info:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(59, 130, 246, 0.35); }\n  .btn-clone { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(20, 184, 166, 0.25); color: #fff; }\n  .btn-clone:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(20, 184, 166, 0.35); }\n  .btn-history { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); transition: all 0.2s; box-shadow: 0 6px 14px rgba(168, 85, 247, 0.25); color: #fff; }\n  .btn-history:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(168, 85, 247, 0.35); }\n\n  @media (max-width: 767px) {   /* === \u79FB\u52A8\u7AEF\u8868\u683C\u6837\u5F0F(\u9AD8\u5BF9\u6BD4\u5EA6\u7248) === */\n    html.dark .responsive-table td:before {  /* \u5F3A\u5236\u63D0\u4EAE\u79FB\u52A8\u7AEF\u8868\u683C\u7684 Label */\n      color: #e5e7eb !important;    /* \u6539\u4E3A\u6781\u4EAE\u7684\u6D45\u7070\u8272 (\u63A5\u8FD1\u7EAF\u767D) */\n      font-weight: 700 !important;  /* \u52A0\u7C97\u5B57\u4F53 */\n      opacity: 1 !important;\n      text-transform: uppercase;    /* \u53EF\u9009\uFF1A\u589E\u52A0\u5927\u5199\u4F7F\u5176\u66F4\u7A81\u51FA */\n      letter-spacing: 0.05em;\n    }\n    html.dark .responsive-table tr {\n      border-color: #374151 !important;\n      background-color: #1f2937 !important;\n      box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important; /* \u9634\u5F71\u7A0D\u5FAE\u52A0\u6DF1 */\n    }\n    \n    html.dark .responsive-table td {\n      border-bottom-color: #374151 !important;\n    }\n    \n    html.dark .td-content-wrapper {\n        color: #f3f4f6;\n    }\n  }\n</style>\n<script>\n  (function() {\n    function applyTheme(mode) {\n      const html = document.documentElement;\n      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;\n      \n      if (mode === 'dark' || (mode === 'system' && isSystemDark)) {\n        html.classList.add('dark');\n      } else {\n        html.classList.remove('dark');\n      }\n    }\n\n    const savedTheme = localStorage.getItem('themeMode') || 'system';\n    applyTheme(savedTheme);\n\n    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {\n      const currentMode = localStorage.getItem('themeMode') || 'system';\n      if (currentMode === 'system') {\n        applyTheme('system');\n      }\n    });\n\n    window.addEventListener('load', async () => {\n      if (window.location.pathname.startsWith('/admin')) {\n        try {\n          const res = await fetch('/api/config');\n          const config = await res.json();\n          if (config.THEME_MODE && config.THEME_MODE !== localStorage.getItem('themeMode')) {\n            localStorage.setItem('themeMode', config.THEME_MODE);\n            applyTheme(config.THEME_MODE);\n            const select = document.getElementById('themeModeSelect');\n            if (select) select.value = config.THEME_MODE;\n          }\n        } catch(e) {}\n      }\n    });\n    \n    window.updateAppTheme = function(mode) {\n      localStorage.setItem('themeMode', mode);\n      applyTheme(mode);\n    };\n  })();\n<\/script>\n";

// src/views/loginPage.html
var loginPage_default = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  \${themeResources}  <style>
    .login-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .login-box {
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .input-field {
      transition: all 0.3s;
      border: 1px solid #e2e8f0;
    }
    .input-field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
    }
    html.dark .login-container {
      background: linear-gradient(135deg, #3b4cc4 0%, #4a2b6b 100%);
    }
    html.dark .login-box {
      background-color: rgba(17, 24, 39, 0.95);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    html.dark .login-box .text-gray-800 { color: #f3f4f6; }
    html.dark .login-box .text-gray-600,
    html.dark .login-box .text-gray-700 { color: #cbd5e1; }
  </style>
</head>
<body class="login-container flex items-center justify-center">
  <div class="login-box p-8 rounded-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-calendar-check mr-2"></i>\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</h1>
      <p class="text-gray-600 mt-2">\u767B\u5F55\u7BA1\u7406\u60A8\u7684\u8BA2\u9605\u63D0\u9192</p>
    </div>
    
    <form id="loginForm" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-user mr-2"></i>\u7528\u6237\u540D
        </label>
        <input type="text" id="username" name="username" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-lock mr-2"></i>\u5BC6\u7801
        </label>
        <input type="password" id="password" name="password" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <button type="submit" 
        class="btn-primary w-full py-3 rounded-lg text-white font-medium focus:outline-none">
        <i class="fas fa-sign-in-alt mr-2"></i>\u767B\u5F55
      </button>
      
      <div id="errorMsg" class="text-red-500 text-center" role="alert"></div>
      <p class="text-xs text-amber-700 text-center mt-3 leading-relaxed">
        \u82E5\u4ECD\u4F7F\u7528\u9ED8\u8BA4\u8D26\u53F7 <code>admin</code> / <code>password</code>\uFF0C\u767B\u5F55\u540E\u8BF7\u7ACB\u5373\u5728\u300C\u7CFB\u7EDF\u914D\u7F6E\u300D\u4FEE\u6539\u5BC6\u7801\u3002
      </p>
    </form>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const button = e.target.querySelector('button');
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u767B\u5F55\u4E2D...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('errorMsg').textContent = result.message || '\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF';
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        document.getElementById('errorMsg').textContent = '\u53D1\u751F\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5';
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    });
  <\/script>
</body>
</html>`;

// src/views/adminPage.html
var adminPage_default = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  \${themeResources}  <style>
    .table-container { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .modal-container { backdrop-filter: blur(8px); }
    .readonly-input { background-color: #f8fafc; border-color: #e2e8f0; cursor: not-allowed; }
    .error-message { font-size: 0.875rem; margin-top: 0.25rem; display: none; }
    .error-message.show { display: block; }

    /* \u901A\u7528\u60AC\u6D6E\u63D0\u793A\u4F18\u5316 */
    .hover-container {
      position: relative;
      width: 100%;
    }
    .hover-text {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
      display: block;
    }
    .hover-text:hover { color: #3b82f6; }
    .hover-tooltip {
      position: fixed;
      z-index: 9999;
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      max-width: 320px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      white-space: normal;
      pointer-events: none;
      line-height: 1.4;
    }
    .hover-tooltip.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .hover-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #1f2937;
    }
    .hover-tooltip.tooltip-above::before {
      top: auto;
      bottom: -6px;
      border-bottom: none;
      border-top: 6px solid #1f2937;
    }

    /* \u5907\u6CE8\u663E\u793A\u4F18\u5316 */
    .notes-container {
      position: relative;
      max-width: 200px;
      width: 100%;
    }
    .notes-text {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
      display: block;
    }
    .notes-text:hover { color: #3b82f6; }
    .notes-tooltip {
      position: fixed;
      z-index: 9999;
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      max-width: 320px;
      word-wrap: break-word;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      white-space: normal;
      pointer-events: none;
      line-height: 1.4;
    }
    .notes-tooltip.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .notes-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 20px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #1f2937;
    }
    .notes-tooltip.tooltip-above::before {
      top: auto;
      bottom: -6px;
      border-bottom: none;
      border-top: 6px solid #1f2937;
    }

    /* \u519C\u5386\u663E\u793A\u6837\u5F0F */
    .lunar-display {
      font-size: 0.75rem;
      color: #6366f1;
      margin-top: 2px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .lunar-display.show {
      opacity: 1;
    }
    
    .custom-date-picker {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      width: 100%;
      max-width: 380px;
      min-width: 300px; 
    }
    
    .custom-date-picker .calendar-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%; 
      height: auto;
      aspect-ratio: 0.85; /* \u4FDD\u6301\u9002\u4E2D\u7684\u957F\u5BBD\u6BD4\uFF0C\u7D27\u51D1\u5E03\u5C40 */
      min-height: 45px;   /* \u4FDD\u8BC1\u6700\u5C0F\u70B9\u51FB\u533A\u57DF */
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      padding: 2px; /* \u51CF\u5C0F\u5185\u8FB9\u8DDD */
      font-size: 13px; /* \u7A0D\u5FAE\u8C03\u5C0F\u5B57\u4F53\u9002\u5E94\u79FB\u52A8\u7AEF */
    }
    /* \u3010\u65B0\u589E\u3011\u81EA\u5B9A\u4E49\u4E0B\u62C9\u83DC\u5355\u6837\u5F0F (\u7528\u4E8E\u66FF\u4EE3 datalist) */
    .custom-dropdown-wrapper {
      position: relative;
      width: 100%;
    }
    .custom-dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      margin-top: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 60; /* \u786E\u4FDD\u5728\u5176\u4ED6\u5143\u7D20\u4E4B\u4E0A */
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: none; /* \u9ED8\u8BA4\u9690\u85CF */
    }
    .custom-dropdown-list.show {
      display: block;
    }
    .dropdown-item {
      padding: 10px 12px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s;
    }
    .dropdown-item:last-child {
      border-bottom: none;
    }
    .dropdown-item:hover, .dropdown-item:active {
      background-color: #f3f4f6;
      color: #4f46e5;
    }

    .custom-date-picker .calendar-day:hover {
      background-color: #e0e7ff;
      transform: scale(1.05);
    }
    
    .custom-date-picker .calendar-day.selected {
      background-color: #6366f1;
      color: white;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    
    .custom-date-picker .calendar-day.today {
      background-color: #e0e7ff;
      color: #6366f1;
      font-weight: 600;
      border: 2px solid #6366f1;
    }
    
    .custom-date-picker .calendar-day.other-month {
      color: #d1d5db;
    }
    
    .custom-date-picker .calendar-day .lunar-text {
      font-size: 11px;
      line-height: 1.2;
      margin-top: 3px;
      opacity: 0.85;
      text-align: center;
      font-weight: 500;
    }
    
    .custom-date-picker .calendar-day.selected .lunar-text {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .custom-date-picker .calendar-day.today .lunar-text {
      color: #6366f1;
    }
    
    /* \u6708\u4EFD\u548C\u5E74\u4EFD\u9009\u62E9\u5668\u6837\u5F0F */
    .month-option, .year-option {
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .month-option:hover, .year-option:hover {
      background-color: #e0e7ff !important;
      border-color: #6366f1;
      color: #6366f1;
    }
    
    .month-option.selected, .year-option.selected {
      background-color: #6366f1 !important;
      color: white;
      border-color: #6366f1;
    }
    
    .lunar-toggle {
      display: inline-flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.875rem;
    }
    .lunar-toggle input[type="checkbox"] {
      margin-right: 6px;
    }

    /* \u8868\u683C\u5E03\u5C40\u4F18\u5316 */
    .table-container {
      width: 100%;
      overflow: hidden;
    }

    .table-container table {
      table-layout: fixed;
      width: 100%;
    }

    /* \u9632\u6B62\u8868\u683C\u5185\u5BB9\u6EA2\u51FA */
    .table-container td {
      overflow: hidden;
      word-wrap: break-word;
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* \u54CD\u5E94\u5F0F\u4F18\u5316 */
    .responsive-table { table-layout: auto; width: 100%; }
    .td-content-wrapper { word-wrap: break-word; white-space: normal; text-align: left; width: 100%; }
    .td-content-wrapper > * { text-align: left; } /* Align content left within the wrapper */
    /* \u64CD\u4F5C\u5217\u6309\u94AE\u59CB\u7EC8\u53EF\u6362\u884C\uFF0C\u907F\u514D\u514B\u9686\u7B49\u6309\u94AE\u88AB\u88C1\u5207\u770B\u4E0D\u89C1 */
    .action-buttons-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;
      min-width: 10rem;
    }
    .action-buttons-wrapper button {
      flex: 0 0 auto;
    }

    @media (max-width: 767px) {
      .table-container { overflow: hidden; }
      .responsive-table thead { display: none; }
      .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
      .responsive-table tr { margin-bottom: 1.5rem; border: 1px solid #ddd; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
      .responsive-table td { display: flex; justify-content: flex-start; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
      .responsive-table td:last-of-type { border-bottom: none; }
      .responsive-table td:before { content: attr(data-label); font-weight: 600; text-align: left; padding-right: 1rem; color: #374151; white-space: nowrap; }
      .action-buttons-wrapper { justify-content: flex-start; }

      .notes-container, .hover-container {
        max-width: 180px; /* Adjust for new layout */
        text-align: right;
      }
      .td-content-wrapper .notes-text {
        text-align: right;
      }
     }
    @media (max-width: 767px) {
      #systemTimeDisplay {
        display: none !important;
      }
    }
    @media (min-width: 768px) {
      .table-container { overflow-x: auto; }
      .responsive-table td[data-label="\u64CD\u4F5C"] { min-width: 16rem; }
    }

    /* Toast \u6837\u5F0F */
    #toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; gap: 8px; max-width: 380px;
    }
    .toast {
      padding: 12px 36px 12px 16px; border-radius: 8px; position: relative;
      color: white; font-weight: 500; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast .toast-close {
      position: absolute; top: 8px; right: 10px; cursor: pointer;
      opacity: 0.7; font-size: 14px; line-height: 1;
    }
    .toast .toast-close:hover { opacity: 1; }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
    html.dark .toast {
      color: #f9fafb;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    }
    html.dark .toast.success { background-color: #059669; }
    html.dark .toast.error { background-color: #dc2626; }
    html.dark .toast.info { background-color: #2563eb; }
    html.dark .toast.warning { background-color: #d97706; }

    /* \u6A21\u6001\u6846\u52A8\u753B */
    #subscriptionModal { transition: opacity 0.2s ease; opacity: 0; }
    #subscriptionModal:not(.hidden) { opacity: 1; }
    #subscriptionModal > div { transition: transform 0.2s ease; transform: scale(0.95); }
    #subscriptionModal:not(.hidden) > div { transform: scale(1); }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md relative z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center shrink-0">
          <div class="flex items-center">
            <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
            <span class="font-bold text-xl text-gray-800">\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</span>
          </div>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal hidden md:block pt-1"></span>
        </div>

        <div class="hidden md:flex items-center space-x-4 ml-auto">
          <a href="/admin/dashboard" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-chart-line mr-1"></i>\u4EEA\u8868\u76D8
          </a>
          <a href="/admin" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-list mr-1"></i>\u8BA2\u9605\u5217\u8868
          </a>
          <a href="/admin/notify-logs" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-history mr-1"></i>\u901A\u77E5\u5386\u53F2
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-cog mr-1"></i>\u7CFB\u7EDF\u914D\u7F6E
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-sign-out-alt mr-1"></i>\u9000\u51FA\u767B\u5F55
          </a>
        </div>

        <div class="flex items-center md:hidden ml-auto">
          <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-label="\u5207\u6362\u5BFC\u822A\u83DC\u5355" class="text-gray-600 hover:text-indigo-600 focus:outline-none p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-b border-gray-200 w-full">
       <div class="px-4 pt-2 pb-4 space-y-2">
        <div id="mobileTimeDisplay" class="px-3 py-2 text-xs text-indigo-600 text-right border-b border-gray-100 mb-2"></div>
        <a href="/admin/dashboard" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-chart-line w-6 text-center mr-2"></i>\u4EEA\u8868\u76D8
        </a>
        <a href="/admin" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-list w-6 text-center mr-2"></i>\u8BA2\u9605\u5217\u8868
        </a>
        <a href="/admin/notify-logs" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-history w-6 text-center mr-2"></i>\u901A\u77E5\u5386\u53F2
        </a>
        <a href="/admin/config" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-cog w-6 text-center mr-2"></i>\u7CFB\u7EDF\u914D\u7F6E
        </a>
        <a href="/api/logout" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors">
          <i class="fas fa-sign-out-alt w-6 text-center mr-2"></i>\u9000\u51FA\u767B\u5F55
        </a>
      </div>
    </div>
  </nav>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">\u8BA2\u9605\u5217\u8868</h2>
        <p class="text-sm text-gray-500 mt-1">\u4F7F\u7528\u641C\u7D22\u4E0E\u5206\u7C7B\u5FEB\u901F\u5B9A\u4F4D\u8BA2\u9605\uFF0C\u5F00\u542F\u519C\u5386\u663E\u793A\u53EF\u540C\u6B65\u67E5\u770B\u519C\u5386\u65E5\u671F</p>
      </div>
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:flex-1 lg:max-w-2xl">
          <div class="relative flex-1 min-w-[200px] lg:max-w-md">
            <input type="text" id="searchKeyword" placeholder="\u641C\u7D22\u540D\u79F0\u3001\u7C7B\u578B\u6216\u5907\u6CE8..." class="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <i class="fas fa-search"></i>
            </span>
            <button id="clearSearch" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" style="display:none;" onclick="document.getElementById('searchKeyword').value='';this.style.display='none';renderSubscriptionTable();">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="sm:w-36 lg:w-32">
            <select id="modeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
              <option value="">\u5168\u90E8\u6A21\u5F0F</option>
              <option value="cycle">\u5FAA\u73AF\u8BA2\u9605</option>
              <option value="reset">\u5230\u671F\u91CD\u7F6E</option>
            </select>
          </div>
          <div class="sm:w-36 lg:w-32">
            <select id="statusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
              <option value="">\u5168\u90E8\u72B6\u6001</option>
              <option value="active">\u6B63\u5E38</option>
              <option value="soon">\u5373\u5C06\u5230\u671F</option>
              <option value="expired">\u5DF2\u8FC7\u671F</option>
              <option value="disabled">\u5DF2\u505C\u7528</option>
            </select>
          </div>
          <div class="sm:w-44 lg:w-40">
            <select id="categoryFilter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
              <option value="">\u5168\u90E8\u5206\u7C7B</option>
            </select>
          </div>

        </div>
        <div class="flex items-center space-x-3 lg:space-x-4">
        <label class="lunar-toggle">
          <input type="checkbox" id="listShowLunar" class="form-checkbox h-4 w-4 text-indigo-600 shrink-0">
          <span class="text-gray-700">\u663E\u793A\u519C\u5386</span>
        </label>
        <button id="addSubscriptionBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shrink-0">
          <i class="fas fa-plus mr-2"></i>\u6DFB\u52A0\u65B0\u8BA2\u9605
        </button>
      </div>
      </div>
    </div>
    
    <div class="table-container bg-white rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full divide-y divide-gray-200 responsive-table">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 23%;">
                \u540D\u79F0
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                \u7C7B\u578B
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 18%;">
                \u5230\u671F <i class="fas fa-sort-up ml-1 text-indigo-500" title="\u6309\u5230\u671F\u65F6\u95F4\u5347\u5E8F\u6392\u5217"></i>
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 10%;">
                \u91D1\u989D
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                \u63D0\u9192
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 10%;">
                \u72B6\u6001
              </th>
              <th scope="col" class="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider" style="width: 13%;">
                \u64CD\u4F5C
              </th>
            </tr>
          </thead>
        <tbody id="subscriptionsBody" class="bg-white divide-y divide-gray-200">
        </tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="subscriptionModal" class="fixed inset-0 z-50 hidden overflow-y-auto bg-gray-600 bg-opacity-50">
    <div class="relative w-auto max-w-2xl mx-4 md:mx-auto my-12 bg-white rounded-lg shadow-xl">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 id="modalTitle" class="text-lg font-medium text-gray-900">\u6DFB\u52A0\u65B0\u8BA2\u9605</h3>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      
      <form id="subscriptionForm" class="p-6 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">\u8BA2\u9605\u540D\u79F0 *</label>
            <input type="text" id="name" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <div class="error-message text-red-500" data-for="name"></div>
          </div>
          
          <div class="custom-dropdown-wrapper">
            <label for="customType" class="block text-sm font-medium text-gray-700 mb-1">\u8BA2\u9605\u7C7B\u578B</label>
            <input type="text" id="customType" placeholder="\u9009\u62E9\u6216\u8F93\u5165\u81EA\u5B9A\u4E49\u7C7B\u578B" autocomplete="off"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <div id="customTypeDropdown" class="custom-dropdown-list"></div>
          </div>

          <div class="custom-dropdown-wrapper">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">\u5206\u7C7B\u6807\u7B7E</label>
            <input type="text" id="category" placeholder="\u9009\u62E9\u6216\u8F93\u5165\u81EA\u5B9A\u4E49\u6807\u7B7E" autocomplete="off"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <div id="categoryDropdown" class="custom-dropdown-list"></div>
            <p class="mt-1 text-xs text-gray-500">\u53EF\u8F93\u5165\u591A\u4E2A\u6807\u7B7E\u5E76\u4F7F\u7528"/"\u5206\u9694</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              \u8D39\u7528\u8BBE\u7F6E <span class="text-gray-400 text-xs ml-1">\u53EF\u9009</span>
            </label>
            <div class="flex space-x-2">
              <div class="w-24 shrink-0"> 
                <select id="currency" class="h-10 w-full px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm">
                  <option value="CNY" selected>CNY (\xA5)</option>
                  <option value="USD">USD ($)</option>   // \u7F8E\u5143
                  <option value="HKD">HKD (HK$)</option> // \u6E2F\u5E01
                  <option value="TWD">TWD (NT$)</option> // \u65B0\u53F0\u5E01
                  <option value="JPY">JPY (\xA5)</option>   // \u65E5\u5143
                  <option value="EUR">EUR (\u20AC)</option>   // \u6B27\u5143
                  <option value="GBP">GBP (\xA3)</option>   // \u82F1\u9551
                  <option value="KRW">KRW (\u20A9)</option>   // \u97E9\u5143
                  <option value="TRY">TRY (\u20BA)</option>   // \u571F\u8033\u5176\u91CC\u62C9
                </select>
              </div>
              <div class="relative flex-1">
                <input type="number" id="amount" step="0.01" min="0" placeholder="\u4F8B\u5982: 15.00"
                  class="h-10 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <p class="mt-1 text-xs text-gray-500">\u7528\u4E8E\u7EDF\u8BA1\u652F\u51FA\u548C\u751F\u6210\u4EEA\u8868\u76D8</p>
          </div>

          <div>
             <div class="flex justify-between items-center mb-1">
                <label for="subscriptionMode" class="block text-sm font-medium text-gray-700">\u8BA2\u9605\u6A21\u5F0F</label>
             </div>
            <select id="subscriptionMode" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white h-10">
              <option value="cycle" selected>\u{1F4C5} \u5FAA\u73AF\u8BA2\u9605</option>
              <option value="reset">\u23F3 \u5230\u671F\u91CD\u7F6E</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 leading-relaxed">
              <strong>\u5FAA\u73AF</strong>\uFF1A\u672A\u8FC7\u671F\u7EED\u8BA2\u65F6\u4ECE\u5F53\u524D\u5230\u671F\u65E5\u63A5\u7EED\uFF08\u5982\u4F1A\u5458\u7EED\u8D39\uFF09\uFF1B
              <strong>\u91CD\u7F6E</strong>\uFF1A\u4ECE\u652F\u4ED8\u65E5\u91CD\u65B0\u8D77\u7B97\u5468\u671F\uFF08\u5982\u4FDD\u53F7\u5361\u6309\u5145\u503C\u65E5\u7B97\uFF09\u3002
            </p>

            <div class="mt-2 flex items-center space-x-3 flex-wrap gap-y-1">
                 <label class="inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" id="showLunar" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-600">\u663E\u793A\u519C\u5386\u65E5\u671F</span>
                </label>
                <label class="inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" id="useLunar" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-600">\u519C\u5386\u5468\u671F</span>
                </label>
                <label class="inline-flex items-center cursor-pointer select-none" title="\u4EC5\u516C\u5386\uFF1B\u7EED\u8BA2/\u63A8\u7B97\u65F6\u843D\u5230\u76EE\u6807\u6708\u6700\u540E\u4E00\u5929">
                  <input type="checkbox" id="endOfMonth" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-600">\u6BCF\u6708\u6700\u540E\u4E00\u5929</span>
                </label>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">\u5F00\u59CB\u65E5\u671F</label>
            <div class="relative">
              <input type="text" id="startDate"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder="YYYY-MM-DD">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <i class="fas fa-calendar text-gray-400"></i>
              </div>
               <div id="startDatePicker" class="custom-date-picker hidden absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg p-4 w-full">
                  <div class="flex justify-between items-center mb-4">
                    <button type="button" id="startDatePrevMonth" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-left"></i></button>
                    <div class="flex items-center space-x-2">
                      <span id="startDateMonth" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">1\u6708</span>
                      <span class="text-gray-400">|</span>
                      <span id="startDateYear" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">2024</span>
                    </div>
                    <button type="button" id="startDateNextMonth" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-right"></i></button>
                  </div>
                  <div id="startDateMonthPicker" class="hidden mb-4"><div class="flex justify-between items-center mb-3"><span class="font-medium text-gray-900">\u9009\u62E9\u6708\u4EFD</span><button type="button" id="startDateBackToCalendar" class="text-gray-600 hover:text-gray-800"><i class="fas fa-times"></i></button></div><div class="grid grid-cols-3 gap-2"><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="0">1\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="1">2\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="2">3\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="3">4\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="4">5\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="5">6\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="6">7\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="7">8\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="8">9\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="9">10\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="10">11\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="11">12\u6708</button></div></div>
                  <div id="startDateYearPicker" class="hidden mb-4"><div class="flex justify-between items-center mb-3"><span class="font-medium text-gray-900">\u9009\u62E9\u5E74\u4EFD</span><button type="button" id="startDateBackToCalendarFromYear" class="text-gray-600 hover:text-gray-800"><i class="fas fa-times"></i></button></div><div class="flex justify-between items-center mb-3"><button type="button"  id="startDatePrevYearDecade" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-left"></i></button><span id="startDateYearRange" class="font-medium text-gray-900">2020-2029</span><button type="button"  id="startDateNextYearDecade" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-right"></i></button></div><div id="startDateYearGrid" class="grid grid-cols-3 gap-2"></div></div>
                  <div class="grid grid-cols-7 gap-2 mb-3"><div class="text-center text-sm font-semibold text-gray-600 py-2">\u65E5</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E00</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E8C</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E09</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u56DB</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E94</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u516D</div></div><div id="startDateCalendar" class="grid grid-cols-7 gap-2"></div>
                  <div class="mt-4 pt-3 border-t border-gray-200"><button type="button" id="startDateGoToToday" class="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md"><i class="fas fa-calendar-day mr-2"></i>\u56DE\u5230\u4ECA\u5929</button></div>
               </div>
            </div>
            <div id="startDateLunar" class="lunar-display pl-1"></div>
          </div>
          
          <div>
            <label for="periodValue" class="block text-sm font-medium text-gray-700 mb-1">\u5468\u671F\u6570\u503C *</label>
            <input type="number" id="periodValue" min="1" value="1" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
          </div>
          
          <div>
            <label for="periodUnit" class="block text-sm font-medium text-gray-700 mb-1">\u5468\u671F\u5355\u4F4D *</label>
            <select id="periodUnit" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="day">\u5929</option>
              <option value="month" selected>\u6708</option>
              <option value="year">\u5E74</option>
            </select>
            <div class="mt-1 flex flex-wrap gap-1">
              <button type="button" class="period-preset text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-indigo-50 text-gray-600" data-value="3" data-unit="month">\u5B63\u5EA6</button>
              <button type="button" class="period-preset text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-indigo-50 text-gray-600" data-value="6" data-unit="month">\u534A\u5E74</button>
              <button type="button" class="period-preset text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-indigo-50 text-gray-600" data-value="1" data-unit="year">\u4E00\u5E74</button>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label for="expiryDate" class="block text-sm font-medium text-gray-700 mb-1">\u5230\u671F\u65E5\u671F *</label>
              <div class="relative">
                <input type="text" id="expiryDate" required
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="YYYY-MM-DD">
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i class="fas fa-calendar text-gray-400"></i>
                </div>
                <div id="expiryDatePicker" class="custom-date-picker hidden absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg p-4 w-full">
                    <div class="flex justify-between items-center mb-4">
                      <button type="button" id="expiryDatePrevMonth" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-left"></i></button>
                      <div class="flex items-center space-x-2"><span id="expiryDateMonth" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">1\u6708</span><span class="text-gray-400">|</span><span id="expiryDateYear" class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600">2024</span></div>
                      <button type="button" id="expiryDateNextMonth" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div id="expiryDateMonthPicker" class="hidden mb-4"><div class="flex justify-between items-center mb-3"><span class="font-medium text-gray-900">\u9009\u62E9\u6708\u4EFD</span><button type="button" id="expiryDateBackToCalendar" class="text-gray-600 hover:text-gray-800"><i class="fas fa-times"></i></button></div><div class="grid grid-cols-3 gap-2"><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="0">1\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="1">2\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="2">3\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="3">4\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="4">5\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="5">6\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="6">7\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="7">8\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="8">9\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="9">10\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="10">11\u6708</button><button type="button" class="month-option px-3 py-2 text-sm rounded hover:bg-gray-100" data-month="11">12\u6708</button></div></div>
                    <div id="expiryDateYearPicker" class="hidden mb-4"><div class="flex justify-between items-center mb-3"><span class="font-medium text-gray-900">\u9009\u62E9\u5E74\u4EFD</span><button type="button" id="expiryDateBackToCalendarFromYear" class="text-gray-600 hover:text-gray-800"><i class="fas fa-times"></i></button></div><div class="flex justify-between items-center mb-3"><button type="button" id="expiryDatePrevYearDecade" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-left"></i></button><span id="expiryDateYearRange" class="font-medium text-gray-900">2020-2029</span><button type="button" id="expiryDateNextYearDecade" class="text-gray-600 hover:text-gray-800"><i class="fas fa-chevron-right"></i></button></div><div id="expiryDateYearGrid" class="grid grid-cols-3 gap-2"></div></div>
                    <div class="grid grid-cols-7 gap-2 mb-3"><div class="text-center text-sm font-semibold text-gray-600 py-2">\u65E5</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E00</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E8C</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E09</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u56DB</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u4E94</div><div class="text-center text-sm font-semibold text-gray-600 py-2">\u516D</div></div><div id="expiryDateCalendar" class="grid grid-cols-7 gap-2"></div>
                    <div class="mt-4 pt-3 border-t border-gray-200"><button type="button" id="expiryDateGoToToday" class="w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md"><i class="fas fa-calendar-day mr-2"></i>\u56DE\u5230\u4ECA\u5929</button></div>
                </div>
              </div>
              <div id="expiryDateLunar" class="lunar-display pl-1 mb-1"></div>
              <div class="error-message text-red-500" data-for="expiryDate"></div>
          </div>

          <div class="flex items-start">
              <button type="button" id="calculateExpiryBtn" class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center justify-center h-[42px] whitespace-nowrap">
                <i class="fas fa-calculator mr-2"></i>\u81EA\u52A8\u8BA1\u7B97\u5230\u671F\u65E5\u671F
              </button>
          </div>
        </div>

        <!-- \u63D0\u9192\u89C4\u5219\u7F16\u8F91\u5668\uFF08\u591A\u6761\u89C4\u5219\uFF09\u3002\u9690\u85CF\u7684 reminderUnit/reminderValue \u4EC5\u4F5C\u4E3A\u540E\u7AEF\u515C\u5E95\u5B57\u6BB5\u4FDD\u7559\u3002 -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-semibold text-gray-700">
              <i class="fas fa-bell text-indigo-500 mr-1"></i> \u63D0\u9192\u89C4\u5219
              <span class="text-xs font-normal text-gray-500 ml-2">\uFF08\u652F\u6301\u591A\u6761\u89C4\u5219\uFF1B\u65B0\u8BA2\u9605\u9ED8\u8BA4 7/3/1 \u5929 + \u5F53\u5929\uFF09</span>
            </label>
            <div class="flex items-center space-x-2">
              <button type="button" id="reminderRulesPresetBtn"
                class="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
                <i class="fas fa-magic"></i> \u5E94\u7528\u9884\u8BBE(7/3/1/\u5F53\u5929)
              </button>
              <button type="button" id="reminderRulesAddBtn"
                class="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <i class="fas fa-plus"></i> \u6DFB\u52A0\u89C4\u5219
              </button>
            </div>
          </div>
          <div id="reminderRulesContainer" class="space-y-2">
            <!-- \u89C4\u5219\u884C\u7531 JS \u6CE8\u5165 -->
          </div>
          <p class="mt-2 text-xs text-gray-500 leading-relaxed">
            <strong class="text-gray-600">\u89E6\u53D1\u8BED\u4E49\uFF08\u7CBE\u786E\u5339\u914D\uFF09\uFF1A</strong>
            \u300C\u5230\u671F\u524D N \u5929\u300D\u4EC5\u5728\u5269\u4F59\u5929\u6570<strong>\u6B63\u597D\u7B49\u4E8E N</strong> \u65F6\u53D1\u9001\u4E00\u6B21\uFF0C\u4E0D\u4F1A\u5728\u7B2C N-1\u20261 \u5929\u81EA\u52A8\u8FDE\u53D1\u3002
            \u82E5\u5E0C\u671B 7/3/1 \u5929\u90FD\u63D0\u9192\uFF0C\u8BF7\u6DFB\u52A0\u591A\u6761\u89C4\u5219\uFF08\u53EF\u7528\u4E0A\u65B9\u9884\u8BBE\uFF09\u3002
            \u7C7B\u578B\uFF1A\u5230\u671F\u524D = \u7CBE\u786E\u65E5/\u5C0F\u65F6\uFF1B\u5230\u671F\u5F53\u5929\uFF1B\u5230\u671F\u540E = \u6BCF X \u5C0F\u65F6\u91CD\u590D\u76F4\u5230\u7EED\u8D39/\u624B\u52A8\u786E\u8BA4\u3002
          </p>
          <!-- \u515C\u5E95\u5B57\u6BB5\uFF1A\u65E7\u8C03\u5EA6\u5668\u8DEF\u5F84\u9700\u8981\u8FD9\u4E24\u4E2A\u503C\uFF1B\u5F53 reminderRules \u4E3A\u7A7A\u65F6\u4ECD\u751F\u6548 -->
          <input type="hidden" id="reminderUnit" value="day">
          <input type="hidden" id="reminderValue" value="7">
          <div class="error-message text-red-500" data-for="reminderValue"></div>
          <p id="reminderHint" class="hidden"></p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">\u9009\u9879\u8BBE\u7F6E</label>
               <div class="flex items-center space-x-6">
                  <label class="inline-flex items-center cursor-pointer select-none group">
                    <input type="checkbox" id="isActive" checked 
                      class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition duration-150 ease-in-out">
                    <span class="ml-2 text-sm text-gray-700 font-medium group-hover:text-indigo-700">\u542F\u7528\u8BA2\u9605</span>
                  </label>
                  
                  <label class="inline-flex items-center cursor-pointer select-none group">
                    <input type="checkbox" id="autoRenew" checked 
                      class="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition duration-150 ease-in-out">
                    <span class="ml-2 text-sm text-gray-700 font-medium group-hover:text-indigo-700">\u81EA\u52A8\u7EED\u8BA2</span>
                  </label>
               </div>
            </div>
        </div>

        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">\u5907\u6CE8</label>
          <textarea id="notes" rows="2" placeholder="\u53EF\u6DFB\u52A0\u76F8\u5173\u5907\u6CE8\u4FE1\u606F..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <div class="error-message text-red-500"></div>
        </div>
        
        <input type="hidden" id="subscriptionId">

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancelBtn" 
            class="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors">
            \u53D6\u6D88
          </button>
          <button type="submit" 
            class="btn-primary text-white px-6 py-2 rounded-md text-sm font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all">
            <i class="fas fa-save mr-2"></i>\u4FDD\u5B58
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // \u7EDF\u4E00 API \u8BF7\u6C42\u5C01\u88C5\uFF1A401 \u81EA\u52A8\u8DF3\u8F6C\u767B\u5F55\u9875
    async function apiFetch(url, options) {
      const response = await fetch(url, options);
      if (response.status === 401) {
        showToast('\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u6B63\u5728\u8DF3\u8F6C\u767B\u5F55\u9875...', 'warning');
        setTimeout(() => { window.location.href = '/'; }, 1000);
        throw new Error('AUTH_EXPIRED');
      }
      return response;
    }

    // HTML \u8F6C\u4E49\uFF0C\u9632\u6B62 XSS
    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    // \u519C\u5386\u8F6C\u6362\u5DE5\u5177\u51FD\u6570 - \u524D\u7AEF\u7248\u672C
    const lunarCalendar = {
      // \u519C\u5386\u6570\u636E (1900-2100\u5E74)
      lunarInfo: [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
        0x14b63, 0x09370, 0x14a38, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x1a978, 0x16aa0, 0x0a6c0, // 2050-2059 (\u4FEE\u6B632057: 0x1a978)
        0x0aa60, 0x16d63, 0x0d260, 0x0d950, 0x0d554, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, // 2060-2069
        0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, // 2070-2079
        0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, // 2080-2089
        0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x1a4bb, 0x0a4d0, 0x0d0b0, // 2090-2099 (\u4FEE\u6B632099: 0x0d0b0)
        0x0d250 // 2100
      ],

      // \u5929\u5E72\u5730\u652F
      gan: ['\u7532', '\u4E59', '\u4E19', '\u4E01', '\u620A', '\u5DF1', '\u5E9A', '\u8F9B', '\u58EC', '\u7678'],
      zhi: ['\u5B50', '\u4E11', '\u5BC5', '\u536F', '\u8FB0', '\u5DF3', '\u5348', '\u672A', '\u7533', '\u9149', '\u620C', '\u4EA5'],

      // \u519C\u5386\u6708\u4EFD
      months: ['\u6B63', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D', '\u4E03', '\u516B', '\u4E5D', '\u5341', '\u51AC', '\u814A'],

      // \u519C\u5386\u65E5\u671F
      days: ['\u521D\u4E00', '\u521D\u4E8C', '\u521D\u4E09', '\u521D\u56DB', '\u521D\u4E94', '\u521D\u516D', '\u521D\u4E03', '\u521D\u516B', '\u521D\u4E5D', '\u521D\u5341',
             '\u5341\u4E00', '\u5341\u4E8C', '\u5341\u4E09', '\u5341\u56DB', '\u5341\u4E94', '\u5341\u516D', '\u5341\u4E03', '\u5341\u516B', '\u5341\u4E5D', '\u4E8C\u5341',
             '\u5EFF\u4E00', '\u5EFF\u4E8C', '\u5EFF\u4E09', '\u5EFF\u56DB', '\u5EFF\u4E94', '\u5EFF\u516D', '\u5EFF\u4E03', '\u5EFF\u516B', '\u5EFF\u4E5D', '\u4E09\u5341'],

      // \u83B7\u53D6\u519C\u5386\u5E74\u5929\u6570
      lunarYearDays: function(year) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) {
          sum += (this.lunarInfo[year - 1900] & i) ? 1 : 0;
        }
        return sum + this.leapDays(year);
      },

      // \u83B7\u53D6\u95F0\u6708\u5929\u6570
      leapDays: function(year) {
        if (this.leapMonth(year)) {
          return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
      },

      // \u83B7\u53D6\u95F0\u6708\u6708\u4EFD
      leapMonth: function(year) {
        return this.lunarInfo[year - 1900] & 0xf;
      },

      // \u83B7\u53D6\u519C\u5386\u6708\u5929\u6570
      monthDays: function(year, month) {
        return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
      },

      // \u516C\u5386\u8F6C\u519C\u5386
      solar2lunar: function(year, month, day) {
        if (year < 1900 || year > 2100) return null;

        const baseDate = Date.UTC(1900, 0, 31);
        const objDate = Date.UTC(year, month - 1, day);
        //let offset = Math.floor((objDate - baseDate) / 86400000);
        let offset = Math.round((objDate - baseDate) / 86400000);


        let temp = 0;
        let lunarYear = 1900;

        for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
          temp = this.lunarYearDays(lunarYear);
          offset -= temp;
        }

        if (offset < 0) {
          offset += temp;
          lunarYear--;
        }

        let lunarMonth = 1;
        let leap = this.leapMonth(lunarYear);
        let isLeap = false;

        for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
          if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
            --lunarMonth;
            isLeap = true;
            temp = this.leapDays(lunarYear);
          } else {
            temp = this.monthDays(lunarYear, lunarMonth);
          }

          if (isLeap && lunarMonth === (leap + 1)) isLeap = false;
          offset -= temp;
        }

        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
          if (isLeap) {
            isLeap = false;
          } else {
            isLeap = true;
            --lunarMonth;
          }
        }

        if (offset < 0) {
          offset += temp;
          --lunarMonth;
        }

        const lunarDay = offset + 1;

        // \u751F\u6210\u519C\u5386\u5B57\u7B26\u4E32
        const ganIndex = (lunarYear - 4) % 10;
        const zhiIndex = (lunarYear - 4) % 12;
        const yearStr = this.gan[ganIndex] + this.zhi[zhiIndex] + '\u5E74';
        const monthStr = (isLeap ? '\u95F0' : '') + this.months[lunarMonth - 1] + '\u6708';
        const dayStr = this.days[lunarDay - 1];

        return {
          year: lunarYear,
          month: lunarMonth,
          day: lunarDay,
          isLeap: isLeap,
          yearStr: yearStr,
          monthStr: monthStr,
          dayStr: dayStr,
          fullStr: yearStr + monthStr + dayStr
        };
      }
    };
	

// \u65B0\u589E\u4FEE\u6539\uFF0C\u519C\u5386\u8F6C\u516C\u5386\uFF08\u7B80\u5316\uFF0C\u9002\u75281900-2100\u5E74\uFF09
function lunar2solar(lunar) {
  for (let y = lunar.year - 1; y <= lunar.year + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const date = createLocalCalendarDate({ year: y, month: m, day: d });
        if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) continue;
        const l = lunarCalendar.solar2lunar(y, m, d);
        if (
          l &&
          l.year === lunar.year &&
          l.month === lunar.month &&
          l.day === lunar.day &&
          l.isLeap === lunar.isLeap
        ) {
          return { year: y, month: m, day: d };
        }
      }
    }
  }
  return null;
}

// \u65B0\u589E\u4FEE\u6539\uFF0C\u519C\u5386\u52A0\u5468\u671F\uFF0C\u524D\u671F\u7248\u672C
function addLunarPeriod(lunar, periodValue, periodUnit) {
  let { year, month, day, isLeap } = lunar;
  if (periodUnit === 'year') {
    year += periodValue;
    const leap = lunarCalendar.leapMonth(year);
    if (isLeap && leap === month) {
      isLeap = true;
    } else {
      isLeap = false;
    }
  } else if (periodUnit === 'month') {
    let totalMonths = (year - 1900) * 12 + (month - 1) + periodValue;
    year = Math.floor(totalMonths / 12) + 1900;
    month = (totalMonths % 12) + 1;
    const leap = lunarCalendar.leapMonth(year);
    if (isLeap && leap === month) {
      isLeap = true;
    } else {
      isLeap = false;
    }
  } else if (periodUnit === 'day') {
    const solar = lunar2solar(lunar);
    const date = createLocalCalendarDate({ year: solar.year, month: solar.month, day: solar.day });
    date.setDate(date.getDate() + periodValue);
    return lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  let maxDay = isLeap
    ? lunarCalendar.leapDays(year)
    : lunarCalendar.monthDays(year, month);
  let targetDay = Math.min(day, maxDay);
  while (targetDay > 0) {
    let solar = lunar2solar({ year, month, day: targetDay, isLeap });
    if (solar) {
      return { year, month, day: targetDay, isLeap };
    }
    targetDay--;
  }
  return { year, month, day, isLeap };
}

// \u524D\u7AEF\u7248\u672C\u7684 lunarBiz \u5BF9\u8C61
const lunarBiz = {
  // \u519C\u5386\u52A0\u5468\u671F\uFF0C\u8FD4\u56DE\u65B0\u7684\u519C\u5386\u65E5\u671F\u5BF9\u8C61
  addLunarPeriod(lunar, periodValue, periodUnit) {
    return addLunarPeriod(lunar, periodValue, periodUnit);
  },
  // \u519C\u5386\u8F6C\u516C\u5386\uFF08\u904D\u5386\u6CD5\uFF0C\u9002\u75281900-2100\u5E74\uFF09
  lunar2solar(lunar) {
    return lunar2solar(lunar);
  },
  // \u8DDD\u79BB\u519C\u5386\u65E5\u671F\u8FD8\u6709\u591A\u5C11\u5929
  daysToLunar(lunar) {
    const solar = lunarBiz.lunar2solar(lunar);
    const date = createLocalCalendarDate({ year: solar.year, month: solar.month, day: solar.day });
    const now = createLocalCalendarDate(getTodayDateStringInTimezone(globalTimezone));
    return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  }
};

    // \u519C\u5386\u663E\u793A\u76F8\u5173\u51FD\u6570
    function updateLunarDisplay(dateInputId, lunarDisplayId) {
      const dateInput = document.getElementById(dateInputId);
      const lunarDisplay = document.getElementById(lunarDisplayId);
      const showLunar = document.getElementById('showLunar');

      if (!dateInput || !lunarDisplay) {
        return;
      }

      if (!dateInput.value || !showLunar || !showLunar.checked) {
        lunarDisplay.classList.remove('show');
        return;
      }

      // \u3010\u4FEE\u590D\u3011\u76F4\u63A5\u89E3\u6790\u5B57\u7B26\u4E32 "YYYY-MM-DD"\uFF0C\u907F\u514D new Date() \u5E26\u6765\u7684\u65F6\u533A\u504F\u79FB\u5BFC\u81F4\u65E5\u671F\u5C11\u4E00\u5929
      const parts = dateInput.value.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      const lunar = lunarCalendar.solar2lunar(year, month, day);

      if (lunar) {
        lunarDisplay.textContent = '\u519C\u5386\uFF1A' + lunar.fullStr;
        lunarDisplay.classList.add('show');
      } else {
        lunarDisplay.classList.remove('show');
      }
    }

    function toggleLunarDisplay() {
      const showLunar = document.getElementById('showLunar');
      if (!showLunar) {
        return;
      }
      
      updateLunarDisplay('startDate', 'startDateLunar');
      updateLunarDisplay('expiryDate', 'expiryDateLunar');

      // \u4FDD\u5B58\u7528\u6237\u504F\u597D
      localStorage.setItem('showLunar', showLunar.checked);
    }

    function loadLunarPreference() {
      const showLunar = document.getElementById('showLunar');
      if (!showLunar) {
        return;
      }
      
      const saved = localStorage.getItem('showLunar');
      if (saved !== null) {
        showLunar.checked = saved === 'true';
      } else {
        showLunar.checked = true; // \u9ED8\u8BA4\u663E\u793A
      }
      toggleLunarDisplay();
    }

    function handleListLunarToggle() {
      const listShowLunar = document.getElementById('listShowLunar');
      // \u4FDD\u5B58\u7528\u6237\u504F\u597D
      localStorage.setItem('showLunar', listShowLunar.checked);
      // \u91CD\u65B0\u52A0\u8F7D\u8BA2\u9605\u5217\u8868\u4EE5\u5E94\u7528\u519C\u5386\u663E\u793A\u8BBE\u7F6E
      renderSubscriptionTable();
    }

    function showToast(message, type = 'success', duration) {
      if (!duration) duration = type === 'error' ? 6000 : type === 'warning' ? 4500 : 3000;
      const container = document.getElementById('toast-container');
      // \u9650\u5236\u6700\u591A 5 \u4E2A toast
      while (container.children.length >= 5) container.removeChild(container.firstChild);

      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span class="toast-msg"></span></div><span class="toast-close" onclick="this.parentElement.remove()">&times;</span>';
      toast.querySelector('.toast-msg').textContent = message;
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 50);
      const timer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 300);
      }, duration);
      toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
    }

    function showFieldError(fieldId, message) {
      const field = document.getElementById(fieldId);
      let errorDiv = field.parentElement ? field.parentElement.querySelector('.error-message') : null;
      if (!errorDiv) {
        errorDiv = document.querySelector('.error-message[data-for="' + fieldId + '"]');
      }
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        field.classList.add('border-red-500');
      }
    }

    function clearFieldErrors() {
      document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
      });
      document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
      });
    }

    function normalizeDateString(value) {
      if (!value) return '';
      const raw = String(value).trim();
      if (!raw) return '';

      const directMatch = raw.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})(?:$|T)/);
      if (directMatch) {
        const year = Number(directMatch[1]);
        const month = Number(directMatch[2]);
        const day = Number(directMatch[3]);
        const parsed = new Date(year, month - 1, day);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
          return \`\${year}-\${String(month).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
        }
      }

      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return \`\${parsed.getFullYear()}-\${String(parsed.getMonth() + 1).padStart(2, '0')}-\${String(parsed.getDate()).padStart(2, '0')}\`;
      }

      return '';
    }

    function pad2(value) {
      return String(value).padStart(2, '0');
    }

    function parseCalendarDateParts(value) {
      const normalized = normalizeDateString(value);
      if (!normalized) return null;
      const [year, month, day] = normalized.split('-').map(Number);
      return { year, month, day };
    }

    function createUtcCalendarDate(value) {
      const parts = typeof value === 'string' ? parseCalendarDateParts(value) : value;
      if (!parts) return null;
      return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
    }

    function createLocalCalendarDate(value) {
      const parts = typeof value === 'string' ? parseCalendarDateParts(value) : value;
      if (!parts) return null;
      return new Date(parts.year, parts.month - 1, parts.day);
    }

    function formatUtcCalendarDate(date) {
      if (!(date instanceof Date) || isNaN(date.getTime())) return '';
      return \`\${date.getUTCFullYear()}-\${pad2(date.getUTCMonth() + 1)}-\${pad2(date.getUTCDate())}\`;
    }

    function getTimezoneDateParts(date, timezone = globalTimezone, includeTime = false) {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return null;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(includeTime
          ? {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }
          : {})
      });
      const parts = formatter.formatToParts(d);
      const pick = (type) => Number(parts.find((item) => item.type === type)?.value || 0);
      const result = {
        year: pick('year'),
        month: pick('month'),
        day: pick('day')
      };
      if (includeTime) {
        let hour = pick('hour');
        if (hour === 24) hour = 0;
        result.hour = hour;
        result.minute = pick('minute');
        result.second = pick('second');
      }
      return result;
    }

    function formatDateInputInTimezone(value, timezone = globalTimezone) {
      const parts = getTimezoneDateParts(value, timezone);
      if (!parts) return '';
      return \`\${parts.year}-\${pad2(parts.month)}-\${pad2(parts.day)}\`;
    }

    function formatDateInTimezone(value, timezone = globalTimezone, options) {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(
        'zh-CN',
        {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          ...(options || {})
        }
      );
    }

    function formatDateTimeInTimezone(value, timezone = globalTimezone) {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }

    function formatClockTimeInTimezone(value, timezone = globalTimezone) {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('zh-CN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }

    function getTodayDateStringInTimezone(timezone = globalTimezone) {
      return formatDateInputInTimezone(new Date(), timezone);
    }

    function addCalendarPeriodToDateString(value, amount, unit) {
      const date = createUtcCalendarDate(value);
      if (!date) return '';
      if (unit === 'day') {
        date.setUTCDate(date.getUTCDate() + amount);
      } else if (unit === 'month') {
        date.setUTCMonth(date.getUTCMonth() + amount);
      } else if (unit === 'year') {
        date.setUTCFullYear(date.getUTCFullYear() + amount);
      }
      return formatUtcCalendarDate(date);
    }

    function validateForm() {
      clearFieldErrors();
      let isValid = true;

      const name = document.getElementById('name').value.trim();
      if (!name) {
        showFieldError('name', '\u8BF7\u8F93\u5165\u8BA2\u9605\u540D\u79F0');
        isValid = false;
      }

      const periodValue = document.getElementById('periodValue').value;
      if (!periodValue || periodValue < 1) {
        showFieldError('periodValue', '\u5468\u671F\u6570\u503C\u5FC5\u987B\u5927\u4E8E0');
        isValid = false;
      }

      const startDateField = document.getElementById('startDate');
      const expiryDateField = document.getElementById('expiryDate');

      if (startDateField) {
        const normalizedStart = normalizeDateString(startDateField.value);
        if (startDateField.value && !normalizedStart) {
          showFieldError('startDate', '\u5F00\u59CB\u65E5\u671F\u683C\u5F0F\u9700\u4E3A YYYY-MM-DD');
          isValid = false;
        } else if (normalizedStart) {
          startDateField.value = normalizedStart;
        }
      }

      const normalizedExpiry = normalizeDateString(expiryDateField ? expiryDateField.value : '');
      if (!normalizedExpiry) {
        showFieldError('expiryDate', '\u5230\u671F\u65E5\u671F\u683C\u5F0F\u9700\u4E3A YYYY-MM-DD');
        isValid = false;
      } else if (expiryDateField) {
        expiryDateField.value = normalizedExpiry;
      }

      const reminderValueField = document.getElementById('reminderValue');
      // \u672C\u6B21\uFF1AreminderValue \u5DF2\u9690\u85CF\uFF0C\u89C4\u5219\u7F16\u8F91\u5668\u66FF\u4EE3\uFF1B\u4FDD\u7559\u515C\u5E95\u6821\u9A8C\u9632\u6B62\u810F\u6570\u636E
      if (reminderValueField && reminderValueField.value !== '' && Number(reminderValueField.value) < 0) {
        showFieldError('reminderValue', '\u63D0\u9192\u503C\u4E0D\u80FD\u4E3A\u8D1F\u6570');
        isValid = false;
      }

      return isValid;
    }

    // \u521B\u5EFA\u5E26\u60AC\u6D6E\u63D0\u793A\u7684\u6587\u672C\u5143\u7D20
    function createHoverText(text, maxLength = 30, className = 'text-sm text-gray-900') {
      if (!text || text.length <= maxLength) {
        return '<div class="' + className + '">' + escapeHtml(text) + '</div>';
      }

      const truncated = escapeHtml(text.substring(0, maxLength)) + '...';
      return '<div class="hover-container">' +
        '<div class="hover-text ' + className + '" data-full-text="' + escapeHtml(text) + '">' +
          truncated +
        '</div>' +
        '<div class="hover-tooltip"></div>' +
      '</div>';
    }

    const categorySeparator = /[\\/,\uFF0C\\s]+/;
    let subscriptionsCache = [];
    let searchDebounceTimer = null;

    function normalizeCategoryTokens(category = '') {
      return category
        .split(categorySeparator)
        .map(token => token.trim())
        .filter(token => token.length > 0);
    }

    function populateCategoryFilter(subscriptions) {
      const select = document.getElementById('categoryFilter');
      if (!select) {
        return;
      }

      const previousValue = select.value;
      const categories = new Set();

      (subscriptions || []).forEach(subscription => {
        normalizeCategoryTokens(subscription.category).forEach(token => categories.add(token));
      });

      const sorted = Array.from(categories).sort((a, b) => a.localeCompare(b, 'zh-CN'));
      select.innerHTML = '';

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '\u5168\u90E8\u5206\u7C7B';
      select.appendChild(defaultOption);

      sorted.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });

      if (previousValue && sorted.map(item => item.toLowerCase()).includes(previousValue.toLowerCase())) {
        select.value = previousValue;
      } else {
        select.value = '';
      }
    }

    function formatReminderRulesSummary(rules) {
      const list = Array.isArray(rules) ? rules.filter(function (r) { return r && r.isEnabled !== false; }) : [];
      if (list.length === 0) return '';

      var parts = [];
      var beforeDays = list
        .filter(function (r) { return r.type === 'before_expiry' && r.unit !== 'hours'; })
        .map(function (r) { return r.value; })
        .filter(function (v) { return Number.isFinite(v); })
        .sort(function (a, b) { return b - a; });
      var beforeHours = list
        .filter(function (r) { return r.type === 'before_expiry' && r.unit === 'hours'; })
        .map(function (r) { return r.value; })
        .filter(function (v) { return Number.isFinite(v); })
        .sort(function (a, b) { return b - a; });

      if (beforeDays.length > 0) parts.push('\u63D0\u524D ' + beforeDays.join('/') + ' \u5929');
      if (beforeHours.length > 0) parts.push('\u63D0\u524D ' + beforeHours.join('/') + ' \u5C0F\u65F6');
      if (list.some(function (r) { return r.type === 'on_expiry' || (r.type === 'before_expiry' && r.value === 0); })) {
        parts.push('\u5230\u671F\u5F53\u5929');
      }
      var after = list.find(function (r) { return r.type === 'after_expiry'; });
      if (after) {
        var interval = after.repeatInterval && after.repeatInterval > 0 ? after.repeatInterval : 24;
        parts.push('\u5230\u671F\u540E\u6BCF ' + interval + ' \u5C0F\u65F6');
      }
      return parts.join(' \xB7 ');
    }

    function getReminderSettings(subscription) {
      // \u4F18\u5148\u4F7F\u7528\u771F\u5B9E\u591A\u89C4\u5219\uFF08\u5217\u8868 API \u5DF2\u9644\u5E26 reminderRules / reminderRulesSummary\uFF09
      // \u6CE8\u610F\uFF1A\u6574\u51FD\u6570\u7EDF\u4E00\u7528 var\uFF0C\u907F\u514D var/let \u540C\u540D\u91CD\u590D\u58F0\u660E\u5BFC\u81F4\u6574\u9875\u811A\u672C\u4E2D\u65AD
      var rules = Array.isArray(subscription.reminderRules) ? subscription.reminderRules : null;
      var summary = subscription.reminderRulesSummary || (rules ? formatReminderRulesSummary(rules) : '');
      var unit;
      var value;

      if (summary) {
        var enabled = rules ? rules.filter(function (r) { return r && r.isEnabled !== false; }) : [];
        var beforeDays = enabled
          .filter(function (r) { return r.type === 'before_expiry' && r.unit !== 'hours'; })
          .map(function (r) { return Number(r.value); })
          .filter(function (v) { return Number.isFinite(v); });
        var beforeHours = enabled
          .filter(function (r) { return r.type === 'before_expiry' && r.unit === 'hours'; })
          .map(function (r) { return Number(r.value); })
          .filter(function (v) { return Number.isFinite(v); });
        var maxDay = beforeDays.length ? Math.max.apply(null, beforeDays) : null;
        var maxHour = beforeHours.length ? Math.max.apply(null, beforeHours) : null;
        unit = maxHour != null && (maxDay == null || maxHour / 24 > maxDay) ? 'hour' : 'day';
        value = unit === 'hour'
          ? (maxHour != null ? maxHour : 0)
          : (maxDay != null ? maxDay : (enabled.some(function (r) { return r.type === 'on_expiry'; }) ? 0 : 7));
        return { unit: unit, value: value, displayText: summary };
      }

      var fallbackDays = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
      unit = subscription.reminderUnit || '';
      value = subscription.reminderValue;

      if (unit !== 'hour') {
        unit = 'day';
      }

      if (unit === 'hour' && (value === undefined || value === null || isNaN(value))) {
        value = subscription.reminderHours !== undefined ? subscription.reminderHours : 0;
      }

      if (value === undefined || value === null || isNaN(value)) {
        value = fallbackDays;
      }

      value = Number(value);

      return {
        unit: unit,
        value: value,
        displayText: unit === 'hour' ? '\u63D0\u524D' + value + '\u5C0F\u65F6' : '\u63D0\u524D' + value + '\u5929'
      };
    }

    function attachHoverListeners() {
      function positionTooltip(element, tooltip) {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = 100;
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let top = rect.bottom + scrollTop + 8;
        let left = rect.left;

        if (rect.bottom + tooltipHeight > viewportHeight) {
          top = rect.top + scrollTop - tooltipHeight - 8;
          tooltip.style.transform = 'translateY(10px)';
          tooltip.classList.add('tooltip-above');
        } else {
          tooltip.style.transform = 'translateY(-10px)';
          tooltip.classList.remove('tooltip-above');
        }

        const maxLeft = window.innerWidth - 320 - 20;
        if (left > maxLeft) {
          left = maxLeft;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      }

      document.querySelectorAll('.notes-text').forEach(notesElement => {
        const fullNotes = notesElement.getAttribute('data-full-notes');
        const tooltip = notesElement.parentElement.querySelector('.notes-tooltip');

        if (fullNotes && tooltip) {
          notesElement.addEventListener('mouseenter', () => {
            tooltip.textContent = fullNotes;
            positionTooltip(notesElement, tooltip);
            tooltip.classList.add('show');
          });

          notesElement.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
          });

          window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
              tooltip.classList.remove('show');
            }
          }, { passive: true });
        }
      });

      document.querySelectorAll('.hover-text').forEach(hoverElement => {
        const fullText = hoverElement.getAttribute('data-full-text');
        const tooltip = hoverElement.parentElement.querySelector('.hover-tooltip');

        if (fullText && tooltip) {
          hoverElement.addEventListener('mouseenter', () => {
            tooltip.textContent = fullText;
            positionTooltip(hoverElement, tooltip);
            tooltip.classList.add('show');
          });

          hoverElement.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
          });

          window.addEventListener('scroll', () => {
            if (tooltip.classList.contains('show')) {
              tooltip.classList.remove('show');
            }
          }, { passive: true });
        }
      });
    }

    function getCurrencySymbol(currency) {
      const currencySymbols = {
        'CNY': '\xA5', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$',
        'JPY': '\xA5', 'EUR': '\u20AC', 'GBP': '\xA3', 'KRW': '\u20A9', 'TRY': '\u20BA'
      };
      return currencySymbols[currency] || '\xA5';
    }

    function renderSubscriptionTable() {
      const tbody = document.getElementById('subscriptionsBody');
      if (!tbody) {
        return;
      }

      const listShowLunar = document.getElementById('listShowLunar');
      const showLunar = listShowLunar ? listShowLunar.checked : false;
      const searchInput = document.getElementById('searchKeyword');
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const categorySelect = document.getElementById('categoryFilter');
      const selectedCategory = categorySelect ? categorySelect.value.trim().toLowerCase() : '';
      const modeSelect = document.getElementById('modeFilter');
      const selectedMode = modeSelect ? modeSelect.value : '';
      const statusSelect = document.getElementById('statusFilter');
      const selectedStatus = statusSelect ? statusSelect.value : '';

      let filtered = Array.isArray(subscriptionsCache) ? [...subscriptionsCache] : [];

      if (selectedCategory) {
        filtered = filtered.filter(subscription =>
          normalizeCategoryTokens(subscription.category).some(token => token.toLowerCase() === selectedCategory)
        );
      }

      if (selectedMode) {
        filtered = filtered.filter(subscription =>
          (subscription.subscriptionMode || 'cycle') === selectedMode
        );
      }

      if (keyword) {
        filtered = filtered.filter(subscription => {
          const haystack = [
            subscription.name,
            subscription.customType,
            subscription.notes,
            subscription.category
          ].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(keyword);
        });
      }

      // \u6E05\u7A7A\u8868\u683C
      tbody.innerHTML = '';

      const currentTime = new Date();
      const currentTimestamp = currentTime.getTime();
      const currentDateInTimezone = createUtcCalendarDate(getTodayDateStringInTimezone(globalTimezone));

      // \u72B6\u6001\u7B5B\u9009\u9700\u8981\u5148\u7B97 daysDiff / soon\uFF0C\u6545\u5728\u6B64\u5904\u8FC7\u6EE4
      if (selectedStatus) {
        filtered = filtered.filter(subscription => {
          const expiryDate = new Date(subscription.expiryDate);
          const expiryDateKey = formatDateInputInTimezone(subscription.expiryDate, globalTimezone);
          const expiryDateInTimezone = createUtcCalendarDate(expiryDateKey);
          const daysDiff = currentDateInTimezone && expiryDateInTimezone
            ? Math.round((expiryDateInTimezone.getTime() - currentDateInTimezone.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          const diffMs = expiryDate.getTime() - currentTimestamp;
          const diffHours = diffMs / (1000 * 60 * 60);
          const reminder = getReminderSettings(subscription);
          const isSoon = reminder.unit === 'hour'
            ? diffHours >= 0 && diffHours <= reminder.value
            : daysDiff >= 0 && daysDiff <= reminder.value;

          if (selectedStatus === 'disabled') return subscription.isActive === false;
          if (subscription.isActive === false) return false;
          if (selectedStatus === 'expired') return daysDiff < 0 || diffMs < 0;
          if (selectedStatus === 'soon') return isSoon && !(daysDiff < 0 || diffMs < 0);
          if (selectedStatus === 'active') return !(daysDiff < 0 || diffMs < 0) && !isSoon;
          return true;
        });
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500"><div>\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u8BA2\u9605</div><button onclick="document.getElementById(\\'searchKeyword\\').value=\\'\\';document.getElementById(\\'clearSearch\\').style.display=\\'none\\';document.getElementById(\\'categoryFilter\\').value=\\'\\';document.getElementById(\\'modeFilter\\').value=\\'\\';document.getElementById(\\'statusFilter\\').value=\\'\\';renderSubscriptionTable();" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800"><i class="fas fa-undo mr-1"></i>\u6E05\u9664\u7B5B\u9009\u6761\u4EF6</button></td></tr>';
        return;
      }

      filtered.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      // \u4F7F\u7528 DocumentFragment \u8FDB\u884C\u6279\u91CF\u63D2\u5165\uFF0C\u51CF\u5C11\u9875\u9762\u91CD\u7ED8\uFF08\u79FB\u52A8\u7AEF\u6027\u80FD\u5173\u952E\uFF09
      const fragment = document.createDocumentFragment();

      filtered.forEach(subscription => {
        const row = document.createElement('tr');
        row.className = subscription.isActive === false ? 'hover:bg-gray-50 bg-gray-100' : 'hover:bg-gray-50';

        const calendarTypeHtml = subscription.useLunar
          ? '<div class="text-xs text-purple-600 mt-1">\u65E5\u5386\u7C7B\u578B\uFF1A\u519C\u5386</div>'
          : '<div class="text-xs text-gray-600 mt-1">\u65E5\u5386\u7C7B\u578B\uFF1A\u516C\u5386</div>';

        const expiryDate = new Date(subscription.expiryDate);
        const expiryDateKey = formatDateInputInTimezone(subscription.expiryDate, globalTimezone);
        const expiryDateInTimezone = createUtcCalendarDate(expiryDateKey);
        const daysDiff = currentDateInTimezone && expiryDateInTimezone
          ? Math.round((expiryDateInTimezone.getTime() - currentDateInTimezone.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const diffMs = expiryDate.getTime() - currentTimestamp;
        const diffHours = diffMs / (1000 * 60 * 60);

        const reminder = getReminderSettings(subscription);
        const isSoon = reminder.unit === 'hour'
          ? diffHours >= 0 && diffHours <= reminder.value
          : daysDiff >= 0 && daysDiff <= reminder.value;

        let statusHtml = '';
        if (!subscription.isActive) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-gray-500"><i class="fas fa-pause-circle mr-1"></i>\u5DF2\u505C\u7528</span>';
        } else if (daysDiff < 0 || diffMs < 0) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500"><i class="fas fa-exclamation-circle mr-1"></i>\u5DF2\u8FC7\u671F</span>';
        } else if (isSoon) {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-yellow-500"><i class="fas fa-exclamation-triangle mr-1"></i>\u5373\u5C06\u5230\u671F</span>';
        } else {
          statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-green-500"><i class="fas fa-check-circle mr-1"></i>\u6B63\u5E38</span>';
        }

        let periodText = '';
        if (subscription.periodValue && subscription.periodUnit) {
          const unitMap = { day: '\u5929', month: '\u6708', year: '\u5E74' };
          let periodLabel = subscription.periodValue + ' ' + (unitMap[subscription.periodUnit] || subscription.periodUnit);
          if (subscription.periodUnit === 'month' && Number(subscription.periodValue) === 3) periodLabel = '\u5B63\u5EA6';
          if (subscription.periodUnit === 'month' && Number(subscription.periodValue) === 6) periodLabel = '\u534A\u5E74';
          if (subscription.endOfMonth && !subscription.useLunar) periodLabel += ' \xB7 \u6708\u672B';
          periodText = periodLabel;
        }

        const autoRenewIcon = subscription.autoRenew !== false
          ? '<i class="fas fa-sync-alt text-blue-500 mr-1" title="\u81EA\u52A8\u7EED\u8BA2"></i>'
          : '<i class="fas fa-ban text-gray-400 mr-1" title="\u4E0D\u81EA\u52A8\u7EED\u8BA2"></i>';

        let lunarExpiryText = '';
        let startLunarText = '';
        
        // \u519C\u5386\u8BA1\u7B97\u53EA\u5728\u9700\u8981\u65F6\u6267\u884C\uFF0C\u4E14\u7B80\u5316\u903B\u8F91
        if (showLunar) {
          const getLunarParts = (dateStr) => {
            if (!dateStr) return null;
            const datePart = formatDateInputInTimezone(dateStr, globalTimezone);
            const parts = datePart.split('-');
            if (parts.length !== 3) return null;
            return {
              y: parseInt(parts[0], 10),
              m: parseInt(parts[1], 10),
              d: parseInt(parts[2], 10)
            };
          };

          const expiryParts = getLunarParts(subscription.expiryDate);
          if (expiryParts) {
             const lunarExpiry = lunarCalendar.solar2lunar(expiryParts.y, expiryParts.m, expiryParts.d);
             lunarExpiryText = lunarExpiry ? lunarExpiry.fullStr : '';
          }

          if (subscription.startDate) {
            const startParts = getLunarParts(subscription.startDate);
            if (startParts) {
               const lunarStart = lunarCalendar.solar2lunar(startParts.y, startParts.m, startParts.d);
               startLunarText = lunarStart ? lunarStart.fullStr : '';
            }
          }
        }

        let notesHtml = '';
        if (subscription.notes) {
          const notes = subscription.notes;
          if (notes.length > 50) {
            const truncatedNotes = escapeHtml(notes.substring(0, 50)) + '...';
            notesHtml = '<div class="notes-container">' +
              '<div class="notes-text text-xs text-gray-500" data-full-notes="' + escapeHtml(notes).replace(/"/g, '&quot;') + '">' +
                truncatedNotes +
              '</div>' +
              '<div class="notes-tooltip"></div>' +
            '</div>';
          } else {
            notesHtml = '<div class="text-xs text-gray-500">' + escapeHtml(notes) + '</div>';
          }
        }

        // \u6784\u9020HTML\u5B57\u7B26\u4E32 (\u51CF\u5C11\u4E86\u51FD\u6570\u8C03\u7528)
        const nameHtml = createHoverText(subscription.name, 20, 'text-sm font-medium text-gray-900');
        const typeHtml = createHoverText(subscription.customType || '\u5176\u4ED6', 15, 'text-sm text-gray-900');
        const periodHtml = periodText ? createHoverText('\u5468\u671F: ' + periodText, 20, 'text-xs text-gray-500 mt-1') : '';
        const modeLabel = (subscription.subscriptionMode === 'reset') ? '\u5230\u671F\u91CD\u7F6E' : '\u5FAA\u73AF\u8BA2\u9605';
        const modeIconClass = (subscription.subscriptionMode === 'reset') ? 'fa-hourglass-end' : 'fa-sync';
        const modeColorClass = (subscription.subscriptionMode === 'reset') ? 'text-orange-500' : 'text-blue-500';
        const modeHtml = '<div class="text-xs ' + modeColorClass + ' mt-1"><i class="fas ' + modeIconClass + ' mr-1"></i>' + modeLabel + '</div>';

        const categoryTokens = normalizeCategoryTokens(subscription.category);
        const categoryHtml = categoryTokens.length
          ? '<div class="flex flex-wrap gap-2 mt-2">' + categoryTokens.map(cat =>
              '<span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full"><i class="fas fa-tag mr-1"></i>' + escapeHtml(cat) + '</span>'
            ).join('') + '</div>'
          : '';

        // \u590D\u7528\u5916\u90E8\u7684 format \u5BF9\u8C61
        const expiryDateText = formatDateInTimezone(subscription.expiryDate, globalTimezone);
        const lunarHtml = lunarExpiryText ? createHoverText('\u519C\u5386: ' + lunarExpiryText, 25, 'text-xs text-blue-600 mt-1') : '';

        let daysLeftText = '';
        if (diffMs < 0) {
          const absDays = Math.abs(daysDiff);
          if (absDays >= 1) {
            daysLeftText = '\u5DF2\u8FC7\u671F' + absDays + '\u5929';
          } else {
            const absHours = Math.ceil(Math.abs(diffHours));
            daysLeftText = '\u5DF2\u8FC7\u671F' + absHours + '\u5C0F\u65F6';
          }
        } else if (daysDiff >= 1) {
          daysLeftText = '\u8FD8\u5269' + daysDiff + '\u5929';
        } else {
          const hoursLeft = Math.max(0, Math.ceil(diffHours));
          daysLeftText = hoursLeft > 0 ? '\u7EA6 ' + hoursLeft + ' \u5C0F\u65F6\u540E\u5230\u671F' : '\u5373\u5C06\u5230\u671F';
        }

        const startDateText = subscription.startDate
          ? '\u5F00\u59CB: ' + formatDateInTimezone(subscription.startDate, globalTimezone) + (startLunarText ? ' (' + startLunarText + ')' : '')
          : '';
        const startDateHtml = startDateText ? createHoverText(startDateText, 30, 'text-xs text-gray-500 mt-1') : '';

        const reminderHtml = '<div class="text-sm text-gray-900"><i class="fas fa-bell mr-1 text-indigo-500"></i>' +
          reminder.displayText + '</div>' +
          '<div class="text-xs text-gray-400 mt-1">\u7CBE\u786E\u65E5\u89E6\u53D1</div>';

        const currencySymbols = {
          'CNY': '\xA5', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
          'JPY': '\xA5', 'EUR': '\u20AC', 'GBP': '\xA3', 'KRW': '\u20A9', 'TRY': '\u20BA'
        };
        const currencySymbol = currencySymbols[subscription.currency] || '\xA5';

        const hasAmount = subscription.amount !== null && subscription.amount !== undefined && !Number.isNaN(Number(subscription.amount));
        const amountHtml = hasAmount
          ? '<div class="flex items-center gap-1">' +
              '<span class="text-xs text-gray-500 font-bold">' + currencySymbol + '</span>' +
              '<span class="text-sm font-medium text-gray-900">' + Number(subscription.amount).toFixed(2) + '</span>' +
            '</div>'
          : '<span class="text-xs text-gray-400">\u672A\u8BBE\u7F6E</span>';

        row.innerHTML =
          '<td data-label="\u540D\u79F0" class="px-4 py-3"><div class="td-content-wrapper">' +
            nameHtml +
            notesHtml +
          '</div></td>' +
          '<td data-label="\u7C7B\u578B" class="px-4 py-3"><div class="td-content-wrapper space-y-1">' +
            '<div class="flex items-center gap-1">' +
              '<i class="fas fa-layer-group text-gray-400"></i>' +
              typeHtml +
            '</div>' +
            (periodHtml ? '<div class="flex items-center gap-1">' + autoRenewIcon + periodHtml + '</div>' : '') +
            modeHtml +
            categoryHtml +
            calendarTypeHtml +
          '</div></td>' +
          '<td data-label="\u5230\u671F" class="px-4 py-3"><div class="td-content-wrapper">' +
            '<div class="text-sm text-gray-900">' + expiryDateText + '</div>' +
            lunarHtml +
            '<div class="text-xs text-gray-500 mt-1">' + daysLeftText + '</div>' +
            startDateHtml +
          '</div></td>' +
          '<td data-label="\u91D1\u989D" class="px-4 py-3"><div class="td-content-wrapper">' +
            amountHtml +
          '</div></td>' +
          '<td data-label="\u63D0\u9192" class="px-4 py-3"><div class="td-content-wrapper">' +
            reminderHtml +
          '</div></td>' +
          '<td data-label="\u72B6\u6001" class="px-4 py-3"><div class="td-content-wrapper">' + statusHtml + '</div></td>' +
          '<td data-label="\u64CD\u4F5C" class="px-4 py-3">' +
            '<div class="action-buttons-wrapper">' +
              '<button class="edit btn-primary text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-edit mr-1"></i>\u7F16\u8F91</button>' +
              '<button class="clone btn-clone text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" title="\u514B\u9686\u4E3A\u65B0\u8BA2\u9605"><i class="fas fa-copy mr-1"></i>\u514B\u9686</button>' +
              '<button class="view-history btn-history text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" title="\u67E5\u770B\u652F\u4ED8\u5386\u53F2"><i class="fas fa-history mr-1"></i>\u5386\u53F2</button>' +
              '<button class="test-notify btn-info text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-paper-plane mr-1"></i>\u6D4B\u8BD5</button>' +
              '<button class="renew-now btn-success text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" title="\u7ACB\u5373\u7EED\u8BA2\u4E00\u4E2A\u5468\u671F"><i class="fas fa-sync-alt mr-1"></i>\u7EED\u8BA2</button>' +
              '<button class="delete btn-danger text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '"><i class="fas fa-trash-alt mr-1"></i>\u5220\u9664</button>' +
              (subscription.isActive
                ? '<button class="toggle-status btn-warning text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" data-action="deactivate"><i class="fas fa-pause-circle mr-1"></i>\u505C\u7528</button>'
                : '<button class="toggle-status btn-success text-white px-2 py-1 rounded text-xs whitespace-nowrap" data-id="' + subscription.id + '" data-action="activate"><i class="fas fa-play-circle mr-1"></i>\u542F\u7528</button>') +
            '</div>' +
          '</td>';

        fragment.appendChild(row);
      });

      tbody.appendChild(fragment);
      document.querySelectorAll('.edit').forEach(button => {
        button.addEventListener('click', editSubscription);
      });

      document.querySelectorAll('.clone').forEach(button => {
        button.addEventListener('click', cloneSubscription);
      });

      document.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', deleteSubscription);
      });

      document.querySelectorAll('.toggle-status').forEach(button => {
        button.addEventListener('click', toggleSubscriptionStatus);
      });

      document.querySelectorAll('.test-notify').forEach(button => {
        button.addEventListener('click', testSubscriptionNotification);
      });

      document.querySelectorAll('.renew-now').forEach(button => {
        button.addEventListener('click', renewSubscriptionNow);
      });

      document.querySelectorAll('.view-history').forEach(button => {
        button.addEventListener('click', viewPaymentHistory);
      });

      if (window.matchMedia('(hover: hover)').matches) {
          attachHoverListeners();
      }
    }

    const searchInput = document.getElementById('searchKeyword');
    if (searchInput) {
      const clearBtn = document.getElementById('clearSearch');
      searchInput.addEventListener('input', () => {
        clearBtn.style.display = searchInput.value ? '' : 'none';
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => renderSubscriptionTable(), 200);
      });
    }

    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) {
      categorySelect.addEventListener('change', () => renderSubscriptionTable());
    }

    const modeSelect = document.getElementById('modeFilter');
    if (modeSelect) {
      modeSelect.addEventListener('change', () => renderSubscriptionTable());
    }

    const statusSelect = document.getElementById('statusFilter');
    if (statusSelect) {
      statusSelect.addEventListener('change', () => renderSubscriptionTable());
    }

    const listShowLunar = document.getElementById('listShowLunar');
    if (listShowLunar) {
      listShowLunar.addEventListener('change', handleListLunarToggle);
    }

    // \u83B7\u53D6\u6240\u6709\u8BA2\u9605\u5E76\u6309\u5230\u671F\u65F6\u95F4\u6392\u5E8F
    async function loadSubscriptions(showLoading = true) {
      try {
        const listShowLunar = document.getElementById('listShowLunar');
        const saved = localStorage.getItem('showLunar');
        if (listShowLunar) {
          if (saved !== null) {
            listShowLunar.checked = saved === 'true';
          } else {
            listShowLunar.checked = true;
          }
        }

        const tbody = document.getElementById('subscriptionsBody');
        if (tbody && showLoading) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>\u52A0\u8F7D\u4E2D...</td></tr>';
        }

        const response = await apiFetch('/api/subscriptions');
        const data = await response.json();

        subscriptionsCache = Array.isArray(data) ? data : [];
        populateCategoryFilter(subscriptionsCache);
        renderSubscriptionTable();
      } catch (error) {
        console.error('\u52A0\u8F7D\u8BA2\u9605\u5931\u8D25:', error);
        const tbody = document.getElementById('subscriptionsBody');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5</td></tr>';
        }
        showToast('\u52A0\u8F7D\u8BA2\u9605\u5217\u8868\u5931\u8D25', 'error');
      }
    }
    
    async function testSubscriptionNotification(e) {
        const button = e.target.closest('button');
        if (!button) {
          showToast('\u672A\u627E\u5230\u6D4B\u8BD5\u6309\u94AE\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5', 'error');
          return;
        }

        const id = button.dataset.id;
        if (!id) {
          showToast('\u8BA2\u9605 ID \u7F3A\u5931\uFF0C\u65E0\u6CD5\u53D1\u9001\u6D4B\u8BD5\u901A\u77E5', 'error');
          return;
        }

        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>\u53D1\u9001\u4E2D';
        button.disabled = true;

        try {
            const response = await apiFetch('/api/subscriptions/' + id + '/test-notify', { method: 'POST' });
            let result = null;
            try {
              result = await response.json();
            } catch (_) {
              result = { success: false, message: '\u670D\u52A1\u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94' };
            }

            if (response.ok && result.success) {
                showToast(result.message || '\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u6210\u529F', 'success');
            } else {
                const errorMessage = (result && result.message) ? result.message : ('HTTP ' + response.status);
                showToast('\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u5931\u8D25: ' + errorMessage, 'error', 4500);
            }
        } catch (error) {
            console.error('\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25:', error);
            showToast('\u53D1\u9001\u6D4B\u8BD5\u901A\u77E5\u65F6\u53D1\u751F\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5', 'error');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }

    async function renewSubscriptionNow(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;

        try {
            const response = await apiFetch('/api/subscriptions/' + id);
            const subscription = await response.json();
            showRenewFormModal(subscription);
        } catch (error) {
            console.error('\u83B7\u53D6\u8BA2\u9605\u4FE1\u606F\u5931\u8D25:', error);
            showToast('\u83B7\u53D6\u8BA2\u9605\u4FE1\u606F\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
        }
    }

    function showRenewFormModal(subscription) {
        const today = getTodayDateStringInTimezone(globalTimezone);
        
        // \u83B7\u53D6\u5F53\u524D\u5230\u671F\u65E5\u7684\u663E\u793A\u6587\u672C
        let currentExpiryDisplay = '\u65E0';
        if (subscription.expiryDate) {
            const datePart = formatDateInputInTimezone(subscription.expiryDate, globalTimezone);
            currentExpiryDisplay = datePart;
            if (subscription.useLunar) {
                try {
                    const parts = datePart.split('-');
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    const d = parseInt(parts[2], 10);
                    const lunarObj = lunarCalendar.solar2lunar(y, m, d);
                    if (lunarObj) {
                        currentExpiryDisplay += ' (\u519C\u5386: ' + lunarObj.fullStr + ')';
                    }
                } catch (e) {
                    console.error('\u519C\u5386\u8BA1\u7B97\u5931\u8D25', e);
                }
            }
        }

        const defaultAmount = subscription.amount !== null && subscription.amount !== undefined ? subscription.amount : 0;
        
        // \u83B7\u53D6\u52A8\u6001\u8D27\u5E01\u7B26\u53F7
        const currencySymbols = {
          'CNY': '\xA5', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
          'JPY': '\xA5', 'EUR': '\u20AC', 'GBP': '\xA3', 'KRW': '\u20A9', 'TRY': '\u20BA'
        };
        const currency = subscription.currency || 'CNY';
        const symbol = currencySymbols[currency] || '\xA5';
        const currencyLabel = "(" + currency + " " + symbol + ")";
        
        const lunarBadge = subscription.useLunar ? 
            '<span class="text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 shrink-0">\u519C\u5386\u5468\u671F</span>' : '';

        // \u6784\u5EFA Modal HTML
        const modalHtml = 
            '<div id="renewFormModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closeRenewFormModal(event)">' +
            '    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">' +
            '        <div class="flex justify-between items-center pb-3 border-b">' +
            '            <h3 class="text-xl font-semibold text-gray-900">' +
            '                <i class="fas fa-sync-alt mr-2"></i>\u624B\u52A8\u7EED\u8BA2 - ' + escapeHtml(subscription.name) +
            '            </h3>' +
            '            <button onclick="closeRenewFormModal()" class="text-gray-400 hover:text-gray-500">' +
            '                <i class="fas fa-times text-2xl"></i>' +
            '            </button>' +
            '        </div>' +
            '' +
            '        <form id="renewForm" class="mt-4 space-y-4">' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">\u652F\u4ED8\u65E5\u671F</label>' +
            '                <input type="date" id="renewPaymentDate" value="' + today + '"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">\u652F\u4ED8\u91D1\u989D ' + currencyLabel + '</label>' +
            '                <input type="number" id="renewAmount" value="' + defaultAmount + '" step="0.01" min="0"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div>' +
            '                <div class="flex justify-between items-center mb-1">' +
            '                    <label class="block text-sm font-medium text-gray-700">\u7EED\u8BA2\u5468\u671F\u6570</label>' +
            '                    ' + lunarBadge + 
            '                </div>' +
            '                <div class="flex items-center space-x-2">' +
            '                    <input type="number" id="renewPeriodMultiplier" value="1" min="1" max="120"' +
            '                           class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"' +
            '                           oninput="updateNewExpiryPreview()">' +
            '                    <span class="text-gray-600">\u4E2A</span>' + 
            '                </div>' +
            '                <p class="mt-1 text-xs text-gray-500">\u4E00\u6B21\u6027\u7EED\u8BA2\u591A\u4E2A\u5468\u671F\uFF08\u598212\u4E2A\u6708\uFF09</p>' +
            '            </div>' +
            '' +
            '            <div class="bg-blue-50 rounded-lg p-4 mb-4">' +
            '                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 sm:mb-2">' +
            '                    <span class="text-gray-500 text-sm shrink-0">\u5F53\u524D\u5230\u671F:</span>' +
            '                    <span class="font-medium text-gray-900 text-sm break-words">' + currentExpiryDisplay + '</span>' +
            '                </div>' +
            '                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">' +
            '                    <span class="text-gray-500 text-sm shrink-0">\u65B0\u5230\u671F\u65E5:</span>' +
            '                    <span class="font-medium text-blue-600 text-sm break-words" id="newExpiryPreview">\u8BA1\u7B97\u4E2D...</span>' +
            '                </div>' +
            '            </div>' +
            '' +
            '            <div>' +
            '                <label class="block text-sm font-medium text-gray-700 mb-1">\u5907\u6CE8 (\u53EF\u9009)</label>' +
            '                <input type="text" id="renewNote" placeholder="\u4F8B\u5982\uFF1A\u5E74\u5EA6\u4F18\u60E0\u3001\u4EF7\u683C\u8C03\u6574"' +
            '                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">' +
            '            </div>' +
            '' +
            '            <div class="flex justify-end space-x-3 pt-3">' +
            '                <button type="button" onclick="closeRenewFormModal()"' +
            '                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">' +
            '                    \u53D6\u6D88' +
            '                </button>' +
            '                <button type="submit" id="confirmRenewBtn"' +
            '                        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">' +
            '                    <i class="fas fa-check mr-1"></i>\u786E\u8BA4\u7EED\u8BA2' +
            '                </button>' +
            '            </div>' +
            '        </form>' +
            '    </div>' +
            '</div>';

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.classList.add('overflow-hidden');
        document.getElementById('renewForm').dataset.subscriptionId = subscription.id;
        document.getElementById('renewForm').dataset.subscriptionData = JSON.stringify(subscription);
        updateNewExpiryPreview();
        document.getElementById('renewForm').addEventListener('submit', handleRenewFormSubmit);
        document.getElementById('renewPeriodMultiplier').addEventListener('input', updateNewExpiryPreview);
    }

    function updateNewExpiryPreview() {
        const form = document.getElementById('renewForm');
        if (!form) return;

        const subscription = JSON.parse(form.dataset.subscriptionData);
        const multiplier = parseInt(document.getElementById('renewPeriodMultiplier').value) || 1;

        // \u83B7\u53D6\u57FA\u51C6\u65E5\u671F\uFF0C\u907F\u514D\u76F4\u63A5 new Date() \u7684\u65F6\u533A\u95EE\u9898
        const parts = parseCalendarDateParts(formatDateInputInTimezone(subscription.expiryDate, globalTimezone)) || { year: 2024, month: 1, day: 1 };
        
        if (subscription.useLunar) {
            try {
                // 1. \u8F6C\u4E3A\u519C\u5386\u5BF9\u8C61
                let lunar = lunarCalendar.solar2lunar(parts.year, parts.month, parts.day);
                
                if (lunar) {
                    // 2. \u5FAA\u73AF\u6DFB\u52A0\u5468\u671F
                    let nextLunar = lunar;
                    for(let i = 0; i < multiplier; i++) {
                        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
                    }
                    
                    // 3. \u8F6C\u56DE\u516C\u5386
                    const solar = lunarBiz.lunar2solar(nextLunar);
                    
                    // \u91CD\u70B9\uFF1A\u7528\u8BA1\u7B97\u51FA\u7684\u516C\u5386\u65E5\u671F\u91CD\u65B0\u83B7\u53D6\u5B8C\u6574\u7684\u519C\u5386\u5BF9\u8C61\uFF0C\u786E\u4FDD\u6709 fullStr \u5C5E\u6027
                    const fullNextLunar = lunarCalendar.solar2lunar(solar.year, solar.month, solar.day);
                    
                    // \u683C\u5F0F\u5316\u8F93\u51FA YYYY-MM-DD
                    const resultStr = solar.year + '-' + 
                                      String(solar.month).padStart(2, '0') + '-' + 
                                      String(solar.day).padStart(2, '0');
                                      
                    document.getElementById('newExpiryPreview').textContent = resultStr + ' (\u519C\u5386: ' + fullNextLunar.fullStr + ')';
                } else {
                    document.getElementById('newExpiryPreview').textContent = '\u65E5\u671F\u8BA1\u7B97\u9519\u8BEF';
                }
            } catch (e) {
                console.error(e);
                document.getElementById('newExpiryPreview').textContent = '\u8BA1\u7B97\u51FA\u9519';
            }
        } else {
            // \u516C\u5386\u8BA1\u7B97\u903B\u8F91
            const totalPeriodValue = subscription.periodValue * multiplier;
            document.getElementById('newExpiryPreview').textContent = addCalendarPeriodToDateString(
              \`\${parts.year}-\${pad2(parts.month)}-\${pad2(parts.day)}\`,
              totalPeriodValue,
              subscription.periodUnit
            );
        }
    }

    async function handleRenewFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const subscriptionId = form.dataset.subscriptionId;
        const confirmBtn = document.getElementById('confirmRenewBtn');

        const options = {
            paymentDate: document.getElementById('renewPaymentDate').value,
            amount: parseFloat(document.getElementById('renewAmount').value) || 0,
            periodMultiplier: parseInt(document.getElementById('renewPeriodMultiplier').value) || 1,
            note: document.getElementById('renewNote').value || '\u624B\u52A8\u7EED\u8BA2'
        };

        const originalBtnContent = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>\u7EED\u8BA2\u4E2D...';
        confirmBtn.disabled = true;

        try {
            const response = await apiFetch('/api/subscriptions/' + subscriptionId + '/renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '\u7EED\u8BA2\u6210\u529F', 'success');
                closeRenewFormModal();
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '\u7EED\u8BA2\u5931\u8D25', 'error');
                confirmBtn.innerHTML = originalBtnContent;
                confirmBtn.disabled = false;
            }
        } catch (error) {
            console.error('\u7EED\u8BA2\u5931\u8D25:', error);
            showToast('\u7EED\u8BA2\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
            confirmBtn.innerHTML = originalBtnContent;
            confirmBtn.disabled = false;
        }
    }

    window.closeRenewFormModal = function(event) {
        if (event && event.target.id !== 'renewFormModal') {
            return;
        }
        const modal = document.getElementById('renewFormModal');
        if (modal) {
            modal.remove();
            document.body.classList.remove('overflow-hidden');
        }
    };

    async function viewPaymentHistory(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;

        try {
            const response = await apiFetch('/api/subscriptions/' + id + '/payments');
            const result = await response.json();

            if (!result.success) {
                showToast(result.message || '\u83B7\u53D6\u652F\u4ED8\u5386\u53F2\u5931\u8D25', 'error');
                return;
            }

            const payments = result.payments || [];
            const subscriptionResponse = await apiFetch('/api/subscriptions/' + id);
            const subscriptionData = await subscriptionResponse.json();
            const subscription = subscriptionData;

            showPaymentHistoryModal(subscription, payments);
        } catch (error) {
            console.error('\u83B7\u53D6\u652F\u4ED8\u5386\u53F2\u5931\u8D25:', error);
            showToast('\u83B7\u53D6\u652F\u4ED8\u5386\u53F2\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
        }
    }

    function showPaymentHistoryModal(subscription, payments) {
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const paymentCount = payments.length;

        let paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml = '<div class="text-center text-gray-500 py-8">\u6682\u65E0\u652F\u4ED8\u8BB0\u5F55</div>';
        } else {
            paymentsHtml = payments.reverse().map(payment => {
                const typeLabel = payment.type === 'initial' ? '\u521D\u59CB\u8BA2\u9605' :
                                payment.type === 'manual' ? '\u624B\u52A8\u7EED\u8BA2' :
                                payment.type === 'auto' ? '\u81EA\u52A8\u7EED\u8BA2' : '\u672A\u77E5';
                const typeClass = payment.type === 'initial' ? 'bg-blue-100 text-blue-800' :
                                payment.type === 'manual' ? 'bg-green-100 text-green-800' :
                                payment.type === 'auto' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
                const formattedDate = formatDateInTimezone(payment.date, globalTimezone);
                const formattedTime = formatClockTimeInTimezone(payment.date, globalTimezone);

                // \u8BA1\u8D39\u5468\u671F\u683C\u5F0F\u5316
                let periodHtml = '';
                if (payment.periodStart && payment.periodEnd) {
                    const options = { month: 'short' };
                    const startStr = formatDateInTimezone(payment.periodStart, globalTimezone, options);
                    const endStr = formatDateInTimezone(payment.periodEnd, globalTimezone, options);
                    periodHtml = '<div class="mt-1 ml-6 text-xs text-gray-500"><i class="fas fa-clock mr-1"></i>\u8BA1\u8D39\u5468\u671F: ' + startStr + ' - ' + endStr + '</div>';
                }

                const noteHtml = payment.note ? '<div class="mt-1 ml-6 text-sm text-gray-600">' + escapeHtml(payment.note) + '</div>' : '';
                const paymentDataJson = JSON.stringify(payment).replace(/"/g, '&quot;');
                return \`
                    <div class="border-b border-gray-200 py-3 hover:bg-gray-50">
                        <div class="flex justify-between items-start gap-3">
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-calendar-alt text-gray-400"></i>
                                    <span class="font-medium">\${formattedDate} \${formattedTime}</span>
                                    <span class="px-2 py-1 rounded text-xs font-medium \${typeClass}">\${typeLabel}</span>
                                </div>
                                \${periodHtml}
                                \${noteHtml}
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-lg font-bold text-gray-900">\${getCurrencySymbol(payment.currency || subscription.currency)}\${Number(payment.amount || 0).toFixed(2)}</div>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="editPaymentRecord('\${subscription.id}', '\${payment.id}')"
                                            class="text-blue-600 hover:text-blue-800 px-2 py-1"
                                            title="\u7F16\u8F91">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deletePaymentRecord('\${subscription.id}', '\${payment.id}')"
                                            class="text-red-600 hover:text-red-800 px-2 py-1"
                                            title="\u5220\u9664">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        const modalHtml = \`
            <div id="paymentHistoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closePaymentHistoryModal(event)">
                <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center pb-3 border-b">
                        <h3 class="text-xl font-semibold text-gray-900">
                            <i class="fas fa-history mr-2"></i>\${escapeHtml(subscription.name)} - \u652F\u4ED8\u5386\u53F2
                        </h3>
                        <button onclick="closePaymentHistoryModal()" class="text-gray-400 hover:text-gray-500">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <div class="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center">
                                <div class="text-sm text-gray-600">\u7D2F\u8BA1\u652F\u51FA</div>
                                <div class="text-2xl font-bold text-purple-600">\${getCurrencySymbol(subscription.currency)}\${totalAmount.toFixed(2)}</div>
                            </div>
                            <div class="text-center">
                                <div class="text-sm text-gray-600">\u652F\u4ED8\u6B21\u6570</div>
                                <div class="text-2xl font-bold text-blue-600">\${paymentCount}</div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 max-h-96 overflow-y-auto">
                        \${paymentsHtml}
                    </div>

                    <div class="mt-4 flex justify-end">
                        <button onclick="closePaymentHistoryModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                            \u5173\u95ED
                        </button>
                    </div>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.classList.add('overflow-hidden');
    }

    window.closePaymentHistoryModal = function(event) {
        if (event && event.target.id !== 'paymentHistoryModal') {
            return;
        }
        const modal = document.getElementById('paymentHistoryModal');
        if (modal) {
            modal.remove();
            document.body.classList.remove('overflow-hidden');
        }
    };

    window.deletePaymentRecord = async function(subscriptionId, paymentId) {
        if (!confirm('\u786E\u8BA4\u5220\u9664\u6B64\u652F\u4ED8\u8BB0\u5F55\uFF1F\u5220\u9664\u540E\u5C06\u91CD\u65B0\u8BA1\u7B97\u7EDF\u8BA1\u6570\u636E\u3002')) {
            return;
        }

        try {
            const response = await apiFetch(\`/api/subscriptions/\${subscriptionId}/payments/\${paymentId}\`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '\u652F\u4ED8\u8BB0\u5F55\u5DF2\u5220\u9664', 'success');
                // \u5173\u95ED\u5F53\u524D\u6A21\u6001\u6846
                closePaymentHistoryModal();
                // \u5237\u65B0\u8BA2\u9605\u5217\u8868
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '\u5220\u9664\u5931\u8D25', 'error');
            }
        } catch (error) {
            console.error('\u5220\u9664\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:', error);
            showToast('\u5220\u9664\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
        }
    };

    window.editPaymentRecord = async function(subscriptionId, paymentId) {
        try {
            // \u83B7\u53D6\u8BA2\u9605\u4FE1\u606F
            const subResponse = await apiFetch(\`/api/subscriptions/\${subscriptionId}\`);
            const subscription = await subResponse.json();

            // \u83B7\u53D6\u652F\u4ED8\u5386\u53F2
            const payResponse = await apiFetch(\`/api/subscriptions/\${subscriptionId}/payments\`);
            const payResult = await payResponse.json();

            const payment = payResult.payments.find(p => p.id === paymentId);
            if (!payment) {
                showToast('\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728', 'error');
                return;
            }

            showEditPaymentModal(subscription, payment);
        } catch (error) {
            console.error('\u83B7\u53D6\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:', error);
            showToast('\u83B7\u53D6\u652F\u4ED8\u8BB0\u5F55\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
        }
    };

    function showEditPaymentModal(subscription, payment) {
        const formattedDate = formatDateInputInTimezone(payment.date, globalTimezone);

        const modalHtml = \`
            <div id="editPaymentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onclick="closeEditPaymentModal(event)">
                <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center pb-3 border-b">
                        <h3 class="text-xl font-semibold text-gray-900">
                            <i class="fas fa-edit mr-2"></i>\u7F16\u8F91\u652F\u4ED8\u8BB0\u5F55
                        </h3>
                        <button onclick="closeEditPaymentModal()" class="text-gray-400 hover:text-gray-500">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <form id="editPaymentForm" class="mt-4 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\u8BA2\u9605\u540D\u79F0</label>
                            <input type="text" value="\${escapeHtml(subscription.name)}" disabled
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\u652F\u4ED8\u65E5\u671F</label>
                            <input type="date" id="editPaymentDate" value="\${formattedDate}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\u652F\u4ED8\u91D1\u989D (\${subscription.currency || 'CNY'} \${getCurrencySymbol(payment.currency || subscription.currency)})</label>
                            <input type="number" id="editPaymentAmount" value="\${payment.amount}" step="0.01" min="0"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">\u5907\u6CE8</label>
                            <input type="text" id="editPaymentNote" value="\${escapeHtml(payment.note || '')}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div class="flex justify-end space-x-3 pt-3">
                            <button type="button" onclick="closeEditPaymentModal()"
                                    class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                                \u53D6\u6D88
                            </button>
                            <button type="submit" id="confirmEditBtn"
                                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                                <i class="fas fa-check mr-1"></i>\u4FDD\u5B58
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        \`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.classList.add('overflow-hidden');

        // \u4FDD\u5B58\u4FE1\u606F\u5230\u8868\u5355
        document.getElementById('editPaymentForm').dataset.subscriptionId = subscription.id;
        document.getElementById('editPaymentForm').dataset.paymentId = payment.id;

        // \u7ED1\u5B9A\u8868\u5355\u63D0\u4EA4\u4E8B\u4EF6
        document.getElementById('editPaymentForm').addEventListener('submit', handleEditPaymentSubmit);
    }

    async function handleEditPaymentSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const subscriptionId = form.dataset.subscriptionId;
        const paymentId = form.dataset.paymentId;
        const confirmBtn = document.getElementById('confirmEditBtn');

        const currentSubscription = subscriptionsCache.find(item => item.id === subscriptionId);
        const paymentData = {
            date: document.getElementById('editPaymentDate').value,
            amount: parseFloat(document.getElementById('editPaymentAmount').value) || 0,
            currency: currentSubscription?.currency || 'CNY',
            note: document.getElementById('editPaymentNote').value
        };

        const originalBtnContent = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>\u4FDD\u5B58\u4E2D...';
        confirmBtn.disabled = true;

        try {
            const response = await apiFetch(\`/api/subscriptions/\${subscriptionId}/payments/\${paymentId}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || '\u652F\u4ED8\u8BB0\u5F55\u5DF2\u66F4\u65B0', 'success');
                closeEditPaymentModal();
                closePaymentHistoryModal();
                await loadSubscriptions(false);
            } else {
                showToast(result.message || '\u66F4\u65B0\u5931\u8D25', 'error');
                confirmBtn.innerHTML = originalBtnContent;
                confirmBtn.disabled = false;
            }
        } catch (error) {
            console.error('\u66F4\u65B0\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:', error);
            showToast('\u66F4\u65B0\u65F6\u53D1\u751F\u9519\u8BEF', 'error');
            confirmBtn.innerHTML = originalBtnContent;
            confirmBtn.disabled = false;
        }
    }

    window.closeEditPaymentModal = function(event) {
        if (event && event.target.id !== 'editPaymentModal') {
            return;
        }
        const modal = document.getElementById('editPaymentModal');
        if (modal) {
            modal.remove();
            document.body.classList.remove('overflow-hidden');
        }
    };

    async function toggleSubscriptionStatus(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      const action = e.target.dataset.action || e.target.parentElement.dataset.action;
      const isActivate = action === 'activate';

      if (!isActivate && !confirm('\u786E\u5B9A\u8981\u505C\u7528\u6B64\u8BA2\u9605\u5417\uFF1F\u505C\u7528\u540E\u5C06\u4E0D\u518D\u6536\u5230\u5230\u671F\u63D0\u9192\u3002')) return;

      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (isActivate ? '\u542F\u7528\u4E2D...' : '\u505C\u7528\u4E2D...');
      button.disabled = true;

      try {
        const response = await apiFetch('/api/subscriptions/' + id + '/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: isActivate })
        });

        if (response.ok) {
          // \u672C\u5730\u66F4\u65B0\u7F13\u5B58\u5E76\u91CD\u7ED8\uFF0C\u907F\u514D\u6574\u8868\u91CD\u65B0\u8BF7\u6C42\u5BFC\u81F4\u8DF3\u52A8
          if (Array.isArray(subscriptionsCache)) {
            const idx = subscriptionsCache.findIndex(function (s) { return s.id === id; });
            if (idx >= 0) {
              subscriptionsCache[idx] = Object.assign({}, subscriptionsCache[idx], {
                isActive: isActivate,
                updatedAt: new Date().toISOString()
              });
            }
          }
          showToast((isActivate ? '\u542F\u7528' : '\u505C\u7528') + '\u6210\u529F', 'success');
          renderSubscriptionTable();
        } else {
          const error = await response.json();
          showToast((isActivate ? '\u542F\u7528' : '\u505C\u7528') + '\u5931\u8D25: ' + (error.message || '\u672A\u77E5\u9519\u8BEF'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error((isActivate ? '\u542F\u7528' : '\u505C\u7528') + '\u8BA2\u9605\u5931\u8D25:', error);
        showToast((isActivate ? '\u542F\u7528' : '\u505C\u7528') + '\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = '\u6DFB\u52A0\u65B0\u8BA2\u9605';
      document.getElementById('subscriptionModal').classList.remove('hidden');
      document.body.classList.add('overflow-hidden'); // \u7981\u6B62\u80CC\u666F\u6EDA\u52A8

      document.getElementById('subscriptionForm').reset();
      document.getElementById('currency').value = 'CNY'; // \u9ED8\u8BA4\u8BBE\u7F6E\u4E3ACNY
      document.getElementById('subscriptionId').value = '';
      clearFieldErrors();

      const today = getTodayDateStringInTimezone(globalTimezone);
      document.getElementById('startDate').value = today;
      document.getElementById('category').value = '';
      document.getElementById('reminderValue').value = '7';
      document.getElementById('reminderUnit').value = 'day';
      document.getElementById('isActive').checked = true;
      document.getElementById('autoRenew').checked = true;
      const endOfMonthEl = document.getElementById('endOfMonth');
      if (endOfMonthEl) endOfMonthEl.checked = false;

      loadLunarPreference();
      calculateExpiryDate();
      setupModalEventListeners();
    });

    /**
     * \u514B\u9686\u8BA2\u9605\uFF1A\u6253\u5F00\u65B0\u5EFA\u8868\u5355\u5E76\u9884\u586B\u5B57\u6BB5\uFF08\u65B0 id \u4FDD\u5B58\u65F6\u751F\u6210\uFF09\uFF0C\u540C\u6B65\u590D\u5236\u63D0\u9192\u89C4\u5219\u3002
     */
    async function cloneSubscription(e) {
      const button = e.target.closest('button') || e.target;
      const id = button.dataset.id;
      if (!id) return;
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      try {
        const response = await apiFetch('/api/subscriptions/' + id);
        const subscription = await response.json();
        if (!subscription || !subscription.id) {
          showToast('\u8BFB\u53D6\u8BA2\u9605\u5931\u8D25', 'error');
          return;
        }

        document.getElementById('modalTitle').textContent = '\u514B\u9686\u8BA2\u9605';
        document.getElementById('subscriptionModal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        document.getElementById('subscriptionForm').reset();
        clearFieldErrors();

        document.getElementById('subscriptionId').value = '';
        document.getElementById('name').value = (subscription.name || '') + ' (\u526F\u672C)';
        document.getElementById('subscriptionMode').value = subscription.subscriptionMode || 'cycle';
        document.getElementById('customType').value = subscription.customType || '';
        document.getElementById('category').value = subscription.category || '';
        document.getElementById('notes').value = subscription.notes || '';
        document.getElementById('amount').value =
          subscription.amount !== null && subscription.amount !== undefined ? subscription.amount : '';
        document.getElementById('currency').value = subscription.currency || 'CNY';
        document.getElementById('isActive').checked = subscription.isActive !== false;
        document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
        document.getElementById('startDate').value = subscription.startDate
          ? formatDateInputInTimezone(subscription.startDate, globalTimezone)
          : getTodayDateStringInTimezone(globalTimezone);
        document.getElementById('expiryDate').value = subscription.expiryDate
          ? formatDateInputInTimezone(subscription.expiryDate, globalTimezone)
          : '';
        document.getElementById('periodValue').value = subscription.periodValue || 1;
        document.getElementById('periodUnit').value = subscription.periodUnit || 'month';
        document.getElementById('useLunar').checked = !!subscription.useLunar;
        const endOfMonthEl = document.getElementById('endOfMonth');
        if (endOfMonthEl) endOfMonthEl.checked = !!subscription.endOfMonth && !subscription.useLunar;

        let rules = Array.isArray(subscription.reminderRules) ? subscription.reminderRules : null;
        if (!rules || rules.length === 0) {
          try {
            const rr = await apiFetch('/api/subscriptions/' + id + '/reminders');
            const body = await rr.json();
            if (body && Array.isArray(body.rules)) rules = body.rules;
          } catch (_) { /* ignore */ }
        }
        if (rules && rules.length > 0) {
          const cloned = rules.map(function (r) {
            return Object.assign({}, r, {
              id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('r-' + Math.random().toString(36).slice(2))
            });
          });
          window.__pendingReminderRules = cloned;
          if (typeof window.__setReminderRules === 'function') {
            window.__setReminderRules(cloned);
          }
        }

        setupModalEventListeners();
        showToast('\u5DF2\u586B\u5165\u514B\u9686\u5185\u5BB9\uFF0C\u786E\u8BA4\u540E\u4FDD\u5B58\u4E3A\u65B0\u8BA2\u9605', 'info', 3500);
      } catch (err) {
        console.error('\u514B\u9686\u5931\u8D25:', err);
        showToast('\u514B\u9686\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    }

    // \u81EA\u5B9A\u4E49\u65E5\u671F\u9009\u62E9\u5668\u529F\u80FD
    class CustomDatePicker {
      constructor(inputId, pickerId, calendarId, monthId, yearId, prevBtnId, nextBtnId) {
        console.log('CustomDatePicker \u6784\u9020\u51FD\u6570:', { inputId, pickerId, calendarId, monthId, yearId, prevBtnId, nextBtnId });
        
        this.input = document.getElementById(inputId);
        this.picker = document.getElementById(pickerId);
        this.calendar = document.getElementById(calendarId);
        this.monthElement = document.getElementById(monthId);
        this.yearElement = document.getElementById(yearId);
        this.prevBtn = document.getElementById(prevBtnId);
        this.nextBtn = document.getElementById(nextBtnId);
        
        // \u65B0\u589E\u5143\u7D20
        this.monthPicker = document.getElementById(pickerId.replace('Picker', 'MonthPicker'));
        this.yearPicker = document.getElementById(pickerId.replace('Picker', 'YearPicker'));
        this.backToCalendarBtn = document.getElementById(pickerId.replace('Picker', 'BackToCalendar'));
        this.backToCalendarFromYearBtn = document.getElementById(pickerId.replace('Picker', 'BackToCalendarFromYear'));
        this.goToTodayBtn = document.getElementById(pickerId.replace('Picker', 'GoToToday'));
        this.prevYearDecadeBtn = document.getElementById(pickerId.replace('Picker', 'PrevYearDecade'));
        this.nextYearDecadeBtn = document.getElementById(pickerId.replace('Picker', 'NextYearDecade'));
        this.yearRangeElement = document.getElementById(pickerId.replace('Picker', 'YearRange'));
        this.yearGrid = document.getElementById(pickerId.replace('Picker', 'YearGrid'));
        
        console.log('\u627E\u5230\u7684\u5143\u7D20:', {
          input: !!this.input,
          picker: !!this.picker,
          calendar: !!this.calendar,
          monthElement: !!this.monthElement,
          yearElement: !!this.yearElement,
          prevBtn: !!this.prevBtn,
          nextBtn: !!this.nextBtn
        });
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentView = 'calendar'; // 'calendar', 'month', 'year'
        this.yearDecade = Math.floor(this.currentDate.getFullYear() / 10) * 10;
        
        this.init();
      }
      
      init() {
        console.log('\u521D\u59CB\u5316\u65E5\u671F\u9009\u62E9\u5668\uFF0C\u8F93\u5165\u6846:', !!this.input, '\u9009\u62E9\u5668:', !!this.picker);
        
        // \u7ED1\u5B9A\u57FA\u672C\u4E8B\u4EF6
        if (this.input) {
          // \u79FB\u9664\u4E4B\u524D\u7684\u4E8B\u4EF6\u76D1\u542C\u5668\uFF08\u5982\u679C\u5B58\u5728\uFF09
          this.input.removeEventListener('click', this._forceShowHandler);
          this._forceShowHandler = () => this.forceShow();
          this.input.addEventListener('click', this._forceShowHandler);
          if (this._manualInputHandler) {
            this.input.removeEventListener('blur', this._manualInputHandler);
          }
          this._manualInputHandler = () => this.syncFromInputValue();
          this.input.addEventListener('blur', this._manualInputHandler);

          if (this._manualKeydownHandler) {
            this.input.removeEventListener('keydown', this._manualKeydownHandler);
          }
          this._manualKeydownHandler = (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              this.syncFromInputValue();
            }
          };
          this.input.addEventListener('keydown', this._manualKeydownHandler);
        }
        
        if (this.prevBtn) {
          this.prevBtn.removeEventListener('click', this._prevHandler);
          this._prevHandler = () => this.previousMonth();
          this.prevBtn.addEventListener('click', this._prevHandler);
        }
        
        if (this.nextBtn) {
          this.nextBtn.removeEventListener('click', this._nextHandler);
          this._nextHandler = () => this.nextMonth();
          this.nextBtn.addEventListener('click', this._nextHandler);
        }
        
        // \u7ED1\u5B9A\u6708\u4EFD\u548C\u5E74\u4EFD\u70B9\u51FB\u4E8B\u4EF6
        if (this.monthElement) {
          this.monthElement.removeEventListener('click', this._showMonthHandler);
          this._showMonthHandler = () => this.showMonthPicker();
          this.monthElement.addEventListener('click', this._showMonthHandler);
        }
        
        if (this.yearElement) {
          this.yearElement.removeEventListener('click', this._showYearHandler);
          this._showYearHandler = () => this.showYearPicker();
          this.yearElement.addEventListener('click', this._showYearHandler);
        }
        
        // \u7ED1\u5B9A\u6708\u4EFD\u9009\u62E9\u5668\u4E8B\u4EF6
        if (this.monthPicker) {
          this.monthPicker.removeEventListener('click', this._monthSelectHandler);
          this._monthSelectHandler = (e) => {
            if (e.target.classList.contains('month-option')) {
              const month = parseInt(e.target.dataset.month);
              this.selectMonth(month);
            }
          };
          this.monthPicker.addEventListener('click', this._monthSelectHandler);
        }
        
        if (this.backToCalendarBtn) {
          this.backToCalendarBtn.removeEventListener('click', this._backToCalendarHandler);
          this._backToCalendarHandler = () => this.showCalendar();
          this.backToCalendarBtn.addEventListener('click', this._backToCalendarHandler);
        }
        
        if (this.backToCalendarFromYearBtn) {
          this.backToCalendarFromYearBtn.removeEventListener('click', this._backToCalendarFromYearHandler);
          this._backToCalendarFromYearHandler = () => this.showCalendar();
          this.backToCalendarFromYearBtn.addEventListener('click', this._backToCalendarFromYearHandler);
        }
        
        // \u7ED1\u5B9A\u5E74\u4EFD\u9009\u62E9\u5668\u4E8B\u4EF6
        if (this.prevYearDecadeBtn) {
        this.prevYearDecadeBtn.removeEventListener('click', this._prevYearDecadeHandler);
        this._prevYearDecadeHandler = (e) => {
            e.stopPropagation(); // \u9632\u6B62\u4E8B\u4EF6\u5192\u6CE1\u5230\u8868\u5355
            this.previousYearDecade();
        };
        this.prevYearDecadeBtn.addEventListener('click', this._prevYearDecadeHandler);
        }

        if (this.nextYearDecadeBtn) {
        this.nextYearDecadeBtn.removeEventListener('click', this._nextYearDecadeHandler);
        this._nextYearDecadeHandler = (e) => {
            e.stopPropagation(); // \u9632\u6B62\u4E8B\u4EF6\u5192\u6CE1\u5230\u8868\u5355
            this.nextYearDecade();
        };
        this.nextYearDecadeBtn.addEventListener('click', this._nextYearDecadeHandler);
}
        
        // \u7ED1\u5B9A\u56DE\u5230\u4ECA\u5929\u4E8B\u4EF6
        if (this.goToTodayBtn) {
          this.goToTodayBtn.removeEventListener('click', this._goToTodayHandler);
          this._goToTodayHandler = () => this.goToToday();
          this.goToTodayBtn.addEventListener('click', this._goToTodayHandler);
        }
        
        // \u70B9\u51FB\u5916\u90E8\u5173\u95ED
        if (this._outsideClickHandler) {
          document.removeEventListener('click', this._outsideClickHandler);
        }
        this._outsideClickHandler = (e) => {
          if (this.picker && !this.picker.contains(e.target) && !this.input.contains(e.target)) {
            console.log('\u70B9\u51FB\u5916\u90E8\uFF0C\u9690\u85CF\u65E5\u671F\u9009\u62E9\u5668');
            this.hide();
          }
        };
        document.addEventListener('click', this._outsideClickHandler);
        
        // \u521D\u59CB\u5316\u663E\u793A\uFF08\u9759\u9ED8\uFF0C\u907F\u514D\u7F16\u8F91\u5F39\u7A97\u521D\u59CB\u5316\u65F6\u8BEF\u62A5\uFF09
        this.syncFromInputValue({ silent: true });
        this.render();
        this.renderYearGrid();
      }
      
      toggle() {
        console.log('toggle \u88AB\u8C03\u7528');
        console.log('picker \u5143\u7D20:', this.picker);
        console.log('picker \u7C7B\u540D:', this.picker ? this.picker.className : 'null');
        console.log('\u662F\u5426\u5305\u542B hidden:', this.picker ? this.picker.classList.contains('hidden') : 'null');
        
        if (this.picker && this.picker.classList.contains('hidden')) {
          console.log('\u663E\u793A\u65E5\u671F\u9009\u62E9\u5668');
          this.show();
        } else {
          console.log('\u9690\u85CF\u65E5\u671F\u9009\u62E9\u5668');
          this.hide();
        }
      }
      
      // \u5F3A\u5236\u663E\u793A\u65E5\u671F\u9009\u62E9\u5668
      forceShow() {
        console.log('forceShow \u88AB\u8C03\u7528');
        if (this.picker) {
          // \u786E\u4FDD\u9009\u62E9\u5668\u663E\u793A
          this.picker.classList.remove('hidden');
          // \u91CD\u7F6E\u5230\u65E5\u5386\u89C6\u56FE
          this.currentView = 'calendar';
          this.hideAllViews();
          this.render();
          console.log('\u65E5\u671F\u9009\u62E9\u5668\u5DF2\u663E\u793A');
        } else {
          console.error('\u65E5\u671F\u9009\u62E9\u5668\u5143\u7D20\u4E0D\u5B58\u5728');
        }
      }
      
      show() {
        if (this.picker) {
          this.picker.classList.remove('hidden');
          this.render();
        }
      }
      
      hide() {
        if (this.picker) {
          this.picker.classList.add('hidden');
        }
      }
      
      previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      }
      
      nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      }
      
      selectDate(date) {
        this.selectedDate = date;
        if (this.input) {
          // \u4F7F\u7528\u672C\u5730\u65F6\u95F4\u683C\u5F0F\u5316\uFF0C\u907F\u514D\u65F6\u533A\u95EE\u9898
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          this.input.value = year + '-' + month + '-' + day;
        }
        this.hide();
        
        // \u89E6\u53D1change\u4E8B\u4EF6\uFF0C\u4F46\u4E0D\u5192\u6CE1\u5230\u8868\u5355
        if (this.input) {
          const event = new Event('change', { bubbles: false });
          this.input.dispatchEvent(event);
        }
      }

      syncFromInputValue(options = {}) {
        if (!this.input) {
          return;
        }
        const { silent = false } = options;
        const value = this.input.value.trim();
        if (!value) {
          this.selectedDate = null;
          return;
        }

        const normalized = normalizeDateString(value);
        if (!normalized) {
          if (!silent && typeof showToast === 'function') {
            showToast('\u65E5\u671F\u683C\u5F0F\u9700\u4E3A YYYY-MM-DD', 'warning');
          }
          return;
        }

        const [yearStr, monthStr, dayStr] = normalized.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        const parsed = new Date(year, month - 1, day);
        if (isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
          if (!silent && typeof showToast === 'function') {
            showToast('\u8BF7\u8F93\u5165\u6709\u6548\u7684\u65E5\u671F', 'warning');
          }
          return;
        }

        this.input.value = normalized;
        this.selectedDate = parsed;
        this.currentDate = new Date(parsed);
        this.render();

        const event = new Event('change', { bubbles: false });
        this.input.dispatchEvent(event);
      }
      
      render() {
        if (!this.monthElement || !this.yearElement || !this.calendar) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // \u66F4\u65B0\u6708\u4EFD\u5E74\u4EFD\u663E\u793A
        this.monthElement.textContent = (month + 1) + '\u6708';
        this.yearElement.textContent = year;
        
        // \u6E05\u7A7A\u65E5\u5386
        this.calendar.innerHTML = '';
        
        // \u83B7\u53D6\u5F53\u6708\u7B2C\u4E00\u5929\u548C\u6700\u540E\u4E00\u5929
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // \u751F\u6210\u65E5\u5386\u7F51\u683C
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          const dayElement = document.createElement('div');
          dayElement.className = 'calendar-day';
          
          // \u5224\u65AD\u662F\u5426\u662F\u5F53\u524D\u6708\u4EFD
          if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
          }
          
          // \u5224\u65AD\u662F\u5426\u662F\u4ECA\u5929
          const today = new Date();
          if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
          }
          
          // \u5224\u65AD\u662F\u5426\u662F\u9009\u4E2D\u65E5\u671F
          if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
            dayElement.classList.add('selected');
          }
          
          // \u83B7\u53D6\u519C\u5386\u4FE1\u606F
          let lunarText = '';
          try {
            const lunar = lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
            if (lunar) {
              if (lunar.day === 1) {
                // \u521D\u4E00\uFF0C\u53EA\u663E\u793A\u6708\u4EFD
                lunarText = lunar.isLeap ? '\u95F0' + lunar.monthStr.replace('\u95F0', '') : lunar.monthStr;
              } else {
                // \u4E0D\u662F\u521D\u4E00\uFF0C\u663E\u793A\u65E5
                lunarText = lunar.dayStr;
              }
            }
          } catch (error) {
            console.error('\u519C\u5386\u8F6C\u6362\u9519\u8BEF:', error);
          }
          
          dayElement.innerHTML =
            '<div>' + date.getDate() + '</div>' +
            '<div class="lunar-text">' + lunarText + '</div>';
          
          dayElement.addEventListener('click', () => this.selectDate(date));
          
          this.calendar.appendChild(dayElement);
        }
      }
      
      // \u663E\u793A\u6708\u4EFD\u9009\u62E9\u5668
      showMonthPicker() {
        this.currentView = 'month';
        this.hideAllViews();
        if (this.monthPicker) {
          this.monthPicker.classList.remove('hidden');
          // \u9AD8\u4EAE\u5F53\u524D\u6708\u4EFD
          const monthOptions = this.monthPicker.querySelectorAll('.month-option');
          monthOptions.forEach((option, index) => {
            option.classList.remove('selected');
            if (index === this.currentDate.getMonth()) {
              option.classList.add('selected');
            }
          });
        }
      }
      
      // \u663E\u793A\u5E74\u4EFD\u9009\u62E9\u5668
      showYearPicker() {
        this.currentView = 'year';
        this.hideAllViews();
        if (this.yearPicker) {
          this.yearPicker.classList.remove('hidden');
        }
        this.renderYearGrid();
      }
      
      // \u663E\u793A\u65E5\u5386\u89C6\u56FE
      showCalendar() {
        this.currentView = 'calendar';
        this.hideAllViews();
        this.render();
      }
      
      // \u9690\u85CF\u6240\u6709\u89C6\u56FE
      hideAllViews() {
        if (this.monthPicker) this.monthPicker.classList.add('hidden');
        if (this.yearPicker) this.yearPicker.classList.add('hidden');
        // \u6CE8\u610F\uFF1A\u4E0D\u9690\u85CF\u65E5\u5386\u89C6\u56FE\uFF0C\u56E0\u4E3A\u5B83\u662F\u4E3B\u89C6\u56FE
      }
      
      // \u9009\u62E9\u6708\u4EFD
      selectMonth(month) {
        this.currentDate.setMonth(month);
        this.showCalendar();
      }
      
      // \u9009\u62E9\u5E74\u4EFD
      selectYear(year) {
        this.currentDate.setFullYear(year);
        this.showCalendar();
      }
      
      // \u4E0A\u4E00\u5341\u5E74
      previousYearDecade() {
        this.yearDecade -= 10;
        this.renderYearGrid();
      }
      
      // \u4E0B\u4E00\u5341\u5E74
      nextYearDecade() {
        this.yearDecade += 10;
        this.renderYearGrid();
      }
      
      // \u6E32\u67D3\u5E74\u4EFD\u7F51\u683C
      renderYearGrid() {
        if (!this.yearGrid || !this.yearRangeElement) return;
        
        const startYear = this.yearDecade;
        const endYear = this.yearDecade + 9;
        
        // \u66F4\u65B0\u5E74\u4EFD\u8303\u56F4\u663E\u793A
        this.yearRangeElement.textContent = startYear + '-' + endYear;
        
        // \u6E05\u7A7A\u5E74\u4EFD\u7F51\u683C
        this.yearGrid.innerHTML = '';
        
        // \u751F\u6210\u5E74\u4EFD\u6309\u94AE
        for (let year = startYear; year <= endYear; year++) {
          const yearBtn = document.createElement('button');
          yearBtn.type = 'button';
          yearBtn.className = 'year-option px-3 py-2 text-sm rounded hover:bg-gray-100';
          yearBtn.textContent = year;
          yearBtn.dataset.year = year;
          
          if (year === this.currentDate.getFullYear()) {
            yearBtn.classList.add('bg-indigo-100', 'text-indigo-600');
          }
          
          // \u9650\u5236\u5E74\u4EFD\u8303\u56F4 1900-2100
          if (year < 1900 || year > 2100) {
            yearBtn.disabled = true;
            yearBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            yearBtn.addEventListener('click', () => this.selectYear(year));
          }
          
          this.yearGrid.appendChild(yearBtn);
        }
      }     
      goToToday() {
        this.currentDate = new Date();
        this.yearDecade = Math.floor(this.currentDate.getFullYear() / 10) * 10;
        this.showCalendar();
      }
      
      destroy() {
        this.hide();       
        
        if (this.input && this._forceShowHandler) {  // \u6E05\u7406\u4E8B\u4EF6\u76D1\u542C\u5668
          this.input.removeEventListener('click', this._forceShowHandler);
        }
        if (this.input && this._manualInputHandler) {
          this.input.removeEventListener('blur', this._manualInputHandler);
        }
        if (this.input && this._manualKeydownHandler) {
          this.input.removeEventListener('keydown', this._manualKeydownHandler);
        }
        if (this.prevBtn && this._prevHandler) {
          this.prevBtn.removeEventListener('click', this._prevHandler);
        }
        if (this.nextBtn && this._nextHandler) {
          this.nextBtn.removeEventListener('click', this._nextHandler);
        }
        if (this.monthElement && this._showMonthHandler) {
          this.monthElement.removeEventListener('click', this._showMonthHandler);
        }
        if (this.yearElement && this._showYearHandler) {
          this.yearElement.removeEventListener('click', this._showYearHandler);
        }
        if (this.monthPicker && this._monthSelectHandler) {
          this.monthPicker.removeEventListener('click', this._monthSelectHandler);
        }
        if (this.backToCalendarBtn && this._backToCalendarHandler) {
          this.backToCalendarBtn.removeEventListener('click', this._backToCalendarHandler);
        }
        if (this.backToCalendarFromYearBtn && this._backToCalendarFromYearHandler) {
          this.backToCalendarFromYearBtn.removeEventListener('click', this._backToCalendarFromYearHandler);
        }
        if (this.prevYearDecadeBtn && this._prevYearDecadeHandler) {
          this.prevYearDecadeBtn.removeEventListener('click', this._prevYearDecadeHandler);
        }
        if (this.nextYearDecadeBtn && this._nextYearDecadeHandler) {
          this.nextYearDecadeBtn.removeEventListener('click', this._nextYearDecadeHandler);
        }
        if (this.goToTodayBtn && this._goToTodayHandler) {
          this.goToTodayBtn.removeEventListener('click', this._goToTodayHandler);
        }
        if (this._outsideClickHandler) {
          document.removeEventListener('click', this._outsideClickHandler);
        }
      }
    }
    
    // === \u81EA\u5B9A\u4E49\u4E0B\u62C9\u83DC\u5355\u903B\u8F91 ===
    const TYPE_OPTIONS = [
      "\u6D41\u5A92\u4F53", "\u89C6\u9891\u5E73\u53F0", "\u97F3\u4E50\u5E73\u53F0", "\u4E91\u670D\u52A1", "\u8F6F\u4EF6\u8BA2\u9605", 
      "\u57DF\u540D", "\u670D\u52A1\u5668", "\u4F1A\u5458\u670D\u52A1", "\u5B66\u4E60\u5E73\u53F0", "\u5065\u8EAB/\u8FD0\u52A8", 
      "\u6E38\u620F", "\u65B0\u95FB/\u6742\u5FD7", "\u751F\u65E5", "\u7EAA\u5FF5\u65E5", "\u5176\u4ED6"
    ];
    
    const CATEGORY_OPTIONS = [
      "\u4E2A\u4EBA", "\u5BB6\u5EAD", "\u5DE5\u4F5C", "\u516C\u53F8", "\u5A31\u4E50", "\u5B66\u4E60", 
      "\u5F00\u53D1", "\u751F\u4EA7\u529B", "\u793E\u4EA4", "\u5065\u5EB7", "\u8D22\u52A1"
    ];

    function initCustomDropdown(inputId, listId, options) {
      const input = document.getElementById(inputId);
      const list = document.getElementById(listId);
      
      if (!input || !list) return;

      function renderItems(filter) {
        const filtered = filter ? options.filter(o => o.includes(filter)) : options;
        list.innerHTML = filtered.map(opt => 
          '<div class="dropdown-item">' + opt + '</div>'
        ).join('');
      }
      renderItems('');

      if (!input.dataset.dropdownBound) {
        input.dataset.dropdownBound = 'true';
        const showList = (e) => {
          e.stopPropagation();
          document.querySelectorAll('.custom-dropdown-list').forEach(el => el.classList.remove('show'));
          renderItems(input.value.trim());
          list.classList.add('show');
        };

        input.addEventListener('focus', showList);
        input.addEventListener('click', showList);
        input.addEventListener('input', () => {
          renderItems(input.value.trim());
          if (!list.classList.contains('show')) list.classList.add('show');
        });

        list.addEventListener('click', (e) => {
          e.stopPropagation();
          if (e.target.classList.contains('dropdown-item')) {
            input.value = e.target.textContent;
            input.dispatchEvent(new Event('input'));
            list.classList.remove('show');
          }
        });
      }
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-dropdown-wrapper')) {
        document.querySelectorAll('.custom-dropdown-list').forEach(el => el.classList.remove('show'));
      }
    });

    function setupModalEventListeners() {     
      const calculateExpiryBtn = document.getElementById('calculateExpiryBtn'); // \u83B7\u53D6DOM\u5143\u7D20
      const useLunar = document.getElementById('useLunar');
      const showLunar = document.getElementById('showLunar');
      const startDate = document.getElementById('startDate');
      const expiryDate = document.getElementById('expiryDate');
      const cancelBtn = document.getElementById('cancelBtn');
      
      initCustomDropdown('customType', 'customTypeDropdown', TYPE_OPTIONS); // \u521D\u59CB\u5316\u81EA\u5B9A\u4E49\u4E0B\u62C9\u83DC\u5355
      fetch('/api/categories').then(r => r.json()).then(data => {
        const saved = (data && data.categories) || [];
        const merged = [...new Set([...saved, ...CATEGORY_OPTIONS])];
        initCustomDropdown('category', 'categoryDropdown', merged);
      }).catch(() => {
        initCustomDropdown('category', 'categoryDropdown', CATEGORY_OPTIONS);
      });    
      
      if (calculateExpiryBtn && !calculateExpiryBtn.dataset.bound) {
        calculateExpiryBtn.dataset.bound = 'true';
        calculateExpiryBtn.addEventListener('click', calculateExpiryDate); // \u7ED1\u5B9A\u4E8B\u4EF6
      }
      if (useLunar && !useLunar.dataset.bound) {
        useLunar.dataset.bound = 'true';
        useLunar.addEventListener('change', function () {
          const endOfMonthEl = document.getElementById('endOfMonth');
          if (endOfMonthEl && useLunar.checked) {
            endOfMonthEl.checked = false;
            endOfMonthEl.disabled = true;
          } else if (endOfMonthEl) {
            endOfMonthEl.disabled = false;
          }
          calculateExpiryDate();
        });
      }
      const endOfMonth = document.getElementById('endOfMonth');
      if (endOfMonth && !endOfMonth.dataset.bound) {
        endOfMonth.dataset.bound = 'true';
        endOfMonth.addEventListener('change', calculateExpiryDate);
      }
      document.querySelectorAll('.period-preset').forEach(function (btn) {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', function () {
          const v = Number(btn.dataset.value) || 1;
          const u = btn.dataset.unit || 'month';
          document.getElementById('periodValue').value = String(v);
          document.getElementById('periodUnit').value = u;
          calculateExpiryDate();
        });
      });
      if (showLunar && !showLunar.dataset.bound) {
        showLunar.dataset.bound = 'true';
        showLunar.addEventListener('change', toggleLunarDisplay);
      }
      if (startDate && !startDate.dataset.bound) {
        startDate.dataset.bound = 'true';
        startDate.addEventListener('change', () => updateLunarDisplay('startDate', 'startDateLunar'));
      }
      if (expiryDate && !expiryDate.dataset.bound) {
        expiryDate.dataset.bound = 'true';
        expiryDate.addEventListener('change', () => updateLunarDisplay('expiryDate', 'expiryDateLunar'));
      }
      if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.dataset.bound = 'true';
        cancelBtn.addEventListener('click', () => {
          document.getElementById('subscriptionModal').classList.add('hidden');
          document.body.classList.remove('overflow-hidden'); // \u6062\u590D\u80CC\u666F\u6EDA\u52A8
        });
      }

      ['startDate', 'periodValue', 'periodUnit'].forEach(id => {
        const element = document.getElementById(id);
        if (element && !element.dataset.bound) {
          element.dataset.bound = 'true';
          element.addEventListener('change', calculateExpiryDate);
        }
      });
      // \u521D\u59CB\u5316\u65E5\u671F\u9009\u62E9\u5668
      try {
        if (window.startDatePicker && typeof window.startDatePicker.destroy === 'function') window.startDatePicker.destroy();
        if (window.expiryDatePicker && typeof window.expiryDatePicker.destroy === 'function') window.expiryDatePicker.destroy();
        
        window.startDatePicker = null;
        window.expiryDatePicker = null;
        
        setTimeout(() => {
          window.startDatePicker = new CustomDatePicker(
            'startDate', 'startDatePicker', 'startDateCalendar', 
            'startDateMonth', 'startDateYear', 'startDatePrevMonth', 'startDateNextMonth'
          );
          window.expiryDatePicker = new CustomDatePicker(
            'expiryDate', 'expiryDatePicker', 'expiryDateCalendar', 
            'expiryDateMonth', 'expiryDateYear', 'expiryDatePrevMonth', 'expiryDateNextMonth'
          );
        }, 50);
      } catch (error) {
        console.error('\u521D\u59CB\u5316\u65E5\u671F\u9009\u62E9\u5668\u5931\u8D25:', error);
      }
    }

	// \u5728 script \u6807\u7B7E\u9876\u90E8\u5B9A\u4E49\u5168\u5C40\u53D8\u91CF
  let isEditingLoading = false;
  const debugLog = (...args) => {
    if (window.DEBUG_LOGS === true) console.log(...args);
  };
    // 3. \u65B0\u589E\u4FEE\u6539\uFF0C calculateExpiryDate \u51FD\u6570\uFF0C\u652F\u6301\u519C\u5386\u5468\u671F\u63A8\u7B97     
	function calculateExpiryDate() {
    if (isEditingLoading) return;

	  const startDate = document.getElementById('startDate').value;
	  const periodValue = parseInt(document.getElementById('periodValue').value);
	  const periodUnit = document.getElementById('periodUnit').value;
	  const useLunar = document.getElementById('useLunar').checked;

	  if (!startDate || !periodValue || !periodUnit) {
		return;
	  }

	  if (useLunar) {
		// \u519C\u5386\u63A8\u7B97
		const start = new Date(startDate);
		const lunar = lunarCalendar.solar2lunar(start.getFullYear(), start.getMonth() + 1, start.getDate());
		let nextLunar = addLunarPeriod(lunar, periodValue, periodUnit);
		const solar = lunar2solar(nextLunar);
		
		// \u4F7F\u7528\u4E0E\u516C\u5386\u76F8\u540C\u7684\u65B9\u5F0F\u521B\u5EFA\u65E5\u671F  
		const expiry = new Date(startDate); // \u4ECE\u539F\u59CB\u65E5\u671F\u5F00\u59CB  
		expiry.setFullYear(solar.year);  
		expiry.setMonth(solar.month - 1);  
		expiry.setDate(solar.day);  
		document.getElementById('expiryDate').value = expiry.getFullYear() + '-' + String(expiry.getMonth() + 1).padStart(2, '0') + '-' + String(expiry.getDate()).padStart(2, '0');
		debugLog('start:', start);
		debugLog('nextLunar:', nextLunar);
		debugLog('expiry:', expiry);
		debugLog('expiryDate:', document.getElementById('expiryDate').value);
		
		debugLog('solar from lunar2solar:', solar);  
		debugLog('solar.year:', solar.year, 'solar.month:', solar.month, 'solar.day:', solar.day);
		debugLog('expiry.getTime():', expiry.getTime());  
		debugLog('expiry.toString():', expiry.toString());
		
		
	  } else {
		// \u516C\u5386\u63A8\u7B97\uFF08\u652F\u6301\u300C\u6BCF\u6708\u6700\u540E\u4E00\u5929\u300D\uFF09
		const start = new Date(startDate);
		const endOfMonthEl = document.getElementById('endOfMonth');
		const endOfMonth = endOfMonthEl && endOfMonthEl.checked;
		let expiry = new Date(start);
		if (periodUnit === 'day') {
		  expiry.setDate(start.getDate() + periodValue);
		} else if (periodUnit === 'month') {
		  if (endOfMonth) {
		    expiry = new Date(start.getFullYear(), start.getMonth() + periodValue + 1, 0);
		  } else {
		    expiry.setMonth(start.getMonth() + periodValue);
		  }
		} else if (periodUnit === 'year') {
		  expiry.setFullYear(start.getFullYear() + periodValue);
		}
		document.getElementById('expiryDate').value = expiry.getFullYear() + '-' + String(expiry.getMonth() + 1).padStart(2, '0') + '-' + String(expiry.getDate()).padStart(2, '0');
		debugLog('start:', start);
		debugLog('expiry:', expiry);
		debugLog('expiryDate:', document.getElementById('expiryDate').value);
	  }

	  // \u66F4\u65B0\u519C\u5386\u663E\u793A
	  updateLunarDisplay('startDate', 'startDateLunar');
	  updateLunarDisplay('expiryDate', 'expiryDateLunar');
	}
    
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('subscriptionModal').classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });

    // ESC \u952E\u5173\u95ED\u6A21\u6001\u6846
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('subscriptionModal');
        if (!modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
          return;
        }
        // \u5173\u95ED\u52A8\u6001\u6A21\u6001\u6846
        const dynamicModals = document.querySelectorAll('#paymentHistoryModal, #renewFormModal, #editPaymentModal');
        dynamicModals.forEach(m => m.remove());
        if (dynamicModals.length) document.body.classList.remove('overflow-hidden');
      }
    });
    
    document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      const id = document.getElementById('subscriptionId').value;
      const reminderUnit = document.getElementById('reminderUnit').value;
      const reminderValue = Number(document.getElementById('reminderValue').value) || 0;
      const reminderHint = document.getElementById('reminderHint');
      if (reminderHint) {
        reminderHint.textContent = reminderUnit === 'hour'
          ? '\u5C0F\u65F6\u7EA7\u63D0\u9192\uFF1A\u9700\u4FDD\u8BC1 Worker \u6BCF\u5C0F\u65F6\u6267\u884C\uFF1B0 \u8868\u793A\u4EC5\u5230\u671F\u65F6\u63D0\u9192'
          : '0 = \u4EC5\u5728\u5230\u671F\u65F6\u63D0\u9192';
      }

      const subscription = {
        name: document.getElementById('name').value.trim(),
        customType: document.getElementById('customType').value.trim(),
        category: document.getElementById('category').value.trim(),
        subscriptionMode: document.getElementById('subscriptionMode').value, // \u65B0\u589E\u4FEE\u6539\uFF0C\u8868\u5355\u63D0\u4EA4\u65F6\u5E26\u4E0A subscriptionMode \u5B57\u6BB5
        notes: document.getElementById('notes').value.trim() || '',
        currency: document.getElementById('currency').value, // \u65B0\u589E\u4FEE\u6539\uFF0C\u8868\u5355\u63D0\u4EA4\u65F6\u5E26\u4E0A currency \u5B57\u6BB5
        amount: document.getElementById('amount').value === '' ? null : parseFloat(document.getElementById('amount').value),
        isActive: document.getElementById('isActive').checked,
        autoRenew: document.getElementById('autoRenew').checked,
        startDate: document.getElementById('startDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        periodValue: Number(document.getElementById('periodValue').value),
        periodUnit: document.getElementById('periodUnit').value,
        reminderUnit: reminderUnit,
        reminderValue: reminderValue,
        reminderDays: reminderUnit === 'day' ? reminderValue : 0,
        reminderHours: reminderUnit === 'hour' ? reminderValue : undefined,
        useLunar: document.getElementById('useLunar').checked,
        endOfMonth: !!(document.getElementById('endOfMonth') && document.getElementById('endOfMonth').checked && !document.getElementById('useLunar').checked)
      };

      // \u663E\u5F0F\u9644\u5E26\u591A\u89C4\u5219\uFF0C\u907F\u514D window.fetch \u52AB\u6301
      if (window.ReminderRulesEditor && typeof window.ReminderRulesEditor.collect === 'function') {
        subscription.reminderRules = window.ReminderRulesEditor.collect();
      } else if (Array.isArray(window.__pendingReminderRules)) {
        subscription.reminderRules = window.__pendingReminderRules;
      }
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (id ? '\u66F4\u65B0\u4E2D...' : '\u4FDD\u5B58\u4E2D...');
      submitButton.disabled = true;
      
      try {
        const url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
        const method = id ? 'PUT' : 'POST';
        
        const response = await apiFetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast((id ? '\u66F4\u65B0' : '\u6DFB\u52A0') + '\u8BA2\u9605\u6210\u529F', 'success');
          document.getElementById('subscriptionModal').classList.add('hidden');
          document.body.classList.remove('overflow-hidden'); // \u6062\u590D\u80CC\u666F\u6EDA\u52A8
          loadSubscriptions();
        } else {
          showToast((id ? '\u66F4\u65B0' : '\u6DFB\u52A0') + '\u8BA2\u9605\u5931\u8D25: ' + (result.message || '\u672A\u77E5\u9519\u8BEF'), 'error');
        }
      } catch (error) {
        console.error((id ? '\u66F4\u65B0' : '\u6DFB\u52A0') + '\u8BA2\u9605\u5931\u8D25:', error);
        showToast((id ? '\u66F4\u65B0' : '\u6DFB\u52A0') + '\u8BA2\u9605\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
	    // \u65B0\u589E\u4FEE\u6539\uFF0C\u7F16\u8F91\u8BA2\u9605\u65F6\u56DE\u663E useLunar \u5B57\u6BB5
    async function editSubscription(e) {
      const button = e.target.closest('button');
      const id = button ? button.dataset.id : (e.target.dataset.id || e.target.parentElement.dataset.id);
      const originalButtonContent = button?.innerHTML;
      if (button) { button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
      
      try {
        const response = await apiFetch('/api/subscriptions/' + id);
        const subscription = await response.json();
        
        if (subscription) {
          document.getElementById('modalTitle').textContent = '\u7F16\u8F91\u8BA2\u9605';
          document.getElementById('subscriptionId').value = subscription.id;
          document.getElementById('name').value = subscription.name;
          document.getElementById('subscriptionMode').value = subscription.subscriptionMode || 'cycle'; // \u9ED8\u8BA4\u4E3A cycle
          document.getElementById('customType').value = subscription.customType || '';
          document.getElementById('category').value = subscription.category || '';
          document.getElementById('notes').value = subscription.notes || '';
          document.getElementById('amount').value = subscription.amount !== null && subscription.amount !== undefined ? subscription.amount : '';
          document.getElementById('currency').value = subscription.currency || 'CNY'; // \u9ED8\u8BA4\u8BBE\u7F6E\u4E3A CNY
          document.getElementById('isActive').checked = subscription.isActive !== false;
          document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
          document.getElementById('startDate').value = subscription.startDate ? formatDateInputInTimezone(subscription.startDate, globalTimezone) : '';
          document.getElementById('expiryDate').value = subscription.expiryDate ? formatDateInputInTimezone(subscription.expiryDate, globalTimezone) : '';
          document.getElementById('periodValue').value = subscription.periodValue || 1;
          document.getElementById('periodUnit').value = subscription.periodUnit || 'month';
          const endOfMonthEl = document.getElementById('endOfMonth');
          if (endOfMonthEl) endOfMonthEl.checked = !!subscription.endOfMonth && !subscription.useLunar;
          const reminderUnit = subscription.reminderUnit || (subscription.reminderHours !== undefined ? 'hour' : 'day');
          let reminderValue;
          const reminderHint = document.getElementById('reminderHint');
          if (reminderUnit === 'hour') {
            if (subscription.reminderValue !== undefined && subscription.reminderValue !== null) {
              reminderValue = subscription.reminderValue;
            } else if (subscription.reminderHours !== undefined) {
              reminderValue = subscription.reminderHours;
            } else {
              reminderValue = 0;
            }
          } else {
            if (subscription.reminderValue !== undefined && subscription.reminderValue !== null) {
              reminderValue = subscription.reminderValue;
            } else if (subscription.reminderDays !== undefined) {
              reminderValue = subscription.reminderDays;
            } else {
              reminderValue = 7;
            }
          }
          document.getElementById('reminderUnit').value = reminderUnit;
          document.getElementById('reminderValue').value = reminderValue;
          if (reminderHint) {
            reminderHint.textContent = reminderUnit === 'hour'
              ? '\u5C0F\u65F6\u7EA7\u63D0\u9192\uFF1A\u9700\u4FDD\u8BC1 Worker \u6BCF\u5C0F\u65F6\u6267\u884C\uFF1B0 \u8868\u793A\u4EC5\u5230\u671F\u65F6\u63D0\u9192'
              : '0 = \u4EC5\u5728\u5230\u671F\u65F6\u63D0\u9192';
          }
          document.getElementById('useLunar').checked = !!subscription.useLunar;
          
          clearFieldErrors();
          loadLunarPreference();
          document.getElementById('subscriptionModal').classList.remove('hidden');
          document.body.classList.add('overflow-hidden'); // \u7981\u6B62\u80CC\u666F\u6EDA\u52A8
          
          // \u91CD\u8981\uFF1A\u7F16\u8F91\u8BA2\u9605\u65F6\u4E5F\u9700\u8981\u91CD\u65B0\u8BBE\u7F6E\u4E8B\u4EF6\u76D1\u542C\u5668
          setupModalEventListeners();

          // \u66F4\u65B0\u519C\u5386\u663E\u793A
          setTimeout(() => {
            updateLunarDisplay('startDate', 'startDateLunar');
            updateLunarDisplay('expiryDate', 'expiryDateLunar');
            // \u91CD\u8981\uFF1A\u5EF6\u8FDF\u91CA\u653E\u52A0\u8F7D\u9501\uFF0C\u7B49\u5F85 DatePicker \u521D\u59CB\u5316\u89E6\u53D1\u7684 change \u4E8B\u4EF6\u7ED3\u675F
            setTimeout(() => {
                isEditingLoading = false;
            }, 200);
          }, 100);
        }
      } catch (error) {
        console.error('\u83B7\u53D6\u8BA2\u9605\u4FE1\u606F\u5931\u8D25:', error);
        showToast('\u83B7\u53D6\u8BA2\u9605\u4FE1\u606F\u5931\u8D25', 'error');
        isEditingLoading = false;
      } finally {
        if (button) { button.disabled = false; button.innerHTML = originalButtonContent; }
      }
    }
    
    async function deleteSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u8BA2\u9605\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002')) {
        return;
      }
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u5220\u9664\u4E2D...';
      button.disabled = true;
      
      try {
        const response = await apiFetch('/api/subscriptions/' + id, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showToast('\u5220\u9664\u6210\u529F', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast('\u5220\u9664\u5931\u8D25: ' + (error.message || '\u672A\u77E5\u9519\u8BEF'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error('\u5220\u9664\u8BA2\u9605\u5931\u8D25:', error);
        showToast('\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    // \u5168\u5C40\u65F6\u533A\u914D\u7F6E
    let globalTimezone = 'UTC';
    
    // \u68C0\u6D4B\u65F6\u533A\u66F4\u65B0
    function checkTimezoneUpdate() {
      const lastUpdate = localStorage.getItem('timezoneUpdated');
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate);
        const currentTime = Date.now();
        // \u5982\u679C\u65F6\u533A\u66F4\u65B0\u53D1\u751F\u5728\u6700\u8FD15\u79D2\u5185\uFF0C\u5219\u5237\u65B0\u9875\u9762
        if (currentTime - updateTime < 5000) {
          localStorage.removeItem('timezoneUpdated');
          window.location.reload();
        }
      }
    }
    
    // \u9875\u9762\u52A0\u8F7D\u65F6\u68C0\u67E5\u65F6\u533A\u66F4\u65B0
    window.addEventListener('load', () => {
      checkTimezoneUpdate();
      loadSubscriptions();
    });
    
    // \u5B9A\u671F\u68C0\u67E5\u65F6\u533A\u66F4\u65B0\uFF08\u6BCF2\u79D2\u68C0\u67E5\u4E00\u6B21\uFF09
    setInterval(checkTimezoneUpdate, 2000);

    // \u5B9E\u65F6\u663E\u793A\u7CFB\u7EDF\u65F6\u95F4\u548C\u65F6\u533A\uFF08\u524D\u7AEF\u7EDF\u4E00\u672C\u5730\u65F6\u533A\u663E\u793A\uFF09
    async function showSystemTime() {
      try {
        const response = await apiFetch('/api/config');
        const config = await response.json();
        window.DEBUG_LOGS = config.DEBUG_LOGS === true;
        globalTimezone = config.TIMEZONE || 'Asia/Shanghai';

        function formatTimezoneDisplay(tz) {
          try {
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            const timezoneNames = {
              'UTC': '\u4E16\u754C\u6807\u51C6\u65F6\u95F4',
              'Asia/Shanghai': '\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4',
              'Asia/Hong_Kong': '\u9999\u6E2F\u65F6\u95F4',
              'Asia/Taipei': '\u53F0\u5317\u65F6\u95F4',
              'Asia/Singapore': '\u65B0\u52A0\u5761\u65F6\u95F4',
              'Asia/Tokyo': '\u65E5\u672C\u65F6\u95F4',
              'Asia/Seoul': '\u97E9\u56FD\u65F6\u95F4',
              'America/New_York': '\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4',
              'America/Los_Angeles': '\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4',
              'America/Chicago': '\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4',
              'America/Denver': '\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4',
              'Europe/London': '\u82F1\u56FD\u65F6\u95F4',
              'Europe/Paris': '\u5DF4\u9ECE\u65F6\u95F4',
              'Europe/Berlin': '\u67CF\u6797\u65F6\u95F4',
              'Europe/Moscow': '\u83AB\u65AF\u79D1\u65F6\u95F4',
              'Australia/Sydney': '\u6089\u5C3C\u65F6\u95F4',
              'Australia/Melbourne': '\u58A8\u5C14\u672C\u65F6\u95F4',
              'Pacific/Auckland': '\u5965\u514B\u5170\u65F6\u95F4'
            };
            const timezoneName = timezoneNames[tz] || tz;
            return \`\${timezoneName} (UTC\${offsetStr})\`;
          } catch (error) {
            console.error('\u683C\u5F0F\u5316\u65F6\u533A\u663E\u793A\u5931\u8D25:', error);
            return tz;
          }
        }

        function update() {
          const now = new Date();
          const timeStr = now.toLocaleString('zh-CN', {
            timeZone: globalTimezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const tzStr = formatTimezoneDisplay(globalTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = \`\${timeStr}  \${tzStr}\`;
          }
          const mobileEl = document.getElementById('mobileTimeDisplay');
          if (mobileEl) {
            mobileEl.textContent = \`\${timeStr} \${tzStr}\`;
          }
        }

        update();
        setInterval(update, 1000);
        loadSubscriptions();
      } catch (e) {
        const el = document.getElementById('systemTimeDisplay');
        if (el) {
          el.textContent = new Date().toLocaleString();
        }
      }
    }
    showSystemTime();
    // --- \u65B0\u589E\uFF1A\u79FB\u52A8\u7AEF\u83DC\u5355\u63A7\u5236\u811A\u672C ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      const syncMobileMenuState = () => {
        const icon = mobileMenuBtn.querySelector('i');
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('fa-bars', isHidden);
          icon.classList.toggle('fa-times', !isHidden);
        }
      };

      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        syncMobileMenuState();
      });

      mobileMenu.querySelectorAll('a').forEach(link => {  // \u70B9\u51FB\u83DC\u5355\u9879\u81EA\u52A8\u5173\u95ED
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        });
      });

      document.addEventListener('click', (event) => {
        if (mobileMenu.classList.contains('hidden')) return;
        if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      syncMobileMenuState();
    }

    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // \u591A\u63D0\u9192\u89C4\u5219\u7F16\u8F91\u5668\uFF08\u5185\u5D4C\u5728\u8BA2\u9605\u8868\u5355\u4E2D\uFF09
    //   - \u6570\u636E\u5F62\u6001\uFF1A[{ id, type, value, unit, repeatInterval?, repeatUntil?, isEnabled }]
    //   - \u65B0\u5EFA\u8BA2\u9605\u65F6\u9ED8\u8BA4\u6E32\u67D3 4 \u6761\u9884\u8BBE\uFF087/3/1/0 \u5929\uFF09
    //   - \u7F16\u8F91\u8BA2\u9605\u65F6\u901A\u8FC7 /api/subscriptions/:id/reminders \u62C9\u53D6
    //   - \u8868\u5355\u63D0\u4EA4\u65F6\u81EA\u52A8\u6536\u96C6\u5E76\u9644\u52A0\u5728 reminderRules \u5B57\u6BB5
    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    (function () {
      const RULE_TYPES = [
        { value: 'before_expiry', label: '\u5230\u671F\u524D' },
        { value: 'on_expiry', label: '\u5230\u671F\u5F53\u5929' },
        { value: 'after_expiry', label: '\u5230\u671F\u540E' }
      ];
      const UNITS = [
        { value: 'days', label: '\u5929' },
        { value: 'hours', label: '\u5C0F\u65F6' }
      ];
      const REPEAT_UNTIL = [
        { value: 'renewed', label: '\u7EED\u8D39' },
        { value: 'acknowledged', label: '\u624B\u52A8\u786E\u8BA4' },
        { value: 'never', label: '\u4E0D\u505C\u6B62' }
      ];

      function uuid() {
        return (crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'r-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      }

      function defaultPresets() {
        return [
          { id: uuid(), type: 'before_expiry', value: 7, unit: 'days', repeatInterval: null, repeatUntil: 'renewed', isEnabled: true },
          { id: uuid(), type: 'before_expiry', value: 3, unit: 'days', repeatInterval: null, repeatUntil: 'renewed', isEnabled: true },
          { id: uuid(), type: 'before_expiry', value: 1, unit: 'days', repeatInterval: null, repeatUntil: 'renewed', isEnabled: true },
          { id: uuid(), type: 'on_expiry', value: 0, unit: 'days', repeatInterval: null, repeatUntil: 'renewed', isEnabled: true }
        ];
      }

      let rules = [];
      window.__setReminderRules = function (next) {
        rules = Array.isArray(next) ? next.slice() : [];
        render();
      };

      function renderRow(rule) {
        const isAfter = rule.type === 'after_expiry';
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-wrap items-center gap-2 bg-white rounded border border-gray-200 px-2 py-2';
        wrap.dataset.ruleId = rule.id;
        wrap.innerHTML = \`
          <label class="inline-flex items-center text-xs">
            <input type="checkbox" class="rule-enabled mr-1 form-checkbox h-4 w-4 text-indigo-600" \${rule.isEnabled ? 'checked' : ''}>
            <span class="text-gray-600">\u542F\u7528</span>
          </label>
          <select class="rule-type px-2 py-1 text-xs border border-gray-300 rounded bg-white">
            \${RULE_TYPES.map(t => \`<option value="\${t.value}" \${rule.type === t.value ? 'selected' : ''}>\${t.label}</option>\`).join('')}
          </select>
          <input type="number" class="rule-value w-16 px-2 py-1 text-xs border border-gray-300 rounded \${rule.type === 'on_expiry' ? 'opacity-50' : ''}" value="\${rule.value}" min="0" \${rule.type === 'on_expiry' ? 'disabled' : ''}>
          <select class="rule-unit px-2 py-1 text-xs border border-gray-300 rounded bg-white \${rule.type === 'on_expiry' ? 'opacity-50' : ''}" \${rule.type === 'on_expiry' ? 'disabled' : ''}>
            \${UNITS.map(u => \`<option value="\${u.value}" \${rule.unit === u.value ? 'selected' : ''}>\${u.label}</option>\`).join('')}
          </select>
          \${isAfter ? \`
            <span class="text-xs text-gray-500">\u6BCF</span>
            <input type="number" class="rule-repeat-interval w-16 px-2 py-1 text-xs border border-gray-300 rounded" value="\${rule.repeatInterval || 24}" min="1">
            <span class="text-xs text-gray-500">\u5C0F\u65F6\u76F4\u5230</span>
            <select class="rule-repeat-until px-2 py-1 text-xs border border-gray-300 rounded bg-white">
              \${REPEAT_UNTIL.map(u => \`<option value="\${u.value}" \${rule.repeatUntil === u.value ? 'selected' : ''}>\${u.label}</option>\`).join('')}
            </select>
          \` : ''}
          <button type="button" class="rule-delete ml-auto text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded">
            <i class="fas fa-trash"></i>
          </button>
        \`;
        // \u7ED1\u5B9A\u4E8B\u4EF6
        wrap.querySelector('.rule-type').addEventListener('change', () => {
          collect();
          rule.type = wrap.querySelector('.rule-type').value;
          if (rule.type === 'after_expiry' && rule.repeatInterval == null) rule.repeatInterval = 24;
          render();
        });
        wrap.querySelector('.rule-delete').addEventListener('click', () => {
          collect();
          rules = rules.filter(r => r.id !== rule.id);
          render();
        });
        return wrap;
      }

      function collect() {
        const container = document.getElementById('reminderRulesContainer');
        if (!container) return rules;
        const rows = container.querySelectorAll('[data-rule-id]');
        const out = [];
        rows.forEach(row => {
          const rule = rules.find(r => r.id === row.dataset.ruleId);
          if (!rule) return;
          rule.isEnabled = row.querySelector('.rule-enabled').checked;
          rule.type = row.querySelector('.rule-type').value;
          rule.value = Math.max(0, Number(row.querySelector('.rule-value').value) || 0);
          rule.unit = row.querySelector('.rule-unit').value;
          if (rule.type === 'after_expiry') {
            const ri = row.querySelector('.rule-repeat-interval');
            const ru = row.querySelector('.rule-repeat-until');
            rule.repeatInterval = ri ? Math.max(1, Number(ri.value) || 24) : 24;
            rule.repeatUntil = ru ? ru.value : 'renewed';
          } else {
            rule.repeatInterval = null;
            rule.repeatUntil = rule.repeatUntil || 'renewed';
          }
          out.push(rule);
        });
        return out;
      }

      function render() {
        const container = document.getElementById('reminderRulesContainer');
        if (!container) return;
        container.innerHTML = '';
        if (rules.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'text-xs text-gray-500 italic px-2 py-3';
          empty.textContent = '\u5F53\u524D\u6CA1\u6709\u63D0\u9192\u89C4\u5219\uFF1B\u8BA2\u9605\u5230\u671F\u65F6\u4E0D\u4F1A\u53D1\u51FA\u901A\u77E5\u3002\u70B9\u51FB"\u6DFB\u52A0\u89C4\u5219"\u6216"\u5E94\u7528\u9884\u8BBE"\u3002';
          container.appendChild(empty);
          return;
        }
        rules.forEach(r => container.appendChild(renderRow(r)));
      }

      // \u628A\u89C4\u5219\u6570\u636E\u88C5\u8F7D\u8FDB\u7F16\u8F91\u5668
      function setRules(input) {
        rules = (Array.isArray(input) ? input : []).map(r => ({
          id: r.id || uuid(),
          type: r.type || 'before_expiry',
          value: typeof r.value === 'number' ? r.value : 7,
          unit: r.unit || 'days',
          repeatInterval: r.repeatInterval == null ? null : Number(r.repeatInterval),
          repeatUntil: r.repeatUntil || 'renewed',
          isEnabled: r.isEnabled !== false
        }));
        render();
      }

      function getRules() {
        return collect();
      }

      // \u66B4\u9732\u7ED9\u8868\u5355 submit / \u514B\u9686\u903B\u8F91\uFF08\u4E0D\u518D\u52AB\u6301 window.fetch\uFF09
      window.ReminderRulesEditor = {
        setRules,
        collect,
        getRules,
        setPresets: () => setRules(defaultPresets()),
        clear: () => setRules([]),
        defaultPresets
      };
      window.__setReminderRules = setRules;

      // \u6309\u94AE\u4E8B\u4EF6
      document.addEventListener('DOMContentLoaded', () => {
        const addBtn = document.getElementById('reminderRulesAddBtn');
        const presetBtn = document.getElementById('reminderRulesPresetBtn');
        if (addBtn) addBtn.addEventListener('click', () => {
          collect();
          rules.push({
            id: uuid(),
            type: 'before_expiry',
            value: 7,
            unit: 'days',
            repeatInterval: null,
            repeatUntil: 'renewed',
            isEnabled: true
          });
          render();
        });
        if (presetBtn) presetBtn.addEventListener('click', () => setRules(defaultPresets()));
      });

      // \u94A9\u5165"\u65B0\u589E\u8BA2\u9605"\u6309\u94AE\uFF1A\u6E05\u7A7A + \u9ED8\u8BA4\u9884\u8BBE
      const addSubBtn = document.getElementById('addSubscriptionBtn');
      if (addSubBtn) {
        addSubBtn.addEventListener('click', () => {
          // \u5EF6\u8FDF\u4E00\u5E27\u8BA9\u539F\u6709 reset \u6D41\u7A0B\u8DD1\u5B8C
          setTimeout(() => setRules(defaultPresets()), 0);
        });
      }
    })();

    // \u7F16\u8F91\u8BA2\u9605\u65F6\u62C9\u53D6\u89C4\u5219\uFF08\u94A9\u5728 editSubscription / subscription detail \u52A0\u8F7D\u4E4B\u540E\uFF09
    (function () {
      const originalEditSubscription = window.editSubscription;
      // editSubscription \u662F\u9876\u5C42 async \u51FD\u6570\uFF1B\u901A\u8FC7\u70B9\u51FB\u4E8B\u4EF6\u4EE3\u7406\u6765\u94A9\u5165\u66F4\u7A33\u3002
      // \u8FD9\u91CC\u6539\u4E3A\uFF1A\u6BCF\u6B21\u5728 subscriptionId \u5B57\u6BB5\u88AB\u586B\u503C\u540E\u5F02\u6B65 GET \u89C4\u5219\u3002
      const subIdField = document.getElementById('subscriptionId');
      if (!subIdField) return;
      const observer = new MutationObserver(() => {
        const id = subIdField.value;
        if (!id) return;
        fetch('/api/subscriptions/' + id + '/reminders', { credentials: 'same-origin' })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && Array.isArray(data.rules)) {
              if (window.ReminderRulesEditor) window.ReminderRulesEditor.setRules(data.rules);
            }
          })
          .catch(() => { /* ignore */ });
      });
      // \u89C2\u5BDF value \u53D8\u5316\uFF08input \u5143\u7D20\u9700\u8981 listen 'input' / 'change'\uFF0C\u4F46\u6211\u4EEC\u4E5F\u7528 setInterval \u515C\u5E95\uFF09
      subIdField.addEventListener('change', () => observer.observe);
      // \u4E3B\u52A8\u8F6E\u8BE2\uFF1A\u5F53 modal \u4E0D\u9690\u85CF\u5E76\u4E14 subscriptionId \u6709\u503C\u65F6\u540C\u6B65\u4E00\u6B21
      let lastId = '';
      setInterval(() => {
        const modal = document.getElementById('subscriptionModal');
        if (!modal || modal.classList.contains('hidden')) {
          lastId = '';
          return;
        }
        const id = subIdField.value;
        if (id && id !== lastId) {
          lastId = id;
          fetch('/api/subscriptions/' + id + '/reminders', { credentials: 'same-origin' })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (data && Array.isArray(data.rules) && window.ReminderRulesEditor) {
                window.ReminderRulesEditor.setRules(data.rules);
              }
            })
            .catch(() => {});
        }
      }, 500);
    })();
  <\/script>
  <script>
    // \u663E\u793A\u7248\u672C\u53F7
    fetch('/api/version').then(r=>r.json()).then(d=>{
      if(d.version){
        const footer=document.createElement('div');
        footer.className='text-center text-xs text-gray-400 py-4';
        footer.textContent='SubsTracker v'+d.version;
        document.body.appendChild(footer);
      }
    }).catch(()=>{});
  <\/script>
</body>
</html>
`;

// src/views/configPage.html
var configPage_default = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u7CFB\u7EDF\u914D\u7F6E - \u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  \${themeResources} <style>
    
    #toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; gap: 8px; max-width: 380px;
    }
    .toast {
      padding: 12px 36px 12px 16px; border-radius: 8px; position: relative;
      color: white; font-weight: 500; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast .toast-close {
      position: absolute; top: 8px; right: 10px; cursor: pointer;
      opacity: 0.7; font-size: 14px; line-height: 1;
    }
    .toast .toast-close:hover { opacity: 1; }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
    html.dark .toast {
      color: #f9fafb;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    }
    html.dark .toast.success { background-color: #059669; }
    html.dark .toast.error { background-color: #dc2626; }
    html.dark .toast.info { background-color: #2563eb; }
    html.dark .toast.warning { background-color: #d97706; }
    html.dark #floatingSaveBar { background-color: #1f2937; border-color: #374151; }
    html.dark #floatingSaveBar span { color: #d1d5db; }
    
    .config-section { 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 24px; 
    }
    .config-section.active { 
      background-color: #f8fafc; 
      border-color: #6366f1; 
    }
    .config-section.inactive { 
      background-color: #f9fafb; 
      opacity: 0.7; 
    }
    /* === Config Page \u6697\u9ED1\u6A21\u5F0F\u4FEE\u590D === */
    html.dark .config-section {
      border-color: #374151;
    }
    html.dark .config-section.active {
      background-color: rgba(31, 41, 55, 0.5); /* #1f2937 with opacity */
      border-color: #818cf8;
    }
    html.dark .config-section.inactive {
      background-color: #111827;
      opacity: 0.5;
    }
    html.dark .bg-indigo-50 {
        background-color: rgba(55, 65, 81, 0.5) !important; /* \u6DF1\u7070\u8272\u5E26\u900F\u660E */
        border-color: #4b5563 !important;
    }
    html.dark .text-indigo-700 {
        color: #a5b4fc !important; /* \u6D45\u975B\u84DD */
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md relative z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center shrink-0">
          <div class="flex items-center">
            <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
            <span class="font-bold text-xl text-gray-800">\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</span>
          </div>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal hidden md:block pt-1"></span>
        </div>
          
        <div class="hidden md:flex items-center space-x-4 ml-auto">
          <a href="/admin/dashboard" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-chart-line mr-1"></i>\u4EEA\u8868\u76D8
          </a>
          <a href="/admin" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-list mr-1"></i>\u8BA2\u9605\u5217\u8868
          </a>
          <a href="/admin/notify-logs" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-history mr-1"></i>\u901A\u77E5\u5386\u53F2
          </a>
          <a href="/admin/config" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-cog mr-1"></i>\u7CFB\u7EDF\u914D\u7F6E
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-sign-out-alt mr-1"></i>\u9000\u51FA\u767B\u5F55
          </a>
        </div>

        <div class="flex items-center md:hidden ml-auto">
          <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-label="\u5207\u6362\u5BFC\u822A\u83DC\u5355" class="text-gray-600 hover:text-indigo-600 focus:outline-none p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-b border-gray-200 w-full">
      <div class="px-4 pt-2 pb-4 space-y-2">
        <div id="mobileTimeDisplay" class="px-3 py-2 text-xs text-indigo-600 text-right border-b border-gray-100 mb-2"></div>
        <a href="/admin/dashboard" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-chart-line w-6 text-center mr-2"></i>\u4EEA\u8868\u76D8
        </a>
        <a href="/admin" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-list w-6 text-center mr-2"></i>\u8BA2\u9605\u5217\u8868
        </a>
        <a href="/admin/notify-logs" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-history w-6 text-center mr-2"></i>\u901A\u77E5\u5386\u53F2
        </a>
        <a href="/admin/config" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-cog w-6 text-center mr-2"></i>\u7CFB\u7EDF\u914D\u7F6E
        </a>
        <a href="/api/logout" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors">
          <i class="fas fa-sign-out-alt w-6 text-center mr-2"></i>\u9000\u51FA\u767B\u5F55
        </a>
      </div>
    </div>
  </nav>
  
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">\u7CFB\u7EDF\u914D\u7F6E</h2>
      <div id="defaultPasswordBanner" class="hidden mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-sm">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        \u68C0\u6D4B\u5230\u4ECD\u53EF\u80FD\u4F7F\u7528\u9ED8\u8BA4\u7BA1\u7406\u5458\u5BC6\u7801\u3002\u8BF7\u7ACB\u5373\u4FEE\u6539\u4E0B\u65B9\u300C\u7BA1\u7406\u5458\u5BC6\u7801\u300D\u5E76\u4FDD\u5B58\uFF0C\u907F\u514D\u516C\u7F51\u88AB\u63A5\u7BA1\u3002
      </div>
      
      <form id="configForm" class="space-y-8">
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">\u7BA1\u7406\u5458\u8D26\u6237</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="adminUsername" class="block text-sm font-medium text-gray-700">\u7528\u6237\u540D</label>
              <input type="text" id="adminUsername" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label for="adminPassword" class="block text-sm font-medium text-gray-700">\u5BC6\u7801</label>
              <input type="password" id="adminPassword" placeholder="\u5982\u4E0D\u4FEE\u6539\u5BC6\u7801\uFF0C\u8BF7\u7559\u7A7A" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\u5F53\u524D\u5BC6\u7801</p>
            </div>
          </div>
        </div>
        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">\u663E\u793A\u8BBE\u7F6E</h3>
          
          <div class="mb-6">
            <label for="themeModeSelect" class="block text-sm font-medium text-gray-700 mb-1">\u4E3B\u9898\u6A21\u5F0F</label>
            <select id="themeModeSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white sm:text-sm">
              <option value="light">\u{1F31E} \u6D45\u8272\u6A21\u5F0F</option>
              <option value="dark">\u{1F319} \u6697\u9ED1\u6A21\u5F0F</option>
              <option value="system">\u{1F5A5}\uFE0F \u8DDF\u968F\u7CFB\u7EDF</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">\u9009\u62E9\u7CFB\u7EDF\u7684\u5916\u89C2\u98CE\u683C</p>
          </div>
          
          <div class="mb-6">
            <label class="inline-flex items-center">
              <input type="checkbox" id="showLunarGlobal" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
              <span class="ml-2 text-sm text-gray-700">\u5728\u901A\u77E5\u4E2D\u663E\u793A\u519C\u5386\u65E5\u671F</span>
            </label>
            <p class="mt-1 text-sm text-gray-500">\u63A7\u5236\u662F\u5426\u5728\u901A\u77E5\u6D88\u606F\u4E2D\u5305\u542B\u519C\u5386\u65E5\u671F\u4FE1\u606F</p>
          </div>
        </div>


        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">\u65F6\u533A\u8BBE\u7F6E</h3>
          <div class="mb-6">
          <label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">\u65F6\u533A\u9009\u62E9</label>
          <select id="timezone" name="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <optgroup label="\u{1F1E8}\u{1F1F3} \u63A8\u8350">
              <option value="Asia/Shanghai">\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4\uFF08UTC+8\uFF09</option>
            </optgroup>
            <optgroup label="\u5176\u5B83\u5E38\u7528\u65F6\u533A">
              <option value="Asia/Hong_Kong">\u9999\u6E2F\u65F6\u95F4\uFF08UTC+8\uFF09</option>
              <option value="Asia/Taipei">\u53F0\u5317\u65F6\u95F4\uFF08UTC+8\uFF09</option>
              <option value="Asia/Singapore">\u65B0\u52A0\u5761\u65F6\u95F4\uFF08UTC+8\uFF09</option>
              <option value="Asia/Tokyo">\u65E5\u672C\u65F6\u95F4\uFF08UTC+9\uFF09</option>
              <option value="Asia/Seoul">\u97E9\u56FD\u65F6\u95F4\uFF08UTC+9\uFF09</option>
              <option value="UTC">\u4E16\u754C\u6807\u51C6\u65F6\u95F4\uFF08UTC+0\uFF09</option>
              <option value="America/New_York">\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4\uFF08UTC-5\uFF09</option>
              <option value="America/Chicago">\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4\uFF08UTC-6\uFF09</option>
              <option value="America/Denver">\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4\uFF08UTC-7\uFF09</option>
              <option value="America/Los_Angeles">\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4\uFF08UTC-8\uFF09</option>
              <option value="Europe/London">\u82F1\u56FD\u65F6\u95F4\uFF08UTC+0\uFF09</option>
              <option value="Europe/Paris">\u5DF4\u9ECE\u65F6\u95F4\uFF08UTC+1\uFF09</option>
              <option value="Europe/Berlin">\u67CF\u6797\u65F6\u95F4\uFF08UTC+1\uFF09</option>
              <option value="Europe/Moscow">\u83AB\u65AF\u79D1\u65F6\u95F4\uFF08UTC+3\uFF09</option>
              <option value="Australia/Sydney">\u6089\u5C3C\u65F6\u95F4\uFF08UTC+10\uFF09</option>
              <option value="Australia/Melbourne">\u58A8\u5C14\u672C\u65F6\u95F4\uFF08UTC+10\uFF09</option>
              <option value="Pacific/Auckland">\u5965\u514B\u5170\u65F6\u95F4\uFF08UTC+12\uFF09</option>
            </optgroup>
          </select>
            <p class="mt-1 text-sm text-gray-500">\u6240\u6709\u65F6\u95F4\u76F8\u5173\u7684\u5224\u65AD\uFF08\u901A\u77E5\u65F6\u6BB5\u3001\u5269\u4F59\u5929\u6570\u3001\u65E5\u671F\u663E\u793A\uFF09\u90FD\u6309\u6B64\u65F6\u533A\u8BA1\u7B97\u3002\u4E2D\u56FD\u7528\u6237\u4FDD\u6301\u9ED8\u8BA4 <code>Asia/Shanghai</code> \u5373\u53EF\u3002</p>
          </div>
        </div>

        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">\u901A\u77E5\u8BBE\u7F6E</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label for="notificationHours" class="block text-sm font-medium text-gray-700">
                \u5141\u8BB8\u53D1\u9001\u7684\u5C0F\u65F6
                <span id="tzLabelInline" class="text-indigo-600 font-semibold">\uFF08\u6309\u4E0B\u65B9\u65F6\u533A\uFF09</span>
              </label>
              <input type="text" id="notificationHours" placeholder="\u4F8B\u5982\uFF1A8 \u6216 08, 12, 20\uFF1B\u7559\u7A7A\u6216 * = \u6BCF\u5C0F\u65F6\u90FD\u53EF\u53D1"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">
                \u586B 0\u201323 \u7684\u6574\u70B9\uFF08\u53EF\u591A\u4E2A\uFF0C\u9017\u53F7\u5206\u9694\uFF09\u3002\u7CFB\u7EDF\u6BCF\u5C0F\u65F6\u68C0\u67E5\u4E00\u6B21\uFF1A\u53EA\u6709\u300C\u5F53\u524D\u6574\u70B9\u300D\u843D\u5728\u5217\u8868\u91CC\u624D\u4F1A\u53D1\u63D0\u9192\u3002
                <strong>\u7559\u7A7A\u6216\u586B *</strong> \u8868\u793A\u6BCF\u4E2A\u6574\u70B9\u90FD\u53EF\u4EE5\u53D1\u3002
                \u591A\u4E2A\u5C0F\u65F6\u53EA\u662F\u5141\u8BB8\u53D1\u9001\u7684\u65F6\u95F4\u7A97\u53E3\uFF1B\u540C\u4E00\u8BA2\u9605\u7684\u540C\u4E00\u65E5\u7EA7\u89C4\u5219\u5F53\u5929\u6210\u529F\u53D1\u9001\u540E\u4E0D\u4F1A\u518D\u6B21\u53D1\u9001\u3002
              </p>
              <div id="tzWindowPreview" class="mt-2 p-3 rounded-md border border-gray-200 bg-gray-50 text-sm leading-relaxed"></div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
              <p class="font-semibold mb-1"><i class="fas fa-lightbulb mr-1"></i>\u600E\u4E48\u7406\u89E3\uFF1F</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>\u4E0A\u9762\u9009\u7684<strong>\u65F6\u533A</strong>\u51B3\u5B9A\u300C\u73B0\u5728\u51E0\u70B9\u300D\u2014\u2014\u4E2D\u56FD\u7528\u6237\u4E00\u822C\u9009 <b>Asia/Shanghai\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09</b>\u3002</li>
                <li>\u586B <code>08</code> = \u53EA\u5728<strong>\u5317\u4EAC\u65F6\u95F4\u65E9\u4E0A 8 \u70B9\u90A3\u4E00\u5C0F\u65F6</strong>\u53D1\uFF08\u7EA6 8:00\u20138:59\uFF09\u3002</li>
                <li>\u73B0\u5728\u82E5\u662F 19 \u70B9\uFF0C\u586B\u4E86 08\uFF0C\u5219<strong>\u4E0D\u4F1A\u53D1</strong>\uFF0C\u4EFB\u52A1\u5386\u53F2\u4F1A\u5199\u300C\u4E0D\u5728\u5141\u8BB8\u53D1\u9001\u7684\u5C0F\u65F6\u300D\u2014\u2014\u8FD9\u662F\u6B63\u5E38\u7684\u3002</li>
                <li>\u6539\u5B8C\u540E\u8BF7\u70B9\u300C\u4FDD\u5B58\u914D\u7F6E\u300D\u624D\u4F1A\u751F\u6548\uFF1B\u4E0B\u65B9\u9884\u89C8\u4F1A\u6309\u8F93\u5165\u6846\u5185\u5BB9\u5B9E\u65F6\u5224\u65AD\u3002</li>
              </ul>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">\u901A\u77E5\u65B9\u5F0F\uFF08\u53EF\u591A\u9009\uFF09</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="telegram" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Telegram</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="notifyx" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
                <span class="ml-2 text-sm text-gray-700 font-semibold">NotifyX</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="webhook" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Webhook \u901A\u77E5</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="wechatbot" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="email" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">\u90AE\u4EF6\u901A\u77E5</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="bark" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Bark</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="gotify" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Gotify</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="serverchan" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Server\u9171</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="ntfy" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">ntfy</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="pushplus" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">PushPlus</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="wpush" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">WPUSH</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="enabledNotifiers" value="dingtalk" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">\u9489\u9489\u901A\u77E5</span>
              </label>
            </div>
            <div class="mt-2 flex flex-wrap gap-4">
              <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> NotifyX\u5B98\u7F51
              </a>
              <a href="https://webhook.site" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> Webhook \u8C03\u8BD5\u5DE5\u5177
              </a>
              <a href="https://developer.work.weixin.qq.com/document/path/91770" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> \u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u6587\u6863
              </a>
              <a href="https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> \u83B7\u53D6 Resend API Key
              </a>
              <a href="https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> Bark iOS\u5E94\u7528
              </a>
              <a href="https://sct.ftqq.com/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> Server\u9171\u5B98\u7F51
              </a>
              <a href="https://www.pushplus.plus/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> PushPlus\u5B98\u7F51
              </a>
              <a href="https://wpush.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> WPUSH\u5B98\u7F51
              </a>
            </div>
          </div>

          <div class="mb-6">
            <label for="thirdPartyToken" class="block text-sm font-medium text-gray-700">\u7B2C\u4E09\u65B9 API \u8BBF\u95EE\u4EE4\u724C</label>
            <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <input type="text" id="thirdPartyToken" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0"
                class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <button type="button" id="generateThirdPartyToken" class="btn-info text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-magic mr-2"></i>\u751F\u6210\u4EE4\u724C
              </button>
              <button type="button" id="clearThirdPartyToken" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
              </button>
            </div>
            <p id="THIRD_PARTY_API_TOKENStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
            <p class="mt-1 text-sm text-gray-500">\u8C03\u7528 /api/notify/{token} \u63A5\u53E3\u65F6\u9700\u643A\u5E26\u6B64\u4EE4\u724C\uFF1B\u7559\u7A7A\u8868\u793A\u7981\u7528\u7B2C\u4E09\u65B9 API \u63A8\u9001\u3002</p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">\u8C03\u8BD5\u8BBE\u7F6E</label>
            <label class="inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" id="debugLogs" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
              <span class="ml-2 text-sm text-gray-700">\u5F00\u542F\u8C03\u8BD5\u65E5\u5FD7\uFF08\u5F71\u54CD\u63A7\u5236\u53F0\u8F93\u51FA\uFF09</span>
            </label>
          </div>

          <div class="mb-6">
            <label for="paymentHistoryLimit" class="block text-sm font-medium text-gray-700">\u652F\u4ED8\u5386\u53F2\u4FDD\u7559\u6761\u6570</label>
            <input type="number" id="paymentHistoryLimit" min="10" max="1000" step="1"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="\u9ED8\u8BA4 100">
            <p class="mt-1 text-sm text-gray-500">\u81EA\u52A8\u7EED\u8BA2\u4E0E\u624B\u52A8\u7EED\u8BA2\u540E\u4EC5\u4FDD\u7559\u6700\u8FD1 N \u6761\u652F\u4ED8\u5386\u53F2\uFF08\u5EFA\u8BAE 50~200\uFF0C\u9ED8\u8BA4 100\uFF09\u3002</p>
          </div>
          
          <div id="telegramConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Telegram \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="tgBotToken" class="block text-sm font-medium text-gray-700">Bot Token</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="tgBotToken" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearTgBotToken" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="TG_BOT_TOKENStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
              </div>
              <div>
                <label for="tgChatId" class="block text-sm font-medium text-gray-700">Chat ID</label>
                <input type="text" id="tgChatId" placeholder="\u53EF\u4ECE @userinfobot \u83B7\u53D6" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="tgTopicId" class="block text-sm font-medium text-gray-700">Topic ID\uFF08\u53EF\u9009\uFF09</label>
                <input type="text" id="tgTopicId" placeholder="Forum \u7FA4\u7EC4\u8BDD\u9898 ID\uFF0C\u5BF9\u5E94 message_thread_id" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-xs text-gray-500">\u4EC5\u5728\u5F00\u542F Topics \u7684\u7FA4\u7EC4\u4E2D\u586B\u5199\uFF1B\u7559\u7A7A\u5219\u53D1\u9001\u5230\u666E\u901A\u4F1A\u8BDD/\u7FA4\u7EC4\u3002</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testTelegramBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 Telegram \u901A\u77E5
              </button>
            </div>
          </div>
          
          <div id="notifyxConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">NotifyX \u914D\u7F6E</h4>
            <div class="mb-4">
              <label for="notifyxApiKey" class="block text-sm font-medium text-gray-700">API Key</label>
              <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <input type="text" id="notifyxApiKey" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <button type="button" id="clearNotifyxApiKey" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                  <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                </button>
              </div>
              <p id="NOTIFYX_API_KEYStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
              <p class="mt-1 text-sm text-gray-500">\u4ECE <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800">NotifyX\u5E73\u53F0</a> \u83B7\u53D6\u7684 API Key</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNotifyXBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 NotifyX \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="webhookConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Webhook \u901A\u77E5 \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="webhookUrl" class="block text-sm font-medium text-gray-700">Webhook \u901A\u77E5 URL</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="url" id="webhookUrl" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearWebhookUrl" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="WEBHOOK_URLStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u8BF7\u586B\u5199\u81EA\u5EFA\u670D\u52A1\u6216\u7B2C\u4E09\u65B9\u5E73\u53F0\u63D0\u4F9B\u7684 Webhook \u5730\u5740\uFF0C\u4F8B\u5982 <code>https://your-webhook-endpoint.com/path</code></p>
              </div>
              <div>
                <label for="webhookMethod" class="block text-sm font-medium text-gray-700">\u8BF7\u6C42\u65B9\u6CD5</label>
                <select id="webhookMethod" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div>
                <label for="webhookHeaders" class="block text-sm font-medium text-gray-700">\u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934 (JSON\u683C\u5F0F\uFF0C\u53EF\u9009)</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-start gap-3">
                  <textarea id="webhookHeaders" rows="3" placeholder='\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0' class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                  <button type="button" id="clearWebhookHeaders" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="WEBHOOK_HEADERSStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">JSON\u683C\u5F0F\u7684\u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\uFF0C\u7559\u7A7A\u4F7F\u7528\u9ED8\u8BA4</p>
              </div>
              <div>
                <label for="webhookTemplate" class="block text-sm font-medium text-gray-700">\u6D88\u606F\u6A21\u677F (JSON\u683C\u5F0F\uFF0C\u53EF\u9009)</label>
                <textarea id="webhookTemplate" rows="4" placeholder='{"title": "{{title}}", "content": "{{content}}", "timestamp": "{{timestamp}}"}' class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                <p class="mt-1 text-sm text-gray-500">\u652F\u6301\u53D8\u91CF: {{title}}, {{content}}, {{timestamp}}\u3002\u7559\u7A7A\u4F7F\u7528\u9ED8\u8BA4\u683C\u5F0F</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testWebhookBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 Webhook \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="wechatbotConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="wechatbotWebhook" class="block text-sm font-medium text-gray-700">\u673A\u5668\u4EBA Webhook URL</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="url" id="wechatbotWebhook" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearWechatbotWebhook" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="WECHATBOT_WEBHOOKStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE\u4F01\u4E1A\u5FAE\u4FE1\u7FA4\u804A\u4E2D\u6DFB\u52A0\u673A\u5668\u4EBA\u83B7\u53D6\u7684 Webhook URL</p>
              </div>
              <div>
                <label for="wechatbotMsgType" class="block text-sm font-medium text-gray-700">\u6D88\u606F\u7C7B\u578B</label>
                <select id="wechatbotMsgType" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="text">\u6587\u672C\u6D88\u606F</option>
                  <option value="markdown">Markdown\u6D88\u606F</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">\u9009\u62E9\u53D1\u9001\u7684\u6D88\u606F\u683C\u5F0F\u7C7B\u578B</p>
              </div>
              <div>
                <label for="wechatbotAtMobiles" class="block text-sm font-medium text-gray-700">@\u624B\u673A\u53F7 (\u53EF\u9009)</label>
                <input type="text" id="wechatbotAtMobiles" placeholder="13800138000,13900139000" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u9700\u8981@\u7684\u624B\u673A\u53F7\uFF0C\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694\uFF0C\u7559\u7A7A\u5219\u4E0D@\u4EFB\u4F55\u4EBA</p>
              </div>
              <div>
                <label for="wechatbotAtAll" class="block text-sm font-medium text-gray-700 mb-2">@\u6240\u6709\u4EBA</label>
                <label class="inline-flex items-center">
                  <input type="checkbox" id="wechatbotAtAll" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-700">\u53D1\u9001\u6D88\u606F\u65F6@\u6240\u6709\u4EBA</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testWechatBotBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 \u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA
              </button>
            </div>
          </div>

          <div id="emailConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">\u90AE\u4EF6\u901A\u77E5 \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="resendApiKey" class="block text-sm font-medium text-gray-700">Resend API Key</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="resendApiKey" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearResendApiKey" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="RESEND_API_KEYStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE <a href="https://resend.com/api-keys" target="_blank" class="text-indigo-600 hover:text-indigo-800">Resend\u63A7\u5236\u53F0</a> \u83B7\u53D6\u7684 API Key</p>
              </div>
              <div>
                <label for="emailFrom" class="block text-sm font-medium text-gray-700">\u53D1\u4EF6\u4EBA\u90AE\u7BB1</label>
                <input type="email" id="emailFrom" placeholder="noreply@yourdomain.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u5FC5\u987B\u662F\u5DF2\u5728Resend\u9A8C\u8BC1\u7684\u57DF\u540D\u90AE\u7BB1</p>
              </div>
              <div>
                <label for="emailFromName" class="block text-sm font-medium text-gray-700">\u53D1\u4EF6\u4EBA\u540D\u79F0</label>
                <input type="text" id="emailFromName" placeholder="\u8BA2\u9605\u63D0\u9192\u7CFB\u7EDF" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u663E\u793A\u5728\u90AE\u4EF6\u4E2D\u7684\u53D1\u4EF6\u4EBA\u540D\u79F0</p>
              </div>
              <div>
                <label for="emailTo" class="block text-sm font-medium text-gray-700">\u6536\u4EF6\u4EBA\u90AE\u7BB1</label>
                <input type="email" id="emailTo" placeholder="user@example.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u63A5\u6536\u901A\u77E5\u90AE\u4EF6\u7684\u90AE\u7BB1\u5730\u5740</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testEmailBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 \u90AE\u4EF6\u901A\u77E5
              </button>
            </div>
          </div>

          <div id="barkConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Bark \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="barkServer" class="block text-sm font-medium text-gray-700">\u670D\u52A1\u5668\u5730\u5740</label>
                <input type="url" id="barkServer" placeholder="https://api.day.app" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">Bark \u670D\u52A1\u5668\u5730\u5740\uFF0C\u9ED8\u8BA4\u4E3A\u5B98\u65B9\u670D\u52A1\u5668\uFF0C\u4E5F\u53EF\u4EE5\u4F7F\u7528\u81EA\u5EFA\u670D\u52A1\u5668</p>
              </div>
              <div>
                <label for="barkDeviceKey" class="block text-sm font-medium text-gray-700">\u8BBE\u5907Key</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="barkDeviceKey" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearBarkDeviceKey" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="BARK_DEVICE_KEYStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE <a href="https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865" target="_blank" class="text-indigo-600 hover:text-indigo-800">Bark iOS \u5E94\u7528</a> \u4E2D\u83B7\u53D6\u7684\u8BBE\u5907Key</p>
              </div>
              <div>
                <label for="barkIsArchive" class="block text-sm font-medium text-gray-700 mb-2">\u4FDD\u5B58\u63A8\u9001</label>
                <label class="inline-flex items-center">
                  <input type="checkbox" id="barkIsArchive" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-700">\u4FDD\u5B58\u63A8\u9001\u5230\u5386\u53F2\u8BB0\u5F55</span>
                </label>
                <p class="mt-1 text-sm text-gray-500">\u52FE\u9009\u540E\u63A8\u9001\u6D88\u606F\u4F1A\u4FDD\u5B58\u5230 Bark \u7684\u5386\u53F2\u8BB0\u5F55\u4E2D</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testBarkBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 Bark \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="gotifyConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Gotify \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="gotifyServerUrl" class="block text-sm font-medium text-gray-700">Server URL</label>
                <input type="url" id="gotifyServerUrl" placeholder="https://gotify.example.com" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u4F60\u7684 Gotify \u670D\u52A1\u5730\u5740\uFF08\u4E0D\u9700\u8981\u5E26 /message\uFF09\u3002</p>
              </div>
              <label for="gotifyAppToken" class="block text-sm font-medium text-gray-700">Application Token</label>
              <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <input type="text" id="gotifyAppToken" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <button type="button" id="clearGotifyAppToken" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                  <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                </button>
              </div>
              <p id="GOTIFY_APP_TOKENStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testGotifyBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 Gotify \u901A\u77E5
              </button>
            </div>
          </div>

          
          <div id="ntfyConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">ntfy \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="ntfyServer" class="block text-sm font-medium text-gray-700">Server URL</label>
                <input type="url" id="ntfyServer" placeholder="https://ntfy.sh" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u516C\u5171\u670D\u52A1\u5668\u53EF\u7528 https://ntfy.sh\uFF0C\u4E5F\u53EF\u586B\u81EA\u5EFA\u5730\u5740\u3002</p>
              </div>
              <div>
                <label for="ntfyTopic" class="block text-sm font-medium text-gray-700">Topic\uFF08\u4E3B\u9898\uFF09</label>
                <input type="text" id="ntfyTopic" placeholder="\u4F8B\u5982 my-substracker-alerts" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div class="md:col-span-2">
                <label for="ntfyToken" class="block text-sm font-medium text-gray-700">Access Token\uFF08\u53EF\u9009\uFF09</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="ntfyToken" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u53D7\u4FDD\u62A4\u4E3B\u9898\u65F6\u586B\u5199" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearNtfyToken" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="NTFY_TOKENStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNtfyBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 ntfy \u901A\u77E5
              </button>
            </div>
          </div>

<div id="serverchanConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Server\u9171 \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="serverchanSendKey" class="block text-sm font-medium text-gray-700">SendKey</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="serverchanSendKey" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearServerchanSendKey" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="SERVERCHAN_SENDKEYStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE <a href="https://sct.ftqq.com/" target="_blank" class="text-indigo-600 hover:text-indigo-800">Server\u9171</a> \u83B7\u53D6 SendKey</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testServerchanBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 Server\u9171 \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="pushplusConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">PushPlus \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="pushplusToken" class="block text-sm font-medium text-gray-700">Token</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="pushplusToken" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearPushplusToken" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="PUSHPLUS_TOKENStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
              </div>
              <div>
                <label for="pushplusTopic" class="block text-sm font-medium text-gray-700">\u7FA4\u7EC4\u7F16\u7801 Topic\uFF08\u53EF\u9009\uFF09</label>
                <input type="text" id="pushplusTopic" placeholder="\u7559\u7A7A\u5219\u53D1\u9001\u5230\u4E2A\u4EBA\u6E20\u9053" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="pushplusChannel" class="block text-sm font-medium text-gray-700">\u6E20\u9053\uFF08\u53EF\u9009\uFF09</label>
                <select id="pushplusChannel" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">\u9ED8\u8BA4</option>
                  <option value="wechat">\u5FAE\u4FE1\u516C\u4F17\u53F7</option>
                  <option value="mail">\u90AE\u4EF6</option>
                  <option value="sms">\u77ED\u4FE1</option>
                  <option value="webhook">Webhook</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">\u5177\u4F53\u53EF\u7528\u6E20\u9053\u4EE5 PushPlus \u5E73\u53F0\u652F\u6301\u60C5\u51B5\u4E3A\u51C6</p>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testPushplusBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 PushPlus \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="wpushConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">WPUSH \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="wpushApikey" class="block text-sm font-medium text-gray-700">API Key</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="text" id="wpushApikey" placeholder="\u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539\uFF1B\u8F93\u5165\u65B0\u503C\u5C06\u66F4\u65B0" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearWpushApikey" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="WPUSH_APIKEYStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE <a href="https://wpush.cn/settings" target="_blank" class="text-indigo-600 hover:text-indigo-800">WPUSH \u8BBE\u7F6E\u9875</a> \u83B7\u53D6 API Key</p>
              </div>
              <div>
                <label for="wpushChannel" class="block text-sm font-medium text-gray-700">\u6E20\u9053\uFF08\u53EF\u9009\uFF09</label>
                <select id="wpushChannel" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="">\u9ED8\u8BA4</option>
                  <option value="wechat">\u5FAE\u4FE1\u516C\u4F17\u53F7</option>
                  <option value="app">App</option>
                  <option value="sms">\u77ED\u4FE1</option>
                  <option value="mail">\u90AE\u4EF6</option>
                  <option value="webhook">Webhook</option>
                  <option value="dingtalk">\u9489\u9489</option>
                  <option value="feishu">\u98DE\u4E66</option>
                  <option value="wechat_work">\u4F01\u4E1A\u5FAE\u4FE1</option>
                  <option value="clawbot">\u5FAE\u4FE1 ClawBot</option>
                  <option value="qqbot">QQ \u673A\u5668\u4EBA</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">\u5177\u4F53\u53EF\u7528\u6E20\u9053\u4EE5 <a href="https://wpush.cn/docs" target="_blank" class="text-indigo-600 hover:text-indigo-800">WPUSH \u6587\u6863</a> \u4E3A\u51C6</p>
              </div>
              <div>
                <label for="wpushTopicCode" class="block text-sm font-medium text-gray-700">Topic \u7F16\u7801\uFF08\u53EF\u9009\uFF09</label>
                <input type="text" id="wpushTopicCode" placeholder="\u7559\u7A7A\u5219\u6309\u4E2A\u4EBA\u6E20\u9053\u63A8\u9001" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testWpushBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 WPUSH \u901A\u77E5
              </button>
            </div>
          </div>

          <div id="dingtalkConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">\u9489\u9489\u901A\u77E5 \u914D\u7F6E</h4>
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label for="dingtalkWebhook" class="block text-sm font-medium text-gray-700">\u9489\u9489\u673A\u5668\u4EBA Webhook URL</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="url" id="dingtalkWebhook" placeholder="https://oapi.dingtalk.com/robot/send?access_token=your-token" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearDingtalkWebhook" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="DINGTALK_WEBHOOKStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u4ECE\u9489\u9489\u7FA4\u804A\u4E2D\u6DFB\u52A0\u673A\u5668\u4EBA\u83B7\u53D6\u7684 Webhook URL</p>
              </div>
              <div>
                <label for="dingtalkSecret" class="block text-sm font-medium text-gray-700">\u7B7E\u540D\u5BC6\u94A5\uFF08\u53EF\u9009\uFF09</label>
                <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input type="password" id="dingtalkSecret" placeholder="SEC\u5F00\u5934\u7684\u52A0\u7B7E\u5BC6\u94A5" class="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <button type="button" id="clearDingtalkSecret" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                    <i class="fas fa-eraser mr-2"></i>\u6E05\u7A7A
                  </button>
                </div>
                <p id="DINGTALK_SECRETStatus" class="mt-1 text-xs text-gray-500">\u52A0\u8F7D\u4E2D...</p>
                <p class="mt-1 text-sm text-gray-500">\u9489\u9489\u673A\u5668\u4EBA\u5B89\u5168\u8BBE\u7F6E\u9009\u300C\u52A0\u7B7E\u300D\u65F6\u586B\u5199\uFF0C\u7559\u7A7A\u8868\u793A\u672A\u542F\u7528\u52A0\u7B7E</p>
              </div>
              <div>
                <label for="dingtalkMsgType" class="block text-sm font-medium text-gray-700">\u6D88\u606F\u7C7B\u578B</label>
                <select id="dingtalkMsgType" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="text">\u6587\u672C\u6D88\u606F</option>
                  <option value="markdown">Markdown\u6D88\u606F</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">\u9009\u62E9\u53D1\u9001\u7684\u6D88\u606F\u683C\u5F0F\u7C7B\u578B</p>
              </div>
              <div>
                <label for="dingtalkAtMobiles" class="block text-sm font-medium text-gray-700">@\u624B\u673A\u53F7 (\u53EF\u9009)</label>
                <input type="text" id="dingtalkAtMobiles" placeholder="13800138000,13900139000" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <p class="mt-1 text-sm text-gray-500">\u9700\u8981@\u7684\u624B\u673A\u53F7\uFF0C\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694\uFF0C\u7559\u7A7A\u5219\u4E0D@\u4EFB\u4F55\u4EBA</p>
              </div>
              <div>
                <label for="dingtalkAtAll" class="block text-sm font-medium text-gray-700 mb-2">@\u6240\u6709\u4EBA</label>
                <label class="inline-flex items-center">
                  <input type="checkbox" id="dingtalkAtAll" class="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                  <span class="ml-2 text-sm text-gray-700">\u53D1\u9001\u6D88\u606F\u65F6@\u6240\u6709\u4EBA</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testDingTalkBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>\u6D4B\u8BD5 \u9489\u9489\u901A\u77E5
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" class="btn-primary text-white px-6 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>\u4FDD\u5B58\u914D\u7F6E
          </button>
        </div>
      </form>

      <!-- \u5907\u4EFD\u4E0E\u6062\u590D\uFF08\u4E0D\u5728 configForm \u5185\uFF0C\u907F\u514D\u89E6\u53D1\u8868\u5355\u63D0\u4EA4\uFF09 -->
      <div class="config-section active mt-8" id="backupSection">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          <i class="fas fa-file-export text-indigo-500 mr-2"></i>\u6570\u636E\u5907\u4EFD\u4E0E\u6062\u590D
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          \u5BFC\u51FA\u7CFB\u7EDF\u914D\u7F6E\u3001\u8BA2\u9605\u5217\u8868\u4E0E\u63D0\u9192\u89C4\u5219\uFF0C\u4FBF\u4E8E\u6362\u8D26\u53F7\u90E8\u7F72\u6216\u5347\u7EA7\u8FC1\u79FB\u3002
          \u9ED8\u8BA4\u5BFC\u51FA<strong>\u4E0D\u542B</strong> Bot Token / API Key \u7B49\u5BC6\u94A5\uFF1B\u9700\u8981\u65F6\u53EF\u52FE\u9009\u300C\u5305\u542B\u654F\u611F\u914D\u7F6E\u300D\u3002
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-download mr-1"></i>\u5BFC\u51FA\u5907\u4EFD</h4>
            <label class="inline-flex items-center text-sm text-gray-700 mb-3 cursor-pointer">
              <input type="checkbox" id="exportIncludeSecrets" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300">
              <span class="ml-2">\u5305\u542B\u654F\u611F\u914D\u7F6E\uFF08Token / \u5BC6\u7801\u7B49\uFF09</span>
            </label>
            <p class="text-xs text-amber-600 mb-3">\u52FE\u9009\u540E\u8BF7\u59A5\u5584\u4FDD\u7BA1 JSON \u6587\u4EF6\uFF0C\u52FF\u4E0A\u4F20\u516C\u5F00\u4ED3\u5E93\u3002</p>
            <button type="button" id="exportBackupBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
              <i class="fas fa-file-download mr-2"></i>\u4E0B\u8F7D\u5907\u4EFD JSON
            </button>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-upload mr-1"></i>\u5BFC\u5165\u6062\u590D</h4>
            <input type="file" id="importBackupFile" accept="application/json,.json" class="block w-full text-sm text-gray-600 mb-3">
            <div class="flex flex-col gap-2 mb-3">
              <label class="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="importMode" value="merge" class="form-radio h-4 w-4 text-indigo-600" checked>
                <span class="ml-2">\u5408\u5E76\uFF08\u6309 ID \u8986\u76D6\u540C\u540D\u8BA2\u9605\uFF0C\u4FDD\u7559\u5176\u4F59\uFF09</span>
              </label>
              <label class="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="importMode" value="replace" class="form-radio h-4 w-4 text-indigo-600">
                <span class="ml-2">\u8986\u76D6\uFF08\u5220\u9664\u73B0\u6709\u8BA2\u9605\u540E\u6574\u5305\u5BFC\u5165\uFF09</span>
              </label>
              <label class="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" id="importIncludeSecrets" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300">
                <span class="ml-2">\u5E94\u7528\u5907\u4EFD\u4E2D\u7684\u654F\u611F\u914D\u7F6E\uFF08\u4EC5\u5F53\u5907\u4EFD\u542B\u5BC6\u94A5\u65F6\u6709\u6548\uFF09</span>
              </label>
            </div>
            <button type="button" id="importBackupBtn" class="btn-warning text-white px-4 py-2 rounded-md text-sm font-medium">
              <i class="fas fa-file-import mr-2"></i>\u4ECE\u6587\u4EF6\u6062\u590D
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- \u60AC\u6D6E\u4FDD\u5B58\u680F -->
  <div id="floatingSaveBar" class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-3 px-6 flex justify-between items-center z-50 transform translate-y-full transition-transform duration-300" style="display:none;">
    <span class="text-sm text-gray-600"><i class="fas fa-exclamation-circle text-yellow-500 mr-2"></i>\u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539</span>
    <button type="button" onclick="document.getElementById('configForm').requestSubmit()" class="btn-primary text-white px-5 py-2 rounded-md text-sm font-medium">
      <i class="fas fa-save mr-2"></i>\u4FDD\u5B58\u914D\u7F6E
    </button>
  </div>

  <script>
    // \u7EDF\u4E00 API \u8BF7\u6C42\u5C01\u88C5\uFF1A401 \u81EA\u52A8\u8DF3\u8F6C\u767B\u5F55\u9875
    async function apiFetch(url, options) {
      const response = await fetch(url, options);
      if (response.status === 401) {
        showToast('\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u6B63\u5728\u8DF3\u8F6C\u767B\u5F55\u9875...', 'warning');
        setTimeout(() => { window.location.href = '/'; }, 1000);
        throw new Error('AUTH_EXPIRED');
      }
      return response;
    }

    function showToast(message, type = 'success', duration) {
      if (!duration) duration = type === 'error' ? 6000 : type === 'warning' ? 4500 : 3000;
      const container = document.getElementById('toast-container');
      while (container.children.length >= 5) container.removeChild(container.firstChild);

      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span class="toast-msg"></span></div><span class="toast-close" onclick="this.parentElement.remove()">&times;</span>';
      toast.querySelector('.toast-msg').textContent = message;
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 50);
      const timer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 300);
      }, duration);
      toast.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
    }

    // \u8BB0\u5F55\u7528\u6237\u662F\u5426\u70B9\u51FB\u4E86\u201C\u6E05\u7A7A\u201D\u67D0\u4E2A\u5BC6\u94A5\u5B57\u6BB5\uFF1B\u4FDD\u5B58\u65F6\u4F1A\u63D0\u4EA4\u7ED9\u540E\u7AEF\u5904\u7406
    const CLEAR_SECRET_FIELDS = new Set();

    function setSecretStatus(key, text) {
      const el = document.getElementById(key + 'Status');
      if (!el) return;
      el.textContent = text;
    }

    function updateAllSecretStatus() {
      const cfg = window.SECRET_CONFIGURED || {};
      setSecretStatus('TG_BOT_TOKEN', cfg.TG_BOT_TOKEN ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('NOTIFYX_API_KEY', cfg.NOTIFYX_API_KEY ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('WEBHOOK_URL', cfg.WEBHOOK_URL ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('WEBHOOK_HEADERS', cfg.WEBHOOK_HEADERS ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('WECHATBOT_WEBHOOK', cfg.WECHATBOT_WEBHOOK ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('RESEND_API_KEY', cfg.RESEND_API_KEY ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('BARK_DEVICE_KEY', cfg.BARK_DEVICE_KEY ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('THIRD_PARTY_API_TOKEN', cfg.THIRD_PARTY_API_TOKEN ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('GOTIFY_APP_TOKEN', cfg.GOTIFY_APP_TOKEN ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('SERVERCHAN_SENDKEY', cfg.SERVERCHAN_SENDKEY ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('PUSHPLUS_TOKEN', cfg.PUSHPLUS_TOKEN ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('WPUSH_APIKEY', cfg.WPUSH_APIKEY ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('DINGTALK_WEBHOOK', cfg.DINGTALK_WEBHOOK ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
      setSecretStatus('DINGTALK_SECRET', cfg.DINGTALK_SECRET ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
    }

    function wireSecretInput(inputId, key) {
      const input = document.getElementById(inputId);
      if (!input) return;
      input.addEventListener('input', () => {
        const value = input.value.trim();
        if (value.length > 0) {
          // \u7528\u6237\u8F93\u5165\u4E86\u65B0\u503C\uFF0C\u89C6\u4E3A\u5C06\u88AB\u66F4\u65B0
          CLEAR_SECRET_FIELDS.delete(key);
          setSecretStatus(key, '\u5C06\u66F4\u65B0\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09');
        } else {
          // \u7A7A\u8868\u793A\u201C\u4E0D\u4FEE\u6539\u201D\uFF08\u9ED8\u8BA4\uFF09
          const cfg = window.SECRET_CONFIGURED || {};
          setSecretStatus(key, cfg[key] ? '\u5DF2\u914D\u7F6E\uFF08\u5DF2\u9690\u85CF\uFF09' : '\u672A\u914D\u7F6E');
        }
      });
    }

    function wireClearSecretButton(buttonId, inputId, key) {
      const btn = document.getElementById(buttonId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;
      btn.addEventListener('click', () => {
        input.value = '';
        CLEAR_SECRET_FIELDS.add(key);
        setSecretStatus(key, '\u5C06\u6E05\u7A7A\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09');
        showToast('\u5DF2\u6807\u8BB0\u6E05\u7A7A\uFF1A' + key + '\uFF08\u70B9\u51FB\u201C\u4FDD\u5B58\u914D\u7F6E\u201D\u540E\u751F\u6548\uFF09', 'warning', 4500);
      });
    }

    async function loadConfig() {
      try {
        const response = await apiFetch('/api/config');
        const config = await response.json();

        // === \u5B89\u5168\u7B56\u7565 ===
        // 1) \u6240\u6709 token/\u5BC6\u94A5\u7C7B\u5B57\u6BB5\uFF0C\u540E\u7AEF\u4E0D\u4F1A\u4E0B\u53D1\u771F\u5B9E\u503C\uFF1B\u8FD9\u91CC\u53EA\u663E\u793A\u201C\u5DF2\u914D\u7F6E(\u9690\u85CF)\u201D\u72B6\u6001\u3002
        // 2) \u4E0D\u586B\u5199 token/\u5BC6\u94A5\u5B57\u6BB5\u5E76\u4FDD\u5B58\u65F6\uFF0C\u540E\u7AEF\u4F1A\u4FDD\u6301\u539F\u503C\u4E0D\u53D8\u3002
        // 3) \u5982\u9700\u6E05\u7A7A\uFF0C\u8BF7\u70B9\u5BF9\u5E94\u7684\u201C\u6E05\u7A7A\u201D\u6309\u94AE\uFF08\u4F1A\u5728\u4FDD\u5B58\u65F6\u751F\u6548\uFF09\u3002

        document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
        const _banner = document.getElementById('defaultPasswordBanner');
        if (_banner) {
          // \u65E0\u6CD5\u8BFB\u53D6\u5BC6\u7801\uFF1B\u7528\u6237\u540D\u4ECD\u4E3A admin \u65F6\u63D0\u793A\u6539\u5BC6\uFF08\u9ED8\u8BA4\u90E8\u7F72\u98CE\u9669\uFF09
          _banner.classList.toggle('hidden', (config.ADMIN_USERNAME || 'admin') !== 'admin');
        }
        document.getElementById('themeModeSelect').value = config.THEME_MODE || 'system';  // \u56DE\u663E\u4E3B\u9898\u8BBE\u7F6E

        // \u975E\u654F\u611F\u5B57\u6BB5\u6B63\u5E38\u56DE\u663E
        document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
        const tgTopicEl = document.getElementById('tgTopicId');
        if (tgTopicEl) tgTopicEl.value = config.TG_TOPIC_ID || '';
        document.getElementById('webhookMethod').value = config.WEBHOOK_METHOD || 'POST';
        document.getElementById('webhookTemplate').value = config.WEBHOOK_TEMPLATE || '';
        document.getElementById('wechatbotMsgType').value = config.WECHATBOT_MSG_TYPE || 'text';
        document.getElementById('wechatbotAtMobiles').value = config.WECHATBOT_AT_MOBILES || '';
        document.getElementById('wechatbotAtAll').checked = config.WECHATBOT_AT_ALL === 'true';
        document.getElementById('dingtalkMsgType').value = config.DINGTALK_MSG_TYPE || 'text';
        document.getElementById('dingtalkAtMobiles').value = config.DINGTALK_AT_MOBILES || '';
        document.getElementById('dingtalkAtAll').checked = config.DINGTALK_AT_ALL === 'true';
        document.getElementById('emailFrom').value = config.EMAIL_FROM || '';
        document.getElementById('emailFromName').value = config.EMAIL_FROM_NAME || '\u8BA2\u9605\u63D0\u9192\u7CFB\u7EDF';
        document.getElementById('emailTo').value = config.EMAIL_TO || '';
        document.getElementById('barkServer').value = config.BARK_SERVER || 'https://api.day.app';
        document.getElementById('barkIsArchive').checked = config.BARK_IS_ARCHIVE === 'true';
        document.getElementById('gotifyServerUrl').value = config.GOTIFY_SERVER_URL || '';
        if (document.getElementById('ntfyServer')) document.getElementById('ntfyServer').value = config.NTFY_SERVER || 'https://ntfy.sh';
        if (document.getElementById('ntfyTopic')) document.getElementById('ntfyTopic').value = config.NTFY_TOPIC || '';
        document.getElementById('pushplusTopic').value = config.PUSHPLUS_TOPIC || '';
        document.getElementById('pushplusChannel').value = config.PUSHPLUS_CHANNEL || '';
        if (document.getElementById('wpushChannel')) document.getElementById('wpushChannel').value = config.WPUSH_CHANNEL || '';
        if (document.getElementById('wpushTopicCode')) document.getElementById('wpushTopicCode').value = config.WPUSH_TOPIC_CODE || '';

        // \u654F\u611F\u5B57\u6BB5\uFF1A\u6E05\u7A7A\u8F93\u5165\u6846\uFF08\u4E0D\u56DE\u663E\u771F\u5B9E\u503C\uFF09
        document.getElementById('tgBotToken').value = '';
        document.getElementById('notifyxApiKey').value = '';
        document.getElementById('webhookUrl').value = '';
        document.getElementById('webhookHeaders').value = '';
        document.getElementById('wechatbotWebhook').value = '';
        document.getElementById('resendApiKey').value = '';
        document.getElementById('barkDeviceKey').value = '';
        document.getElementById('thirdPartyToken').value = '';
        document.getElementById('gotifyAppToken').value = '';
        document.getElementById('serverchanSendKey').value = '';
        document.getElementById('pushplusToken').value = '';
        if (document.getElementById('wpushApikey')) document.getElementById('wpushApikey').value = '';
        document.getElementById('dingtalkWebhook').value = '';
        document.getElementById('dingtalkSecret').value = '';

        window.SECRET_CONFIGURED = {
          TG_BOT_TOKEN: config.TG_BOT_TOKEN_CONFIGURED === true,
          NOTIFYX_API_KEY: config.NOTIFYX_API_KEY_CONFIGURED === true,
          WEBHOOK_URL: config.WEBHOOK_URL_CONFIGURED === true,
          WEBHOOK_HEADERS: config.WEBHOOK_HEADERS_CONFIGURED === true,
          WECHATBOT_WEBHOOK: config.WECHATBOT_WEBHOOK_CONFIGURED === true,
          RESEND_API_KEY: config.RESEND_API_KEY_CONFIGURED === true,
          BARK_DEVICE_KEY: config.BARK_DEVICE_KEY_CONFIGURED === true,
          THIRD_PARTY_API_TOKEN: config.THIRD_PARTY_API_TOKEN_CONFIGURED === true,
          GOTIFY_APP_TOKEN: config.GOTIFY_APP_TOKEN_CONFIGURED === true,
          NTFY_TOKEN: config.NTFY_TOKEN_CONFIGURED === true,
          SERVERCHAN_SENDKEY: config.SERVERCHAN_SENDKEY_CONFIGURED === true,
          PUSHPLUS_TOKEN: config.PUSHPLUS_TOKEN_CONFIGURED === true,
          WPUSH_APIKEY: config.WPUSH_APIKEY_CONFIGURED === true,
          DINGTALK_WEBHOOK: config.DINGTALK_WEBHOOK_CONFIGURED === true,
          DINGTALK_SECRET: config.DINGTALK_SECRET_CONFIGURED === true
        };

        updateAllSecretStatus();
        document.getElementById('debugLogs').checked = config.DEBUG_LOGS === true;
        document.getElementById('paymentHistoryLimit').value = Number(config.PAYMENT_HISTORY_LIMIT) || 100;
        const notificationHoursInput = document.getElementById('notificationHours');
        if (notificationHoursInput) {
          // \u5C06\u901A\u77E5\u5C0F\u65F6\u6570\u7EC4\u683C\u5F0F\u5316\u4E3A\u9017\u53F7\u5206\u9694\u7684\u5B57\u7B26\u4E32\uFF0C\u4FBF\u4E8E\u7BA1\u7406\u5458\u67E5\u770B\u4E0E\u7F16\u8F91
          const hours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS : [];
          notificationHoursInput.value = hours.join(', ');
        }

        // \u52A0\u8F7D\u519C\u5386\u663E\u793A\u8BBE\u7F6E
        document.getElementById('showLunarGlobal').checked = config.SHOW_LUNAR === true;

        // \u52A8\u6001\u751F\u6210\u65F6\u533A\u9009\u9879\uFF0C\u5E76\u8BBE\u7F6E\u4FDD\u5B58\u7684\u503C
        generateTimezoneOptions(config.TIMEZONE || 'Asia/Shanghai');

        // \u5904\u7406\u591A\u9009\u901A\u77E5\u6E20\u9053
        const enabledNotifiers = config.ENABLED_NOTIFIERS || ['notifyx'];
        document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
          checkbox.checked = enabledNotifiers.includes(checkbox.value);
        });

        toggleNotificationConfigs(enabledNotifiers);

        // \u914D\u7F6E\u52A0\u8F7D\u5B8C\u6210\u540E\u518D\u5237\u65B0\u300C\u662F\u5426\u53EF\u53D1\u9001\u300D\u9884\u89C8\uFF08\u907F\u514D\u7A7A\u8F93\u5165\u88AB\u5F53\u6210\u5168\u5929\uFF09
        if (typeof window.__refreshNotificationHoursPreview === 'function') {
          window.__refreshNotificationHoursPreview();
        }
      } catch (error) {
        console.error('\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25:', error);
        showToast('\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5', 'error');
        // \u7981\u7528\u8868\u5355\u9632\u6B62\u8BEF\u63D0\u4EA4\u8986\u76D6\u6570\u636E
        const form = document.getElementById('configForm');
        Array.from(form.elements).forEach(el => { el.disabled = true; });
      }
    }
    
    // \u52A8\u6001\u751F\u6210\u65F6\u533A\u9009\u9879\uFF08\u4FDD\u6301\u4E0E\u9759\u6001 HTML \u4E00\u81F4\uFF1A\u63A8\u8350\u5206\u7EC4\u5728\u6700\u524D\uFF09
    function generateTimezoneOptions(selectedTimezone = 'Asia/Shanghai') {
      const timezoneSelect = document.getElementById('timezone');
      const fallbackTimezone = 'Asia/Shanghai';

      const recommended = [
        { value: 'Asia/Shanghai', name: '\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4', offset: '+8' }
      ];
      const others = [
        { value: 'Asia/Hong_Kong', name: '\u9999\u6E2F\u65F6\u95F4', offset: '+8' },
        { value: 'Asia/Taipei', name: '\u53F0\u5317\u65F6\u95F4', offset: '+8' },
        { value: 'Asia/Singapore', name: '\u65B0\u52A0\u5761\u65F6\u95F4', offset: '+8' },
        { value: 'Asia/Tokyo', name: '\u65E5\u672C\u65F6\u95F4', offset: '+9' },
        { value: 'Asia/Seoul', name: '\u97E9\u56FD\u65F6\u95F4', offset: '+9' },
        { value: 'UTC', name: '\u4E16\u754C\u6807\u51C6\u65F6\u95F4', offset: '+0' },
        { value: 'America/New_York', name: '\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4', offset: '-5' },
        { value: 'America/Chicago', name: '\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4', offset: '-6' },
        { value: 'America/Denver', name: '\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4', offset: '-7' },
        { value: 'America/Los_Angeles', name: '\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4', offset: '-8' },
        { value: 'Europe/London', name: '\u82F1\u56FD\u65F6\u95F4', offset: '+0' },
        { value: 'Europe/Paris', name: '\u5DF4\u9ECE\u65F6\u95F4', offset: '+1' },
        { value: 'Europe/Berlin', name: '\u67CF\u6797\u65F6\u95F4', offset: '+1' },
        { value: 'Europe/Moscow', name: '\u83AB\u65AF\u79D1\u65F6\u95F4', offset: '+3' },
        { value: 'Australia/Sydney', name: '\u6089\u5C3C\u65F6\u95F4', offset: '+10' },
        { value: 'Australia/Melbourne', name: '\u58A8\u5C14\u672C\u65F6\u95F4', offset: '+10' },
        { value: 'Pacific/Auckland', name: '\u5965\u514B\u5170\u65F6\u95F4', offset: '+12' }
      ];
      const allTimezones = [...recommended, ...others];
      
      // \u6E05\u7A7A\u73B0\u6709\u9009\u9879
      timezoneSelect.innerHTML = '';

      // \u63A8\u8350\u5206\u7EC4
      const recGroup = document.createElement('optgroup');
      recGroup.label = '\u{1F1E8}\u{1F1F3} \u63A8\u8350';
      recommended.forEach(tz => {
        const o = document.createElement('option');
        o.value = tz.value;
        o.textContent = tz.name + '\uFF08UTC' + tz.offset + '\uFF09';
        recGroup.appendChild(o);
      });
      timezoneSelect.appendChild(recGroup);

      // \u5176\u5B83\u5E38\u7528\u65F6\u533A\u5206\u7EC4
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = '\u5176\u5B83\u5E38\u7528\u65F6\u533A';
      others.forEach(tz => {
        const o = document.createElement('option');
        o.value = tz.value;
        o.textContent = tz.name + '\uFF08UTC' + tz.offset + '\uFF09';
        otherGroup.appendChild(o);
      });
      timezoneSelect.appendChild(otherGroup);

      const timezoneExists = allTimezones.some(tz => tz.value === selectedTimezone);
      timezoneSelect.value = timezoneExists ? selectedTimezone : fallbackTimezone;

      if (!timezoneExists) {
        showToast('\u68C0\u6D4B\u5230\u672A\u77E5\u65F6\u533A\u914D\u7F6E\uFF0C\u5DF2\u56DE\u9000\u4E3A Asia/Shanghai\uFF0C\u8BF7\u91CD\u65B0\u786E\u8BA4\u540E\u4FDD\u5B58', 'warning', 4500);
      }
    }
    
    function toggleNotificationConfigs(enabledNotifiers) {
      const telegramConfig = document.getElementById('telegramConfig');
      const ntfyConfig = document.getElementById('ntfyConfig');
      const notifyxConfig = document.getElementById('notifyxConfig');
      const webhookConfig = document.getElementById('webhookConfig');
      const wechatbotConfig = document.getElementById('wechatbotConfig');
      const emailConfig = document.getElementById('emailConfig');
      const barkConfig = document.getElementById('barkConfig');
      const gotifyConfig = document.getElementById('gotifyConfig');
      const serverchanConfig = document.getElementById('serverchanConfig');
      const pushplusConfig = document.getElementById('pushplusConfig');
      const wpushConfig = document.getElementById('wpushConfig');
      const dingtalkConfig = document.getElementById('dingtalkConfig');

      // \u91CD\u7F6E\u6240\u6709\u914D\u7F6E\u533A\u57DF
      [telegramConfig, notifyxConfig, webhookConfig, wechatbotConfig, emailConfig, barkConfig, gotifyConfig, serverchanConfig, pushplusConfig, ntfyConfig, wpushConfig, dingtalkConfig].forEach(config => {
        config.classList.remove('active', 'inactive');
        config.classList.add('inactive');
      });

      // \u6FC0\u6D3B\u9009\u4E2D\u7684\u914D\u7F6E\u533A\u57DF
      enabledNotifiers.forEach(type => {
        if (type === 'telegram') {
          telegramConfig.classList.remove('inactive');
          telegramConfig.classList.add('active');
        } else if (type === 'notifyx') {
          notifyxConfig.classList.remove('inactive');
          notifyxConfig.classList.add('active');
        } else if (type === 'webhook') {
          webhookConfig.classList.remove('inactive');
          webhookConfig.classList.add('active');
        } else if (type === 'wechatbot') {
          wechatbotConfig.classList.remove('inactive');
          wechatbotConfig.classList.add('active');
        } else if (type === 'email') {
          emailConfig.classList.remove('inactive');
          emailConfig.classList.add('active');
        } else if (type === 'bark') {
          barkConfig.classList.remove('inactive');
          barkConfig.classList.add('active');
        } else if (type === 'gotify') {
          gotifyConfig.classList.remove('inactive');
          gotifyConfig.classList.add('active');
        } else if (type === 'ntfy' && ntfyConfig) {
          ntfyConfig.classList.remove('inactive');
          ntfyConfig.classList.add('active');
        } else if (type === 'serverchan') {
          serverchanConfig.classList.remove('inactive');
          serverchanConfig.classList.add('active');
        } else if (type === 'pushplus') {
          pushplusConfig.classList.remove('inactive');
          pushplusConfig.classList.add('active');
        } else if (type === 'wpush' && wpushConfig) {
          wpushConfig.classList.remove('inactive');
          wpushConfig.classList.add('active');
        } else if (type === 'dingtalk' && dingtalkConfig) {
          dingtalkConfig.classList.remove('inactive');
          dingtalkConfig.classList.add('active');
        }
      });
    }

    document.querySelectorAll('input[name="enabledNotifiers"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
          .map(cb => cb.value);
        toggleNotificationConfigs(enabledNotifiers);
      });
    });
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const enabledNotifiers = Array.from(document.querySelectorAll('input[name="enabledNotifiers"]:checked'))
        .map(cb => cb.value);

      if (enabledNotifiers.length === 0) {
        showToast('\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u79CD\u901A\u77E5\u65B9\u5F0F', 'warning');
        return;
      }

      const config = {
        ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
        THEME_MODE: document.getElementById('themeModeSelect').value,      // \u4FDD\u5B58\u4E3B\u9898\u8BBE\u7F6E

        // token/\u5BC6\u94A5\u7C7B\u5B57\u6BB5\uFF1A\u9ED8\u8BA4\u7559\u7A7A=\u4E0D\u4FEE\u6539\uFF1B\u8981\u6E05\u7A7A\u5219\u8D70 CLEAR_SECRET_FIELDS
        TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
        NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
        WEBHOOK_URL: document.getElementById('webhookUrl').value.trim(),
        WEBHOOK_HEADERS: document.getElementById('webhookHeaders').value.trim(),
        WECHATBOT_WEBHOOK: document.getElementById('wechatbotWebhook').value.trim(),
        RESEND_API_KEY: document.getElementById('resendApiKey').value.trim(),
        BARK_DEVICE_KEY: document.getElementById('barkDeviceKey').value.trim(),
        THIRD_PARTY_API_TOKEN: document.getElementById('thirdPartyToken').value.trim(),
        GOTIFY_APP_TOKEN: document.getElementById('gotifyAppToken').value.trim(),
        SERVERCHAN_SENDKEY: document.getElementById('serverchanSendKey').value.trim(),
        PUSHPLUS_TOKEN: document.getElementById('pushplusToken').value.trim(),
        WPUSH_APIKEY: (document.getElementById('wpushApikey') && document.getElementById('wpushApikey').value.trim()) || '',
        DINGTALK_WEBHOOK: document.getElementById('dingtalkWebhook').value.trim(),
        DINGTALK_SECRET: document.getElementById('dingtalkSecret').value.trim(),

        // \u975E\u654F\u611F\u5B57\u6BB5\u6B63\u5E38\u63D0\u4EA4
        TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
        TG_TOPIC_ID: (document.getElementById('tgTopicId') && document.getElementById('tgTopicId').value.trim()) || '',
        WEBHOOK_METHOD: document.getElementById('webhookMethod').value,
        WEBHOOK_TEMPLATE: document.getElementById('webhookTemplate').value.trim(),
        SHOW_LUNAR: document.getElementById('showLunarGlobal').checked,
        WECHATBOT_MSG_TYPE: document.getElementById('wechatbotMsgType').value,
        WECHATBOT_AT_MOBILES: document.getElementById('wechatbotAtMobiles').value.trim(),
        WECHATBOT_AT_ALL: document.getElementById('wechatbotAtAll').checked.toString(),
        EMAIL_FROM: document.getElementById('emailFrom').value.trim(),
        EMAIL_FROM_NAME: document.getElementById('emailFromName').value.trim(),
        EMAIL_TO: document.getElementById('emailTo').value.trim(),
        BARK_SERVER: document.getElementById('barkServer').value.trim() || 'https://api.day.app',
        BARK_IS_ARCHIVE: document.getElementById('barkIsArchive').checked.toString(),
        GOTIFY_SERVER_URL: document.getElementById('gotifyServerUrl').value.trim(),
        PUSHPLUS_TOPIC: document.getElementById('pushplusTopic').value.trim(),
        PUSHPLUS_CHANNEL: document.getElementById('pushplusChannel').value.trim(),
        NTFY_SERVER: (document.getElementById('ntfyServer') && document.getElementById('ntfyServer').value.trim()) || 'https://ntfy.sh',
        NTFY_TOPIC: (document.getElementById('ntfyTopic') && document.getElementById('ntfyTopic').value.trim()) || '',
        NTFY_TOKEN: (document.getElementById('ntfyToken') && document.getElementById('ntfyToken').value.trim()) || '',
        WPUSH_CHANNEL: (document.getElementById('wpushChannel') && document.getElementById('wpushChannel').value.trim()) || '',
        WPUSH_TOPIC_CODE: (document.getElementById('wpushTopicCode') && document.getElementById('wpushTopicCode').value.trim()) || '',
        DINGTALK_MSG_TYPE: document.getElementById('dingtalkMsgType').value,
        DINGTALK_AT_MOBILES: document.getElementById('dingtalkAtMobiles').value.trim(),
        DINGTALK_AT_ALL: document.getElementById('dingtalkAtAll').checked.toString(),
        ENABLED_NOTIFIERS: enabledNotifiers,
        TIMEZONE: document.getElementById('timezone').value.trim(),

        // \u6807\u8BB0\u201C\u6E05\u7A7A\u54EA\u4E9B\u5BC6\u94A5\u5B57\u6BB5\u201D
        CLEAR_SECRET_FIELDS: Array.from(CLEAR_SECRET_FIELDS),

        DEBUG_LOGS: document.getElementById('debugLogs').checked === true,
        PAYMENT_HISTORY_LIMIT: (() => {
          const raw = Number(document.getElementById('paymentHistoryLimit').value);
          if (!Number.isFinite(raw)) return 100;
          return Math.min(1000, Math.max(10, Math.floor(raw)));
        })(),
        // \u524D\u7AEF\u5148\u884C\u6574\u7406\u901A\u77E5\u5C0F\u65F6\u5217\u8868\uFF0C\u540E\u7AEF\u4ECD\u4F1A\u518D\u6B21\u6821\u9A8C
        NOTIFICATION_HOURS: (() => {
          const raw = document.getElementById('notificationHours').value.trim();
          if (!raw) {
            return [];
          }
          return raw
            .split(/[,\uFF0C\\s]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        })()
      };

      const passwordField = document.getElementById('adminPassword');
      if (passwordField.value.trim()) {
        config.ADMIN_PASSWORD = passwordField.value.trim();
      }

      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u4FDD\u5B58\u4E2D...';
      submitButton.disabled = true;

      try {
        const response = await apiFetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
          showToast('\u914D\u7F6E\u4FDD\u5B58\u6210\u529F', 'success');
          if (window.updateAppTheme) {    // \u4FDD\u5B58\u6210\u529F\u540E\u7ACB\u5373\u5E94\u7528\u4E3B\u9898\uFF0C\u65E0\u9700\u5237\u65B0
            window.updateAppTheme(config.THEME_MODE);
          }
          passwordField.value = '';
          
          // \u524D\u7AEF\u59CB\u7EC8\u663E\u793A\u6D4F\u89C8\u5668\u672C\u5730\u65F6\u533A
          globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          showSystemTime();
          
          // \u6807\u8BB0\u65F6\u533A\u5DF2\u66F4\u65B0\uFF0C\u4F9B\u5176\u4ED6\u9875\u9762\u68C0\u6D4B
          localStorage.setItem('timezoneUpdated', Date.now().toString());
          
          // \u5982\u679C\u5F53\u524D\u5728\u8BA2\u9605\u5217\u8868\u9875\u9762\uFF0C\u5219\u81EA\u52A8\u5237\u65B0\u9875\u9762\u4EE5\u66F4\u65B0\u65F6\u533A\u663E\u793A
          if (window.location.pathname === '/admin') {
            window.location.reload();
          }
        } else {
          showToast('\u914D\u7F6E\u4FDD\u5B58\u5931\u8D25: ' + (result.message || '\u672A\u77E5\u9519\u8BEF'), 'error');
        }
      } catch (error) {
        console.error('\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25:', error);
        showToast('\u4FDD\u5B58\u914D\u7F6E\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function testNotification(type) {
      const buttonId = type === 'telegram' ? 'testTelegramBtn' :
                      type === 'notifyx' ? 'testNotifyXBtn' :
                      type === 'wechatbot' ? 'testWechatBotBtn' :
                      type === 'email' ? 'testEmailBtn' :
                      type === 'bark' ? 'testBarkBtn' :
                      type === 'gotify' ? 'testGotifyBtn' :
                      type === 'serverchan' ? 'testServerchanBtn' :
                      type === 'pushplus' ? 'testPushplusBtn' :
                      type === 'ntfy' ? 'testNtfyBtn' :
                      type === 'wpush' ? 'testWpushBtn' :
                      type === 'dingtalk' ? 'testDingTalkBtn' : 'testWebhookBtn';
      const button = document.getElementById(buttonId);
      if (!button) {
        showToast('\u6D4B\u8BD5\u6309\u94AE\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5', 'error');
        return;
      }
      const originalContent = button.innerHTML;
      const serviceName = type === 'telegram' ? 'Telegram' :
                          type === 'notifyx' ? 'NotifyX' :
                          type === 'wechatbot' ? '\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA' :
                          type === 'email' ? '\u90AE\u4EF6\u901A\u77E5' :
                          type === 'bark' ? 'Bark' :
                          type === 'gotify' ? 'Gotify' :
                          type === 'serverchan' ? 'Server\u9171' :
                          type === 'pushplus' ? 'PushPlus' :
                          type === 'ntfy' ? 'ntfy' :
                          type === 'wpush' ? 'WPUSH' :
                          type === 'dingtalk' ? '\u9489\u9489\u901A\u77E5' : 'Webhook \u901A\u77E5';

      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u6D4B\u8BD5\u4E2D...';
      button.disabled = true;

      const config = {};
      // \u65B9\u6848 B\uFF1A\u654F\u611F\u5B57\u6BB5\u4E0D\u56DE\u663E\u3002\u6D4B\u8BD5\u901A\u77E5\u65F6\u5982\u679C\u7528\u6237\u6CA1\u586B\uFF0C\u5C31\u6309\u201C\u4F7F\u7528\u670D\u52A1\u5668\u5DF2\u4FDD\u5B58\u7684\u914D\u7F6E\u201D\u5904\u7406\u3002
      if (type === 'telegram') {
        config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();
        const topicEl = document.getElementById('tgTopicId');
        if (topicEl) config.TG_TOPIC_ID = topicEl.value.trim();
        const token = document.getElementById('tgBotToken').value.trim();
        if (token) config.TG_BOT_TOKEN = token;
      } else if (type === 'notifyx') {
        const key = document.getElementById('notifyxApiKey').value.trim();
        if (key) config.NOTIFYX_API_KEY = key;
      } else if (type === 'webhook') {
        config.WEBHOOK_METHOD = document.getElementById('webhookMethod').value;
        config.WEBHOOK_TEMPLATE = document.getElementById('webhookTemplate').value.trim();
        const url = document.getElementById('webhookUrl').value.trim();
        const headers = document.getElementById('webhookHeaders').value.trim();
        if (url) config.WEBHOOK_URL = url;
        if (headers) config.WEBHOOK_HEADERS = headers;
      } else if (type === 'wechatbot') {
        config.WECHATBOT_MSG_TYPE = document.getElementById('wechatbotMsgType').value;
        config.WECHATBOT_AT_MOBILES = document.getElementById('wechatbotAtMobiles').value.trim();
        config.WECHATBOT_AT_ALL = document.getElementById('wechatbotAtAll').checked.toString();
        const url = document.getElementById('wechatbotWebhook').value.trim();
        if (url) config.WECHATBOT_WEBHOOK = url;
      } else if (type === 'email') {
        const key = document.getElementById('resendApiKey').value.trim();
        if (key) config.RESEND_API_KEY = key;
        config.EMAIL_FROM = document.getElementById('emailFrom').value.trim();
        config.EMAIL_FROM_NAME = document.getElementById('emailFromName').value.trim();
        config.EMAIL_TO = document.getElementById('emailTo').value.trim();
      } else if (type === 'bark') {
        config.BARK_SERVER = document.getElementById('barkServer').value.trim() || 'https://api.day.app';
        const key = document.getElementById('barkDeviceKey').value.trim();
        if (key) config.BARK_DEVICE_KEY = key;
        config.BARK_IS_ARCHIVE = document.getElementById('barkIsArchive').checked.toString();
      } else if (type === 'gotify') {
        config.GOTIFY_SERVER_URL = document.getElementById('gotifyServerUrl').value.trim();
        const token = document.getElementById('gotifyAppToken').value.trim();
        if (token) config.GOTIFY_APP_TOKEN = token;

        if (!config.GOTIFY_SERVER_URL) {
          showToast('\u8BF7\u5148\u586B\u5199 Gotify Server URL', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else if (type === 'serverchan') {
        const key = document.getElementById('serverchanSendKey').value.trim();
        if (key) config.SERVERCHAN_SENDKEY = key;
      } else if (type === 'pushplus') {
        const token = document.getElementById('pushplusToken').value.trim();
        if (token) config.PUSHPLUS_TOKEN = token;
        config.PUSHPLUS_TOPIC = document.getElementById('pushplusTopic').value.trim();
        config.PUSHPLUS_CHANNEL = document.getElementById('pushplusChannel').value.trim();
      } else if (type === 'wpush') {
        const key = document.getElementById('wpushApikey') && document.getElementById('wpushApikey').value.trim();
        if (key) config.WPUSH_APIKEY = key;
        config.WPUSH_CHANNEL = (document.getElementById('wpushChannel') && document.getElementById('wpushChannel').value.trim()) || '';
        config.WPUSH_TOPIC_CODE = (document.getElementById('wpushTopicCode') && document.getElementById('wpushTopicCode').value.trim()) || '';
      } else if (type === 'dingtalk') {
        config.DINGTALK_MSG_TYPE = document.getElementById('dingtalkMsgType').value;
        config.DINGTALK_AT_MOBILES = document.getElementById('dingtalkAtMobiles').value.trim();
        config.DINGTALK_AT_ALL = document.getElementById('dingtalkAtAll').checked.toString();
        const url = document.getElementById('dingtalkWebhook').value.trim();
        const secret = document.getElementById('dingtalkSecret').value.trim();
        if (url) config.DINGTALK_WEBHOOK = url;
        if (secret) config.DINGTALK_SECRET = secret;
      }

      try {
        const response = await apiFetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, ...config })
        });

        let result = null;
        try {
          result = await response.json();
        } catch (_) {
          result = { success: false, message: '\u670D\u52A1\u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94' };
        }

        if (response.ok && result.success) {
          showToast(serviceName + ' \u901A\u77E5\u6D4B\u8BD5\u6210\u529F\uFF01', 'success');
        } else {
          const message = (result && result.message) ? result.message : ('HTTP ' + response.status);
          showToast(serviceName + ' \u901A\u77E5\u6D4B\u8BD5\u5931\u8D25: ' + message, 'error', 4500);
        }
      } catch (error) {
        console.error('\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25:', error);
        showToast(serviceName + ' \u6D4B\u8BD5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5', 'error');
      } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('testTelegramBtn').addEventListener('click', () => {
      testNotification('telegram');
    });
    
    document.getElementById('testNotifyXBtn').addEventListener('click', () => {
      testNotification('notifyx');
    });

    document.getElementById('testWebhookBtn').addEventListener('click', () => {
      testNotification('webhook');
    });

    document.getElementById('testWechatBotBtn').addEventListener('click', () => {
      testNotification('wechatbot');
    });

    document.getElementById('testEmailBtn').addEventListener('click', () => {
      testNotification('email');
    });

    document.getElementById('testBarkBtn').addEventListener('click', () => {
      testNotification('bark');
    });

    document.getElementById('testGotifyBtn').addEventListener('click', () => {
      testNotification('gotify');
    });

    document.getElementById('testServerchanBtn').addEventListener('click', () => {
      testNotification('serverchan');
    });

    document.getElementById('testPushplusBtn').addEventListener('click', () => {
      testNotification('pushplus');
    });

    const testNtfyBtn = document.getElementById('testNtfyBtn');
    if (testNtfyBtn) {
      testNtfyBtn.addEventListener('click', () => {
        testNotification('ntfy');
      });
    }

    const testWpushBtn = document.getElementById('testWpushBtn');
    if (testWpushBtn) {
      testWpushBtn.addEventListener('click', () => {
        testNotification('wpush');
      });
    }

    const testDingTalkBtn = document.getElementById('testDingTalkBtn');
    if (testDingTalkBtn) {
      testDingTalkBtn.addEventListener('click', () => {
        testNotification('dingtalk');
      });
    }

    document.getElementById('generateThirdPartyToken').addEventListener('click', () => {
      try {
        // \u751F\u6210 32 \u4F4D\u968F\u673A\u4EE4\u724C\uFF0C\u907F\u514D\u51FA\u73B0\u7279\u6B8A\u5B57\u7B26\uFF0C\u65B9\u4FBF\u5199\u5165 URL
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const buffer = new Uint8Array(32);
        window.crypto.getRandomValues(buffer);
        const token = Array.from(buffer).map(v => charset[v % charset.length]).join('');
        const input = document.getElementById('thirdPartyToken');
        input.value = token;
        input.dispatchEvent(new Event('input'));
        showToast('\u5DF2\u751F\u6210\u65B0\u7684\u7B2C\u4E09\u65B9 API \u4EE4\u724C\uFF0C\u8BF7\u4FDD\u5B58\u914D\u7F6E\u540E\u751F\u6548', 'info');
      } catch (error) {
        console.error('\u751F\u6210\u4EE4\u724C\u5931\u8D25:', error);
        showToast('\u751F\u6210\u4EE4\u724C\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u8F93\u5165', 'error');
      }
    });

    window.addEventListener('load', () => {
      // \u7ED1\u5B9A\u654F\u611F\u5B57\u6BB5\u8F93\u5165/\u6E05\u7A7A\u6309\u94AE
      wireSecretInput('tgBotToken', 'TG_BOT_TOKEN');
      wireSecretInput('notifyxApiKey', 'NOTIFYX_API_KEY');
      wireSecretInput('webhookUrl', 'WEBHOOK_URL');
      wireSecretInput('webhookHeaders', 'WEBHOOK_HEADERS');
      wireSecretInput('wechatbotWebhook', 'WECHATBOT_WEBHOOK');
      wireSecretInput('resendApiKey', 'RESEND_API_KEY');
      wireSecretInput('barkDeviceKey', 'BARK_DEVICE_KEY');
      wireSecretInput('thirdPartyToken', 'THIRD_PARTY_API_TOKEN');
      wireSecretInput('gotifyAppToken', 'GOTIFY_APP_TOKEN');
      if (document.getElementById('ntfyToken')) wireSecretInput('ntfyToken', 'NTFY_TOKEN');
      wireSecretInput('serverchanSendKey', 'SERVERCHAN_SENDKEY');
      wireSecretInput('pushplusToken', 'PUSHPLUS_TOKEN');
      if (document.getElementById('wpushApikey')) wireSecretInput('wpushApikey', 'WPUSH_APIKEY');

      wireClearSecretButton('clearTgBotToken', 'tgBotToken', 'TG_BOT_TOKEN');
      wireClearSecretButton('clearNotifyxApiKey', 'notifyxApiKey', 'NOTIFYX_API_KEY');
      wireClearSecretButton('clearWebhookUrl', 'webhookUrl', 'WEBHOOK_URL');
      wireClearSecretButton('clearWebhookHeaders', 'webhookHeaders', 'WEBHOOK_HEADERS');
      wireClearSecretButton('clearWechatbotWebhook', 'wechatbotWebhook', 'WECHATBOT_WEBHOOK');
      wireClearSecretButton('clearResendApiKey', 'resendApiKey', 'RESEND_API_KEY');
      wireClearSecretButton('clearBarkDeviceKey', 'barkDeviceKey', 'BARK_DEVICE_KEY');
      wireClearSecretButton('clearThirdPartyToken', 'thirdPartyToken', 'THIRD_PARTY_API_TOKEN');
      wireClearSecretButton('clearGotifyAppToken', 'gotifyAppToken', 'GOTIFY_APP_TOKEN');
      if (document.getElementById('clearNtfyToken')) wireClearSecretButton('clearNtfyToken', 'ntfyToken', 'NTFY_TOKEN');
      wireClearSecretButton('clearServerchanSendKey', 'serverchanSendKey', 'SERVERCHAN_SENDKEY');
      wireClearSecretButton('clearPushplusToken', 'pushplusToken', 'PUSHPLUS_TOKEN');
      if (document.getElementById('clearWpushApikey')) wireClearSecretButton('clearWpushApikey', 'wpushApikey', 'WPUSH_APIKEY');

      loadConfig();

      // \u8868\u5355\u53D8\u66F4\u68C0\u6D4B\uFF1A\u663E\u793A\u60AC\u6D6E\u4FDD\u5B58\u680F + beforeunload \u63D0\u793A
      let configDirty = false;
      const form = document.getElementById('configForm');
      const floatingBar = document.getElementById('floatingSaveBar');

      form.addEventListener('input', () => {
        if (!configDirty) {
          configDirty = true;
          floatingBar.style.display = '';
          requestAnimationFrame(() => floatingBar.style.transform = 'translateY(0)');
        }
      });
      form.addEventListener('change', () => {
        if (!configDirty) {
          configDirty = true;
          floatingBar.style.display = '';
          requestAnimationFrame(() => floatingBar.style.transform = 'translateY(0)');
        }
      });

      // \u4FDD\u5B58\u6210\u529F\u540E\u9690\u85CF\u60AC\u6D6E\u680F
      form.addEventListener('submit', () => {
        setTimeout(() => {
          configDirty = false;
          floatingBar.style.transform = 'translateY(100%)';
          setTimeout(() => { floatingBar.style.display = 'none'; }, 300);
        }, 500);
      });

      window.addEventListener('beforeunload', (e) => {
        if (configDirty) { e.preventDefault(); e.returnValue = ''; }
      });
    });
    
    // \u524D\u7AEF\u5C55\u793A\u65F6\u533A\uFF08\u56FA\u5B9A\u4F7F\u7528\u6D4F\u89C8\u5668\u672C\u5730\u65F6\u533A\uFF09
    let globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    let systemTimeTimer = null;
    let timezoneCheckTimer = null;
    
    // \u5B9E\u65F6\u663E\u793A\u7CFB\u7EDF\u65F6\u95F4\u548C\u65F6\u533A
    async function showSystemTime() {
      try {
        // \u83B7\u53D6\u540E\u53F0\u914D\u7F6E\u7684\u65F6\u533A
        const response = await apiFetch('/api/config');
        const config = await response.json();
        globalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // \u683C\u5F0F\u5316\u5F53\u524D\u65F6\u95F4
        function formatTime(dt, tz) {
          return dt.toLocaleString('zh-CN', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        function formatTimezoneDisplay(tz) {
          try {
            // \u4F7F\u7528\u66F4\u51C6\u786E\u7684\u65F6\u533A\u504F\u79FB\u8BA1\u7B97\u65B9\u6CD5
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            
            // \u65F6\u533A\u4E2D\u6587\u540D\u79F0\u6620\u5C04
            const timezoneNames = {
              'UTC': '\u4E16\u754C\u6807\u51C6\u65F6\u95F4',
              'Asia/Shanghai': '\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4',
              'Asia/Hong_Kong': '\u9999\u6E2F\u65F6\u95F4',
              'Asia/Taipei': '\u53F0\u5317\u65F6\u95F4',
              'Asia/Singapore': '\u65B0\u52A0\u5761\u65F6\u95F4',
              'Asia/Tokyo': '\u65E5\u672C\u65F6\u95F4',
              'Asia/Seoul': '\u97E9\u56FD\u65F6\u95F4',
              'America/New_York': '\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4',
              'America/Los_Angeles': '\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4',
              'America/Chicago': '\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4',
              'America/Denver': '\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4',
              'Europe/London': '\u82F1\u56FD\u65F6\u95F4',
              'Europe/Paris': '\u5DF4\u9ECE\u65F6\u95F4',
              'Europe/Berlin': '\u67CF\u6797\u65F6\u95F4',
              'Europe/Moscow': '\u83AB\u65AF\u79D1\u65F6\u95F4',
              'Australia/Sydney': '\u6089\u5C3C\u65F6\u95F4',
              'Australia/Melbourne': '\u58A8\u5C14\u672C\u65F6\u95F4',
              'Pacific/Auckland': '\u5965\u514B\u5170\u65F6\u95F4'
            };
            
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            const timezoneName = timezoneNames[tz] || tz;
            return timezoneName + ' (UTC' + offsetStr + ')';
          } catch (error) {
            console.error('\u683C\u5F0F\u5316\u65F6\u533A\u663E\u793A\u5931\u8D25:', error);
            return tz;
          }
        }
        function update() {
          const now = new Date();
          const timeStr = formatTime(now, globalTimezone);
          const tzStr = formatTimezoneDisplay(globalTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = timeStr + '  ' + tzStr;
          }
          // \u66F4\u65B0\u79FB\u52A8\u7AEF\u663E\u793A (\u65B0\u589E)
          const mobileEl = document.getElementById('mobileTimeDisplay');
          if (mobileEl) {
            mobileEl.textContent = timeStr + ' ' + tzStr;
          }
        }
        update();

        if (systemTimeTimer) {
          clearInterval(systemTimeTimer);
        }
        systemTimeTimer = setInterval(update, 1000);

        if (timezoneCheckTimer) {
          clearInterval(timezoneCheckTimer);
        }
        timezoneCheckTimer = setInterval(async () => {
          try {
            const response = await apiFetch('/api/config');
            await response.json();
            const newTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

            if (globalTimezone !== newTimezone) {
              globalTimezone = newTimezone;
              update();
            }
          } catch (error) {
            console.error('\u68C0\u67E5\u65F6\u533A\u66F4\u65B0\u5931\u8D25:', error);
          }
        }, 30000);
      } catch (e) {
        // \u51FA\u9519\u65F6\u663E\u793A\u672C\u5730\u65F6\u95F4
        const el = document.getElementById('systemTimeDisplay');
        if (el) {
          el.textContent = new Date().toLocaleString();
        }
      }
    }
    showSystemTime();
    // --- \u65B0\u589E\uFF1A\u79FB\u52A8\u7AEF\u83DC\u5355\u63A7\u5236\u811A\u672C ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      const syncMobileMenuState = () => {
        const icon = mobileMenuBtn.querySelector('i');
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('fa-bars', isHidden);
          icon.classList.toggle('fa-times', !isHidden);
        }
      };

      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        syncMobileMenuState();
      });
      
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        });
      });

      document.addEventListener('click', (event) => {
        if (mobileMenu.classList.contains('hidden')) return;
        if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      syncMobileMenuState();
    }

    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // \u901A\u77E5\u5C0F\u65F6\u5B9E\u65F6\u9884\u89C8\uFF08\u4E0E\u8C03\u5EA6\u5668\u540C\u4E00\u5957\u89C4\u5219\uFF09
    // \u6CE8\u610F\uFF1A\u5FC5\u987B\u5728 loadConfig \u5199\u5165\u8F93\u5165\u6846\u4E4B\u540E\u518D\u5237\u65B0\uFF0C\u5426\u5219\u4F1A\u8BEF\u663E\u793A\u300C\u7A7A=\u5168\u5929\u300D
    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    (function () {
      const tzSelect = document.getElementById('timezone');
      const hoursInput = document.getElementById('notificationHours');
      const labelInline = document.getElementById('tzLabelInline');
      const preview = document.getElementById('tzWindowPreview');
      if (!tzSelect || !hoursInput || !preview || !labelInline) return;

      const TZ_LABELS = {
        'Asia/Shanghai': '\u5317\u4EAC\u65F6\u95F4',
        'Asia/Hong_Kong': '\u9999\u6E2F\u65F6\u95F4',
        'Asia/Taipei': '\u53F0\u5317\u65F6\u95F4',
        'Asia/Tokyo': '\u4E1C\u4EAC\u65F6\u95F4',
        'Asia/Singapore': '\u65B0\u52A0\u5761\u65F6\u95F4',
        'UTC': '\u4E16\u754C\u534F\u8C03\u65F6(UTC)',
        'America/New_York': '\u7EBD\u7EA6\u65F6\u95F4',
        'America/Los_Angeles': '\u6D1B\u6749\u77F6\u65F6\u95F4',
        'Europe/London': '\u4F26\u6566\u65F6\u95F4'
      };

      function friendlyTz(tz) {
        return TZ_LABELS[tz] || tz;
      }

      function currentTzHour(tz) {
        try {
          const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit'
          });
          const parts = fmt.formatToParts(new Date());
          let h = parts.find(p => p.type === 'hour')?.value || '00';
          const m = parts.find(p => p.type === 'minute')?.value || '00';
          if (h === '24') h = '00';
          return { hh: String(h).padStart(2, '0'), mm: String(m).padStart(2, '0') };
        } catch {
          return { hh: '??', mm: '??' };
        }
      }

      function parseHours(text) {
        if (!text) return [];
        return String(text).split(/[,\uFF0C\\s]+/).map(s => s.trim()).filter(Boolean).map(s => {
          if (s === '*' || s.toUpperCase() === 'ALL') return '*';
          const n = Number(s);
          if (!isNaN(n)) return String(Math.max(0, Math.min(23, Math.floor(n)))).padStart(2, '0');
          return s;
        });
      }

      function update() {
        const tz = tzSelect.value || 'UTC';
        const tzName = friendlyTz(tz);
        labelInline.textContent = '\uFF08\u6309' + tzName + '\uFF09';
        const { hh, mm } = currentTzHour(tz);
        const hours = parseHours(hoursInput.value);
        const allowAll = hours.length === 0 || hours.includes('*');
        const inWindow = allowAll || hours.includes(hh);

        let statusHtml;
        if (allowAll) {
          statusHtml = '<span class="text-green-700 font-medium">\u2713 \u5F53\u524D\u4F1A\u5141\u8BB8\u53D1\u9001</span>'
            + '<div class="text-xs text-gray-600 mt-1">\u672A\u9650\u5236\u5C0F\u65F6\uFF08\u7559\u7A7A\u6216 *\uFF09= \u6BCF\u4E2A\u6574\u70B9\u68C0\u67E5\u65F6\u90FD\u53EF\u4EE5\u53D1\u3002</div>';
        } else if (inWindow) {
          statusHtml = '<span class="text-green-700 font-medium">\u2713 \u5F53\u524D\u6574\u70B9\u5728\u5141\u8BB8\u5217\u8868\u5185\uFF0C\u4F1A\u53D1\u9001</span>'
            + '<div class="text-xs text-gray-600 mt-1">\u5141\u8BB8\u7684\u5C0F\u65F6\uFF1A<b>' + hours.join('\u3001') + '</b>\uFF1B\u73B0\u5728\u662F <b>' + hh + ':' + mm + '</b>\uFF08' + tzName + '\uFF09\u3002</div>';
        } else {
          statusHtml = '<span class="text-amber-700 font-medium">\u2717 \u5F53\u524D\u4E0D\u4F1A\u53D1\u9001</span>'
            + '<div class="text-xs text-gray-600 mt-1">\u4F60\u53EA\u5141\u8BB8\u5728 <b>' + hours.join('\u3001') + '</b> \u70B9\u53D1\u9001\uFF1B\u73B0\u5728\u662F <b>' + hh + ':' + mm + '</b>\uFF08' + tzName + '\uFF09\u3002'
            + '\u5B9A\u65F6\u4EFB\u52A1\u4ECD\u4F1A\u6BCF\u5C0F\u65F6\u8DD1\u4E00\u6B21\uFF0C\u4F46\u4E0D\u63A8\u9001\uFF0C\u4EFB\u52A1\u5386\u53F2\u4F1A\u8BB0\u300C\u4E0D\u5728\u5141\u8BB8\u53D1\u9001\u7684\u5C0F\u65F6\u300D\u2014\u2014\u8FD9\u662F\u6B63\u5E38\u8DF3\u8FC7\u3002</div>';
        }

        preview.innerHTML =
          '<div class="text-gray-800">' + statusHtml + '</div>'
          + '<div class="text-xs text-gray-500 mt-2">\u65F6\u533A\u4EE3\u7801\uFF1A' + tz + ' \xB7 \u9884\u89C8\u4EC5\u53CD\u6620\u8F93\u5165\u6846\u5185\u5BB9\uFF0C\u4FDD\u5B58\u540E\u8C03\u5EA6\u5668\u624D\u7528\u670D\u52A1\u5668\u4E0A\u7684\u503C\u3002</div>';
      }

      window.__refreshNotificationHoursPreview = update;

      tzSelect.addEventListener('change', update);
      hoursInput.addEventListener('input', update);
      hoursInput.addEventListener('change', update);
      setTimeout(update, 200);
      setInterval(update, 30000);
    })();

    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // \u5907\u4EFD\u5BFC\u51FA / \u5BFC\u5165\u6062\u590D
    // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    (function () {
      const exportBtn = document.getElementById('exportBackupBtn');
      const importBtn = document.getElementById('importBackupBtn');
      if (!exportBtn || !importBtn) return;

      exportBtn.addEventListener('click', async () => {
        const includeSecrets = document.getElementById('exportIncludeSecrets').checked;
        if (includeSecrets && !confirm('\u5C06\u5BFC\u51FA\u5305\u542B Token / \u5BC6\u94A5\u7684\u5B8C\u6574\u5907\u4EFD\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4F1A\u5B89\u5168\u4FDD\u5B58\u3002\u7EE7\u7EED\uFF1F')) {
          return;
        }
        const original = exportBtn.innerHTML;
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u5BFC\u51FA\u4E2D...';
        try {
          const url = '/api/backup?includeSecrets=' + (includeSecrets ? '1' : '0');
          const res = await apiFetch(url);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || ('HTTP ' + res.status));
          }
          const blob = await res.blob();
          const a = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          a.href = objectUrl;
          a.download = 'substracker-backup-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(objectUrl);
          showToast('\u5907\u4EFD\u5DF2\u4E0B\u8F7D', 'success');
        } catch (e) {
          if (e && e.message === 'AUTH_EXPIRED') return;
          console.error(e);
          showToast('\u5BFC\u51FA\u5931\u8D25: ' + (e.message || e), 'error');
        } finally {
          exportBtn.disabled = false;
          exportBtn.innerHTML = original;
        }
      });

      importBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('importBackupFile');
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
          showToast('\u8BF7\u5148\u9009\u62E9\u5907\u4EFD JSON \u6587\u4EF6', 'warning');
          return;
        }
        const modeEl = document.querySelector('input[name="importMode"]:checked');
        const mode = modeEl ? modeEl.value : 'merge';
        const includeSecrets = document.getElementById('importIncludeSecrets').checked;

        if (mode === 'replace' && !confirm('\u8986\u76D6\u6A21\u5F0F\u4F1A\u5220\u9664\u5F53\u524D\u5168\u90E8\u8BA2\u9605\u540E\u518D\u5BFC\u5165\uFF0C\u4E14\u4E0D\u53EF\u64A4\u9500\u3002\u786E\u5B9A\u7EE7\u7EED\uFF1F')) {
          return;
        }
        if (!confirm('\u786E\u8BA4\u4ECE\u5907\u4EFD\u6062\u590D\uFF1F\u5EFA\u8BAE\u5148\u5BFC\u51FA\u4E00\u4EFD\u5F53\u524D\u6570\u636E\u4F5C\u4E3A\u56DE\u6EDA\u3002')) {
          return;
        }

        const original = importBtn.innerHTML;
        importBtn.disabled = true;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u6062\u590D\u4E2D...';
        try {
          const text = await file.text();
          let backup;
          try {
            backup = JSON.parse(text);
          } catch {
            throw new Error('\u6587\u4EF6\u4E0D\u662F\u5408\u6CD5 JSON');
          }
          const res = await apiFetch('/api/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup, mode, includeSecrets })
          });
          const result = await res.json().catch(() => ({}));
          if (!res.ok || !result.success) {
            throw new Error(result.message || ('HTTP ' + res.status));
          }
          const stats = result.stats || {};
          showToast(
            '\u6062\u590D\u6210\u529F\uFF1A\u8BA2\u9605 ' + (stats.subscriptions || 0) +
            ' \u6761\uFF0C\u89C4\u5219 ' + (stats.reminderRules || 0) + ' \u6761',
            'success',
            5000
          );
          // \u91CD\u65B0\u52A0\u8F7D\u914D\u7F6E\u8868\u5355
          if (typeof loadConfig === 'function') {
            try { loadConfig(); } catch (_) { /* ignore */ }
          } else {
            setTimeout(function () { location.reload(); }, 800);
          }
        } catch (e) {
          if (e && e.message === 'AUTH_EXPIRED') return;
          console.error(e);
          showToast('\u6062\u590D\u5931\u8D25: ' + (e.message || e), 'error', 6000);
        } finally {
          importBtn.disabled = false;
          importBtn.innerHTML = original;
        }
      });
    })();
  <\/script>
</body>
</html>
`;

// src/views/dashboardPage.html
var dashboardPage_default = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u4EEA\u8868\u76D8 - SubsTracker</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  \${themeResources}  <style>
    .stat-card{background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s,box-shadow 0.2s}
    .stat-card:hover{transform:translateY(-4px);box-shadow:0 4px 16px rgba(0,0,0,0.15)}
    .stat-card-header{color:#6b7280;font-size:0.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem}
    .stat-card-value{font-size:2rem;font-weight:700;color:#1f2937;margin-bottom:0.25rem}
    .stat-card-subtitle{color:#9ca3af;font-size:0.875rem}
    .stat-card-trend{display:inline-flex;align-items:center;gap:0.25rem;font-size:0.875rem;margin-top:0.5rem;padding:0.25rem 0.5rem;border-radius:6px}
    .stat-card-trend.up{color:#10b981;background:#d1fae5}
    .stat-card-trend.down{color:#ef4444;background:#fee2e2}
    .stat-card-trend.flat{color:#6b7280;background:#f3f4f6}
    .list-item{display:flex;align-items:center;justify-content:space-between;padding:1rem;border-radius:8px;transition:background 0.2s}
    .list-item:hover{background:#f9fafb}
    .list-item:not(:last-child){border-bottom:1px solid #f3f4f6}
    .list-item-content{flex:1}
    .list-item-name{font-weight:600;color:#1f2937;margin-bottom:0.25rem}
    .list-item-meta{display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:#6b7280;flex-wrap:wrap}
    .list-item-amount{font-size:1.125rem;font-weight:700;color:#10b981}
    .list-item-badge{display:inline-block;padding:0.25rem 0.75rem;border-radius:12px;font-size:0.75rem;font-weight:500;background:#e0e7ff;color:#4f46e5}
    .ranking-item{margin-bottom:1rem}
    .ranking-item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem}
    .ranking-item-name{font-weight:600;color:#1f2937}
    .ranking-item-value{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem}
    .ranking-item-amount{font-weight:700;color:#1f2937}
    .ranking-item-percentage{color:#10b981}
    .ranking-progress{width:100%;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden}
    .ranking-progress-bar{height:100%;border-radius:4px;transition:width 0.6s ease}
    .ranking-progress-bar.color-1{background:linear-gradient(90deg,#6366f1,#8b5cf6)}
    .ranking-progress-bar.color-2{background:linear-gradient(90deg,#10b981,#059669)}
    .ranking-progress-bar.color-3{background:linear-gradient(90deg,#f59e0b,#d97706)}
    .ranking-progress-bar.color-4{background:linear-gradient(90deg,#ef4444,#dc2626)}
    .ranking-progress-bar.color-5{background:linear-gradient(90deg,#8b5cf6,#7c3aed)}
    .empty-state{text-align:center;padding:3rem 1rem;color:#9ca3af}
    .empty-state-icon{font-size:3rem;margin-bottom:1rem;opacity:0.5}
    .empty-state-text{font-size:0.875rem}
    /* === Dashboard \u6697\u9ED1\u6A21\u5F0F\u4FEE\u590D === */
    html.dark .stat-card {
      background: #1f2937; /* \u6DF1\u8272\u5361\u7247\u80CC\u666F */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    }
    html.dark .stat-card-header { color: #9ca3af; }
    html.dark .stat-card-value { color: #f3f4f6; } /* \u767D\u8272\u6587\u5B57 */
    html.dark .stat-card-subtitle { color: #6b7280; } 
    html.dark .stat-card-trend.flat { background: #374151; color: #9ca3af; }
    html.dark .stat-card-trend.up { background: rgba(16, 185, 129, 0.2); }
    html.dark .stat-card-trend.down { background: rgba(239, 68, 68, 0.2); }
    html.dark .list-item:hover { background: #374151; }
    html.dark .list-item:not(:last-child) { border-bottom-color: #374151; }
    html.dark .list-item-name { color: #f3f4f6; } /* \u5217\u8868\u9879\u540D\u79F0\u53D8\u767D */
    html.dark .list-item-meta { color: #9ca3af; }
    html.dark .list-item-badge { background: #3730a3; color: #c7d2fe; }
    html.dark .ranking-item-name { color: #f3f4f6; } /* \u6392\u884C\u699C\u540D\u79F0\u53D8\u767D */
    html.dark .ranking-item-amount { color: #e5e7eb; } /* \u91D1\u989D\u53D8\u767D */
    html.dark .ranking-progress { background: #374151; }
    /* \u4FEE\u590D\u53F3\u4E0A\u89D2\u7684\u6807\u7B7E */
    html.dark .bg-indigo-100 { background-color: rgba(99, 102, 241, 0.2) !important; color: #a5b4fc !important; }
    html.dark .text-indigo-800 { color: #c7d2fe !important; }
    .loading-skeleton{background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:loading 1.5s infinite;height:100px;border-radius:8px}
    /* \u6697\u9ED1\u6A21\u5F0F\u9AA8\u67B6\u5C4F */
    html.dark .loading-skeleton { background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%); }
    @keyframes loading{0%{background-position:200% 0}100%{background-position:-200% 0}}
  </style>
</head>
<body class="bg-gray-50">
  <nav class="bg-white shadow-md relative z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center shrink-0">
          <div class="flex items-center">
            <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
            <span class="font-bold text-xl text-gray-800">\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</span>
          </div>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal hidden md:block pt-1"></span>
        </div>
        
        <div class="hidden md:flex items-center space-x-4 ml-auto">
          <a href="/admin/dashboard" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-chart-line mr-1"></i>\u4EEA\u8868\u76D8
          </a>
          <a href="/admin" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-list mr-1"></i>\u8BA2\u9605\u5217\u8868
          </a>
          <a href="/admin/notify-logs" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-history mr-1"></i>\u901A\u77E5\u5386\u53F2
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-cog mr-1"></i>\u7CFB\u7EDF\u914D\u7F6E
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-sign-out-alt mr-1"></i>\u9000\u51FA\u767B\u5F55
          </a>
        </div>

        <div class="flex items-center md:hidden ml-auto">
          <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-label="\u5207\u6362\u5BFC\u822A\u83DC\u5355" class="text-gray-600 hover:text-indigo-600 focus:outline-none p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-b border-gray-200 w-full">
      <div class="px-4 pt-2 pb-4 space-y-2">
        <div id="mobileTimeDisplay" class="px-3 py-2 text-xs text-indigo-600 text-right border-b border-gray-100 mb-2"></div>
        <a href="/admin/dashboard" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-chart-line w-6 text-center mr-2"></i>\u4EEA\u8868\u76D8
        </a>
        <a href="/admin" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-list w-6 text-center mr-2"></i>\u8BA2\u9605\u5217\u8868
        </a>
        <a href="/admin/notify-logs" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-history w-6 text-center mr-2"></i>\u901A\u77E5\u5386\u53F2
        </a>
        <a href="/admin/config" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-cog w-6 text-center mr-2"></i>\u7CFB\u7EDF\u914D\u7F6E
        </a>
        <a href="/api/logout" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors">
          <i class="fas fa-sign-out-alt w-6 text-center mr-2"></i>\u9000\u51FA\u767B\u5F55
        </a>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">\u{1F4CA} \u4EEA\u8868\u677F</h2>
      <p class="text-sm text-gray-500 mt-1">\u8BA2\u9605\u8D39\u7528\u548C\u6D3B\u52A8\u6982\u89C8\uFF08\u7EDF\u8BA1\u91D1\u989D\u5DF2\u6298\u5408\u4E3A CNY\uFF09</p>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-history text-indigo-500"></i>
          <h3 class="text-lg font-medium text-gray-900">\u81EA\u52A8\u63D0\u9192\u4EFB\u52A1\u72B6\u6001</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">Cron \u53EF\u89C2\u6D4B\u6027</span>
      </div>
      <div class="p-6" id="schedulerStatus">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium text-gray-900"><i class="fas fa-chart-pie text-indigo-500 mr-2"></i>\u6570\u636E\u6982\u89C8</h2>
      <button id="refreshBtn" onclick="manualRefresh()" class="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded hover:bg-indigo-50 transition">
        <i class="fas fa-sync-alt mr-1"></i>\u5237\u65B0
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" id="statsGrid">
      <div class="loading-skeleton"></div>
      <div class="loading-skeleton"></div>
      <div class="loading-skeleton"></div>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-calendar-check text-blue-500"></i>
          <h3 class="text-lg font-medium text-gray-900">\u6700\u8FD1\u652F\u4ED8</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">\u8FC7\u53BB7\u5929</span>
      </div>
      <div class="p-6" id="recentPayments">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-clock text-yellow-500"></i>
          <h3 class="text-lg font-medium text-gray-900">\u5373\u5C06\u7EED\u8D39</h3>
        </div>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">\u672A\u67657\u5929</span>
      </div>
      <div class="p-6" id="upcomingRenewals">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-stream text-indigo-500"></i>
          <h3 class="text-lg font-medium text-gray-900">\u81EA\u52A8\u63D0\u9192\u4EFB\u52A1\u5386\u53F2\uFF08\u6700\u8FD110\u6B21\uFF09</h3>
        </div>
      </div>
      <div class="p-6" id="schedulerStatusHistory">
        <div class="loading-skeleton"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-chart-bar text-purple-500"></i>
            <h3 class="text-lg font-medium text-gray-900">\u6309\u7C7B\u578B\u652F\u51FA\u6392\u884C</h3>
          </div>
          <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">\u5E74\u5EA6\u7EDF\u8BA1 (\u6298\u5408CNY)</span>
        </div>
        <div class="p-6" id="expenseByType">
          <div class="loading-skeleton"></div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-folder text-green-500"></i>
            <h3 class="text-lg font-medium text-gray-900">\u6309\u5206\u7C7B\u652F\u51FA\u7EDF\u8BA1</h3>
          </div>
          <span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">\u5E74\u5EA6\u7EDF\u8BA1 (\u6298\u5408CNY)</span>
        </div>
        <div class="p-6" id="expenseByCategory">
          <div class="loading-skeleton"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // \u7EDF\u4E00 API \u8BF7\u6C42\u5C01\u88C5\uFF1A401 \u81EA\u52A8\u8DF3\u8F6C\u767B\u5F55\u9875
    async function apiFetch(url, options) {
      const response = await fetch(url, options);
      if (response.status === 401) {
        window.location.href = '/';
        throw new Error('AUTH_EXPIRED');
      }
      return response;
    }

    // \u5B9A\u4E49\u8D27\u5E01\u7B26\u53F7\u6620\u5C04
    const currencySymbols = {
      'CNY': '\xA5', 'USD': '$', 'HKD': 'HK$', 'TWD': 'NT$', 
      'JPY': '\xA5', 'EUR': '\u20AC', 'GBP': '\xA3', 'KRW': '\u20A9', 'TRY': '\u20BA'
    };
    function getSymbol(currency) {
      return currencySymbols[currency] || '\xA5';
    }

    // \u524D\u7AEF\u7EDF\u4E00\u672C\u5730\u65F6\u533A\u663E\u793A
    async function showSystemTime() {
      try {
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        function formatTimezoneDisplay(tz) {
          try {
            const now = new Date();
            const dtf = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              hour12: false,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const parts = dtf.formatToParts(now);
            const get = type => Number(parts.find(x => x.type === type).value);
            const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
            const utc = now.getTime();
            const offset = Math.round((target - utc) / (1000 * 60 * 60));
            const offsetStr = offset >= 0 ? '+' + offset : offset;
            return \`\${tz} (UTC\${offsetStr})\`;
          } catch (error) {
            console.error('\u683C\u5F0F\u5316\u65F6\u533A\u663E\u793A\u5931\u8D25:', error);
            return tz;
          }
        }

        function update() {
          const now = new Date();
          const timeStr = now.toLocaleString('zh-CN', {
            timeZone: localTimezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const tzStr = formatTimezoneDisplay(localTimezone);
          const el = document.getElementById('systemTimeDisplay');
          if (el) {
            el.textContent = \`\${timeStr}  \${tzStr}\`;
          }
          const mobileEl = document.getElementById('mobileTimeDisplay');
          if (mobileEl) {
            mobileEl.textContent = \`\${timeStr} \${tzStr}\`;
          }
        }

        update();
        setInterval(update, 1000);
      } catch (e) {
        console.error(e);
      }
    }

    async function loadDashboardData(){
      try {
        const r=await apiFetch('/api/dashboard/stats');
        const d=await r.json();
        if(!d.success) throw new Error(d.message||'\u52A0\u8F7D\u5931\u8D25');
        
        const data=d.data;

        const schedulerStatusEl = document.getElementById('schedulerStatus');
        if (schedulerStatusEl) {
          const status = data.schedulerStatus;
          if (!status) {
            schedulerStatusEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u{1F550}</div><div class="empty-state-text">\u6682\u65E0\u5B9A\u65F6\u4EFB\u52A1\u6267\u884C\u8BB0\u5F55\uFF08\u7B49\u5F85\u4E0B\u4E00\u6B21 Cron\uFF09</div></div>';
          } else {
            const sendResult = status.sendResult || {};
            const runAt = status.lastRunAt ? new Date(status.lastRunAt).toLocaleString('zh-CN') : '\u672A\u77E5';
            const configuredHours = Array.isArray(status.configuredHours) && status.configuredHours.length > 0
              ? status.configuredHours.join(', ')
              : '\u5168\u90E8\u65F6\u6BB5';
            const sentBadge = status.sent
              ? '<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">\u672C\u6B21\u6709\u53D1\u9001</span>'
              : '<span class="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">\u672C\u6B21\u672A\u53D1\u9001</span>';

            schedulerStatusEl.innerHTML = \`
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">\u6700\u8FD1\u6267\u884C\u65F6\u95F4</div>
                  <div class="text-gray-900 font-medium mt-1">\${runAt}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">\u72B6\u6001</div>
                  <div class="mt-1">\${sentBadge}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">\u5F53\u524D\u5C0F\u65F6 / \u914D\u7F6E\u65F6\u6BB5\uFF08UTC\uFF09</div>
                  <div class="text-gray-900 font-medium mt-1">\${status.currentHour || '--'} / \${configuredHours}</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3">
                  <div class="text-gray-500">\u68C0\u67E5\u4E0E\u547D\u4E2D</div>
                  <div class="text-gray-900 font-medium mt-1">\u68C0\u67E5 \${status.checkedSubscriptions || 0} \u6761\uFF0C\u547D\u4E2D \${status.expiringMatched || 0} \u6761</div>
                </div>
                <div class="bg-gray-50 rounded-md p-3 md:col-span-2">
                  <div class="text-gray-500">\u53D1\u9001\u7ED3\u679C</div>
                  <div class="text-gray-900 font-medium mt-1">\u5C1D\u8BD5 \${sendResult.attempted || 0} \u4E2A\u6E20\u9053\uFF0C\u6210\u529F \${sendResult.successCount || 0}\uFF0C\u5931\u8D25 \${sendResult.failedCount || 0}\uFF0C\u53BB\u91CD\u8DF3\u8FC7 \${status.dedupeSkipped || 0}</div>
                  <div class="text-xs text-gray-500 mt-1">\${status.reason || '\u6682\u65E0\u8BE6\u60C5'}</div>
                </div>
              </div>
            \`;
          }
        }

        const schedulerHistory = Array.isArray(data.schedulerStatusHistory) ? data.schedulerStatusHistory : [];
        const schedulerHistoryEl = document.getElementById('schedulerStatusHistory');
        if (schedulerHistoryEl) {
          if (schedulerHistory.length === 0) {
            schedulerHistoryEl.innerHTML = '<div class="text-sm text-gray-500">\u6682\u65E0\u5386\u53F2\u8BB0\u5F55</div>';
          } else {
            schedulerHistoryEl.innerHTML = schedulerHistory.slice(0, 10).map(item => {
              const when = item.lastRunAt ? new Date(item.lastRunAt).toLocaleString('zh-CN') : '\u672A\u77E5\u65F6\u95F4';
              const sent = item.sent ? '\u5DF2\u53D1\u9001' : '\u672A\u53D1\u9001';
              const reason = item.reason || '-';
              return \`<div class="py-2 border-b border-gray-100 last:border-b-0 text-sm"><div class="font-medium text-gray-800">\${when} \xB7 \${sent}</div><div class="text-xs text-gray-500 mt-1">\${reason}</div></div>\`;
            }).join('');
          }
        }

        document.getElementById('statsGrid').innerHTML=\`
          <div class="stat-card">
            <div class="stat-card-header">\u6708\u5EA6\u652F\u51FA (CNY)</div>
            <div class="stat-card-value">\xA5\${data.monthlyExpense.amount.toFixed(2)}</div>
            <div class="stat-card-subtitle">\u672C\u6708\u6298\u5408\u652F\u51FA</div>
            <div class="stat-card-trend \${data.monthlyExpense.trendDirection}">
              <i class="fas fa-arrow-\${data.monthlyExpense.trendDirection==='up'?'up':data.monthlyExpense.trendDirection==='down'?'down':'right'}"></i>
              \${data.monthlyExpense.trend}%
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">\u5E74\u5EA6\u652F\u51FA (CNY)</div>
            <div class="stat-card-value">\xA5\${data.yearlyExpense.amount.toFixed(2)}</div>
            <div class="stat-card-subtitle">\u6708\u5747\u652F\u51FA: \xA5\${data.yearlyExpense.monthlyAverage.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-header">\u6D3B\u8DC3\u8BA2\u9605</div>
            <div class="stat-card-value">\${data.activeSubscriptions.active}</div>
            <div class="stat-card-subtitle">\u603B\u8BA2\u9605\u6570: \${data.activeSubscriptions.total}</div>
            \${data.activeSubscriptions.expiringSoon>0?\`<div class="stat-card-trend down"><i class="fas fa-exclamation-circle"></i>\${data.activeSubscriptions.expiringSoon} \u5373\u5C06\u5230\u671F</div>\`:''}
          </div>
        \`;
        
        const rp=document.getElementById('recentPayments');
        rp.innerHTML=data.recentPayments.length===0?'<div class="empty-state"><div class="empty-state-icon">\u{1F4ED}</div><div class="empty-state-text">\u8FC7\u53BB7\u5929\u5185\u6CA1\u6709\u652F\u4ED8\u8BB0\u5F55</div></div>':
        data.recentPayments.map(s=>\`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">\${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-calendar"></i> \${new Date(s.paymentDate).toLocaleDateString('zh-CN')}</span>
                \${s.customType?\`<span class="list-item-badge">\${s.customType}</span>\`:''}
              </div>
            </div>
            <div class="list-item-amount">\${getSymbol(s.currency)}\${(s.amount||0).toFixed(2)}</div>
          </div>
        \`).join('');
        
        const ur=document.getElementById('upcomingRenewals');
        ur.innerHTML=data.upcomingRenewals.length===0?'<div class="empty-state"><div class="empty-state-icon">\u2705</div><div class="empty-state-text">\u672A\u67657\u5929\u5185\u6CA1\u6709\u5373\u5C06\u7EED\u8D39\u7684\u8BA2\u9605</div></div>':
        data.upcomingRenewals.map(s=>\`
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-name">\${s.name}</div>
              <div class="list-item-meta">
                <span><i class="fas fa-clock"></i> \${new Date(s.renewalDate).toLocaleDateString('zh-CN')}</span>
                <span style="color:#f59e0b;font-weight:600">\${s.daysUntilRenewal} \u5929\u540E</span>
                \${s.customType?\`<span class="list-item-badge">\${s.customType}</span>\`:''}
              </div>
            </div>
            <div class="list-item-amount">\${getSymbol(s.currency)}\${(s.amount||0).toFixed(2)}</div>
          </div>
        \`).join('');
        
        const et=document.getElementById('expenseByType');
        et.innerHTML=data.expenseByType.length===0?'<div class="empty-state"><div class="empty-state-icon">\u{1F4CA}</div><div class="empty-state-text">\u6682\u65E0\u652F\u51FA\u6570\u636E</div></div>':
        data.expenseByType.map((item,i)=>\`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name">\${item.type}</div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">\xA5\${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">\${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-\${(i%5)+1}" style="width:\${item.percentage}%"></div>
            </div>
          </div>
        \`).join('');
        
        const ec=document.getElementById('expenseByCategory');
        ec.innerHTML=data.expenseByCategory.length===0?'<div class="empty-state"><div class="empty-state-icon">\u{1F4C2}</div><div class="empty-state-text">\u6682\u65E0\u652F\u51FA\u6570\u636E</div></div>':
        data.expenseByCategory.map((item,i)=>\`
          <div class="ranking-item">
            <div class="ranking-item-header">
              <div class="ranking-item-name">\${item.category}</div>
              <div class="ranking-item-value">
                <span class="ranking-item-amount">\xA5\${item.amount.toFixed(2)}</span>
                <span class="ranking-item-percentage">\${item.percentage}%</span>
              </div>
            </div>
            <div class="ranking-progress">
              <div class="ranking-progress-bar color-\${(i%5)+1}" style="width:\${item.percentage}%"></div>
            </div>
          </div>
        \`).join('');
      } catch(e){
        console.error('\u52A0\u8F7D\u4EEA\u8868\u76D8\u6570\u636E\u5931\u8D25:',e);
        document.getElementById('statsGrid').innerHTML='<div class="empty-state"><div class="empty-state-icon">\u274C</div><div class="empty-state-text">\u52A0\u8F7D\u5931\u8D25: '+(e.message||'\u7F51\u7EDC\u9519\u8BEF')+'</div><button onclick="manualRefresh()" class="mt-3 text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded border border-indigo-200 hover:bg-indigo-50"><i class="fas fa-redo mr-1"></i>\u91CD\u8BD5</button></div>';
      }
    }
    
    // \u624B\u52A8\u5237\u65B0
    async function manualRefresh() {
      const btn = document.getElementById('refreshBtn');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>\u5237\u65B0\u4E2D';
      btn.disabled = true;
      await loadDashboardData();
      btn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>\u5237\u65B0';
      btn.disabled = false;
    }
    window.manualRefresh = manualRefresh;

    // \u521D\u59CB\u5316\u65F6\u95F4\u663E\u793A\u548C\u6570\u636E\u52A0\u8F7D
    showSystemTime();
    loadDashboardData();

    // \u81EA\u52A8\u5237\u65B0\uFF1A\u9875\u9762\u53EF\u89C1\u65F6\u6BCF 60 \u79D2\u5237\u65B0\uFF0C\u4E0D\u53EF\u89C1\u65F6\u6682\u505C
    let refreshTimer = setInterval(loadDashboardData, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      } else {
        loadDashboardData();
        refreshTimer = setInterval(loadDashboardData, 60000);
      }
    });

    // --- \u79FB\u52A8\u7AEF\u83DC\u5355\u63A7\u5236\u811A\u672C ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      const syncMobileMenuState = () => {
        const icon = mobileMenuBtn.querySelector('i');
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('fa-bars', isHidden);
          icon.classList.toggle('fa-times', !isHidden);
        }
      };

      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        syncMobileMenuState();
      });

      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        });
      });

      document.addEventListener('click', (event) => {
        if (mobileMenu.classList.contains('hidden')) return;
        if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          syncMobileMenuState();
        }
      });

      syncMobileMenuState();
    }
  <\/script>
</body>
</html>`;

// src/views/notifyLogsPage.html
var notifyLogsPage_default = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u901A\u77E5\u5386\u53F2 - \u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  \${themeResources}
  <style>
    /* \u4E0E\u5176\u4ED6 admin \u9875\u4FDD\u6301\u4E00\u81F4\u7684\u5C0F\u5C4F\u9690\u85CF\u65F6\u949F\u89C4\u5219 */
    @media (max-width: 767px) {
      #systemTimeDisplay { display: none !important; }
    }
    /* \u901A\u77E5\u5386\u53F2\u4E13\u7528\u6837\u5F0F */
    .row-success { background-color: #f0fdf4; }
    .row-failed  { background-color: #fef2f2; }
    html.dark .row-success { background-color: rgba(34,197,94,0.08) !important; }
    html.dark .row-failed  { background-color: rgba(239,68,68,0.08) !important; }
    .raw-pre { white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow: auto; }
    /* \u6982\u89C8\u5361\u7247 hover \u4E0E admin \u4E00\u81F4 */
    .stat-card { background: #fff; border-radius: 12px; padding: 1rem 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
    html.dark .stat-card { background: var(--dark-bg-secondary); }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <!-- \u4E0E admin / config / dashboard \u5B8C\u5168\u4E00\u81F4\u7684\u9876\u90E8\u5BFC\u822A -->
  <nav class="bg-white shadow-md relative z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center shrink-0">
          <div class="flex items-center">
            <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
            <span class="font-bold text-xl text-gray-800">\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF</span>
          </div>
          <span id="systemTimeDisplay" class="ml-4 text-base text-indigo-600 font-normal hidden md:block pt-1"></span>
        </div>

        <div class="hidden md:flex items-center space-x-4 ml-auto">
          <a href="/admin/dashboard" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-chart-line mr-1"></i>\u4EEA\u8868\u76D8
          </a>
          <a href="/admin" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-list mr-1"></i>\u8BA2\u9605\u5217\u8868
          </a>
          <a href="/admin/notify-logs" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-history mr-1"></i>\u901A\u77E5\u5386\u53F2
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-cog mr-1"></i>\u7CFB\u7EDF\u914D\u7F6E
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-300 px-3 py-2 rounded-md text-sm font-medium transition">
            <i class="fas fa-sign-out-alt mr-1"></i>\u9000\u51FA\u767B\u5F55
          </a>
        </div>

        <div class="flex items-center md:hidden ml-auto">
          <button id="mobile-menu-btn" type="button" aria-expanded="false" aria-label="\u5207\u6362\u5BFC\u822A\u83DC\u5355"
            class="text-gray-600 hover:text-indigo-600 focus:outline-none p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-b border-gray-200 w-full">
      <div class="px-4 pt-2 pb-4 space-y-2">
        <div id="mobileTimeDisplay" class="px-3 py-2 text-xs text-indigo-600 text-right border-b border-gray-100 mb-2"></div>
        <a href="/admin/dashboard" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-chart-line w-6 text-center mr-2"></i>\u4EEA\u8868\u76D8
        </a>
        <a href="/admin" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-list w-6 text-center mr-2"></i>\u8BA2\u9605\u5217\u8868
        </a>
        <a href="/admin/notify-logs" class="block px-3 py-3 rounded-md text-base font-medium text-indigo-600 bg-indigo-50">
          <i class="fas fa-history w-6 text-center mr-2"></i>\u901A\u77E5\u5386\u53F2
        </a>
        <a href="/admin/config" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
          <i class="fas fa-cog w-6 text-center mr-2"></i>\u7CFB\u7EDF\u914D\u7F6E
        </a>
        <a href="/api/logout" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors">
          <i class="fas fa-sign-out-alt w-6 text-center mr-2"></i>\u9000\u51FA\u767B\u5F55
        </a>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- \u9875\u9762\u5934\u90E8\uFF08\u4E0E\u8BA2\u9605\u5217\u8868\u7684 h2 + subtitle \u6A21\u5F0F\u4E00\u81F4\uFF09 -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-history text-indigo-600 mr-2"></i>\u901A\u77E5\u5386\u53F2
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          \u6BCF\u6761\u901A\u77E5\uFF08\u6210\u529F/\u5931\u8D25\uFF09\u90FD\u6709\u8BB0\u5F55\uFF0C30 \u5929 TTL\uFF1B\u7528\u4E8E\u81EA\u52A9\u6392\u67E5"\u4E3A\u4EC0\u4E48\u6CA1\u6536\u5230\u901A\u77E5"
        </p>
      </div>
      <button id="reloadBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium self-start md:self-auto">
        <i class="fas fa-sync mr-1"></i>\u5237\u65B0\u6570\u636E
      </button>
    </div>

    <!-- \u6982\u89C8\u5361\u7247 -->
    <div id="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card text-center">
        <div class="text-xs text-gray-500 uppercase font-medium tracking-wide">\u603B\u8BB0\u5F55</div>
        <div id="metricTotal" class="text-3xl font-bold text-gray-800 mt-1">-</div>
      </div>
      <div class="stat-card text-center">
        <div class="text-xs text-gray-500 uppercase font-medium tracking-wide">\u6210\u529F</div>
        <div id="metricSuccess" class="text-3xl font-bold text-green-600 mt-1">-</div>
      </div>
      <div class="stat-card text-center">
        <div class="text-xs text-gray-500 uppercase font-medium tracking-wide">\u5931\u8D25</div>
        <div id="metricFailed" class="text-3xl font-bold text-red-600 mt-1">-</div>
      </div>
      <div class="stat-card text-center">
        <div class="text-xs text-gray-500 uppercase font-medium tracking-wide">\u6700\u8FD1\u4E00\u6B21\u53D1\u9001</div>
        <div id="metricLatest" class="text-sm font-semibold text-gray-700 mt-2">-</div>
      </div>
    </div>

    <!-- \u7B5B\u9009\u6761 -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">\u8BA2\u9605</label>
          <select id="filterSubId" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="">\u5168\u90E8\u8BA2\u9605</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">\u6E20\u9053</label>
          <select id="filterChannel" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="">\u5168\u90E8</option>
            <option value="telegram">Telegram</option>
            <option value="notifyx">NotifyX</option>
            <option value="webhook">Webhook</option>
            <option value="wechatbot">\u4F01\u4E1A\u5FAE\u4FE1</option>
            <option value="email">\u90AE\u4EF6</option>
            <option value="bark">Bark</option>
            <option value="gotify">Gotify</option>
            <option value="serverchan">Server\u9171</option>
            <option value="pushplus">PushPlus</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">\u72B6\u6001</label>
          <select id="filterStatus" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="">\u5168\u90E8</option>
            <option value="success">\u6210\u529F</option>
            <option value="failed">\u5931\u8D25</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">\u65F6\u95F4\u8303\u56F4</label>
          <select id="filterSince" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="24">\u6700\u8FD1 24 \u5C0F\u65F6</option>
            <option value="72" selected>\u6700\u8FD1 3 \u5929</option>
            <option value="168">\u6700\u8FD1 7 \u5929</option>
            <option value="720">\u6700\u8FD1 30 \u5929</option>
            <option value="">\u4E0D\u9650</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">\u6761\u6570\u4E0A\u9650</label>
          <select id="filterLimit" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <option value="50">50</option>
            <option value="100" selected>100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>
    </div>

    <!-- \u8C03\u5EA6\u65E5\u5FD7\u5FEB\u901F\u9884\u89C8\uFF08\u4E0E\u8BA2\u9605\u5217\u8868"\u6279\u91CF\u64CD\u4F5C"\u533A\u4E00\u81F4\u7684\u6298\u53E0\u98CE\u683C\uFF09 -->
    <details class="bg-white rounded-lg shadow-md mb-6">
      <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
        <i class="fas fa-clock text-indigo-600 mr-2"></i>\u6700\u8FD1 10 \u6B21\u5B9A\u65F6\u4EFB\u52A1\u6267\u884C
        <span class="text-xs text-gray-500 ml-2">\u70B9\u51FB\u5C55\u5F00\u67E5\u770B\u94FE\u8DEF\u660E\u7EC6</span>
      </summary>
      <div id="schedLogs" class="px-4 pb-4 mt-2 space-y-2 text-xs"></div>
    </details>

    <!-- \u4E3B\u8868\u683C -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u65F6\u95F4</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u8BA2\u9605</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u89C4\u5219</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u6E20\u9053</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u72B6\u6001</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">\u8BE6\u60C5</th>
            </tr>
          </thead>
          <tbody id="logsBody" class="divide-y divide-gray-200 bg-white">
            <tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">\u52A0\u8F7D\u4E2D\u2026</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- \u52A0\u8F7D\u66F4\u591A\uFF08\u6E38\u6807\u5206\u9875\uFF09 -->
    <div id="loadMoreWrap" class="hidden text-center py-5">
      <button id="loadMoreBtn" type="button"
        class="inline-flex items-center px-5 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
        <i class="fas fa-chevron-down mr-2"></i>\u52A0\u8F7D\u66F4\u591A
      </button>
      <p id="loadMoreHint" class="text-xs text-gray-400 mt-2"></p>
    </div>
  </div>

  <script>
/**
 * \u7B80\u6613 API \u5BA2\u6237\u7AEF
 *
 * \u7528\u6CD5\uFF08\u6D4F\u89C8\u5668\u5168\u5C40\uFF09\uFF1A
 *   \u5728\u9875\u9762\u5F15\u5165 /js/lib/api-client.js\uFF08\u6216\u672C\u5185\u8054\u526F\u672C\uFF09\u540E\u76F4\u63A5\u8C03\u7528\uFF1A
 *   const r = await ApiClient.get('/api/notification-logs');
 *
 * \u6240\u6709\u65B9\u6CD5\u90FD\u8FD4\u56DE\u89E3\u6790\u540E\u7684 JSON\uFF1BHTTP \u975E 2xx \u4F1A\u629B\u51FA\u542B status / body \u7684 Error\u3002
 * \u81EA\u52A8\u5E26 Cookie\uFF08\u51ED\u7740\u7AD9\u5185 SameSite=Strict \u7684 token\uFF09\u3002
 */
(function (root) {
  'use strict';

  async function request(method, url, body) {
    /** @type {RequestInit} */
    const init = {
      method,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    };
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // \u975E JSON \u54CD\u5E94\uFF0C\u4FDD\u7559 null
    }
    if (res.status === 401) {
      try {
        if (typeof window !== 'undefined' && window.location && !String(window.location.pathname || '').match(/^\\/?$/)) {
          window.location.href = '/';
        }
      } catch (_) { /* ignore */ }
      const err = new Error((data && data.message) || '\u672A\u6388\u6743\u8BBF\u95EE');
      // @ts-ignore
      err.status = 401;
      // @ts-ignore
      err.body = data;
      throw err;
    }
    if (!res.ok) {
      const err = new Error((data && data.message) || ('HTTP ' + res.status));
      // @ts-ignore
      err.status = res.status;
      // @ts-ignore
      err.body = data;
      throw err;
    }
    return data;
  }

  /**
   * \u7B80\u6613\u67E5\u8BE2\u5B57\u7B26\u4E32\u6784\u9020\uFF08None / undefined \u5B57\u6BB5\u8FC7\u6EE4\u6389\uFF09\u3002
   *
   * @param {Record<string, any>} params
   * @returns {string}
   */
  function qs(params) {
    if (!params) return '';
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      usp.append(k, String(v));
    }
    const s = usp.toString();
    return s ? '?' + s : '';
  }

  root.ApiClient = {
    get: (url, params) => request('GET', url + qs(params)),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    delete: (url) => request('DELETE', url),
    qs
  };
})(typeof window !== 'undefined' ? window : globalThis);

  <\/script>
  <script>
    /**
     * \u901A\u77E5\u5386\u53F2\u9875\u811A\u672C
     *
     * \u6570\u636E\u6E90\uFF1A
     *   GET /api/notification-logs?subId=&channel=&status=&since=&limit=
     *   GET /api/scheduler-logs?limit=10
     *   GET /api/config \uFF08\u53D6 TIMEZONE \u7528\u4E8E\u672C\u5730\u65F6\u95F4\u663E\u793A\uFF09
     *   GET /api/subscriptions \uFF08\u6620\u5C04 subId \u2192 \u8BA2\u9605\u540D\uFF09
     */
    let userTz = 'UTC';
    let subNameMap = {};
    // \u6E38\u6807\u5206\u9875\u72B6\u6001
    let allLogs = [];
    let nextCursor = null;
    let loadingMore = false;

    function fmtTime(iso) {
      try {
        return new Date(iso).toLocaleString('zh-CN', { timeZone: userTz });
      } catch {
        return iso;
      }
    }

    function ruleLabel(ruleId) {
      if (!ruleId || ruleId === 'none' || ruleId === 'null') {
        return '<span class="text-gray-400">\u624B\u52A8/\u9ED8\u8BA4</span>';
      }
      return '<span class="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">' + ruleId.slice(0, 8) + '</span>';
    }

    function statusBadge(s) {
      if (s === 'success') return '<span class="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">\u2713 \u6210\u529F</span>';
      if (s === 'failed')  return '<span class="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">\u2717 \u5931\u8D25</span>';
      return '<span class="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">' + s + '</span>';
    }

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function buildDetail(log) {
      const parts = [];
      if (log.title) parts.push('<div><b>\u6807\u9898\uFF1A</b>' + escapeHtml(log.title) + '</div>');
      if (log.error) parts.push('<div class="text-red-600 mt-1"><b>\u9519\u8BEF\uFF1A</b>' + escapeHtml(log.error) + '</div>');
      if (log.raw) {
        const raw = typeof log.raw === 'string' ? log.raw : JSON.stringify(log.raw, null, 2);
        parts.push('<details class="mt-1"><summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700">\u5C55\u5F00\u539F\u59CB\u8FD4\u56DE</summary><pre class="raw-pre text-xs bg-gray-50 p-2 mt-1 rounded">' + escapeHtml(raw) + '</pre></details>');
      }
      if (log.content) {
        const trimmed = String(log.content).slice(0, 300) + (log.content.length > 300 ? '\u2026' : '');
        parts.push('<details class="mt-1"><summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700">\u5C55\u5F00\u901A\u77E5\u6B63\u6587</summary><pre class="raw-pre text-xs bg-gray-50 p-2 mt-1 rounded">' + escapeHtml(trimmed) + '</pre></details>');
      }
      return parts.length ? parts.join('') : '<span class="text-gray-400">\u65E0</span>';
    }

    async function loadConfig() {
      try {
        const res = await fetch('/api/config', { credentials: 'same-origin' });
        const cfg = await res.json();
        if (cfg && cfg.TIMEZONE) userTz = cfg.TIMEZONE;
      } catch (e) { /* ignore */ }
    }

    async function loadSubs() {
      try {
        const res = await fetch('/api/subscriptions', { credentials: 'same-origin' });
        const list = await res.json();
        const select = document.getElementById('filterSubId');
        if (Array.isArray(list)) {
          for (const s of list) {
            subNameMap[s.id] = s.name;
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            select.appendChild(opt);
          }
        }
      } catch (e) { /* ignore */ }
    }

    async function loadSchedLogs() {
      const target = document.getElementById('schedLogs');
      target.innerHTML = '<div class="text-gray-400 px-2 py-4">\u52A0\u8F7D\u4E2D\u2026</div>';
      try {
        const data = await ApiClient.get('/api/scheduler-logs', { limit: 10 });
        const logs = (data && data.logs) || [];
        if (logs.length === 0) {
          target.innerHTML = '<div class="text-gray-400 px-2 py-4">\u6682\u65E0\u8C03\u5EA6\u8BB0\u5F55</div>';
          return;
        }
        target.innerHTML = logs.map(l => {
          const color = l.status === 'ok' ? 'text-green-600' : (l.status === 'skipped' ? 'text-yellow-600' : 'text-red-600');
          const statusLabel = l.status === 'ok' ? '\u2713 \u6210\u529F' : (l.status === 'skipped' ? '\u2298 \u8DF3\u8FC7' : '\u2717 \u9519\u8BEF');
          return '<div class="flex flex-wrap items-center gap-3 border-b border-gray-100 py-1.5 last:border-0">'
            + '<span class="text-gray-500 font-mono">' + escapeHtml(fmtTime(l.startedAt)) + '</span>'
            + '<span class="' + color + ' font-medium">' + statusLabel + '</span>'
            + '<span class="text-gray-700">' + escapeHtml(l.timezone) + ' \xB7 \u672C\u5730\u5C0F\u65F6 <b>' + escapeHtml(l.currentHour) + '</b> \xB7 \u5728\u7A97\u53E3=' + (l.inWindow ? '\u662F' : '\u5426') + '</span>'
            + '<span class="text-gray-700">\u547D\u4E2D <b>' + l.matchedCount + '</b> / \u53BB\u91CD <b>' + l.dedupedCount + '</b> / \u53D1\u9001 <b>' + l.sentCount + '</b> / \u7EED\u8BA2 <b>' + l.autoRenewedCount + '</b></span>'
            + (l.reason ? '<span class="text-gray-500 italic">' + escapeHtml(l.reason) + '</span>' : '')
            + '</div>';
        }).join('');
      } catch (err) {
        target.innerHTML = '<div class="text-red-500 px-2 py-4">\u52A0\u8F7D\u5931\u8D25\uFF1A' + escapeHtml(err.message) + '</div>';
      }
    }

    async function loadLogs(append) {
      const subId = document.getElementById('filterSubId').value.trim();
      const channel = document.getElementById('filterChannel').value;
      const status = document.getElementById('filterStatus').value;
      const sinceHours = document.getElementById('filterSince').value;
      const limit = Number(document.getElementById('filterLimit').value) || 100;
      const params = { limit };
      if (subId) params.subId = subId;
      if (channel) params.channel = channel;
      if (status) params.status = status;
      if (sinceHours) {
        params.since = new Date(Date.now() - Number(sinceHours) * 3600 * 1000).toISOString();
      }
      if (append && nextCursor) params.cursor = nextCursor;

      const tbody = document.getElementById('logsBody');
      const btn = document.getElementById('loadMoreBtn');
      if (!append) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">\u52A0\u8F7D\u4E2D\u2026</td></tr>';
        document.getElementById('loadMoreWrap').classList.add('hidden');
      }
      try {
        const data = await ApiClient.get('/api/notification-logs', params);
        const logs = (data && data.logs) || [];
        nextCursor = (data && data.nextCursor) || null;
        if (!append) allLogs = [];
        allLogs = allLogs.concat(logs);
        renderMetrics();
        renderRows();
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>\u52A0\u8F7D\u66F4\u591A'; }
      } catch (err) {
        if (append) {
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>\u52A0\u8F7D\u66F4\u591A'; }
          const hint = document.getElementById('loadMoreHint');
          if (hint) hint.textContent = '\u52A0\u8F7D\u5931\u8D25\uFF1A' + err.message;
        } else {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-12 text-center text-red-500">\u52A0\u8F7D\u5931\u8D25\uFF1A' + escapeHtml(err.message) + '</td></tr>';
        }
      }
    }

    function renderMetrics() {
      document.getElementById('metricTotal').textContent = allLogs.length;
      document.getElementById('metricSuccess').textContent = allLogs.filter(l => l.status === 'success').length;
      document.getElementById('metricFailed').textContent = allLogs.filter(l => l.status === 'failed').length;
      document.getElementById('metricLatest').textContent = allLogs.length ? fmtTime(allLogs[0].timestamp) : '-';
    }

    function renderRows() {
      const tbody = document.getElementById('logsBody');
      if (allLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5F55</td></tr>';
      } else {
        tbody.innerHTML = allLogs.map(l => {
          const subName = subNameMap[l.subId] || l.subId;
          const rowClass = l.status === 'failed' ? 'row-failed' : 'row-success';
          return '<tr class="' + rowClass + ' hover:bg-opacity-75">'
            + '<td class="px-4 py-3 align-top whitespace-nowrap font-mono text-xs">' + escapeHtml(fmtTime(l.timestamp)) + '</td>'
            + '<td class="px-4 py-3 align-top">' + escapeHtml(subName) + '</td>'
            + '<td class="px-4 py-3 align-top">' + ruleLabel(l.ruleId) + '</td>'
            + '<td class="px-4 py-3 align-top font-medium">' + escapeHtml(l.channel) + '</td>'
            + '<td class="px-4 py-3 align-top">' + statusBadge(l.status) + '</td>'
            + '<td class="px-4 py-3 align-top text-xs">' + buildDetail(l) + '</td>'
            + '</tr>';
        }).join('');
      }
      const wrap = document.getElementById('loadMoreWrap');
      if (wrap) wrap.classList.toggle('hidden', !nextCursor);
    }

    // \u2500\u2500\u2500 \u4E8B\u4EF6\u7ED1\u5B9A \u2500\u2500\u2500
    document.getElementById('reloadBtn').addEventListener('click', () => {
      loadLogs();
      loadSchedLogs();
    });
    ['filterSubId', 'filterChannel', 'filterStatus', 'filterSince', 'filterLimit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', loadLogs);
    });
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        if (loadingMore) return;
        loadingMore = true;
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>\u52A0\u8F7D\u4E2D\u2026';
        loadLogs(true).finally(() => { loadingMore = false; });
      });
    }

    // \u2500\u2500\u2500 \u5B9E\u65F6\u65F6\u949F\uFF08\u4E0E\u5176\u4ED6 admin \u9875\u4E00\u81F4\u7684\u5B9E\u73B0\uFF09\u2500\u2500\u2500
    function formatTimezoneDisplay(tz) {
      try {
        const now = new Date();
        const dtf = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour12: false,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const parts = dtf.formatToParts(now);
        const get = (type) => Number(parts.find(x => x.type === type).value);
        const target = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
        const offset = Math.round((target - now.getTime()) / (1000 * 60 * 60));
        const offsetStr = offset >= 0 ? '+' + offset : offset;
        const names = {
          'UTC': '\u4E16\u754C\u6807\u51C6\u65F6\u95F4',
          'Asia/Shanghai': '\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4',
          'Asia/Hong_Kong': '\u9999\u6E2F\u65F6\u95F4',
          'Asia/Taipei': '\u53F0\u5317\u65F6\u95F4',
          'Asia/Singapore': '\u65B0\u52A0\u5761\u65F6\u95F4',
          'Asia/Tokyo': '\u65E5\u672C\u65F6\u95F4',
          'Asia/Seoul': '\u97E9\u56FD\u65F6\u95F4',
          'America/New_York': '\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4',
          'America/Los_Angeles': '\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4',
          'America/Chicago': '\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4',
          'America/Denver': '\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4',
          'Europe/London': '\u82F1\u56FD\u65F6\u95F4',
          'Europe/Paris': '\u5DF4\u9ECE\u65F6\u95F4',
          'Europe/Berlin': '\u67CF\u6797\u65F6\u95F4',
          'Europe/Moscow': '\u83AB\u65AF\u79D1\u65F6\u95F4',
          'Australia/Sydney': '\u6089\u5C3C\u65F6\u95F4',
          'Australia/Melbourne': '\u58A8\u5C14\u672C\u65F6\u95F4',
          'Pacific/Auckland': '\u5965\u514B\u5170\u65F6\u95F4'
        };
        const cn = names[tz] || tz;
        return cn + ' (UTC' + offsetStr + ')';
      } catch { return tz; }
    }

    function startClock() {
      const updateClock = () => {
        try {
          const now = new Date();
          const timeStr = now.toLocaleString('zh-CN', {
            timeZone: userTz,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const tzStr = formatTimezoneDisplay(userTz);
          const el = document.getElementById('systemTimeDisplay');
          const mob = document.getElementById('mobileTimeDisplay');
          if (el) el.textContent = timeStr + '  ' + tzStr;
          if (mob) mob.textContent = timeStr + ' ' + tzStr;
        } catch { /* ignore */ }
      };
      updateClock();
      setInterval(updateClock, 1000);
    }

    // \u2500\u2500\u2500 \u79FB\u52A8\u7AEF\u83DC\u5355\uFF08\u4E0E\u5176\u4ED6 admin \u9875\u4E00\u81F4\u7684\u5B9E\u73B0\uFF09\u2500\u2500\u2500
    function setupMobileMenu() {
      const btn = document.getElementById('mobile-menu-btn');
      const menu = document.getElementById('mobile-menu');
      if (!btn || !menu) return;
      const sync = () => {
        const icon = btn.querySelector('i');
        const isHidden = menu.classList.contains('hidden');
        btn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('fa-bars', isHidden);
          icon.classList.toggle('fa-times', !isHidden);
        }
      };
      btn.addEventListener('click', () => { menu.classList.toggle('hidden'); sync(); });
      menu.querySelectorAll('a').forEach(link =>
        link.addEventListener('click', () => { menu.classList.add('hidden'); sync(); })
      );
      document.addEventListener('click', (e) => {
        if (menu.classList.contains('hidden')) return;
        if (btn.contains(e.target) || menu.contains(e.target)) return;
        menu.classList.add('hidden'); sync();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
          menu.classList.add('hidden'); sync();
        }
      });
      sync();
    }

    // \u2500\u2500\u2500 \u542F\u52A8 \u2500\u2500\u2500
    (async function init() {
      setupMobileMenu();
      await loadConfig();
      startClock();
      await loadSubs();
      await Promise.all([loadLogs(), loadSchedLogs()]);
    })();
  <\/script>
</body>
</html>
`;

// src/views/pages.js
function injectTheme(html) {
  return html.replace(/\$\{themeResources\}/g, theme_resources_default);
}
var loginPage = injectTheme(loginPage_default);
var adminPage = injectTheme(adminPage_default);
var configPage = injectTheme(configPage_default);
var notifyLogsPage = injectTheme(notifyLogsPage_default);
function dashboardPage() {
  return injectTheme(dashboardPage_default);
}

// src/api/admin.js
async function handleAdminRequest(request, env) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log("[\u7BA1\u7406\u9875\u9762] \u8BBF\u95EE\u8DEF\u5F84:", pathname);
    const token = getCookieValue(request.headers.get("Cookie"), "token");
    console.log("[\u7BA1\u7406\u9875\u9762] Token\u5B58\u5728:", !!token);
    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    console.log("[\u7BA1\u7406\u9875\u9762] \u7528\u6237\u9A8C\u8BC1\u7ED3\u679C:", !!user);
    if (!user) {
      console.log("[\u7BA1\u7406\u9875\u9762] \u7528\u6237\u672A\u767B\u5F55\uFF0C\u91CD\u5B9A\u5411\u5230\u767B\u5F55\u9875\u9762");
      return new Response("", {
        status: 302,
        headers: { "Location": "/" }
      });
    }
    if (pathname === "/admin/config") {
      return new Response(configPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (pathname === "/admin/dashboard") {
      return new Response(dashboardPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (pathname === "/admin/notify-logs") {
      return new Response(notifyLogsPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    return new Response(adminPage, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("[\u7BA1\u7406\u9875\u9762] \u5904\u7406\u8BF7\u6C42\u65F6\u51FA\u9519:", error);
    return new Response("\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
function handleLoginPage() {
  return new Response(loginPage, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// src/api/debug.js
init_config();
init_time();
init_scheduler_logs_repo();
function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function handleDebug(request, env) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("export") === "sched_logs") {
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));
      const logs = await getRecent(env, limit);
      return new Response(JSON.stringify(logs, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="scheduler-logs-${Date.now()}.json"`
        }
      });
    }
    const config = await getConfig(env);
    const tz = config.TIMEZONE || "UTC";
    const now = getNowInTimezone(tz);
    const notificationHours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS.map((h) => String(h).padStart(2, "0")) : [];
    const inWindow = notificationHours.length === 0 || notificationHours.includes("*") || notificationHours.includes("ALL") || notificationHours.includes(now.hourString);
    const debugInfo = {
      timestamp: now.utc.toISOString(),
      pathname: url.pathname,
      kvBinding: !!env.SUBSCRIPTIONS_KV,
      configExists: !!config,
      adminUsername: config.ADMIN_USERNAME,
      hasJwtSecret: !!config.JWT_SECRET,
      jwtSecretLength: config.JWT_SECRET ? config.JWT_SECRET.length : 0,
      timezone: tz,
      timezoneDisplay: formatTimezoneDisplay(tz),
      timezoneOffsetHours: getTimezoneOffset(tz),
      utcIso: now.utc.toISOString(),
      localIso: now.isoLocal,
      currentHour: now.hourString,
      configuredHours: notificationHours,
      inNotificationWindow: inWindow
    };
    return new Response(
      `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>\u8C03\u8BD5\u4FE1\u606F - SubsTracker</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", monospace; padding: 20px; background: #f5f5f5; color: #333; }
    h1 { font-size: 22px; }
    .info { background: white; padding: 15px 20px; margin: 12px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .info h3 { margin-top: 0; font-size: 16px; color: #555; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .row .k { color: #666; }
    .row .v { font-weight: 600; color: #1a1a1a; }
    .success { color: #16a34a; }
    .error { color: #dc2626; }
    .warn { color: #ca8a04; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>\u7CFB\u7EDF\u8C03\u8BD5\u4FE1\u606F</h1>

  <div class="info">
    <h3>\u57FA\u672C</h3>
    <div class="row"><span class="k">UTC \u65F6\u95F4</span><span class="v">${esc(debugInfo.timestamp)}</span></div>
    <div class="row"><span class="k">\u8BBF\u95EE\u8DEF\u5F84</span><span class="v">${esc(debugInfo.pathname)}</span></div>
    <div class="row"><span class="k">KV \u7ED1\u5B9A</span><span class="v ${debugInfo.kvBinding ? "success" : "error"}">${debugInfo.kvBinding ? "\u2713 \u5DF2\u7ED1\u5B9A" : "\u2717 \u672A\u7ED1\u5B9A"}</span></div>
    <div class="row"><span class="k">\u914D\u7F6E\u53EF\u8BFB</span><span class="v ${debugInfo.configExists ? "success" : "error"}">${debugInfo.configExists ? "\u2713" : "\u2717"}</span></div>
    <div class="row"><span class="k">\u7BA1\u7406\u5458\u7528\u6237\u540D</span><span class="v">${esc(debugInfo.adminUsername || "(\u672A\u8BBE\u7F6E)")}</span></div>
    <div class="row"><span class="k">JWT \u5BC6\u94A5</span><span class="v ${debugInfo.hasJwtSecret ? "success" : "error"}">${debugInfo.hasJwtSecret ? `\u2713 \u5DF2\u8BBE\u7F6E (${debugInfo.jwtSecretLength} \u5B57\u7B26)` : "\u2717 \u7F3A\u5931"}</span></div>
  </div>

  <div class="info">
    <h3>\u65F6\u533A\u8BCA\u65AD</h3>
    <div class="row"><span class="k">\u914D\u7F6E\u7684\u65F6\u533A</span><span class="v">${esc(debugInfo.timezoneDisplay)}</span></div>
    <div class="row"><span class="k">\u65F6\u533A\u504F\u79FB</span><span class="v">UTC${debugInfo.timezoneOffsetHours >= 0 ? "+" : ""}${debugInfo.timezoneOffsetHours} \u5C0F\u65F6</span></div>
    <div class="row"><span class="k">\u5F53\u524D UTC</span><span class="v">${esc(debugInfo.utcIso)}</span></div>
    <div class="row"><span class="k">\u5F53\u524D\u7528\u6237\u672C\u5730\u65F6\u95F4</span><span class="v">${esc(debugInfo.localIso)}</span></div>
    <div class="row"><span class="k">\u7528\u4E8E\u901A\u77E5\u65F6\u6BB5\u5224\u65AD\u7684\u5C0F\u65F6</span><span class="v">${esc(debugInfo.currentHour)}</span></div>
    <div class="row"><span class="k">\u914D\u7F6E\u7684\u901A\u77E5\u5C0F\u65F6\uFF08\u7528\u6237 TZ\uFF09</span><span class="v">${notificationHours.length === 0 ? '<em class="warn">\u7A7A\uFF08\u9ED8\u8BA4\u5168\u5929\u53D1\u9001\uFF09</em>' : `<code>${esc(notificationHours.join(", "))}</code>`}</span></div>
    <div class="row"><span class="k">\u73B0\u5728\u662F\u5426\u5141\u8BB8\u53D1\u9001</span><span class="v ${debugInfo.inNotificationWindow ? "success" : "warn"}">${debugInfo.inNotificationWindow ? "\u2713 \u5728\u7A97\u53E3\u5185" : "\u2717 \u4E0D\u5728\u7A97\u53E3\u5185"}</span></div>
  </div>

  <div class="info">
    <h3>\u63D0\u793A</h3>
    <p>1. \u5982\u679C\u65F6\u533A\u8BCA\u65AD\u4E2D"\u5F53\u524D\u5C0F\u65F6"\u4E0E\u4F60\u9884\u671F\u4E0D\u7B26\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E\u4E2D\u7684 <code>TIMEZONE</code> \u662F\u5426\u4E0E\u4F60\u6240\u5728\u5730\u5339\u914D\u3002</p>
    <p>2. \u672C\u7248\u672C <code>NOTIFICATION_HOURS</code> <strong>\u6309\u4F60\u914D\u7F6E\u7684\u65F6\u533A</strong>\u89E3\u91CA\uFF08\u4E0D\u518D\u662F UTC\uFF09\u3002\u4F8B\u5982\u60F3\u8BA9\u5317\u4EAC\u65F6\u95F4 8 \u70B9\u6536\u5230\u901A\u77E5\uFF0C<code>TIMEZONE=Asia/Shanghai</code> \u65F6\u586B <code>08</code>\u3002</p>
    <p>3. \u8BE6\u7EC6\u53D1\u9001\u8BB0\u5F55\u8BF7\u524D\u5F80\u540E\u53F0"\u901A\u77E5\u5386\u53F2"\u9875\uFF08\u540E\u7EED\u7248\u672C\u63D0\u4F9B\uFF09\u3002</p>
    <p>4. <a href="/admin">\u8FD4\u56DE\u7BA1\u7406\u540E\u53F0</a></p>
    <p>5. <a href="/debug?export=sched_logs&limit=50">\u{1F4E5} \u5BFC\u51FA\u6700\u8FD1 50 \u6761\u8C03\u5EA6\u6267\u884C\u65E5\u5FD7\uFF08JSON\uFF09</a></p>
  </div>
</body>
</html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(`\u8C03\u8BD5\u9875\u9762\u9519\u8BEF: ${error && error.message ? error.message : error}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

// src/data/migrate.js
init_subscriptions_repo();
init_reminders_repo();
init_scheduler_logs_repo();
var SCHEMA_VERSION = "v4";
var KEY_SCHEMA_VERSION = "schema_version";
var KEY_MIGRATION_LOCK = "migration_lock";
var LOCK_TTL_SEC = 60;
var BACKUP_TTL_SEC = 7 * 24 * 3600;
var MIGRATION_STEPS = [
  {
    id: "subscriptions_v3",
    description: "\u628A\u5355 Key subscriptions \u62C6\u6210 sub:{id} + sub_index",
    run: migrateSubscriptions
  },
  {
    id: "reminder_rules_v3",
    description: "\u628A\u8BA2\u9605\u81EA\u5E26\u7684 reminderUnit/reminderValue \u8F6C\u6210 reminder_rules:{subId}",
    run: migrateReminderRules
  },
  {
    id: "scheduler_logs_v3",
    description: "\u628A\u65E7 scheduler_status_history \u5408\u5E76\u5230 sched_log:{iso}",
    run: migrateSchedulerLogs
  },
  {
    id: "sub_summary_v3",
    description: "\u7ED9\u8BA2\u9605\u5185\u5D4C\u63D0\u9192\u6458\u8981\u5B57\u6BB5\uFF0C\u5217\u8868\u9875\u4E0D\u518D\u9010\u6761\u8BFB\u89C4\u5219",
    run: migrateSubSummaries
  }
];
var cachedSchemaVersion = (
  /** @type {string|null} */
  null
);
async function ensureMigrations(env) {
  if (cachedSchemaVersion === SCHEMA_VERSION) {
    return { migrated: false, reason: "cached" };
  }
  const current = await env.SUBSCRIPTIONS_KV.get(KEY_SCHEMA_VERSION);
  if (current === SCHEMA_VERSION) {
    cachedSchemaVersion = SCHEMA_VERSION;
    return { migrated: false, reason: "already_" + SCHEMA_VERSION };
  }
  const acquired = await tryAcquireLock(env);
  if (!acquired) {
    return { migrated: false, reason: "locked_elsewhere" };
  }
  const ranSteps = [];
  try {
    for (const step of MIGRATION_STEPS) {
      const doneFlag = await env.SUBSCRIPTIONS_KV.get(`migrate:${step.id}`);
      if (doneFlag === "done") continue;
      console.log(`[migrate] \u5F00\u59CB\u6267\u884C: ${step.id} - ${step.description}`);
      await step.run(env);
      await env.SUBSCRIPTIONS_KV.put(`migrate:${step.id}`, "done");
      console.log(`[migrate] \u5B8C\u6210: ${step.id}`);
      ranSteps.push(step.id);
    }
    await env.SUBSCRIPTIONS_KV.put(KEY_SCHEMA_VERSION, SCHEMA_VERSION);
    cachedSchemaVersion = SCHEMA_VERSION;
    return { migrated: true, ranSteps };
  } catch (err) {
    console.error("[migrate] \u6267\u884C\u5931\u8D25\uFF0C\u672C\u6B21\u4E0D\u4F1A\u6807\u8BB0\u5B8C\u6210\uFF0C\u4E0B\u6B21\u8BF7\u6C42\u4F1A\u91CD\u8BD5:", err);
    throw err;
  } finally {
    await releaseLock(env);
  }
}
async function tryAcquireLock(env) {
  const existing = await env.SUBSCRIPTIONS_KV.get(KEY_MIGRATION_LOCK);
  if (existing) return false;
  await env.SUBSCRIPTIONS_KV.put(KEY_MIGRATION_LOCK, (/* @__PURE__ */ new Date()).toISOString(), {
    expirationTtl: LOCK_TTL_SEC
  });
  return true;
}
async function releaseLock(env) {
  try {
    await env.SUBSCRIPTIONS_KV.delete(KEY_MIGRATION_LOCK);
  } catch (err) {
    console.warn("[migrate] \u91CA\u653E\u9501\u5931\u8D25\uFF08TTL 60s \u540E\u4F1A\u81EA\u52A8\u91CA\u653E\uFF09:", err);
  }
}
async function migrateSubscriptions(env) {
  const oldRaw = await env.SUBSCRIPTIONS_KV.get("subscriptions");
  let oldSubs = [];
  if (oldRaw) {
    try {
      const parsed = JSON.parse(oldRaw);
      oldSubs = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("[migrate:subscriptions_v3] \u65E7\u6570\u636E JSON \u89E3\u6790\u5931\u8D25\uFF0C\u6309\u7A7A\u5904\u7406:", err);
      oldSubs = [];
    }
  }
  if (oldSubs.length > 0) {
    await replaceAll(env, oldSubs);
  } else {
    const existing = await listIds(env);
    if (existing.length === 0) {
      await env.SUBSCRIPTIONS_KV.put("sub_index", "[]");
    }
  }
  if (oldRaw) {
    await env.SUBSCRIPTIONS_KV.put("subscriptions_v2_backup", oldRaw, {
      expirationTtl: BACKUP_TTL_SEC
    });
    await env.SUBSCRIPTIONS_KV.delete("subscriptions");
  }
  console.log(`[migrate:subscriptions_v3] \u5DF2\u8FC1\u79FB ${oldSubs.length} \u6761\u8BA2\u9605`);
}
async function migrateReminderRules(env) {
  const subs = await listAll(env);
  let count = 0;
  for (const sub of subs) {
    const existing = await listForSubscription(env, sub.id);
    if (existing.length > 0) continue;
    const rule = legacyFieldToRule(sub);
    await replaceForSubscription(env, sub.id, [rule]);
    count++;
  }
  console.log(`[migrate:reminder_rules_v3] \u5DF2\u4E3A ${count} \u4E2A\u8BA2\u9605\u751F\u6210\u9ED8\u8BA4\u63D0\u9192\u89C4\u5219`);
}
async function migrateSubSummaries(env) {
  const subs = await listAll(env);
  let count = 0;
  for (const sub of subs) {
    if (sub && sub.reminderRulesSummary) continue;
    let rules = await listForSubscription(env, sub.id);
    if (rules.length === 0) {
      rules = [legacyFieldToRule(sub)];
    }
    await save(env, { ...sub, reminderRulesSummary: formatRulesSummary(rules) });
    count++;
  }
  console.log(`[migrate:sub_summary_v3] \u5DF2\u4E3A ${count} \u4E2A\u8BA2\u9605\u8865\u5185\u5D4C\u6458\u8981`);
}
async function migrateSchedulerLogs(env) {
  const histRaw = await env.SUBSCRIPTIONS_KV.get("scheduler_status_history");
  if (!histRaw) return;
  let history = [];
  try {
    const parsed = JSON.parse(histRaw);
    history = Array.isArray(parsed) ? parsed : [];
  } catch {
    history = [];
  }
  let count = 0;
  for (const item of history) {
    const startedAt = item.lastRunAt || (/* @__PURE__ */ new Date()).toISOString();
    await writeLog(
      env,
      {
        startedAt,
        finishedAt: startedAt,
        timezone: item.timezone || "UTC",
        currentHour: item.currentHour || "00",
        configuredHours: Array.isArray(item.configuredHours) ? item.configuredHours : [],
        inWindow: !!item.shouldNotifyThisHour,
        checkedCount: item.checkedSubscriptions || 0,
        matchedCount: item.expiringMatched || 0,
        dedupedCount: item.dedupeSkipped || 0,
        sentCount: item.sent ? 1 : 0,
        autoRenewedCount: item.updatedSubscriptions || 0,
        status: item.errorStack ? "error" : item.sent ? "ok" : "skipped",
        reason: item.reason || (item.errorStack ? "legacy_error" : void 0),
        extra: { migratedFromV2: true }
      },
      { ttlSec: 7 * 24 * 3600 }
    );
    count++;
  }
  console.log(`[migrate:scheduler_logs_v3] \u5DF2\u8FC1\u79FB ${count} \u6761\u5386\u53F2\u8C03\u5EA6\u8BB0\u5F55`);
}

// src/app.js
var app = new Hono2();
app.use("*", async (c, next) => {
  try {
    await ensureMigrations(c.env);
  } catch (err) {
    console.error("[app] \u8FC1\u79FB\u5931\u8D25\uFF0C\u56DE\u9000\u7EE7\u7EED\u5904\u7406\u8BF7\u6C42:", err);
  }
  await next();
});
app.onError((err, c) => {
  console.error("[app] \u672A\u6355\u83B7\u5F02\u5E38:", err && err.stack ? err.stack : err);
  return c.json(
    {
      success: false,
      message: err && err.message ? err.message : "\u670D\u52A1\u5F02\u5E38",
      code: "internal_error"
    },
    500
  );
});
app.get("/", async (c) => {
  const { user } = await getUserFromRequest(c.req.raw, c.env);
  if (user) return c.redirect("/admin");
  return handleLoginPage();
});
app.all("/debug", async (c) => {
  const { user } = await getUserFromRequest(c.req.raw, c.env);
  if (!user) {
    return new Response("\u672A\u6388\u6743\u8BBF\u95EE", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
  return handleDebug(c.req.raw, c.env);
});
app.all("/api/*", async (c) => {
  return handleApiRequest(c.req.raw, c.env);
});
app.all("/admin/*", async (c) => {
  return handleAdminRequest(c.req.raw, c.env);
});
app.get("/admin", async (c) => {
  return handleAdminRequest(c.req.raw, c.env);
});
app.all("*", async () => {
  return handleLoginPage();
});
var app_default = app;

// src/services/scheduler.js
init_config();
init_subscriptions_repo();
init_reminders_repo();
init_scheduler_logs_repo();
init_time();
init_reminder();
init_reminder_engine();
init_lunar();
var DEDUPE_TTL_SEC = 60 * 60 * 48;
var LAST_FIRE_TTL_SEC = 60 * 60 * 24 * 60;
function buildDedupeBucket(rule, nowParts) {
  const ymd = `${nowParts.year}${String(nowParts.month).padStart(2, "0")}${String(nowParts.day).padStart(2, "0")}`;
  const isDayRule = rule.type === "on_expiry" || rule.type === "before_expiry" && rule.unit !== "hours";
  return isDayRule ? ymd : `${ymd}${nowParts.hourString}`;
}
async function readLastFireAt(env, subId, ruleId) {
  return env.SUBSCRIPTIONS_KV.get(`notify_lastfire:${subId}:${ruleId}`);
}
async function writeLastFireAt(env, subId, ruleId, iso) {
  await env.SUBSCRIPTIONS_KV.put(`notify_lastfire:${subId}:${ruleId}`, iso, {
    expirationTtl: LAST_FIRE_TTL_SEC
  });
}
async function checkExpiringSubscriptions(env) {
  const startedAtIso = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const config = await getConfig(env);
    const timezone = config.TIMEZONE || "UTC";
    const now = getNowInTimezone(timezone);
    const normalizedHours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS.map((h) => String(h).trim()).filter((h) => h.length > 0).map((h) => {
      const up = h.toUpperCase();
      if (up === "*" || up === "ALL") return "*";
      return /^\d+$/.test(h) ? h.padStart(2, "0") : up;
    }) : [];
    const inWindow = normalizedHours.length === 0 || normalizedHours.includes("*") || normalizedHours.includes("ALL") || normalizedHours.includes(now.hourString);
    const subscriptions = await listAll(env);
    let activeCount = 0;
    let matchedCount = 0;
    let dedupedCount = 0;
    let sentCount = 0;
    let autoRenewedCount = 0;
    const candidates = [];
    const updatedSubsToSave = [];
    for (const subscription of subscriptions) {
      if (!subscription.isActive) continue;
      activeCount++;
      let expiryDate = new Date(subscription.expiryDate);
      let daysDiff = getDaysBetween(now.utc, expiryDate, timezone);
      let hoursDiff = (expiryDate.getTime() - now.utc.getTime()) / MS_PER_HOUR;
      if (subscription.autoRenew && daysDiff < 0) {
        const renewed = autoRenew(subscription, now.utc, timezone, config);
        if (renewed) {
          updatedSubsToSave.push(renewed.next);
          autoRenewedCount++;
          expiryDate = new Date(renewed.next.expiryDate);
          daysDiff = getDaysBetween(now.utc, expiryDate, timezone);
          hoursDiff = (expiryDate.getTime() - now.utc.getTime()) / MS_PER_HOUR;
          subscription.expiryDate = renewed.next.expiryDate;
          subscription.startDate = renewed.next.startDate;
          subscription.lastPaymentDate = renewed.next.lastPaymentDate;
          subscription.paymentHistory = renewed.next.paymentHistory;
        }
      }
      let rules = await listForSubscription(env, subscription.id);
      if (rules.length === 0) {
        const legacy = legacyFieldToRule(subscription);
        legacy.id = `legacy:${subscription.id}`;
        rules = [legacy];
      }
      for (const rule of rules) {
        const lastFireAtIso = rule.type === "after_expiry" ? await readLastFireAt(env, subscription.id, rule.id) || void 0 : void 0;
        const decision = shouldFire(rule, {
          daysDiff,
          hoursDiff,
          nowIso: now.utc.toISOString(),
          lastFireAtIso
        });
        if (!decision.fire) continue;
        matchedCount++;
        candidates.push({ sub: subscription, rule, daysDiff, hoursDiff });
      }
    }
    if (updatedSubsToSave.length > 0) {
      await saveMany(env, updatedSubsToSave);
      console.log(`[\u5B9A\u65F6\u4EFB\u52A1] \u5DF2\u81EA\u52A8\u7EED\u8BA2 ${updatedSubsToSave.length} \u4E2A\u8BA2\u9605`);
    }
    if (!inWindow) {
      const entry2 = await writeLog(env, {
        startedAt: startedAtIso,
        finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        timezone,
        currentHour: now.hourString,
        configuredHours: normalizedHours,
        inWindow: false,
        checkedCount: activeCount,
        matchedCount,
        dedupedCount: 0,
        sentCount: 0,
        autoRenewedCount,
        status: "skipped",
        reason: `\u5F53\u524D${timezone} ${now.hourString}\u70B9\u4E0D\u5728\u5141\u8BB8\u53D1\u9001\u7684\u5C0F\u65F6 [${normalizedHours.join(",") || "\u672A\u9650\u5236=\u6BCF\u5C0F\u65F6"}] \u5185\uFF08\u6B63\u5E38\u8DF3\u8FC7\uFF0C\u4E0D\u4F1A\u53D1\u901A\u77E5\uFF09`
      });
      return entry2;
    }
    const ready = [];
    const nowParts = {
      year: now.parts.year,
      month: now.parts.month,
      day: now.parts.day,
      hourString: now.hourString
    };
    for (const c of candidates) {
      const bucket = buildDedupeBucket(c.rule, nowParts);
      const dedupeKey = `notify_dedupe:${c.sub.id}:${c.rule.id}:${bucket}`;
      const exists = await env.SUBSCRIPTIONS_KV.get(dedupeKey);
      if (exists) {
        dedupedCount++;
        continue;
      }
      ready.push({ ...c, dedupeKey });
    }
    if (ready.length === 0) {
      const entry2 = await writeLog(env, {
        startedAt: startedAtIso,
        finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        timezone,
        currentHour: now.hourString,
        configuredHours: normalizedHours,
        inWindow: true,
        checkedCount: activeCount,
        matchedCount,
        dedupedCount,
        sentCount: 0,
        autoRenewedCount,
        status: matchedCount > 0 ? "skipped" : "ok",
        reason: matchedCount > 0 ? `\u547D\u4E2D ${matchedCount} \u6761\u89C4\u5219\u4F46\u5168\u90E8\u5728\u53BB\u91CD\u7A97\u53E3\u5185\uFF08\u8DF3\u8FC7 ${dedupedCount}\uFF09` : "\u672C\u6B21\u672A\u547D\u4E2D\u4EFB\u4F55\u63D0\u9192\u89C4\u5219"
      });
      return entry2;
    }
    ready.sort((a, b) => a.daysDiff - b.daysDiff);
    const enrichedSubs = ready.map((c) => ({
      ...c.sub,
      daysRemaining: c.daysDiff,
      hoursRemaining: Math.round(c.hoursDiff),
      matchedReminderRule: c.rule
    }));
    const content = formatNotificationContent(enrichedSubs, config);
    const title = "\u8BA2\u9605\u5230\u671F/\u7EED\u8D39\u63D0\u9192";
    const primary = ready[0];
    const dispatchResult = await dispatch(
      { title, content },
      config,
      {
        env,
        subId: primary.sub.id,
        ruleId: primary.rule.id,
        logPrefix: "[\u5B9A\u65F6\u4EFB\u52A1]",
        metadata: {
          tags: enrichedSubs.map((s) => s.name),
          daysRemaining: primary.daysDiff,
          ruleType: primary.rule.type,
          ruleValue: primary.rule.value
        }
      }
    );
    sentCount = dispatchResult.successCount;
    if (dispatchResult.successCount > 0) {
      const firedAt = now.utc.toISOString();
      await Promise.all(
        ready.map(async (c) => {
          await env.SUBSCRIPTIONS_KV.put(c.dedupeKey, "1", { expirationTtl: DEDUPE_TTL_SEC });
          if (c.rule.type === "after_expiry") {
            await writeLastFireAt(env, c.sub.id, c.rule.id, firedAt);
          }
        })
      );
    }
    const entry = await writeLog(env, {
      startedAt: startedAtIso,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      timezone,
      currentHour: now.hourString,
      configuredHours: normalizedHours,
      inWindow: true,
      checkedCount: activeCount,
      matchedCount,
      dedupedCount,
      sentCount,
      autoRenewedCount,
      status: dispatchResult.failedCount > 0 && sentCount === 0 ? "error" : "ok",
      reason: dispatchResult.attempted > 0 ? `\u53D1\u9001\u5230 ${dispatchResult.attempted} \u4E2A\u6E20\u9053\uFF0C\u6210\u529F ${dispatchResult.successCount} / \u5931\u8D25 ${dispatchResult.failedCount}` : "\u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053",
      extra: {
        candidates: ready.map((c) => ({
          subId: c.sub.id,
          subName: c.sub.name,
          ruleId: c.rule.id,
          ruleType: c.rule.type,
          ruleValue: c.rule.value,
          daysDiff: c.daysDiff
        })),
        channelResults: dispatchResult.channelResults
      }
    });
    return entry;
  } catch (error) {
    console.error("[\u5B9A\u65F6\u4EFB\u52A1] \u6267\u884C\u5931\u8D25:", error);
    return writeLog(env, {
      startedAt: startedAtIso,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      timezone: "UTC",
      currentHour: "00",
      configuredHours: [],
      inWindow: false,
      checkedCount: 0,
      matchedCount: 0,
      dedupedCount: 0,
      sentCount: 0,
      autoRenewedCount: 0,
      status: "error",
      reason: "\u6267\u884C\u5F02\u5E38: " + (error && error.message ? error.message : String(error)),
      extra: { stack: error && error.stack }
    });
  }
}
function autoRenew(sub, now, timezone, config) {
  const mode = sub.subscriptionMode || "cycle";
  const tz = timezone || "UTC";
  let expiryDate = new Date(sub.expiryDate);
  let periodsAdded = 0;
  const nowMidnight = getTimezoneMidnightTimestamp(now, tz);
  function atTimezoneMidnight(y, m, d) {
    const ts = getTimestampForTimezoneParts(
      { year: y, month: m, day: d, hour: 0, minute: 0, second: 0 },
      tz
    );
    return new Date(ts);
  }
  if (sub.useLunar) {
    let parts = getTimezoneDateParts(expiryDate, tz);
    let lunar = lunarCalendar.solar2lunar(parts.year, parts.month, parts.day);
    while (getTimezoneMidnightTimestamp(expiryDate, tz) <= nowMidnight) {
      if (!lunar) break;
      lunar = lunarBiz.addLunarPeriod(lunar, sub.periodValue, sub.periodUnit);
      const solar = lunarBiz.lunar2solar(lunar);
      if (!solar) break;
      expiryDate = atTimezoneMidnight(solar.year, solar.month, solar.day);
      periodsAdded++;
      if (periodsAdded > 60) break;
    }
  } else {
    while (getTimezoneMidnightTimestamp(expiryDate, tz) <= nowMidnight) {
      if (mode === "reset") {
        const p = getTimezoneDateParts(now, tz);
        expiryDate = atTimezoneMidnight(p.year, p.month, p.day);
      }
      expiryDate = addCalendarPeriodInTimezone(
        expiryDate,
        sub.periodValue || 1,
        sub.periodUnit || "month",
        tz,
        { endOfMonth: !!sub.endOfMonth }
      );
      periodsAdded++;
      if (periodsAdded > 120) break;
    }
  }
  if (periodsAdded === 0) return null;
  const newStartDate = mode === "reset" ? new Date(now) : new Date(sub.expiryDate);
  const newExpiryDate = expiryDate;
  const paymentRecord = {
    id: Date.now().toString(),
    date: now.toISOString(),
    amount: sub.amount || 0,
    type: "auto",
    note: `\u81EA\u52A8\u7EED\u8BA2 (${mode === "reset" ? "\u91CD\u7F6E\u6A21\u5F0F" : "\u63A5\u7EED\u6A21\u5F0F"}${periodsAdded > 1 ? ", \u8865\u9F50" + periodsAdded + "\u5468\u671F" : ""})`,
    periodStart: newStartDate.toISOString(),
    periodEnd: newExpiryDate.toISOString()
  };
  const paymentHistoryLimit = Number(config.PAYMENT_HISTORY_LIMIT) || 100;
  const ph = [...sub.paymentHistory || [], paymentRecord];
  const trimmed = ph.length > paymentHistoryLimit ? ph.slice(-paymentHistoryLimit) : ph;
  return {
    next: {
      ...sub,
      startDate: newStartDate.toISOString(),
      expiryDate: newExpiryDate.toISOString(),
      lastPaymentDate: now.toISOString(),
      paymentHistory: trimmed
    }
  };
}

// src/index.js
var index_default = {
  fetch: app_default.fetch,
  /**
   * 每小时由 Cron 触发一次。
   *
   * @param {ScheduledEvent} event
   * @param {{ SUBSCRIPTIONS_KV: KVNamespace }} env
   * @param {ExecutionContext} ctx
   */
  async scheduled(event, env, ctx) {
    void ctx;
    try {
      await ensureMigrations(env);
    } catch (err) {
      console.error("[index] scheduled \u8FC1\u79FB\u5931\u8D25:", err);
    }
    console.log(
      "[Workers] \u5B9A\u65F6\u4EFB\u52A1\u89E6\u53D1",
      "cron:",
      event?.cron || "(unknown)",
      "UTC:",
      (/* @__PURE__ */ new Date()).toISOString()
    );
    await checkExpiringSubscriptions(env);
  }
};
export {
  index_default as default
};
