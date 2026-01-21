/**
 * 仪表板修复验证脚本
 */

const http = require('http');

console.log('🔍 验证仪表板修复...\n');

// 测试API端点
const testApiEndpoint = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/statistics',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
};

// 验证数据类型
const validateDataTypes = (data) => {
    const checks = {
        'total 是整数': typeof data.total === 'number',
        'available 是整数': typeof data.available === 'number',
        'using 是整数': typeof data.using === 'number',
        'invalid 是整数': typeof data.invalid === 'number',
        'blacklist 是整数': typeof data.blacklist === 'number',
        'avgUseCount 是字符串': typeof data.avgUseCount === 'string'
    };

    return checks;
};

// 主函数
async function main() {
    try {
        console.log('1️⃣  获取API数据...');
        const response = await testApiEndpoint();

        if (response.code !== 200) {
            throw new Error(`API返回错误: ${response.message}`);
        }

        console.log('   ✅ API响应正常\n');

        console.log('2️⃣  验证数据类型...');
        const checks = validateDataTypes(response.data);

        let allPassed = true;
        for (const [check, passed] of Object.entries(checks)) {
            const icon = passed ? '✅' : '❌';
            console.log(`   ${icon} ${check}`);
            if (!passed) allPassed = false;
        }
        console.log('');

        console.log('3️⃣  数据样本:');
        console.log(`   总数: ${response.data.total}`);
        console.log(`   可用: ${response.data.available}`);
        console.log(`   使用中: ${response.data.using}`);
        console.log(`   失效: ${response.data.invalid}`);
        console.log(`   黑名单: ${response.data.blacklist}`);
        console.log(`   平均使用次数: ${response.data.avgUseCount}\n`);

        if (allPassed) {
            console.log('✨ 验证通过！仪表板应该可以正常工作了\n');
            console.log('📝 建议:');
            console.log('   1. 刷新浏览器 (F5)');
            console.log('   2. 进入Dashboard页面');
            console.log('   3. 检查是否显示统计数据和图表');
        } else {
            console.log('⚠️  某些检查失败，可能还有问题\n');
            console.log('💡 可能的原因:');
            console.log('   1. 代码未正确更新');
            console.log('   2. 服务未重启');
            console.log('   3. 数据库连接问题');
        }

    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        console.error('\n💡 故障排除:');
        console.error('   1. 检查服务是否运行: npm run dev');
        console.error('   2. 检查端口3000是否可访问');
        console.error('   3. 查看后端日志');
    }
}

main();
