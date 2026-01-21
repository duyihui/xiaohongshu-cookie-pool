# API 文档

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **响应格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

所有API响应都遵循以下格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 状态码说明

- `200`: 请求成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## Cookie相关接口

### 1. 导入Cookie

**请求**
```
POST /api/cookies/import
Content-Type: application/json
```

**请求体**
```json
{
  "cookies": [
    {
      "ip": "192.168.1.1",
      "cookie": "sessionid=xxx; path=/; secure",
      "validUntil": "2024-02-20T10:00:00Z"
    },
    {
      "ip": "192.168.1.2",
      "cookie": "sessionid=yyy; path=/; secure"
    }
  ]
}
```

**响应**
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "details": [
      {
        "success": true,
        "ip": "192.168.1.1",
        "id": 1
      },
      {
        "success": true,
        "ip": "192.168.1.2",
        "id": 2
      }
    ]
  }
}
```

---

### 2. 获取随机未使用Cookie

**请求**
```
GET /api/cookies/random
```

**响应**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "ip": "192.168.1.1",
    "cookie": "sessionid=xxx; path=/; secure",
    "useCount": 5
  }
}
```

---

### 3. 验证单个Cookie

**请求**
```
POST /api/cookies/:id/validate
```

**响应**
```json
{
  "code": 200,
  "message": "验证完成",
  "data": {
    "valid": true,
    "ip": "192.168.1.1"
  }
}
```

---

### 4. 批量验证Cookie

**请求**
```
POST /api/cookies/validate/batch
Content-Type: application/json
```

**请求体**
```json
{
  "ids": [1, 2, 3]
}
```

**响应**
```json
{
  "code": 200,
  "message": "验证完成",
  "data": {
    "total": 3,
    "results": [
      {
        "id": 1,
        "ip": "192.168.1.1",
        "valid": true
      },
      {
        "id": 2,
        "ip": "192.168.1.2",
        "valid": false
      }
    ]
  }
}
```

---

### 5. 释放Cookie

**请求**
```
POST /api/cookies/:id/release
```

**响应**
```json
{
  "code": 200,
  "message": "释放成功",
  "data": {
    "id": 1,
    "ip": "192.168.1.1",
    "message": "Cookie已释放"
  }
}
```

---

### 6. 获取Cookie列表

**请求**
```
GET /api/cookies?page=1&pageSize=10&status=0&ip=192
```

**查询参数**
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 状态过滤（0-可用, 1-使用中, 2-失效, 3-黑名单）
- `ip`: IP模糊搜索

**响应**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "data": [
      {
        "id": 1,
        "ip": "192.168.1.1",
        "cookie": "sessionid=xxx...",
        "status": 0,
        "is_using": false,
        "use_count": 5,
        "created_at": "2024-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

### 7. 获取Cookie详情

**请求**
```
GET /api/cookies/:id
```

**响应**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "ip": "192.168.1.1",
    "cookie": "sessionid=xxx...",
    "status": 0,
    "is_using": false,
    "last_used_time": "2024-01-20T10:30:00Z",
    "last_check_time": "2024-01-20T11:00:00Z",
    "use_count": 5,
    "valid_until": "2024-02-20T10:00:00Z",
    "error_msg": null,
    "created_at": "2024-01-20T10:00:00Z"
  }
}
```

---

### 8. 获取统计信息

**请求**
```
GET /api/statistics
```

**响应**
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

---

### 9. 添加到黑名单

**请求**
```
POST /api/cookies/:id/blacklist
Content-Type: application/json
```

**请求体**
```json
{
  "reason": "IP被封禁"
}
```

**响应**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "ip": "192.168.1.1",
    "message": "已添加到黑名单"
  }
}
```

---

## 健康检查

**请求**
```
GET /health
```

**响应**
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "status": "healthy"
  }
}
```

---

## Cookie状态说明

- `0`: 未使用/可用
- `1`: 使用中
- `2`: 已失效
- `3`: 黑名单

## 最佳实践

1. **获取Cookie流程**
   - 调用 `GET /api/cookies/random` 获取可用Cookie
   - 设置代理为返回的IP
   - 使用返回的Cookie进行请求
   - 任务完成后调用 `POST /api/cookies/:id/release` 释放Cookie

2. **定期维护**
   - 定期调用 `POST /api/cookies/validate/batch` 检测Cookie有效性
   - 移除失效的Cookie到黑名单
   - 监控统计信息了解池的健康状况

3. **错误处理**
   - 如果获取不到Cookie，检查统计信息
   - 如果Cookie频繁失效，增加导入频率
   - 监控错误日志及时发现问题
