const pool = require('../config/database');
const logger = require('../config/logger');

async function runMigrations() {
  let connection;

  try {
    connection = await pool.getConnection();
    logger.info('开始执行数据库迁移...');

    // 创建Cookie表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cookie_pool\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
        \`ip\` VARCHAR(15) NOT NULL COMMENT 'IP地址',
        \`cookie\` LONGTEXT NOT NULL COMMENT 'Cookie字符串',
        \`status\` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-未使用，1-使用中，2-已失效，3-黑名单',
        \`is_using\` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否正在使用',
        \`last_used_time\` DATETIME COMMENT '最后使用时间',
        \`last_check_time\` DATETIME COMMENT '最后检测时间',
        \`use_count\` INT NOT NULL DEFAULT 0 COMMENT '使用次数',
        \`valid_until\` DATETIME COMMENT 'Cookie有效期至',
        \`error_msg\` VARCHAR(500) COMMENT '错误信息',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_ip\` (\`ip\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_is_using\` (\`is_using\`),
        KEY \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小红书Cookie池表';
    `;

    await connection.execute(createTableSQL);
    logger.info('✓ Cookie表已创建或已存在');

    // 创建日志表
    const createLogTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cookie_logs\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
        \`cookie_id\` BIGINT UNSIGNED NOT NULL COMMENT 'Cookie ID',
        \`action\` VARCHAR(50) NOT NULL COMMENT '操作类型：import,use,release,check,delete',
        \`status\` TINYINT NOT NULL COMMENT '操作结果：0-成功，1-失败',
        \`message\` VARCHAR(500) COMMENT '操作信息',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_cookie_id\` (\`cookie_id\`),
        KEY \`idx_created_at\` (\`created_at\`),
        CONSTRAINT \`fk_cookie_logs_cookie_id\` FOREIGN KEY (\`cookie_id\`) REFERENCES \`cookie_pool\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cookie操作日志表';
    `;

    await connection.execute(createLogTableSQL);
    logger.info('✓ Cookie日志表已创建或已存在');

    logger.info('数据库迁移完成！');
    return true;
  } catch (error) {
    logger.error(`数据库迁移失败: ${error.message}`);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { runMigrations };
