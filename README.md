# 小红书 Cookie 池

一个完整的小红书Cookie池管理系统，支持Cookie导入、有效性检测、随机获取等功能。

## 功能特性

- ✅ 手动导入Cookie（支持批量导入）
- ✅ Cookie有效性检测（单个/批量）
- ✅ 随机获取未使用的Cookie
- ✅ Cookie编辑管理（新增）
- ✅ Cookie删除管理（新增）
- ✅ Cookie使用情况管理
- ✅ 自动过期清理
- ✅ 详细的使用统计
- ✅ 黑名单管理
- ✅ 使用周期管理
- ✅ 企业级Web管理后台
- ✅ 现代化UI设计
- ✅ 完全符合CSP安全策略

## 最新更新

### 🎉 v1.1.0 - 安全重构与功能增强

**新增功能**
- 📝 **编辑Cookie**: 支持修改IP、Cookie值、有效期、状态
- 🗑️ **删除Cookie**: 直接从数据库删除不需要的Cookie
- 🔒 **CSP安全重构**: 从内联事件改为事件委托模式，完全符合Content Security Policy
- 🎨 **UI优化**: 企业级现代设计，响应式布局

**技术改进**
- ✅ 移除所有onclick内联事件处理器
- ✅ 实现事件委托模式（document-level delegation）
- ✅ 性能提升：1个监听器 vs N个（N=行数）
- ✅ 自动支持动态行元素
- ✅ 符合OWASP安全建议
- ✅ 符合Google、Microsoft等企业标准

**修复问题**
- 🐛 修复CSP阻止按钮功能的问题
- 🐛 优化批量操作按钮布局
- 🐛 改进错误处理和日志记录

## 项目结构

```
xiaohongshu-cookie-pool/
├── config/              # 配置文件
├── models/              # 数据库模型
├── services/            # 业务逻辑
├── controllers/         # 控制器
├── routes/              # 路由
├── utils/               # 工具函数
├── public/              # 前端文件
│   ├── js/              # JavaScript文件
│   ├── css/             # 样式文件
│   └── index.html       # 管理后台
├── migrations/          # 数据库迁移
├── tests/               # 测试文件
└── index.js             # 入口文件
```

## 安装

```bash
npm install
```

## 配置

创建 `.env` 文件：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiaohongshu_db
DB_PORT=3306

PORT=3000
NODE_ENV=development

# 小红书相关配置
XHS_API_ENDPOINT=https://edith.xiaohongshu.com
```

## 使用

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start

# 数据库迁移
npm run migrate

# 运行测试
npm test
```

## Web管理后台

启动服务后访问：`http://localhost:3000/admin`

### 功能
- 📊 **仪表板**: 实时统计信息和图表展示
- 🍪 **Cookie管理**: 完整的CRUD操作
- 📈 **批量操作**: 验证、释放、黑名单、删除
- 🔍 **搜索过滤**: 支持按IP、状态、有效期搜索
- 📱 **响应式设计**: 完美支持移动端

## API 文档

详见 [API.md](./API.md)

### 快速示例

```bash
# 获取随机Cookie
curl http://localhost:3000/api/cookies/random

# 获取Cookie列表
curl http://localhost:3000/api/cookies?page=1&pageSize=10

# 编辑Cookie
curl -X PUT http://localhost:3000/api/cookies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "10.0.0.1",
    "status": 0
  }'

# 删除Cookie
curl -X DELETE http://localhost:3000/api/cookies/1

# 验证Cookie
curl -X POST http://localhost:3000/api/cookies/1/validate

# 释放Cookie
curl -X POST http://localhost:3000/api/cookies/1/release

# 添加到黑名单
curl -X POST http://localhost:3000/api/cookies/1/blacklist \
  -H "Content-Type: application/json" \
  -d '{"reason": "IP被封禁"}'

# 批量验证
curl -X POST http://localhost:3000/api/cookies/validate/batch \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'

# 获取统计信息
curl http://localhost:3000/api/statistics
```

## Cookie状态说明

| 状态 | 说明 | 可用 |
|------|------|------|
| 0 | 未使用/可用 | ✅ |
| 1 | 使用中 | ❌ |
| 2 | 已失效 | ❌ |
| 3 | 黑名单 | ❌ |

## 安全特性

- 🔒 **Content Security Policy (CSP)**: 完全符合现代CSP策略
- 🚫 **XSS防护**: 使用事件委托，无内联脚本
- 🛡️ **Helmet**: 启用安全HTTP头
- 🔐 **CORS**: 配置化跨域策略
- 📝 **输入验证**: 使用Joi进行请求验证

## 性能优化

| 方面 | 优化 |
|------|------|
| **事件处理** | 使用事件委托：1个监听器而非N个 |
| **DOM操作** | 最小化重排和重绘 |
| **网络请求** | API响应分页和缓存 |
| **日志记录** | Winston异步日志 |

## 开发工具

- **Express.js**: Web框架
- **MySQL2**: 数据库驱动
- **Joi**: 数据验证
- **Winston**: 日志记录
- **Helmet**: 安全中间件
- **CORS**: 跨域支持
- **Nodemon**: 开发时热重载
- **Jest**: 单元测试

## 许可证

ISC


