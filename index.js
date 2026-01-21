require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const cookieRoutes = require('./routes/cookieRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const CleanupService = require('./services/CleanupService');
const MonitorService = require('./services/MonitorService');
const { runMigrations } = require('./migrations/run');
const { createAdditionalTables } = require('./migrations/createAdditionalTables');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  logger.error(`处理错误: ${err.message}`);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: { status: 'healthy' }
  });
});

// API路由
app.use('/api/cookies', cookieRoutes);
app.use('/api/monitor', monitorRoutes);

// 获取统计信息独立路由（避免与cookies路由冲突）
const CookieController = require('./controllers/CookieController');
app.get('/api/statistics', CookieController.getStatistics);

// 未找到路由
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '路由不存在',
    data: null
  });
});

// 使用错误处理中间件
app.use(errorHandler);

// 初始化应用
async function initialize() {
  try {
    // 执行数据库迁移
    logger.info('正在初始化数据库...');
    await runMigrations();
    await createAdditionalTables();

    // 启动定时任务
    CleanupService.startCleanupJob();
    CleanupService.startValidationJob();
    MonitorService.startHealthCheckJob(1); // 每小时检查一次

    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`小红书Cookie池服务已启动，监听端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error(`启动失败: ${error.message}`);
    process.exit(1);
  }
}

initialize();

module.exports = app;
