#!/bin/bash

# 仪表板问题诊断和修复脚本

echo "════════════════════════════════════════════════════"
echo "🔧 仪表板图表加载失败 - 诊断和修复"
echo "════════════════════════════════════════════════════"
echo ""

# 1. 检查Chart.js是否在HTML中正确引入
echo "1️⃣  检查Chart.js引入..."
if grep -q "Chart.js" public/index.html; then
    echo "   ✅ Chart.js 已引入"
else
    echo "   ❌ Chart.js 未引入"
    exit 1
fi

# 2. 检查脚本加载顺序
echo ""
echo "2️⃣  检查脚本加载顺序..."
chartjs_line=$(grep -n "Chart.js" public/index.html | grep -o '^[0-9]*')
appjs_line=$(grep -n "app.js" public/index.html | grep -o '^[0-9]*')

if [ "$chartjs_line" -lt "$appjs_line" ]; then
    echo "   ✅ 脚本加载顺序正确 (Chart.js:$chartjs_line < app.js:$appjs_line)"
else
    echo "   ❌ 脚本加载顺序错误 (Chart.js:$chartjs_line >= app.js:$appjs_line)"
    exit 1
fi

# 3. 检查Canvas元素
echo ""
echo "3️⃣  检查Canvas元素..."
if grep -q 'id="statusChart"' public/index.html && grep -q 'id="usageChart"' public/index.html; then
    echo "   ✅ Canvas 元素存在"
else
    echo "   ❌ Canvas 元素缺失"
    exit 1
fi

# 4. 检查app.js初始化逻辑
echo ""
echo "4️⃣  检查app.js初始化逻辑..."
if grep -q "document.readyState.*loading" public/js/app.js; then
    echo "   ✅ app.js 使用 DOMContentLoaded 等待"
else
    echo "   ⚠️  app.js 没有等待 DOM 加载 (可能是问题)"
fi

# 5. 检查Chart对象检查
echo ""
echo "5️⃣  检查Chart对象验证..."
if grep -q "typeof Chart.*undefined" public/js/app.js; then
    echo "   ✅ 代码检查 Chart 对象是否存在"
else
    echo "   ⚠️  代码未检查 Chart 对象"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "📋 诊断完成！"
echo ""
echo "📝 建议操作:"
echo "   1. 重启服务: npm run dev"
echo "   2. 打开浏览器: http://localhost:3000"
echo "   3. 按 F12 打开开发者工具"
echo "   4. 查看 Console 标签中的具体错误信息"
echo "   5. 查看 Network 标签中 Chart.js 是否加载 (200状态)"
echo ""
echo "🐛 如果仍然有问题，请检查:"
echo "   - 浏览器网络连接"
echo "   - CDN 是否可以访问: https://cdnjs.cloudflare.com"
echo "   - 使用本地 Chart.js 库而不是 CDN"
echo "════════════════════════════════════════════════════"
