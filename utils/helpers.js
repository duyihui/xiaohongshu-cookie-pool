const logger = require('../config/logger');

/**
 * 验证IP地址格式
 */
function validateIpFormat(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255;
  });
}

/**
 * 验证Cookie字符串格式
 */
function validateCookieFormat(cookie) {
  if (typeof cookie !== 'string' || cookie.trim().length === 0) {
    return false;
  }
  // Cookie应该至少包含一个=号（key=value格式）
  return cookie.includes('=');
}

/**
 * 解析Cookie字符串
 */
function parseCookie(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;

  cookieStr.split(/;\s*/).forEach(cookie => {
    const [key, value] = cookie.split('=').map(s => s.trim());
    if (key) {
      cookies[key] = value || '';
    }
  });

  return cookies;
}

/**
 * 格式化数据库时间
 */
function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 计算Cookie过期时间
 */
function calculateExpiryTime(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateTime(date);
}

/**
 * 随机延迟（毫秒）
 */
function randomDelay(min = 100, max = 1000) {
  return new Promise(resolve => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
}

/**
 * 批量处理数组，分批执行
 */
async function batchProcess(items, batchSize, processor) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item).catch(error => ({
        error: error.message,
        item
      })))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * 重试执行函数
 */
async function retryExecute(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        logger.warn(`重试第 ${i + 1} 次: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * 生成报告摘要
 */
function generateReport(stats) {
  return `
=== Cookie池状态报告 ===
总数量: ${stats.total}
可用: ${stats.available} (${((stats.available / stats.total) * 100).toFixed(2)}%)
使用中: ${stats.using}
已失效: ${stats.invalid}
黑名单: ${stats.blacklist}
总使用次数: ${stats.totalUseCount}
平均使用次数: ${stats.avgUseCount}
========================
  `.trim();
}

/**
 * 检查是否需要告警
 */
function checkAlertConditions(stats) {
  const alerts = [];

  if (stats.total === 0) {
    alerts.push({
      level: 3,
      type: 'EMPTY_POOL',
      message: 'Cookie池为空，无可用Cookie'
    });
  }

  if (stats.available === 0 && stats.total > 0) {
    alerts.push({
      level: 2,
      type: 'NO_AVAILABLE',
      message: '没有可用的Cookie'
    });
  }

  const invalidRate = (stats.invalid / stats.total);
  if (invalidRate > 0.3) {
    alerts.push({
      level: 2,
      type: 'HIGH_INVALID_RATE',
      message: `失效率过高: ${(invalidRate * 100).toFixed(2)}%`
    });
  }

  const blacklistRate = (stats.blacklist / stats.total);
  if (blacklistRate > 0.2) {
    alerts.push({
      level: 1,
      type: 'HIGH_BLACKLIST_RATE',
      message: `黑名单比例较高: ${(blacklistRate * 100).toFixed(2)}%`
    });
  }

  return alerts;
}

module.exports = {
  validateIpFormat,
  validateCookieFormat,
  parseCookie,
  formatDateTime,
  calculateExpiryTime,
  randomDelay,
  batchProcess,
  retryExecute,
  generateReport,
  checkAlertConditions
};
