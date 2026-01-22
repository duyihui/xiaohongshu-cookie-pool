# 单元测试和集成测试指南

## 概述

本项目使用 Jest 作为测试框架，包含单元测试、集成测试和端到端测试。

## 测试结构

```
tests/
├── CookieService.test.js          # 业务逻辑层测试
├── CookieController.test.js       # 控制层测试
├── api.integration.test.js        # API集成测试
└── README.md                      # 本文件
```

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
npm test -- CookieService.test.js
npm test -- CookieController.test.js
```

### 运行匹配某个模式的测试

```bash
npm test -- --testNamePattern="updateCookie"
```

### 生成覆盖率报告

```bash
npm test -- --coverage
```

### 监听模式（开发时自动重新运行）

```bash
npm test -- --watch
```

## 测试范围

### CookieService 单元测试

测试业务逻辑层的所有核心功能：

#### 1. Cookie 基本操作
- ✅ `addCookie()` - 添加新Cookie
- ✅ `getCookieById()` - 通过ID获取Cookie
- ✅ `updateCookie()` - 更新Cookie信息
- ✅ `deleteCookie()` - 删除Cookie

#### 2. Cookie 查询操作
- ✅ `getCookieList()` - 分页获取列表
- ✅ `getRandomCookie()` - 获取随机可用Cookie
- ✅ `getStatistics()` - 获取统计信息

#### 3. Cookie 状态操作
- ✅ `validateCookie()` - 验证Cookie有效性
- ✅ `releaseCookie()` - 释放正在使用的Cookie
- ✅ `addToBlacklist()` - 添加到黑名单

#### 4. 错误处理
- ✅ 缺少必填参数时的处理
- ✅ 数据库操作失败的处理
- ✅ 无效输入的验证

### CookieController 单元测试

测试API控制层的所有端点：

#### 1. GET 端点
- ✅ `GET /api/cookies` - 获取列表
- ✅ `GET /api/cookies/:id` - 获取详情
- ✅ `GET /api/cookies/random` - 获取随机
- ✅ `GET /api/statistics` - 获取统计

#### 2. POST 端点
- ✅ `POST /api/cookies` - 添加Cookie
- ✅ `POST /api/cookies/:id/validate` - 验证
- ✅ `POST /api/cookies/:id/release` - 释放
- ✅ `POST /api/cookies/:id/blacklist` - 黑名单

#### 3. PUT 端点
- ✅ `PUT /api/cookies/:id` - 编辑Cookie

#### 4. DELETE 端点
- ✅ `DELETE /api/cookies/:id` - 删除Cookie

#### 5. 错误处理
- ✅ 404 未找到
- ✅ 400 参数错误
- ✅ 500 服务器错误

### API 集成测试

测试完整的API流程：

- ✅ CRUD 完整流程
- ✅ 错误处理
- ✅ 批量操作
- ✅ 性能表现

## 测试示例

### 测试成功场景

```javascript
it('应该成功添加新Cookie', async () => {
  const mockCookie = {
    id: 1,
    ip: '192.168.1.1',
    cookie: 'sessionid=test'
  };

  CookieService.addCookie.mockResolvedValue(mockCookie);

  const result = await CookieService.addCookie({
    ip: '192.168.1.1',
    cookie: 'sessionid=test'
  });

  expect(result).toEqual(mockCookie);
});
```

### 测试错误场景

```javascript
it('应该在缺少IP时抛出错误', async () => {
  await expect(
    CookieService.addCookie({ cookie: 'sessionid=test' })
  ).rejects.toThrow();
});
```

### 测试 API 响应

```javascript
it('应该返回Cookie列表', async () => {
  const mockCookies = {
    data: [{ id: 1, status: 0 }],
    pagination: { page: 1, total: 1 }
  };

  CookieService.getCookieList.mockResolvedValue(mockCookies);

  await CookieController.getCookies(req, res);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      code: 200,
      message: expect.any(String)
    })
  );
});
```

## Mock 和 Stub

### 使用 Jest Mock

```javascript
// Mock整个模块
jest.mock('../services/CookieService');

