# 部署与配置指南

## 目录

1. [本地开发](#本地开发)
2. [Docker部署](#docker部署)
3. [生产部署](#生产部署)
4. [性能调优](#性能调优)
5. [监控告警](#监控告警)

## 本地开发

### 系统需求

- Node.js >= 14.0
- MySQL >= 5.7
- npm >= 6.0

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository>
cd xiaohongshu-cookie-pool

# 2. 安装依赖
npm install

# 3. 创建数据库
mysql -u root -p
> CREATE DATABASE xiaohongshu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> EXIT;

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库配置

# 5. 启动服务
npm run dev

# 6. 测试
curl http://localhost:3000/health
```

### 推荐的IDE设置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.enable": true
}
```

## Docker部署

### 创建 Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=root_password
      - DB_NAME=xiaohongshu_db
      - NODE_ENV=production
    depends_on:
      - mysql
    networks:
      - app-network
    restart: always

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=xiaohongshu_db
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app-network
    restart: always

volumes:
  mysql_data:

networks:
  app-network:
```

### 启动Docker容器

```bash
# 构建镜像
docker build -t xiaohongshu-cookie-pool .

# 使用docker-compose启动
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止容器
docker-compose down
```

## 生产部署

### 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start index.js --name "cookie-pool"

# 配置PM2启动脚本
pm2 save
pm2 startup

# 监控应用
pm2 monit

# 查看日志
pm2 logs cookie-pool

# 重启应用
pm2 restart cookie-pool

# 停止应用
pm2 stop cookie-pool
```

### 创建 ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'cookie-pool',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: 'password',
      DB_NAME: 'xiaohongshu_db'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### Nginx反向代理配置

```nginx
upstream cookie_pool {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.example.com;

    # 请求超时时间
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://cookie_pool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 缓冲设置
        proxy_buffering off;
    }

    # 静态文件缓存
    location ~ \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL/HTTPS配置

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}
```

## 性能调优

### 1. 数据库优化

```sql
-- 添加更多索引以优化查询性能
ALTER TABLE cookie_pool ADD INDEX idx_status_using (status, is_using);
ALTER TABLE cookie_pool ADD INDEX idx_use_count (use_count);

-- 启用查询缓存（MySQL 5.7+）
SET GLOBAL query_cache_size = 1048576;
SET GLOBAL query_cache_type = 1;
```

### 2. 连接池优化

```javascript
// config/database.js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xiaohongshu_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 20,        // 根据负载调整
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});
```

### 3. Node.js内存优化

```bash
# 增加堆内存
node --max-old-space-size=2048 index.js
```

### 4. Redis缓存（可选）

```javascript
// 缓存热数据
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

// 缓存统计信息
const stats = await getStatsFromCache();
if (!stats) {
  stats = await CookieModel.getStats();
  await cacheStats(stats, 300); // 缓存5分钟
}
```

### 5. 压缩响应

```javascript
const compression = require('compression');
app.use(compression());
```

## 监控告警

### 集成Prometheus

```javascript
// 安装依赖
npm install prom-client

// 在应用中添加
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds'
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(duration);
  });
  next();
});

// 暴露metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Grafana仪表板

创建Grafana仪表板以可视化关键指标：
- Cookie池大小趋势
- 请求响应时间
- 错误率
- 告警统计

### 日志聚合（ELK Stack）

```javascript
// 使用Elasticsearch日志驱动
const elasticsearch = require('elasticsearch');

const esClient = new elasticsearch.Client({
  host: 'localhost:9200'
});

logger.add(new winston.transports.ElasticsearchTransport({
  client: esClient,
  index: 'cookie-pool-logs'
}));
```

### 告警规则示例

```yaml
groups:
  - name: cookie-pool
    rules:
      - alert: CookiePoolEmpty
        expr: cookie_pool_total == 0
        for: 5m
        annotations:
          summary: "Cookie池为空"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "错误率过高"

      - alert: DatabaseConnectionDown
        expr: up{job="mysql"} == 0
        for: 1m
        annotations:
          summary: "数据库连接异常"
```

## 容量规划

### 内存计算

```
单个Cookie大小: ~1KB
预期Cookie数量: 10,000条
数据库缓存: ~100MB
应用程序: ~50MB
总计: ~150MB
```

### 存储计算

```
单条Cookie: 1KB
单条日志: 0.5KB
日志保留期: 30天
每天请求数: 100,000

月存储量: ~1.5GB
年存储量: ~18GB
```

### 网络带宽

```
平均请求大小: 1KB
平均响应大小: 2KB
QPS: 100
带宽占用: ~300KB/s = 2.4Mbps
```

## 灾难恢复

### 数据备份

```bash
# 每日备份
*/0 * * * * mysqldump -u root -p xiaohongshu_db > /backup/db_$(date +\%Y\%m\%d).sql

# 备份上传到云存储
30 2 * * * aws s3 sync /backup/ s3://my-backup-bucket/
```

### 恢复流程

```bash
# 恢复数据库
mysql -u root -p xiaohongshu_db < backup.sql

# 验证数据
mysql -u root -p -e "SELECT COUNT(*) FROM xiaohongshu_db.cookie_pool;"

# 重启应用
pm2 restart cookie-pool
```

## 升级流程

```bash
# 1. 备份当前版本
cp -r . /backup/current_version

# 2. 备份数据库
mysqldump -u root -p xiaohongshu_db > /backup/db_backup.sql

# 3. 停止应用
pm2 stop cookie-pool

# 4. 更新代码
git pull origin main

# 5. 安装新依赖
npm install

# 6. 运行迁移脚本
npm run migrate

# 7. 启动应用
pm2 start cookie-pool

# 8. 验证
curl http://localhost:3000/health
```

## 性能基准

在标准配置下（1核CPU，2GB内存）：

| 操作 | QPS | 延迟 |
|------|-----|------|
| 获取随机Cookie | 500 | 20ms |
| 验证单个Cookie | 100 | 100ms |
| 导入批量Cookie | 50 | 200ms |
| 查询列表 | 300 | 50ms |

## 故障恢复SLA

- **RTO** (恢复时间目标): 5分钟
- **RPO** (恢复点目标): 1小时

## 文档和参考

- [Express.js文档](https://expressjs.com/)
- [MySQL文档](https://dev.mysql.com/doc/)
- [Docker文档](https://docs.docker.com/)
- [PM2文档](https://pm2.keymetrics.io/)

---

**最后更新**: 2024-01-20
