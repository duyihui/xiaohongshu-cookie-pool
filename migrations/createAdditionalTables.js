const pool = require('../config/database');
const logger = require('../config/logger');

async function createAdditionalTables() {
  let connection;

  try {
    connection = await pool.getConnection();
    logger.info('开始创建额外数据库表...');

    // 创建Cookie周期表
    const createCycleTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cookie_cycles\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
        \`name\` VARCHAR(100) NOT NULL COMMENT '周期名称',
        \`description\` TEXT COMMENT '周期描述',
        \`start_time\` DATETIME NOT NULL COMMENT '周期开始时间',
        \`end_time\` DATETIME NOT NULL COMMENT '周期结束时间',
        \`target_count\` INT COMMENT '目标爬取数量',
        \`current_count\` INT DEFAULT 0 COMMENT '当前爬取数量',
        \`max_cookies\` INT DEFAULT 10 COMMENT '可用最大Cookie数',
        \`status\` TINYINT DEFAULT 0 COMMENT '状态：0-进行中，1-已完成',
        \`completed_at\` DATETIME COMMENT '完成时间',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_start_time\` (\`start_time\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cookie使用周期表';
    `;

    await connection.execute(createCycleTableSQL);
    logger.info('✓ Cookie周期表已创建或已存在');

    // 创建Cookie周期进度表
    const createProgressTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cookie_cycle_progress\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
        \`cycle_id\` BIGINT UNSIGNED NOT NULL COMMENT '周期ID',
        \`cookie_id\` BIGINT UNSIGNED NOT NULL COMMENT 'Cookie ID',
        \`use_time\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
        \`success\` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否成功',
        \`error_msg\` VARCHAR(500) COMMENT '错误信息',
        PRIMARY KEY (\`id\`),
        KEY \`idx_cycle_id\` (\`cycle_id\`),
        KEY \`idx_cookie_id\` (\`cookie_id\`),
        CONSTRAINT \`fk_progress_cycle_id\` FOREIGN KEY (\`cycle_id\`) REFERENCES \`cookie_cycles\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_progress_cookie_id\` FOREIGN KEY (\`cookie_id\`) REFERENCES \`cookie_pool\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cookie使用周期进度表';
    `;

    await connection.execute(createProgressTableSQL);
    logger.info('✓ Cookie周期进度表已创建或已存在');

    // 创建监控告警表
    const createAlertTableSQL = `
      CREATE TABLE IF NOT EXISTS \`cookie_alerts\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
        \`level\` TINYINT NOT NULL COMMENT '告警级别：1-低，2-中，3-高',
        \`type\` VARCHAR(50) NOT NULL COMMENT '告警类型',
        \`message\` TEXT NOT NULL COMMENT '告警信息',
        \`status\` TINYINT DEFAULT 0 COMMENT '状态：0-未处理，1-已处理',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_level\` (\`level\`),
        KEY \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cookie告警表';
    `;

    await connection.execute(createAlertTableSQL);
    logger.info('✓ Cookie告警表已创建或已存在');

    logger.info('额外表创建完成！');
    return true;
  } catch (error) {
    logger.error(`创建额外表失败: ${error.message}`);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { createAdditionalTables };
