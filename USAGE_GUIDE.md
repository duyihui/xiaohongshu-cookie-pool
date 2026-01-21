# 小红书Cookie池 - 完整使用指南

## 目录

- [功能概览](#功能概览)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API接口](#api接口)
- [使用场景](#使用场景)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

## 功能概览

### 核心功能

1. **Cookie管理**
   - 批量导入Cookie（支持IP + Cookie字符串）
   - 随机获取未使用Cookie
   - Cookie有效性检测
   - Cookie状态跟踪

2. **智能调度**
   - 一个IP对应一个Cookie的绑定关系
   - 自动释放长时间占用的Cookie
   - 过期Cookie自动清理
   - 黑名单管理

3. **监控告警**
   - 实时健康检查
   - 多级别告警机制
   - 使用统计和分析
   - 历史数据导出

4. **周期管理** (额外功能)
   - 创建爬取周期
   - 周期进度跟踪
   - 周期报告生成

## 快速开始

### 1. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑.env文件，配置数据库连接
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiaohongshu_db
DB_PORT=3306

PORT=3000
NODE_ENV=development
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE xiaohongshu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 或生产模式
npm start
```

### 5. 测试服务

```bash
# 检查健康状态
curl http://localhost:3000/health

# 输出
# {"code":200,"message":"OK","data":{"status":"healthy"}}
```

## 核心概念

### Cookie状态

| 状态码 | 状态名 | 说明 |
|--------|--------|------|
| 0 | 未使用 | 可用的Cookie，未被占用 |
| 1 | 使用中 | 正在被某个任务使用 |
| 2 | 已失效 | Cookie已过期或检测失效 |
| 3 | 黑名单 | IP已被封禁或存在问题 |

### Cookie生命周期

```
导入 → 未使用 → 被获取(使用中) → 释放(未使用)
  ↓         ↓                      ↓
  │    定期检测              任务完成释放
  │         ↓
  └→ 已失效/黑名单 → 删除
```

### 使用流程

```
1. 导入Cookie
   POST /api/cookies/import
   
2. 获取可用Cookie
   GET /api/cookies/random
   → 返回 {id, ip, cookie}
   
3. 使用Cookie
   设置代理IP
   使用返回的Cookie进行请求
   
4. 任务完成后释放
   POST /api/cookies/{id}/release
```

## API接口

### 1. Cookie管理

#### 导入Cookie

```bash
curl -X POST http://localhost:3000/api/cookies/import \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": [
      {
        "ip": "192.168.1.100",
        "cookie": "sessionid=abc123...; path=/",
        "validUntil": "2024-02-20T10:00:00Z"
      }
    ]
  }'
```

**响应示例：**
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "total": 1,
    "success": 1,
    "failed": 0,
    "details": [
      {
        "success": true,
        "ip": "192.168.1.100",
        "id": 1
      }
    ]
  }
}
```

#### 获取随机Cookie

```bash
curl http://localhost:3000/api/cookies/random
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "ip": "192.168.1.100",
    "cookie": "sessionid=abc123...",
    "useCount": 5
  }
}
```

#### 验证单个Cookie

```bash
curl -X POST http://localhost:3000/api/cookies/1/validate
```

#### 释放Cookie

```bash
curl -X POST http://localhost:3000/api/cookies/1/release
```

#### 获取Cookie列表

```bash
# 获取所有可用Cookie，按分页返回
curl "http://localhost:3000/api/cookies?page=1&pageSize=20&status=0"
```

#### 获取统计信息

```bash
curl http://localhost:3000/api/statistics
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 100,
    "available": 80,
    "using": 5,
    "invalid": 10,
    "blacklist": 5,
    "totalUseCount": 1250,
    "avgUseCount": "12.50"
  }
}
```

### 2. 监控接口

#### 获取池状态

```bash
curl http://localhost:3000/api/monitor/status
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "stats": {...},
    "alerts": 2,
    "health": "HEALTHY",
    "utilizationRate": "5.00%",
    "availabilityRate": "80.00%",
    "timestamp": "2024-01-20T10:00:00Z"
  }
}
```

#### 执行健康检查

```bash
curl -X POST http://localhost:3000/api/monitor/health-check
```

#### 获取告警列表

```bash
curl http://localhost:3000/api/monitor/alerts
```

#### 标记告警为已处理

```bash
curl -X POST http://localhost:3000/api/monitor/alerts/1/resolve
```

## 使用场景

### 场景1: 简单的Cookie轮换

```javascript
const axios = require('axios');

async function crawlWithCookie() {
  const apiUrl = 'http://localhost:3000/api';
  
  try {
    // 1. 获取Cookie
    const getCookieRes = await axios.get(`${apiUrl}/cookies/random`);
    const { id, ip, cookie } = getCookieRes.data.data;
    
    // 2. 设置代理和Cookie
    const proxiedUrl = `http://${ip}:proxy_port`;
    
    // 3. 爬取数据
    const crawlRes = await axios.get('https://xiaohongshu.com/api/...', {
      headers: {
        'Cookie': cookie
      },
      // 设置代理（根据你的代理软件调整）
      proxy: {
        protocol: 'http',
        host: ip,
        port: 8888
      }
    });
    
    console.log('爬取成功:', crawlRes.data);
    
    // 4. 释放Cookie
    await axios.post(`${apiUrl}/cookies/${id}/release`);
    
  } catch (error) {
    console.error('爬取失败:', error.message);
  }
}

