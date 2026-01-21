const CookieModel = require('../models/CookieModel');
const logger = require('../config/logger');
const axios = require('axios');
const { execSync } = require('child_process');
const path = require('path');

class CookieService {
  /**
   * 导入Cookie
   */
  static async importCookies(cookieList) {
    try {
      // 验证输入
      if (!Array.isArray(cookieList) || cookieList.length === 0) {
        throw new Error('Cookie列表不能为空');
      }

      // 验证每条记录
      const validatedList = cookieList.map((item, index) => {
        if (!item.ip || !item.cookie) {
          throw new Error(`第${index + 1}条记录缺少ip或cookie字段`);
        }
        return {
          ip: item.ip.trim(),
          cookie: item.cookie.trim(),
          validUntil: item.validUntil || null
        };
      });

      // 批量创建
      const results = await CookieModel.createBatch(validatedList);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      logger.info(`导入Cookie完成: 成功${successCount}条, 失败${failCount}条`);

      return {
        total: results.length,
        success: successCount,
        failed: failCount,
        details: results
      };
    } catch (error) {
      logger.error(`导入Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取随机未使用的Cookie
   */
  static async getRandomUnusedCookie() {
    try {
      const cookies = await CookieModel.findUnused(1);
      
      if (cookies.length === 0) {
        throw new Error('没有可用的Cookie');
      }

      const cookie = cookies[0];
      
      // 标记为使用中
      await CookieModel.markAsUsing(cookie.id);

      return {
        id: cookie.id,
        ip: cookie.ip,
        cookie: cookie.cookie,
        useCount: cookie.use_count + 1
      };
    } catch (error) {
      logger.error(`获取随机Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检测Cookie有效性
   */
  static async validateCookie(id, cookie = null) {
    try {
      let cookieData = cookie;

      if (!cookieData) {
        const record = await CookieModel.findById(id);
        if (!record) {
          throw new Error('Cookie记录不存在');
        }
        cookieData = record;
      }

      // 调用小红书接口检测Cookie
      const isValid = await this._checkXhsCookie(cookieData.cookie);

      if (isValid) {
        await CookieModel.updateCheckInfo(id, 0, null); // status: 0 = valid
        logger.info(`Cookie验证成功: ${cookieData.ip}`);
        return { valid: true, ip: cookieData.ip };
      } else {
        await CookieModel.updateCheckInfo(id, 2, 'Cookie已失效'); // status: 2 = invalid
        logger.warn(`Cookie验证失败: ${cookieData.ip}`);
        return { valid: false, ip: cookieData.ip, reason: 'Cookie已失效' };
      }
    } catch (error) {
      logger.error(`检测Cookie失败: ${error.message}`);
      if (id) {
        await CookieModel.updateCheckInfo(id, 2, error.message);
      }
      throw error;
    }
  }

  /**
   * 调用小红书API检测Cookie
   * 需要调用 ../小红书/compute_xs.js 获取X-s签名
   */
  static async _checkXhsCookie(cookieStr) {
    try {
      const apiPath = '/api/sns/web/v1/user/selfinfo';
      
      // 调用 compute_xs.js 获取 X-s 签名
      const xsSignature = await this._getXsSignature(apiPath);
      
      if (!xsSignature) {
        logger.warn('无法获取X-s签名，使用备用方式验证Cookie');
        return await this._checkXhsCookieWithoutXs(cookieStr);
      }
      logger.info(`X-s: ${xsSignature}`);
      // 这是一个示例实现，实际需要根据小红书的API调整
      const response = await axios.get(`https://edith.xiaohongshu.com${apiPath}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookieStr,
          'X-s': xsSignature,  // ✅ 新增：X-s 签名
          'Content-Type': 'application/json;charset=UTF-8'
        },
        timeout: 10000
      });
      logger.info(`response: ${JSON.stringify(response.data)}`);
      // 根据响应判断Cookie是否有效
      return response.status === 200 && response.data.success !== false;
    } catch (error) {
      logger.debug(`XHS API调用失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 调用 compute_xs.js 获取 X-s 签名
   */
  static async _getXsSignature(apiPath) {
    try {
      const computeXsPath = path.join(__dirname, '../../../小红书/compute_xs.js');
      
      // 准备输入数据
      const inputData = JSON.stringify({
        path: apiPath,
        params: {}
      });

      // 使用 child_process 调用 compute_xs.js
      const result = execSync(`node "${computeXsPath}"`, {
        input: inputData,
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 1024 * 1024  // 1MB buffer
      });

      const xsSignature = result.trim();
      
      if (!xsSignature || !xsSignature.startsWith('XYS_')) {
        logger.warn('获取的X-s签名格式不正确');
        return null;
      }

      return xsSignature;
    } catch (error) {
      logger.error(`获取X-s签名失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 备用方案：不使用X-s签名验证Cookie
   */
  static async _checkXhsCookieWithoutXs(cookieStr) {
    try {
      const response = await axios.get('https://edith.xiaohongshu.com/api/sns/web/v1/user/selfinfo', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookieStr,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        timeout: 10000
      });
      logger.info(`response: ${JSON.stringify(response.data)}`);
      // 根据响应判断Cookie是否有效
      return response.status === 200 && response.data.success !== false;
    } catch (error) {
      logger.info(`error_response: ${error.message}`);
      logger.debug(`备用验证方案也失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 释放Cookie
   */
  static async releaseCookie(id) {
    try {
      const cookie = await CookieModel.findById(id);
      if (!cookie) {
        throw new Error('Cookie记录不存在');
      }

      await CookieModel.releaseCookie(id);
      logger.info(`释放Cookie: ${cookie.ip}`);

      return { id, ip: cookie.ip, message: 'Cookie已释放' };
    } catch (error) {
      logger.error(`释放Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量检测Cookie
   */
  static async batchValidateCookies(ids = null) {
    try {
      let cookies;

      if (ids && Array.isArray(ids)) {
        // 检测指定的Cookie
        cookies = await Promise.all(ids.map(id => CookieModel.findById(id)));
        cookies = cookies.filter(c => c !== null);
      } else {
        // 检测所有有效的Cookie
        const result = await CookieModel.findAll(1, 1000, { status: 0 });
        cookies = result.data;
      }

      const results = [];

      for (const cookie of cookies) {
        try {
          const isValid = await this._checkXhsCookie(cookie.cookie);
          
          if (isValid) {
            await CookieModel.updateCheckInfo(cookie.id, 0, null);
            results.push({
              id: cookie.id,
              ip: cookie.ip,
              valid: true
            });
          } else {
            await CookieModel.updateCheckInfo(cookie.id, 2, 'Cookie已失效');
            results.push({
              id: cookie.id,
              ip: cookie.ip,
              valid: false
            });
          }
        } catch (error) {
          await CookieModel.updateCheckInfo(cookie.id, 2, error.message);
          results.push({
            id: cookie.id,
            ip: cookie.ip,
            valid: false,
            error: error.message
          });
        }
      }

      logger.info(`批量检测完成: ${results.length}条`);
      return results;
    } catch (error) {
      logger.error(`批量检测Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  static async getStatistics() {
    try {
      const stats = await CookieModel.getStats();
      return {
        total: stats.total || 0,
        available: stats.available || 0,
        using: stats.using || 0,
        invalid: stats.invalid || 0,
        blacklist: stats.blacklist || 0,
        totalUseCount: stats.totalUseCount || 0,
        avgUseCount: parseFloat(stats.avgUseCount || 0).toFixed(2)
      };
    } catch (error) {
      logger.error(`获取统计信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加到黑名单
   */
  static async addToBlacklist(id, reason = '') {
    try {
      const cookie = await CookieModel.findById(id);
      if (!cookie) {
        throw new Error('Cookie记录不存在');
      }

      await CookieModel.addToBlacklist(id, reason);
      logger.info(`添加黑名单: ${cookie.ip} - ${reason}`);

      return { id, ip: cookie.ip, message: '已添加到黑名单' };
    } catch (error) {
      logger.error(`添加黑名单失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CookieService;
