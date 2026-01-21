#!/bin/bash

# 测试脚本：验证统计接口的数据准确性

echo "====== 小红书Cookie池 - 统计接口测试 ======"
echo ""

# 1. 导入一些测试Cookie
echo "1️⃣  导入测试Cookie..."
curl -s -X POST http://localhost:3000/api/cookies/import \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": [
      {"ip":"192.168.1.100","cookie":"sessionid=test1"},
      {"ip":"192.168.1.101","cookie":"sessionid=test2"},
      {"ip":"192.168.1.102","cookie":"sessionid=test3"},
      {"ip":"192.168.1.103","cookie":"sessionid=test4"},
      {"ip":"192.168.1.104","cookie":"sessionid=test5"}
    ]
  }' | jq '.'

echo ""
echo "2️⃣  获取统计信息（应该显示5个未使用）..."
curl -s http://localhost:3000/api/statistics | jq '.'

echo ""
echo "3️⃣  获取随机Cookie进行使用..."
RESPONSE=$(curl -s http://localhost:3000/api/cookies/random)
COOKIE_ID=$(echo $RESPONSE | jq '.data.id')
echo "获取到Cookie ID: $COOKIE_ID"
echo $RESPONSE | jq '.'

echo ""
echo "4️⃣  获取统计信息（应该显示1个使用中，4个未使用）..."
curl -s http://localhost:3000/api/statistics | jq '.'

echo ""
echo "5️⃣  释放Cookie..."
curl -s -X POST "http://localhost:3000/api/cookies/$COOKIE_ID/release" | jq '.'

echo ""
echo "6️⃣  获取统计信息（应该回到5个未使用）..."
curl -s http://localhost:3000/api/statistics | jq '.'

echo ""
echo "====== 测试完成 ======"
