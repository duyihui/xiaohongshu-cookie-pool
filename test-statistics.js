/**
 * 统计接口测试脚本
 * 用法: node test-statistics.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('====== 小红书Cookie池 - 统计接口测试 ======\n');

  try {
    // 1. 导入测试Cookie
    console.log('1️⃣  导入5个测试Cookie...');
    const importRes = await axios.post(`${API_URL}/cookies/import`, {
      cookies: [
        { ip: '192.168.1.100', cookie: 'sessionid=test1' },
        { ip: '192.168.1.101', cookie: 'sessionid=test2' },
        { ip: '192.168.1.102', cookie: 'sessionid=test3' },
        { ip: '192.168.1.103', cookie: 'sessionid=test4' },
        { ip: '192.168.1.104', cookie: 'sessionid=test5' }
      ]
    });
    console.log(`✓ 成功导入: ${importRes.data.data.success}条\n`);

    // 2. 查询统计（应该5个未使用）
    console.log('2️⃣  查询统计信息（应该5个available，0个using）...');
    let statsRes = await axios.get(`${API_URL}/statistics`);
    const stats1 = statsRes.data.data;
    console.log(`总数: ${stats1.total}, 可用: ${stats1.available}, 使用中: ${stats1.using}`);
    console.log(`期望: total=5, available=5, using=0`);
    const test1Pass = stats1.total === 5 && stats1.available === 5 && stats1.using === 0;
    console.log(`结果: ${test1Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // 3. 获取随机Cookie（标记为使用中）
    console.log('3️⃣  获取随机Cookie进行使用...');
    const getRes = await axios.get(`${API_URL}/cookies/random`);
    const cookieId = getRes.data.data.id;
    console.log(`✓ 获取到Cookie ID: ${cookieId}\n`);

    await sleep(100);

    // 4. 查询统计（应该1个使用中，4个未使用）
    console.log('4️⃣  查询统计信息（应该4个available，1个using）...');
    statsRes = await axios.get(`${API_URL}/statistics`);
    const stats2 = statsRes.data.data;
    console.log(`总数: ${stats2.total}, 可用: ${stats2.available}, 使用中: ${stats2.using}`);
    console.log(`期望: total=5, available=4, using=1`);
    const test2Pass = stats2.total === 5 && stats2.available === 4 && stats2.using === 1;
    console.log(`结果: ${test2Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // 5. 释放Cookie
    console.log('5️⃣  释放Cookie...');
    await axios.post(`${API_URL}/cookies/${cookieId}/release`);
    console.log(`✓ Cookie已释放\n`);

    await sleep(100);

    // 6. 查询统计（应该回到5个未使用）
    console.log('6️⃣  查询统计信息（应该回到5个available，0个using）...');
    statsRes = await axios.get(`${API_URL}/statistics`);
    const stats3 = statsRes.data.data;
    console.log(`总数: ${stats3.total}, 可用: ${stats3.available}, 使用中: ${stats3.using}`);
    console.log(`期望: total=5, available=5, using=0`);
    const test3Pass = stats3.total === 5 && stats3.available === 5 && stats3.using === 0;
    console.log(`结果: ${test3Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // 总结
    console.log('====== 测试结果总结 ======');
    const allPass = test1Pass && test2Pass && test3Pass;
    console.log(`测试1 (初始状态): ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`测试2 (使用中): ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`测试3 (释放后): ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\n总体结果: ${allPass ? '✅ 所有测试通过！' : '❌ 有测试失败'}`);

  } catch (error) {
    console.error('❌ 测试出错:', error.response?.data || error.message);
  }
}

runTests();
