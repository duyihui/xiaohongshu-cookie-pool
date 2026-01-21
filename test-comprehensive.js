/**
 * 综合测试脚本
 * 验证所有Bug修复和功能正常
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

// 测试用例数据
const TEST_DATA = {
  cookies: [
    {
      ip: '192.168.1.1',
      cookie: 'SESSIONID=test123; UserID=user001; Path=/'
    },
    {
      ip: '192.168.1.2',
      cookie: 'SESSIONID=test456; UserID=user002; Path=/'
    },
    {
      ip: '192.168.1.3',
      cookie: 'SESSIONID=test789; UserID=user003; Path=/'
    }
  ]
};

/**
 * 发送HTTP请求的辅助函数
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 断言测试
 */
function assertEqual(actual, expected, message) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`✓ ${message}`);
    TEST_RESULTS.passed++;
  } catch (error) {
    console.error(`✗ ${message}`);
    console.error(`  期望: ${JSON.stringify(expected)}`);
    console.error(`  实际: ${JSON.stringify(actual)}`);
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push(message);
  }
}

function assertExists(value, message) {
  try {
    assert.ok(value, message);
    console.log(`✓ ${message}`);
    TEST_RESULTS.passed++;
  } catch (error) {
    console.error(`✗ ${message}`);
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push(message);
  }
}

function assertStatusCode(statusCode, expected, message) {
  assertEqual(statusCode, expected, message);
}

/**
 * 测试1: 健康检查
 */
