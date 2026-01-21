<<<<<<< HEAD
# xiaohongshu-cookie-pool
=======
# 小红书 Cookie 池

一个完整的小红书Cookie池管理系统，支持Cookie导入、有效性检测、随机获取等功能。

## 功能特性

- ✅ 手动导入Cookie（支持批量导入）
- ✅ Cookie有效性检测
- ✅ 随机获取未使用的Cookie
- ✅ Cookie使用情况管理
- ✅ 自动过期清理
- ✅ 详细的使用统计
- ✅ 黑名单管理
- ✅ 使用周期管理

## 项目结构

```
xiaohongshu-cookie-pool/
├── config/              # 配置文件
├── models/              # 数据库模型
├── services/            # 业务逻辑
├── controllers/         # 控制器
├── routes/              # 路由
├── utils/               # 工具函数
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
# 开发模式
npm run dev

# 生产模式
npm start

# 数据库迁移
npm run migrate
```

## API 文档

详见 `API.md`

## 许可证

MIT
>>>>>>> 891c99c (Initial commit: 小红书Cookie池管理系统 v1.1.0 - 完整的Cookie验证和管理系统，支持X-s签名集成)
