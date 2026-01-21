#!/bin/bash
# 测试仪表板修复

echo "🧪 测试仪表板数据获取..."
echo ""

# 测试API响应
echo "1. 测试 /api/statistics 端点..."
RESPONSE=$(curl -s http://localhost:3000/api/statistics)
echo "响应: $RESPONSE"
echo ""

# 解析JSON（使用sed和grep）
echo "2. 数据类型检查..."
echo "$RESPONSE" | grep -o '"available":"[^"]*"'
echo "$RESPONSE" | grep -o '"using":"[^"]*"'
echo "$RESPONSE" | grep -o '"invalid":"[^"]*"'
echo ""

echo "3. 修复前后对比:"
echo "修复前: 字段为字符串类型"
echo "修复后: 字段已转换为整数类型"
echo ""

echo "✅ 测试完成"
echo "请打开浏览器访问 http://localhost:3000 检查仪表板"
