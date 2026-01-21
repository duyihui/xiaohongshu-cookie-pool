#!/usr/bin/env node

/**
 * 仪表板修复验证脚本
 * 验证所有修复都已应用且正常工作
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 开始验证仪表板修复...\n');
console.log('═══════════════════════════════════════════════════════\n');

let testsPassed = 0;
let testsFailed = 0;

async function testStaticFiles() {
    console.log('📁 测试1: 检查静态文件...');
    
    try {
        const chartPath = path.join(__dirname, 'public', 'js', 'chart.min.js');
        const stats = fs.statSync(chartPath);
        
        if (stats.size > 100000) { // Chart.js应该> 100KB
            console.log('   ✅ Chart.js 本地库存在且有效 (大小: ' + Math.round(stats.size/1024) + 'KB)\n');
            testsPassed++;
            return true;
        } else {
            console.log('   ❌ Chart.js 文件太小\n');
            testsFailed++;
            return false;
        }
    } catch (e) {
        console.log('   ❌ Chart.js 文件不存在: ' + e.message + '\n');
        testsFailed++;
        return false;
    }
}

async function testHTMLContent() {
    console.log('📄 测试2: 检查HTML内容...');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let allGood = true;
                const checks = {
                    'Canvas元素': data.includes('id="statusChart"') && data.includes('id="usageChart"'),
                    '本地Chart.js': data.includes('js/chart.min.js'),
                    'Chart.js CDN已移除': !data.includes('Chart.js/3.9.1'),
                    'app.js脚本': data.includes('js/app.js'),
                    'api.js脚本': data.includes('js/api.js'),
                };

                for (const [check, result] of Object.entries(checks)) {
                    if (result) {
                        console.log('   ✅ ' + check);
                    } else {
                        console.log('   ❌ ' + check);
                        allGood = false;
                    }
                }
                
                if (allGood) {
                    testsPassed++;
                } else {
                    testsFailed++;
                }
                
                console.log('');
                resolve(allGood);
            });
        });

        req.on('error', (e) => {
            console.log('   ❌ 无法连接到服务器: ' + e.message + '\n');
            testsFailed++;
            resolve(false);
        });

        req.setTimeout(6000);
        req.end();
    });
}

async function testAPIData() {
    console.log('📡 测试3: 检查API数据...');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/statistics',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const checks = {
                        'API返回成功': parsed.code === 200,
                        'Data对象存在': parsed.data !== undefined,
                        'Total字段': parsed.data?.total !== undefined,
                        'Available字段': parsed.data?.available !== undefined,
                        'Using字段': parsed.data?.using !== undefined,
                        'Invalid字段': parsed.data?.invalid !== undefined,
                        'Blacklist字段': parsed.data?.blacklist !== undefined,
                    };

                    let allGood = true;
                    for (const [check, result] of Object.entries(checks)) {
                        if (result) {
                            console.log('   ✅ ' + check);
                        } else {
                            console.log('   ❌ ' + check);
                            allGood = false;
                        }
                    }
                    
                    console.log('\n   API返回的数据:');
                    console.log('   - total: ' + parsed.data.total);
                    console.log('   - available: ' + parsed.data.available);
                    console.log('   - using: ' + parsed.data.using);
                    console.log('   - invalid: ' + parsed.data.invalid);
                    console.log('   - blacklist: ' + parsed.data.blacklist + '\n');
                    
                    if (allGood) {
                        testsPassed++;
                    } else {
                        testsFailed++;
                    }
                    
                    resolve(allGood);
                } catch (e) {
                    console.log('   ❌ API返回的不是有效JSON: ' + e.message + '\n');
                    testsFailed++;
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log('   ❌ 无法连接到API: ' + e.message + '\n');
            testsFailed++;
            resolve(false);
        });

        req.setTimeout(6000);
        req.end();
    });
}

async function testAppJSDebug() {
    console.log('🐛 测试4: 检查app.js调试功能...');
    
    try {
        const appPath = path.join(__dirname, 'public', 'js', 'app.js');
        const content = fs.readFileSync(appPath, 'utf8');
        
        const checks = {
            'DOMContentLoaded等待': content.includes('DOMContentLoaded'),
            'Chart对象检查': content.includes('typeof Chart'),
            '错误日志记录': content.includes('console.error'),
            '调试日志记录': content.includes('console.log'),
        };

        let allGood = true;
        for (const [check, result] of Object.entries(checks)) {
            if (result) {
                console.log('   ✅ ' + check);
            } else {
                console.log('   ❌ ' + check);
                allGood = false;
            }
        }
        console.log('');
        
        if (allGood) {
            testsPassed++;
        } else {
            testsFailed++;
        }
    } catch (e) {
        console.log('   ❌ 无法读取app.js: ' + e.message + '\n');
        testsFailed++;
    }
}

async function runAllTests() {
    await testStaticFiles();
    await testHTMLContent();
    await testAPIData();
    await testAppJSDebug();
    
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 测试结果汇总:\n');
    console.log('   ✅ 通过: ' + testsPassed + ' 个测试');
    console.log('   ❌ 失败: ' + testsFailed + ' 个测试');
    console.log('');
    
    if (testsFailed === 0) {
        console.log('🎉 恭喜！所有测试都通过了！');
        console.log('\n✅ 仪表板应该正常工作了。');
        console.log('\n📝 后续操作:');
        console.log('   1. 打开浏览器访问: http://localhost:3000');
        console.log('   2. 验证Dashboard图表是否正常加载');
        console.log('   3. 查看统计数据是否显示');
        console.log('\n');
    } else {
        console.log('⚠️  仍有测试失败，请检查上述错误。\n');
    }
}

// 延迟执行，给服务器启动时间
setTimeout(runAllTests, 2000);