crawlWithCookie();
```

### 场景2: 批量任务处理

```javascript
async function batchCrawl() {
  const urls = ['url1', 'url2', 'url3', ...]; // 100个URL
  const apiUrl = 'http://localhost:3000/api';
  
  for (const url of urls) {
    // 获取Cookie
    const getCookieRes = await axios.get(`${apiUrl}/cookies/random`);
    const { id, ip, cookie } = getCookieRes.data.data;
    
    try {
      // 爬取
      const res = await crawl(url, ip, cookie);
      console.log(`✓ ${url}`);
    } catch (error) {
      // 如果失败，可选择添加到黑名单
      if (error.response?.status === 403) {
        await axios.post(`${apiUrl}/cookies/${id}/blacklist`, {
          reason: '频繁被拒绝'
        });
      }
    } finally {
      // 释放
      await axios.post(`${apiUrl}/cookies/${id}/release`);
    }
  }
}
```

### 场景3: 监控和维护

```javascript
async function monitorPool() {
  const apiUrl = 'http://localhost:3000/api';
  
  setInterval(async () => {
    // 定期检查池状态
    const statusRes = await axios.get(`${apiUrl}/monitor/status`);
    const { health, alerts } = statusRes.data.data;
    
    if (health !== 'HEALTHY') {
      console.warn(`⚠️  池状态异常: ${health}`);
      
      // 获取告警详情
      const alertRes = await axios.get(`${apiUrl}/monitor/alerts`);
      alertRes.data.data.alerts.forEach(alert => {
        console.log(`  [${alert.type}] ${alert.message}`);
      });
    }
    
    // 定期清理无效Cookie
    const statsRes = await axios.get(`${apiUrl}/statistics`);
    const invalidRate = statsRes.data.data.invalid / statsRes.data.data.total;
    
    if (invalidRate > 0.2) {
      console.log('Invalid rate > 20%, triggering validation...');
      await axios.post(`${apiUrl}/cookies/validate/batch`);
    }
  }, 60000); // 每分钟检查一次
}
```

## 故障排查

### 问题1: "没有可用的Cookie"

**原因：**
- Cookie池为空
- 所有Cookie都在使用中
- 所有Cookie都已失效

**解决方案：**
```bash
# 检查统计信息
curl http://localhost:3000/api/statistics

# 如果available为0，需要导入Cookie
curl -X POST http://localhost:3000/api/cookies/import ...

# 如果using过多，可能有Cookie未正确释放
# 检查日志，手动释放长时间占用的Cookie
```

### 问题2: Cookie验证总是失败

**原因：**
- Cookie格式不正确
- Cookie已过期
- 小红书API返回403

**解决方案：**
```bash
# 检查导入的Cookie格式
curl http://localhost:3000/api/cookies/1

# 检查错误信息
# 如果是格式问题，重新导入正确的Cookie
# 如果是过期，使用新Cookie替代
```

### 问题3: 服务启动失败

**原因：**
- 数据库连接失败
- 端口被占用
- 依赖未安装

**解决方案：**
```bash
# 检查数据库连接
mysql -u root -p -h localhost
USE xiaohongshu_db;

# 检查.env配置
cat .env

# 检查端口占用
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 重新安装依赖
rm -rf node_modules
npm install
```

## 最佳实践

### 1. Cookie导入

```javascript
// ✅ 正确：批量导入，利用唯一约束防止重复
const cookies = [
  { ip: '1.1.1.1', cookie: '...', validUntil: '2024-02-20' },
  { ip: '1.1.1.2', cookie: '...', validUntil: '2024-02-20' }
];
await importCookies(cookies);

// ❌ 错误：逐个导入，效率低
for (const cookie of cookies) {
  await importCookie(cookie);
}
```

### 2. Cookie使用

```javascript
// ✅ 正确：使用try-finally确保释放
try {
  const cookie = await getRandomCookie();
  await doSomething(cookie);
} finally {
  await releaseCookie(cookie.id);
}

// ❌ 错误：不释放，导致Cookie被占用
const cookie = await getRandomCookie();
await doSomething(cookie);
// 没有释放！
```

### 3. 错误处理

```javascript
// ✅ 正确：捕获并处理不同错误
try {
  const cookie = await getRandomCookie();
} catch (error) {
  if (error.code === 'NO_AVAILABLE_COOKIE') {
    console.log('需要导入更多Cookie');
    // 触发Cookie导入流程
  } else {
    console.error('未知错误:', error);
  }
}

// ❌ 错误：忽略所有错误
const cookie = await getRandomCookie();
```

### 4. 监控告警

```javascript
// ✅ 正确：定期检查告警并处理
setInterval(async () => {
  const status = await getPoolStatus();
  
  if (status.health === 'CRITICAL') {
    // 发送告警通知
    notify('Cookie池严重异常！', status);
    // 停止爬取任务
    stopCrawling();
  }
}, 60000);

// ❌ 错误：不监控告警
// 导致问题发现不及时
```

### 5. 定期维护

```bash
# 每天定期检测所有Cookie
curl -X POST http://localhost:3000/api/cookies/validate/batch

# 检查告警列表
curl http://localhost:3000/api/monitor/alerts

# 导出监控数据进行分析
curl "http://localhost:3000/api/monitor/export?startDate=2024-01-20&endDate=2024-01-21"
```

## 常见问题

**Q: 一个IP可以有多个Cookie吗？**
A: 不可以。系统设计为一个IP只能对应一个Cookie，这是通过数据库唯一约束保证的。

**Q: Cookie会自动过期吗？**
A: 是的。系统每小时会检查所有Cookie的有效期，过期的Cookie会被自动删除。

**Q: 如何重新验证所有Cookie？**
A: 调用批量验证接口 `POST /api/cookies/validate/batch`

**Q: 支持代理吗？**
A: 系统返回IP供您设置代理，具体代理软件需要自行配置。

## 联系支持

如有问题，请检查日志文件：
- `logs/error.log` - 错误日志
- `logs/combined.log` - 所有日志

或查看项目仓库的Issue。
