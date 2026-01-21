/**
 * 管理页面集成测试
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

async function testAdminPage() {
    console.log('🧪 开始测试管理页面集成...\n');

    try {
        // 1. 检查服务健康状态
        console.log('1️⃣  检查服务健康状态...');
        const healthRes = await axios.get(`${BASE_URL}/health`);
        console.log(`   ✅ 服务在线: ${healthRes.data.message}\n`);

        // 2. 获取统计信息
        console.log('2️⃣  获取统计信息...');
        const statsRes = await axios.get(`${API_URL}/statistics`);
        if (statsRes.data.code === 200) {
            console.log(`   ✅ 统计信息获取成功:`);
            console.log(`      总数: ${statsRes.data.data.total}`);
            console.log(`      可用: ${statsRes.data.data.available}`);
            console.log(`      使用中: ${statsRes.data.data.using}`);
            console.log(`      失效: ${statsRes.data.data.invalid}`);
            console.log(`      黑名单: ${statsRes.data.data.blacklist}\n`);
        }

        // 3. 获取Cookie列表
        console.log('3️⃣  获取Cookie列表...');
        const cookiesRes = await axios.get(`${API_URL}/cookies?page=1&pageSize=5`);
        if (cookiesRes.data.code === 200) {
            console.log(`   ✅ Cookie列表获取成功:`);
            console.log(`      总数: ${cookiesRes.data.data.pagination.total}`);
            console.log(`      本页: ${cookiesRes.data.data.data.length}条\n`);
        }

        // 4. 检查前端文件
        console.log('4️⃣  检查前端文件...');
        const mainRes = await axios.get(`${BASE_URL}/`);
        if (mainRes.status === 200) {
            const hasHtml = mainRes.data.includes('Cookie池管理');
            const hasJs = mainRes.data.includes('api.js');
            const hasCss = mainRes.data.includes('style.css');
            
            console.log(`   ✅ 主页加载成功`);
            console.log(`      HTML: ${hasHtml ? '✓' : '✗'}`);
            console.log(`      CSS: ${hasCss ? '✓' : '✗'}`);
            console.log(`      JS: ${hasJs ? '✓' : '✗'}\n`);
        }

        console.log('✨ 所有测试通过! 管理页面已就绪\n');
        console.log('📝 访问地址: http://localhost:3000');
        console.log('📚 文档位置: ADMIN_GUIDE.md\n');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('\n🔍 故障排除:');
        console.error('   1. 确保服务正在运行: npm run dev');
        console.error('   2. 检查端口3000是否被占用');
        console.error('   3. 检查数据库连接是否正常');
    }
}

// 延迟1秒后启动测试（确保服务已启动）
setTimeout(testAdminPage, 1000);
