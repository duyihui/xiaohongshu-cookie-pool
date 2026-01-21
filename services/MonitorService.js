const pool = require('../config/database');
const logger = require('../config/logger');
const CookieModel = require('../models/CookieModel');
const { checkAlertConditions, generateReport } = require('../utils/helpers');

class MonitorService {
  /**
   * 创建告警记录
   */
  static async createAlert(level, type, message) {
    try {
      const query = `
        INSERT INTO cookie_alerts (level, type, message, status)
        VALUES (?, ?, ?, 0)
      `;
      const [result] = await pool.execute(query, [level, type, message]);
      logger.warn(`告警已创建 [${type}]: ${message}`);
      return result;
    } catch (error) {
      logger.error(`创建告警失败: ${error.message}`);
    }
  }

  /**
   * 获取未处理的告警
   */
  static async getUnresolvedAlerts() {
    try {
      const query = `
        SELECT * FROM cookie_alerts
        WHERE status = 0
        ORDER BY level DESC, created_at DESC
        LIMIT 100
      `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      logger.error(`获取告警列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 标记告警为已处理
   */
  static async resolveAlert(alertId) {
    try {
      const query = `UPDATE cookie_alerts SET status = 1 WHERE id = ?`;
      const [result] = await pool.execute(query, [alertId]);
      return result;
    } catch (error) {
      logger.error(`标记告警失败: ${error.message}`);
    }
  }

  /**
   * 执行健康检查
   */
  static async performHealthCheck() {
    try {
      logger.info('执行Cookie池健康检查...');
      
      const stats = await CookieModel.getStats();
      const alerts = checkAlertConditions(stats);
      const report = generateReport(stats);

      logger.info(report);

      // 创建告警
      for (const alert of alerts) {
        const existing = await this._checkExistingAlert(alert.type);
        if (!existing) {
          await this.createAlert(alert.level, alert.type, alert.message);
        }
      }

      return {
        stats,
        alerts,
        report,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`健康检查失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查是否已存在该类型的未处理告警
   */
  static async _checkExistingAlert(type) {
    try {
      const query = `
        SELECT COUNT(*) as count FROM cookie_alerts
        WHERE type = ? AND status = 0
      `;
      const [result] = await pool.execute(query, [type]);
      return result[0].count > 0;
    } catch (error) {
      logger.error(`检查告警失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 启动定期健康检查
   */
  static startHealthCheckJob(intervalHours = 1) {
    const intervalMs = intervalHours * 3600 * 1000;

    setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error(`定期健康检查出错: ${error.message}`);
      });
    }, intervalMs);

    logger.info(`定期健康检查已启动，间隔: ${intervalHours}小时`);
  }

  /**
   * 获取池的实时状态
   */
  static async getPoolStatus() {
    try {
      const stats = await CookieModel.getStats();
      const alerts = await this.getUnresolvedAlerts();

      const utilizationRate = stats.total > 0 
        ? ((stats.using / stats.total) * 100).toFixed(2)
        : 0;

      const availabilityRate = stats.total > 0
        ? ((stats.available / stats.total) * 100).toFixed(2)
        : 0;

      return {
        stats,
        alerts: alerts.length,
        utilizationRate: `${utilizationRate}%`,
        availabilityRate: `${availabilityRate}%`,
        health: this._getHealthStatus(stats),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`获取池状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 判断池的健康状态
   */
  static _getHealthStatus(stats) {
    if (stats.total === 0) return 'CRITICAL';
    if (stats.available === 0) return 'WARNING';
    
    const invalidRate = stats.invalid / stats.total;
    if (invalidRate > 0.5) return 'WARNING';
    
    return 'HEALTHY';
  }

  /**
   * 导出监控数据
   */
  static async exportMonitoringData(startDate, endDate) {
    try {
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_alerts,
          SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as low_level,
          SUM(CASE WHEN level = 2 THEN 1 ELSE 0 END) as medium_level,
          SUM(CASE WHEN level = 3 THEN 1 ELSE 0 END) as high_level,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as resolved
        FROM cookie_alerts
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const [rows] = await pool.execute(query, [startDate, endDate]);
      return rows;
    } catch (error) {
      logger.error(`导出监控数据失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MonitorService;
