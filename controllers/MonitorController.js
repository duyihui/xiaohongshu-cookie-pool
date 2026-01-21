const MonitorService = require('../services/MonitorService');
const logger = require('../config/logger');

class MonitorController {
  /**
   * 获取池状态
   * GET /api/monitor/status
   */
  static async getPoolStatus(req, res) {
    try {
      const status = await MonitorService.getPoolStatus();
      res.json({
        code: 200,
        message: '获取成功',
        data: status
      });
    } catch (error) {
      logger.error(`获取池状态错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 执行健康检查
   * POST /api/monitor/health-check
   */
  static async performHealthCheck(req, res) {
    try {
      const result = await MonitorService.performHealthCheck();
      res.json({
        code: 200,
        message: '检查完成',
        data: result
      });
    } catch (error) {
      logger.error(`执行健康检查错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 获取告警列表
   * GET /api/monitor/alerts
   */
  static async getAlerts(req, res) {
    try {
      const alerts = await MonitorService.getUnresolvedAlerts();
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          total: alerts.length,
          alerts
        }
      });
    } catch (error) {
      logger.error(`获取告警列表错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 标记告警为已处理
   * POST /api/monitor/alerts/:id/resolve
   */
  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      await MonitorService.resolveAlert(id);
      
      res.json({
        code: 200,
        message: '操作成功',
        data: { id }
      });
    } catch (error) {
      logger.error(`标记告警错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 导出监控数据
   * GET /api/monitor/export?startDate=2024-01-01&endDate=2024-01-31
   */
  static async exportMonitoringData(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          code: 400,
          message: '请提供startDate和endDate参数 (格式: YYYY-MM-DD)',
          data: null
        });
      }

      // 验证日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({
          code: 400,
          message: '日期格式不正确，应为 YYYY-MM-DD',
          data: null
        });
      }

      // 验证日期逻辑
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(400).json({
          code: 400,
          message: 'startDate不能晚于endDate',
          data: null
        });
      }

      const data = await MonitorService.exportMonitoringData(startDate, endDate);
      
      res.json({
        code: 200,
        message: '导出成功',
        data
      });
    } catch (error) {
      logger.error(`导出监控数据错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = MonitorController;
