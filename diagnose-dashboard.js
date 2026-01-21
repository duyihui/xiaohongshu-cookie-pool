#!/usr/bin/env node

/**
 * 仪表板诊断脚本
 * 用于诊断Chart.js加载问题
 */

const http = require('http');

console.log('🔍 开始诊断仪表板问题...\n');

// 测试API是否返回正确的数据
function testAPI() {
    return new Promise((resolve) => {
        console.log('📡 测试API端点...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/statistics',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ API 响应成功');
                    console.log('   数据类型检查:');
                    console.log(`   - total: ${typeof parsed.data.total} = "${parsed.data.total}"`);
                    console.log(`   - available: ${typeof parsed.data.available} = "${parsed.data.available}"`);
                    console.log(`   - using: ${typeof parsed.data.using} = "${parsed.data.using}"`);
                    console.log(`   - invalid: ${typeof parsed.data.invalid} = "${parsed.data.invalid}"`);
                    console.log(`   - blacklist: ${typeof parsed.data.blacklist} = "${parsed.data.blacklist}"\n`);
                    resolve(true);
                } catch (e) {
                    console.log('❌ API 响应不是有效的JSON\n');
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log(`❌ 无法连接到服务器: ${e.message}\n`);
            resolve(false);
        });

        req.end();
    });
}

// 测试HTML页面是否加载
function testHTML() {
    return new Promise((resolve) => {
        console.log('📄 测试HTML页面...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const hasCanvas = data.includes('id="statusChart"') && data.includes('id="usageChart"');
                const hasChartJS = data.includes('Chart.js');
                const hasAppJS = data.includes('app.js');
                
                console.log('✅ HTML 页面加载成功');
                console.log(`   - Canvas元素: ${hasCanvas ? '✅' : '❌'}`);
                console.log(`   - Chart.js库: ${hasChartJS ? '✅' : '❌'}`);
                console.log(`   - app.js: ${hasAppJS ? '✅' : '❌'}\n`);
                
                // 检查脚本加载顺序
                const chartJSIndex = data.indexOf('Chart.js');
                const appJSIndex = data.indexOf('app.js');
                if (chartJSIndex !== -1 && appJSIndex !== -1) {
                    if (chartJSIndex < appJSIndex) {
                        console.log('   脚本加载顺序: ✅ 正确 (Chart.js 在 app.js 之前)\n');
                    } else {
                        console.log('   脚本加载顺序: ❌ 错误 (app.js 在 Chart.js 之前)\n');
                    }
                }
                
                resolve(hasCanvas && hasChartJS && hasAppJS);
            });
        });

        req.on('error', (e) => {
            console.log(`❌ 无法连接到页面: ${e.message}\n`);
            resolve(false);
        });

        req.end();
    });
}

// 主诊断函数
async function runDiagnostics() {
    console.log('═══════════════════════════════════════════════\n');
    
    const htmlOk = await testHTML();
    const apiOk = await testAPI();
    
    console.log('═══════════════════════════════════════════════\n');
    console.log('📊 诊断结果汇总:\n');
    
    if (htmlOk && apiOk) {
        console.log('✅ 所有诊断通过！系统应该正常工作。');
        console.log('   如果仍然显示"图表加载失败"，请:');
        console.log('   1. 打开浏览器开发者工具 (F12)');
        console.log('   2. 查看 Console 标签，找到具体错误信息');
        console.log('   3. 查看 Network 标签，确认 Chart.js CDN 加载成功\n');
    } else {
        console.log('❌ 诊断发现问题:');
        if (!htmlOk) console.log('   - HTML 页面加载失败或缺少必要元素');
        if (!apiOk) console.log('   - API 返回数据格式错误');
        console.log('\n请解决上述问题后重试。\n');
    }
}

// 延迟启动诊断，给服务器时间启动
console.log('⏳ 等待服务器启动...\n');
setTimeout(runDiagnostics, 2000);
