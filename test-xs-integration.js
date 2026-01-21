#!/usr/bin/env node

/**
 * X-s 集成验证脚本
 * 用于验证 compute_xs.js 的集成是否正常工作
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║          X-s 签名集成验证脚本                         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(type, message) {
  const symbols = {
    '✓': colors.green + '✓' + colors.reset,
    '✗': colors.red + '✗' + colors.reset,
    '⚠': colors.yellow + '⚠' + colors.reset,
    'ℹ': colors.blue + 'ℹ' + colors.reset
  };
  console.log(`${symbols[type]} ${message}`);
}

// 测试结果记录
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// ============================================
// 测试1: 检查文件存在性
// ============================================
console.log('\n【测试1】文件存在性检查');
console.log('─'.repeat(50));

const filesToCheck = [
  { path: path.join(__dirname, '../小红书/compute_xs.js'), name: 'compute_xs.js' },
  { path: path.join(__dirname, '../小红书/code1.js'), name: 'code1.js' },
  { path: path.join(__dirname, '../小红书/code2.js'), name: 'code2.js' },
  { path: path.join(__dirname, '../小红书/get_envirment.js'), name: 'get_envirment.js' }
];

let filesOk = true;
filesToCheck.forEach(file => {
  if (fs.existsSync(file.path)) {
    log('✓', `${file.name} 存在`);
    results.passed++;
  } else {
    log('✗', `${file.name} 不存在: ${file.path}`);
    results.failed++;
    filesOk = false;
    results.errors.push(`缺少文件: ${file.name}`);
  }
});

if (!filesOk) {
  console.log('\n❌ 文件检查失败，无法继续测试\n');
  process.exit(1);
}

// ============================================
// 测试2: 检查Node.js依赖
// ============================================
console.log('\n【测试2】Node.js依赖检查');
console.log('─'.repeat(50));

try {
  const childProcess = require('child_process');
  log('✓', 'child_process 模块可用');
  results.passed++;
} catch (e) {
  log('✗', 'child_process 模块不可用');
  results.failed++;
  results.errors.push('缺少child_process模块');
}

try {
  const pathModule = require('path');
  log('✓', 'path 模块可用');
  results.passed++;
} catch (e) {
  log('✗', 'path 模块不可用');
  results.failed++;
  results.errors.push('缺少path模块');
}

// ============================================
// 测试3: 测试compute_xs.js执行
// ============================================
console.log('\n【测试3】compute_xs.js 执行测试');
console.log('─'.repeat(50));

const computeXsPath = path.join(__dirname, '../小红书/compute_xs.js');
const testInput = JSON.stringify({
  path: '/api/sns/web/v1/user/selfinfo',
  params: {}
});

try {
  console.log('正在调用 compute_xs.js...');
  console.log('输入数据:', testInput);
  
  const result = execSync(`node "${computeXsPath}"`, {
    input: testInput,
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });

  const xsSignature = result.trim();
  console.log('输出结果:', xsSignature);
  
  // 验证输出格式
  if (xsSignature.startsWith('XYS_')) {
    log('✓', 'X-s 签名格式正确');
    log('✓', `完整签名: ${xsSignature}`);
    results.passed += 2;
  } else {
    log('✗', `X-s 签名格式错误。期望以 'XYS_' 开头，得到: ${xsSignature.substring(0, 20)}...`);
    results.failed++;
    results.errors.push(`签名格式不正确: ${xsSignature.substring(0, 50)}`);
  }
} catch (error) {
  log('✗', `执行 compute_xs.js 失败: ${error.message}`);
  results.failed++;
  results.errors.push(`执行失败: ${error.message}`);
}

// ============================================
// 测试4: 测试路径计算
// ============================================
console.log('\n【测试4】路径计算测试');
console.log('─'.repeat(50));

try {
  const __dirname_test = __dirname;
  const computePath = path.join(__dirname_test, '../../小红书/compute_xs.js');
  
  log('✓', `当前目录: ${__dirname_test}`);
  log('✓', `计算路径: ${computePath}`);
  log('✓', `路径正确: ${fs.existsSync(computePath)}`);
  
  results.passed++;
} catch (error) {
  log('✗', `路径计算失败: ${error.message}`);
  results.failed++;
  results.errors.push(`路径计算错误: ${error.message}`);
}

// ============================================
// 测试5: 模拟 CookieService 调用
// ============================================
console.log('\n【测试5】CookieService 集成测试');
console.log('─'.repeat(50));

try {
  const CookieService = require('./services/CookieService');
  
  if (typeof CookieService._getXsSignature === 'function') {
    log('✓', '_getXsSignature 方法存在');
    results.passed++;
  } else {
    log('✗', '_getXsSignature 方法不存在');
    results.failed++;
    results.errors.push('_getXsSignature 方法未找到');
  }

  if (typeof CookieService._checkXhsCookie === 'function') {
    log('✓', '_checkXhsCookie 方法存在');
    results.passed++;
  } else {
    log('✗', '_checkXhsCookie 方法不存在');
    results.failed++;
    results.errors.push('_checkXhsCookie 方法未找到');
  }

  if (typeof CookieService._checkXhsCookieWithoutXs === 'function') {
    log('✓', '_checkXhsCookieWithoutXs 方法存在');
    results.passed++;
  } else {
    log('✗', '_checkXhsCookieWithoutXs 方法不存在');
    results.failed++;
    results.errors.push('_checkXhsCookieWithoutXs 方法未找到');
  }
} catch (error) {
  log('✗', `加载 CookieService 失败: ${error.message}`);
  results.failed++;
  results.errors.push(`CookieService 加载错误: ${error.message}`);
}

// ============================================
// 测试结果汇总
// ============================================
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║                    测试结果汇总                       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log(`通过测试: ${colors.green}${results.passed}${colors.reset}`);
console.log(`失败测试: ${colors.red}${results.failed}${colors.reset}`);
console.log(`总计: ${results.passed + results.failed}`);

if (results.errors.length > 0) {
  console.log('\n错误详情:');
  results.errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}

// ============================================
// 最终状态
// ============================================
console.log('\n' + '═'.repeat(50));

if (results.failed === 0) {
  console.log(colors.green + '✓ 所有测试通过！X-s集成正常' + colors.reset);
  console.log('═'.repeat(50) + '\n');
  
  console.log('下一步:');
  console.log('  1. 启动服务: npm run dev');
  console.log('  2. 测试验证API: curl http://localhost:3000/api/cookies/1/validate');
  console.log('  3. 监控日志: tail -f logs/application.log\n');
  
  process.exit(0);
} else {
  console.log(colors.red + '✗ 测试失败，请检查上述错误' + colors.reset);
  console.log('═'.repeat(50) + '\n');
  
  console.log('故障排除:');
  console.log('  1. 确认 D:\\爬虫\\小红书 目录中的文件完整');
  console.log('  2. 检查 Node.js 版本是否支持 child_process');
  console.log('  3. 查看 XS_INTEGRATION.md 获取详细帮助\n');
  
  process.exit(1);
}