async function testHealthCheck() {
  console.log('\n--- 测试1: 健康检查 ---');
  try {
    const response = await makeRequest('GET', '/health');
    assertStatusCode(response.statusCode, 200, '健康检查返回200状态码');
    assertEqual(response.body.code, 200, '健康检查返回code=200');
  } catch (error) {
    console.error('健康检查失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试2: Cookie导入
 */
async function testImportCookies() {
  console.log('\n--- 测试2: Cookie导入 ---');
  try {
    const response = await makeRequest('POST', '/api/cookies/import', {
      cookies: TEST_DATA.cookies
    });
    assertStatusCode(response.statusCode, 200, 'Cookie导入返回200状态码');
    assertEqual(response.body.code, 200, 'Cookie导入返回code=200');
    assertExists(response.body.data.total, 'Cookie导入返回total字段');
    assertExists(response.body.data.success, 'Cookie导入返回success字段');
  } catch (error) {
    console.error('Cookie导入失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试3: 获取Cookie列表
 */
async function testGetCookieList() {
  console.log('\n--- 测试3: 获取Cookie列表 ---');
  try {
    const response = await makeRequest('GET', '/api/cookies?page=1&pageSize=10');
    assertStatusCode(response.statusCode, 200, 'Cookie列表返回200状态码');
    assertEqual(response.body.code, 200, 'Cookie列表返回code=200');
    assertExists(response.body.data.data, 'Cookie列表返回data字段');
    assertExists(response.body.data.pagination, 'Cookie列表返回pagination字段');
  } catch (error) {
    console.error('获取Cookie列表失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试4: 获取随机Cookie
 */
async function testGetRandomCookie() {
  console.log('\n--- 测试4: 获取随机Cookie ---');
  try {
    const response = await makeRequest('GET', '/api/cookies/random');
    assertStatusCode(response.statusCode, 200, '随机Cookie返回200状态码');
    assertEqual(response.body.code, 200, '随机Cookie返回code=200');
    assertExists(response.body.data.id, '随机Cookie返回id字段');
    assertExists(response.body.data.ip, '随机Cookie返回ip字段');
    assertExists(response.body.data.cookie, '随机Cookie返回cookie字段');
  } catch (error) {
    console.error('获取随机Cookie失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试5: 获取统计信息
 */
async function testGetStatistics() {
  console.log('\n--- 测试5: 获取统计信息 ---');
  try {
    const response = await makeRequest('GET', '/api/statistics');
    assertStatusCode(response.statusCode, 200, '统计信息返回200状态码');
    assertEqual(response.body.code, 200, '统计信息返回code=200');
    assertExists(response.body.data.total, '统计信息返回total字段');
    assertExists(response.body.data.available, '统计信息返回available字段');
    assertExists(response.body.data.using, '统计信息返回using字段');
    assertExists(response.body.data.invalid, '统计信息返回invalid字段');
    assertExists(response.body.data.blacklist, '统计信息返回blacklist字段');
  } catch (error) {
    console.error('获取统计信息失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试6: 批量验证Cookie (参数验证 - Bug #2)
 */
async function testBatchValidateCookiesParamValidation() {
  console.log('\n--- 测试6: 批量验证Cookie参数验证 (Bug #2 修复) ---');
  try {
    // 测试无效参数
    const response = await makeRequest('POST', '/api/cookies/validate/batch', {
      ids: 'not-an-array'  // 应该是数组
    });
    assertStatusCode(response.statusCode, 400, '无效参数返回400状态码');
    assertEqual(response.body.code, 400, '无效参数返回code=400');
  } catch (error) {
    console.error('参数验证测试失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试7: 正确的批量验证Cookie调用
 */
async function testBatchValidateCookiesCorrect() {
  console.log('\n--- 测试7: 批量验证Cookie正确调用 ---');
  try {
    const response = await makeRequest('POST', '/api/cookies/validate/batch', {
      ids: []  // 空数组是有效的
    });
    assertStatusCode(response.statusCode, 200, '有效参数返回200状态码');
    assertEqual(response.body.code, 200, '有效参数返回code=200');
  } catch (error) {
    console.error('批量验证Cookie测试失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试8: 导出监控数据参数验证 (Bug #5 修复)
 */
async function testExportMonitoringDataParamValidation() {
  console.log('\n--- 测试8: 导出监控数据参数验证 (Bug #5 修复) ---');
  try {
    // 测试缺少参数
    const response1 = await makeRequest('GET', '/api/monitor/export');
    assertStatusCode(response1.statusCode, 400, '缺少参数返回400状态码');
    assertEqual(response1.body.code, 400, '缺少参数返回code=400');

    // 测试无效日期格式
    const response2 = await makeRequest('GET', '/api/monitor/export?startDate=2024/01/01&endDate=2024/01/31');
    assertStatusCode(response2.statusCode, 400, '无效日期格式返回400状态码');
    assertEqual(response2.body.code, 400, '无效日期格式返回code=400');

    // 测试日期逻辑错误 (startDate > endDate)
    const response3 = await makeRequest('GET', '/api/monitor/export?startDate=2024-01-31&endDate=2024-01-01');
    assertStatusCode(response3.statusCode, 400, '日期逻辑错误返回400状态码');
    assertEqual(response3.body.code, 400, '日期逻辑错误返回code=400');

    // 测试有效调用
    const response4 = await makeRequest('GET', '/api/monitor/export?startDate=2024-01-01&endDate=2024-01-31');
    assertStatusCode(response4.statusCode, 200, '有效参数返回200状态码');
    assertEqual(response4.body.code, 200, '有效参数返回code=200');
  } catch (error) {
    console.error('导出监控数据参数验证测试失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试9: 获取池状态
 */
async function testGetPoolStatus() {
  console.log('\n--- 测试9: 获取池状态 ---');
  try {
    const response = await makeRequest('GET', '/api/monitor/status');
    assertStatusCode(response.statusCode, 200, '池状态返回200状态码');
    assertEqual(response.body.code, 200, '池状态返回code=200');
    assertExists(response.body.data.stats, '池状态返回stats字段');
    assertExists(response.body.data.health, '池状态返回health字段');
    assertExists(response.body.data.utilizationRate, '池状态返回utilizationRate字段');
  } catch (error) {
    console.error('获取池状态失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 测试10: 获取告警列表
 */
async function testGetAlerts() {
  console.log('\n--- 测试10: 获取告警列表 ---');
  try {
    const response = await makeRequest('GET', '/api/monitor/alerts');
    assertStatusCode(response.statusCode, 200, '告警列表返回200状态码');
    assertEqual(response.body.code, 200, '告警列表返回code=200');
    assertExists(response.body.data.total, '告警列表返回total字段');
    assertExists(response.body.data.alerts, '告警列表返回alerts字段');
  } catch (error) {
    console.error('获取告警列表失败:', error.message);
    TEST_RESULTS.failed++;
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('========================================');
  console.log('  小红书Cookie池 - 综合测试套件');
  console.log('========================================');
  console.log(`测试开始时间: ${new Date().toISOString()}`);
  
  try {
    await testHealthCheck();
    await testImportCookies();
    await testGetCookieList();
    await testGetRandomCookie();
    await testGetStatistics();
    await testBatchValidateCookiesParamValidation();
    await testBatchValidateCookiesCorrect();
    await testExportMonitoringDataParamValidation();
    await testGetPoolStatus();
    await testGetAlerts();

    // 输出测试结果摘要
    console.log('\n========================================');
    console.log('  测试结果摘要');
    console.log('========================================');
    console.log(`✓ 通过: ${TEST_RESULTS.passed}`);
    console.log(`✗ 失败: ${TEST_RESULTS.failed}`);
    console.log(`总计: ${TEST_RESULTS.passed + TEST_RESULTS.failed}`);
    
    if (TEST_RESULTS.failed > 0) {
      console.log('\n失败的测试:');
      TEST_RESULTS.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log(`\n测试结束时间: ${new Date().toISOString()}`);
    console.log('========================================\n');

    // 返回测试是否全部通过
    process.exit(TEST_RESULTS.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n测试执行出错:', error);
    process.exit(1);
  }
}

// 启动测试
runAllTests();
