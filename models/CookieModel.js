const pool = require('../config/database');
const logger = require('../config/logger');

class CookieModel {
  /**
   * 创建Cookie记录
   */
  static async create(ip, cookie, validUntil = null) {
    try {
      const query = `
        INSERT INTO cookie_pool (ip, cookie, status, valid_until)
        VALUES (?, ?, 0, ?)
      `;
      const [result] = await pool.execute(query, [ip, cookie, validUntil]);
      return result;
    } catch (error) {
      logger.error(`创建Cookie记录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查询未使用的Cookie
   */
  static async findUnused(limit = 1) {
    try {
      const query = `
        SELECT * FROM cookie_pool
        WHERE status = 0 AND is_using = FALSE
        ORDER BY RAND()
        LIMIT ?
      `;
      const [rows] = await pool.execute(query, [limit]);
      return rows;
    } catch (error) {
      logger.error(`查询未使用Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据IP查询Cookie
   */
  static async findByIp(ip) {
    try {
      const query = `SELECT * FROM cookie_pool WHERE ip = ? LIMIT 1`;
      const [rows] = await pool.execute(query, [ip]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`根据IP查询Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据ID查询Cookie
   */
  static async findById(id) {
    try {
      const query = `SELECT * FROM cookie_pool WHERE id = ? LIMIT 1`;
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      logger.error(`根据ID查询Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新Cookie状态
   */
  static async updateStatus(id, status) {
    try {
      const query = `UPDATE cookie_pool SET status = ? WHERE id = ?`;
      const [result] = await pool.execute(query, [status, id]);
      return result;
    } catch (error) {
      logger.error(`更新Cookie状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 标记Cookie正在使用
   */
  static async markAsUsing(id) {
    try {
      const query = `
        UPDATE cookie_pool
        SET status = 1, is_using = TRUE, last_used_time = NOW(), use_count = use_count + 1
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [id]);
      return result;
    } catch (error) {
      logger.error(`标记Cookie使用失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 释放Cookie（标记未使用）
   */
  static async releaseCookie(id) {
    try {
      const query = `
        UPDATE cookie_pool
        SET status = 0, is_using = FALSE
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [id]);
      return result;
    } catch (error) {
      logger.error(`释放Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新Cookie检测时间和错误信息
   */
  static async updateCheckInfo(id, status, errorMsg = null) {
    try {
      const query = `
        UPDATE cookie_pool
        SET status = ?, last_check_time = NOW(), error_msg = ?
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [status, errorMsg, id]);
      return result;
    } catch (error) {
      logger.error(`更新Cookie检测信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量创建Cookie
   */
  static async createBatch(cookieList) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const results = [];
      const query = `
        INSERT INTO cookie_pool (ip, cookie, status, valid_until)
        VALUES (?, ?, 0, ?)
      `;

      for (const item of cookieList) {
        try {
          const [result] = await connection.execute(query, [
            item.ip,
            item.cookie,
            item.validUntil || null
          ]);
          results.push({ success: true, ip: item.ip, id: result.insertId });
        } catch (error) {
          // IP重复等情况
          results.push({ success: false, ip: item.ip, error: error.message });
        }
      }

      await connection.commit();
      return results;
    } catch (error) {
      if (connection) await connection.rollback();
      logger.error(`批量创建Cookie失败: ${error.message}`);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 查询所有Cookie分页
   */
  static async findAll(page = 1, pageSize = 10, filters = {}) {
    try {
      let query = 'SELECT * FROM cookie_pool WHERE 1=1';
      const params = [];

      if (filters.status !== undefined) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.ip) {
        query += ' AND ip LIKE ?';
        params.push(`%${filters.ip}%`);
      }

      const offset = (page - 1) * pageSize;
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, offset);

      const [rows] = await pool.execute(query, params);

      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM cookie_pool WHERE 1=1';
      const countParams = [];

      if (filters.status !== undefined) {
        countQuery += ' AND status = ?';
        countParams.push(filters.status);
      }

      if (filters.ip) {
        countQuery += ' AND ip LIKE ?';
        countParams.push(`%${filters.ip}%`);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      return {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error(`查询Cookie列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  static async getStats() {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as \`using\`,
          SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as invalid,
          SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as blacklist,
          SUM(use_count) as totalUseCount,
          AVG(use_count) as avgUseCount
        FROM cookie_pool
      `;
      const [rows] = await pool.execute(query);
      return rows[0];
    } catch (error) {
      logger.error(`获取统计信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除过期Cookie
   */
  static async deleteExpired() {
    try {
      const query = `
        DELETE FROM cookie_pool
        WHERE status = 2 AND valid_until IS NOT NULL AND valid_until < NOW()
      `;
      const [result] = await pool.execute(query);
      return result;
    } catch (error) {
      logger.error(`删除过期Cookie失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 添加到黑名单
   */
  static async addToBlacklist(id, reason = '') {
    try {
      const query = `
        UPDATE cookie_pool
        SET status = 3, error_msg = ?
        WHERE id = ?
      `;
      const [result] = await pool.execute(query, [reason, id]);
      return result;
    } catch (error) {
      logger.error(`添加黑名单失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = CookieModel;
