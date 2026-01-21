const pool = require('../config/database');
const logger = require('../config/logger');

class CycleService {
  /**
   * 创建Cookie使用周期
   * 一个周期包含：开始时间、结束时间、目标爬取数量等
   */
  static async createCycle(data) {
    try {
      const query = `
        INSERT INTO cookie_cycles (name, description, start_time, end_time, target_count, max_cookies)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(query, [
        data.name,
        data.description || '',
        data.startTime,
        data.endTime,
        data.targetCount || 0,
        data.maxCookies || 10
      ]);
      
      logger.info(`创建Cookie周期: ${data.name}`);
      return result;
    } catch (error) {
      logger.error(`创建周期失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取当前活跃周期
   */
  static async getActiveCycle() {
    try {
      const query = `
        SELECT * FROM cookie_cycles
        WHERE status = 0 
        AND start_time <= NOW() 
        AND end_time >= NOW()
        LIMIT 1
      `;
      const [rows] = await pool.execute(query);
      return rows[0] || null;
    } catch (error) {
      logger.error(`获取活跃周期失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新周期进度
   */
  static async updateCycleProgress(cycleId, currentCount) {
    try {
      const query = `
        UPDATE cookie_cycles
        SET current_count = ?, updated_at = NOW()
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [currentCount, cycleId]);
      return result;
    } catch (error) {
      logger.error(`更新周期进度失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 完成周期
   */
  static async completeCycle(cycleId) {
    try {
      const query = `
        UPDATE cookie_cycles
        SET status = 1, completed_at = NOW()
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [cycleId]);
      logger.info(`周期已完成: ${cycleId}`);
      return result;
    } catch (error) {
      logger.error(`完成周期失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取周期报告
   */
  static async getCycleReport(cycleId) {
    try {
      const query = `
        SELECT 
          cc.id,
          cc.name,
          cc.start_time,
          cc.end_time,
          cc.target_count,
          cc.current_count,
          cc.status,
          COUNT(DISTINCT cpp.cookie_id) as used_cookies,
          SUM(CASE WHEN cpp.success = 1 THEN 1 ELSE 0 END) as successful_uses,
          SUM(CASE WHEN cpp.success = 0 THEN 1 ELSE 0 END) as failed_uses
        FROM cookie_cycles cc
        LEFT JOIN cookie_cycle_progress cpp ON cc.id = cpp.cycle_id
        WHERE cc.id = ?
        GROUP BY cc.id
      `;
      const [rows] = await pool.execute(query, [cycleId]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`获取周期报告失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取周期列表
   */
  static async getCycleList(page = 1, pageSize = 10) {
    try {
      const offset = (page - 1) * pageSize;
      const query = `
        SELECT * FROM cookie_cycles
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.execute(query, [pageSize, offset]);

      const countQuery = 'SELECT COUNT(*) as total FROM cookie_cycles';
      const [countResult] = await pool.execute(countQuery);

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total: countResult[0].total
        }
      };
    } catch (error) {
      logger.error(`获取周期列表失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CycleService;