// Mock特定方法
CookieService.addCookie.mockResolvedValue(mockData);

// 验证调用
expect(CookieService.addCookie).toHaveBeenCalledWith(expectedArgs);
```

### 常用 Mock 方法

- `mockResolvedValue()` - Mock异步成功结果
- `mockRejectedValue()` - Mock异步失败结果
- `mockReturnValue()` - Mock同步返回值
- `mockImplementation()` - Mock自定义实现
- `toHaveBeenCalledWith()` - 验证调用参数
- `toHaveBeenCalledTimes()` - 验证调用次数

## 覆盖率目标

项目设置了以下覆盖率目标：

- **分支覆盖率**: >= 60%
- **函数覆盖率**: >= 60%
- **行覆盖率**: >= 60%
- **语句覆盖率**: >= 60%

查看覆盖率报告：

```bash
npm test -- --coverage
```

报告会生成在 `coverage/` 目录下，可以用浏览器打开 `coverage/lcov-report/index.html` 查看详细的可视化报告。

## 最佳实践

### 1. 测试命名

```javascript
// ✅ 好的测试名称
it('应该在IP为空时返回400错误', async () => {});
it('应该成功添加新Cookie并返回ID', async () => {});

// ❌ 不好的测试名称
it('test add', async () => {});
it('works', async () => {});
```

### 2. 测试隔离

```javascript
// 每个测试前清空mocks
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. AAA 模式

```javascript
// Arrange - 准备数据
const mockCookie = { id: 1, status: 0 };
CookieService.getCookieById.mockResolvedValue(mockCookie);

// Act - 执行操作
const result = await CookieService.getCookieById(1);

// Assert - 验证结果
expect(result).toEqual(mockCookie);
```

### 4. 避免测试过度

```javascript
// ❌ 不要测试框架本身
it('Jest works', () => {
  expect(true).toBe(true);
});

// ✅ 只测试你的业务逻辑
it('应该在无效IP时验证失败', async () => {
  await expect(validateIP('invalid')).rejects.toThrow();
});
```

### 5. 异步测试

```javascript
// ✅ 使用 async/await
it('应该获取Cookie', async () => {
  const result = await CookieService.getCookieById(1);
  expect(result).toBeDefined();
});

// ✅ 或者返回 Promise
it('应该获取Cookie', () => {
  return CookieService.getCookieById(1).then(result => {
    expect(result).toBeDefined();
  });
});
```

## 常见问题

### Q: 如何测试数据库操作？

A: 使用 Mock 或搭建测试数据库。本项目使用 Mock 方式：

```javascript
jest.mock('../models/CookieModel');
CookieModel.addCookie.mockResolvedValue(mockData);
```

### Q: 如何测试异常处理？

A: 使用 `rejects` 断言：

```javascript
await expect(
  CookieService.addCookie({})
).rejects.toThrow('参数错误');
```

### Q: 如何增加新测试？

A: 在 `tests/` 目录下创建 `*.test.js` 文件：

```javascript
describe('新功能', () => {
  it('应该...', () => {
    // 测试代码
  });
});
```

### Q: 如何调试测试？

A: 使用 Node 调试器：

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## CI/CD 集成

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test -- --coverage
```

## 持续改进

### 监控覆盖率

定期检查测试覆盖率，目标是逐步提升：

```bash
npm test -- --coverage --collectCoverageFrom="controllers/**/*.js,services/**/*.js"
```

### 新功能测试

添加新功能时，要求同时添加相应的测试用例。

### 代码审查

PR 时检查：
- ✅ 测试是否完整
- ✅ 覆盖率是否满足要求
- ✅ 测试名称是否清晰
- ✅ Mock 是否合理

## 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Node.js 测试指南](https://nodejs.org/en/docs/guides/testing/)
