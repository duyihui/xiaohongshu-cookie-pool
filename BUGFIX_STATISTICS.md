# 统计接口数据不准确问题 - 修复说明

## 问题描述

调用 `GET /api/statistics` 接口时，返回的 `using` 字段（使用中的Cookie数量）数据不准确。

## 问题根因分析

系统中有两个字段表示"使用中"的状态：

1. **status** - Cookie的整体状态
   - 0: 未使用
   - 1: 使用中
   - 2: 已失效
   - 3: 黑名单

2. **is_using** - Cookie当前是否被占用
   - TRUE: 正在被使用
   - FALSE: 未被使用

### 问题所在

在 `models/CookieModel.js` 中：

- **markAsUsing()** 方法只更新了 `is_using = TRUE`，**没有更新 status**
- **releaseCookie()** 方法只更新了 `is_using = FALSE`，**没有恢复 status**

而统计查询 `getStats()` 中计算 "using" 字段时，基于 `status = 1` 进行统计：

```sql
SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as `using`
```

这导致了不一致：
- 实际有Cookie被占用（is_using = TRUE）
- 但status字段仍然是0（未使用）
- 统计时就统计不到这些被占用的Cookie

## 修复方案

### 修复1: markAsUsing() 方法

**文件**: `models/CookieModel.js` (第86-98行)

**修改前**:
```javascript
static async markAsUsing(id) {
  const query = `
    UPDATE cookie_pool
    SET is_using = TRUE, last_used_time = NOW(), use_count = use_count + 1
    WHERE id = ?
  `;
}
```

**修改后**:
```javascript
static async markAsUsing(id) {
  const query = `
    UPDATE cookie_pool
    SET status = 1, is_using = TRUE, last_used_time = NOW(), use_count = use_count + 1
    WHERE id = ?
  `;
}
```

增加了 `status = 1`，标记为使用中状态。

### 修复2: releaseCookie() 方法

**文件**: `models/CookieModel.js` (第101-117行)

**修改前**:
```javascript
static async releaseCookie(id) {
  const query = `
    UPDATE cookie_pool
    SET is_using = FALSE
    WHERE id = ?
  `;
}
```

**修改后**:
```javascript
static async releaseCookie(id) {
  const query = `
    UPDATE cookie_pool
    SET status = 0, is_using = FALSE
    WHERE id = ?
  `;
}
```

增加了 `status = 0`，恢复为未使用状态。

### 修复3: getStats() 中的SQL语法

**文件**: `models/CookieModel.js` (第236-255行)

**修改**:
```sql
-- 修改前
SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as using

-- 修改后（using是MySQL保留字，需要用反引号）
SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as `using`
```

## 验证修复

### 手动测试

1. **重启服务器**
   ```bash
   npm run dev
   ```

2. **导入测试Cookie**
   ```bash
   curl -X POST http://localhost:3000/api/cookies/import \
     -H "Content-Type: application/json" \
     -d '{
       "cookies": [
         {"ip":"192.168.1.100","cookie":"sessionid=test1"},
         {"ip":"192.168.1.101","cookie":"sessionid=test2"},
         {"ip":"192.168.1.102","cookie":"sessionid=test3"}
       ]
     }'
   ```

3. **查看初始统计**
   ```bash
   curl http://localhost:3000/api/statistics
   ```
   期望: `"total": 3, "available": 3, "using": 0`

4. **获取随机Cookie**
   ```bash
   curl http://localhost:3000/api/cookies/random
   ```
   记录返回的 `id`

5. **查看统计（应该变化）**
   ```bash
   curl http://localhost:3000/api/statistics
   ```
   期望: `"total": 3, "available": 2, "using": 1`

6. **释放Cookie**
   ```bash
   curl -X POST http://localhost:3000/api/cookies/{id}/release
   ```

7. **查看统计（应该恢复）**
   ```bash
   curl http://localhost:3000/api/statistics
   ```
   期望: `"total": 3, "available": 3, "using": 0`

### 自动化测试

运行自动化测试脚本：
```bash
node test-statistics.js
```

脚本会自动执行上述所有步骤，并输出测试结果。

## 影响范围

修复后影响的功能：

- ✅ `GET /api/statistics` - 统计接口数据准确
- ✅ `GET /api/monitor/status` - 池状态显示正确
- ✅ `POST /api/monitor/health-check` - 健康检查数据准确
- ✅ 告警系统 - 基于正确数据生成告警

## 相关代码文件

- `models/CookieModel.js` - 数据访问层修复
- `services/CleanupService.js` - 自动释放机制（无需修改，已使用releaseCookie）
- `test-statistics.js` - 测试脚本

## 总结

| 问题 | 原因 | 解决 | 状态 |
|------|------|------|------|
| using字段不准确 | status和is_using不同步 | 同时更新两个字段 | ✅ 已修复 |
| SQL语法错误 | using是保留字 | 使用反引号转义 | ✅ 已修复 |

修复后，统计接口将准确反映Cookie池的真实状态！
