/**
 * 测试新增功能
 */
const http = require('http');

async function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 开始测试新增功能...\n');

    try {
        // 1. 获取Cookies
        console.log('1️⃣ 获取所有Cookies:');
        const getCookies = await makeRequest('GET', '/api/cookies');
        console.log(`   ✓ 获取到 ${getCookies.data.data.length} 条Cookie\n`);

        if (getCookies.data.data.length === 0) {
            console.log('❌ 没有Cookie数据，跳过后续测试\n');
            process.exit(0);
        }

        const testId = getCookies.data.data[0].id;
        console.log(`2️⃣ 使用Cookie ID: ${testId}\n`);

        // 2. 测试编辑功能
        console.log(`3️⃣ 测试编辑Cookie (PUT /api/cookies/${testId}):`);
        const updateResult = await makeRequest('PUT', `/api/cookies/${testId}`, {
            ip: '10.0.0.1',
            cookie: 'test_cookie=test_value',
            status: 0
        });
        if (updateResult.code === 200) {
            console.log('   ✓ 编辑成功\n');
        } else {
            console.log(`   ❌ 编辑失败: ${updateResult.message}\n`);
        }

        // 3. 测试删除功能
        console.log(`4️⃣ 测试删除Cookie (DELETE /api/cookies/${testId}):`);
        const deleteResult = await makeRequest('DELETE', `/api/cookies/${testId}`);
        if (deleteResult.code === 200) {
            console.log('   ✓ 删除成功\n');
        } else {
            console.log(`   ❌ 删除失败: ${deleteResult.message}\n`);
        }

        // 4. 验证删除结果
        console.log('5️⃣ 验证删除结果:');
        const checkCookies = await makeRequest('GET', '/api/cookies');
        const stillExists = checkCookies.data.data.some(c => c.id === testId);
        if (!stillExists) {
            console.log(`   ✓ Cookie已成功删除\n`);
        } else {
            console.log(`   ❌ Cookie仍然存在\n`);
        }

        console.log('✅ 所有功能测试完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 测试错误:', error.message);
        process.exit(1);
    }
}

runTests();
