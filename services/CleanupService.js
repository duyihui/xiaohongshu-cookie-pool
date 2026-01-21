const CookieModel = require('../models/CookieModel');
const logger = require('../config/logger');

class CleanupService {
  /**
   * 启动定时清理任务
   */
  static startCleanupJob() {
    // 每小时执行一次清理
    const intervalMs = parseInt(process.env.COOKIE_CHECK_INTERVAL) || 3600000;
    
    setInterval(() => {
      this.cleanupExpiredCookies();
      this.releaseStuckCookies();
    }, intervalMs);

    logger.info(`定时清理任务已启动, 间隔: ${intervalMs}ms`);
  }

  /**
   * 清理过期Cookie
   */
  static async cleanupExpiredCookies() {
    try {
      logger.info('开始清理过期Cookie...');
      const result = await CookieModel.deleteExpired();
      logger.info(`清理过期Cookie完成: 删除${result.affectedRows}条`);
      return result;
    } catch (error) {
      logger.error(`清理过期Cookie失败: ${error.message}`);
    }
  }

  /**
   * 释放被卡住的Cookie（防止Cookie长时间被占用）
   */
   static async releaseStuckCookies() {
     try {
       logger.info('开始释放被占用的Cookie...');
       
       // 查询30分钟未更新的使用中的Cookie
       const query = `
         SELECT * FROM cookie_pool
         WHERE is_using = TRUE 
         AND last_used_time < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       `;
       
       let pool;
       try {
         pool = require('../config/database');
       } catch (error) {
         logger.error(`无法获取数据库连接池: ${error.message}`);
         throw new Error('数据库连接失败');
       }

       const [rows] = await pool.execute(query);

       for (const cookie of rows) {
         try {
           await CookieModel.releaseCookie(cookie.id);
           logger.warn(`自动释放长时间占用的Cookie: ${cookie.ip}`);
         } catch (error) {
           logger.error(`释放Cookie失败: ${error.message}`);
         }
       }

       logger.info(`释放被占用的Cookie完成: 释放${rows.length}条`);
       return rows.length;
     } catch (error) {
       logger.error(`释放被占用的Cookie失败: ${error.message}`);
     }
   }

  /**
   * 定期检测所有Cookie
   */
  static startValidationJob() {
    // 每5分钟检测一次
    const intervalMs = 300 * 1000;
    
    setInterval(() => {
      this.validateAllCookies();
    }, intervalMs);

    logger.info('定期检测任务已启动');
  }

  /**
   * 检测所有Cookie
   */
  static async validateAllCookies() {
    try {
      logger.info('开始检测所有Cookie...');
      const CookieService = require('./CookieService');
      const results = await CookieService.batchValidateCookies();
      logger.info(`检测完成: ${results.length}条`);
      return results;
    } catch (error) {
      logger.error(`检测所有Cookie失败: ${error.message}`);
    }
  }
}

module.exports = CleanupService;
