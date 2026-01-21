/**
 * 小红书Cookie池 - 使用示例
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 创建HTTP客户端
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

/**
 * 示例1: 导入Cookie
 */
async function exampleImportCookies() {
  console.log('\n=== 示例1: 导入Cookie ===');
  
  try {
    const response = await client.post('/cookies/import', {
      cookies: [
        {
          ip: '192.168.1.1',
          cookie: 'sessionid=test_cookie_1; path=/; domain=.xiaohongshu.com',
          validUntil: '2024-02-20T10:00:00Z'
        },
        {
          ip: '192.168.1.2',
          cookie: 'sessionid=test_cookie_2; path=/; domain=.xiaohongshu.com'
        },
        {
          ip: '192.168.1.3',
          cookie: 'sessionid=test_cookie_3; path=/; domain=.xiaohongshu.com'
        }
      ]
    });

    console.log('导入结果:', response.data);
  } catch (error) {
    console.error('导入失败:', error.response?.data || error.message);
  }
}

/**
 * 示例2: 获取随机Cookie
 */
async function exampleGetRandomCookie() {
  console.log('\n=== 示例2: 获取随机Cookie ===');
  
  try {
    const response = await client.get('/cookies/random');
    console.log('获取的Cookie:', response.data.data);
    
    // 保存Cookie ID供后续释放使用
    return response.data.data.id;
  } catch (error) {
    console.error('获取失败:', error.response?.data || error.message);
  }
}

/**
 * 示例3: 验证Cookie
 */
async function exampleValidateCookie(cookieId) {
  console.log('\n=== 示例3: 验证Cookie ===');
  
  try {
    const response = await client.post(`/cookies/${cookieId}/validate`);
    console.log('验证结果:', response.data.data);
  } catch (error) {
    console.error('验证失败:', error.response?.data || error.message);
  }
}

/**
 * 示例4: 获取Cookie列表
 */
async function exampleGetCookieList() {
  console.log('\n=== 示例4: 获取Cookie列表 ===');
  
  try {
    const response = await client.get('/cookies', {
      params: {
        page: 1,
        pageSize: 10,
        status: 0 // 只获取可用的
      }
    });

    console.log('Cookie列表:');
    console.log(`- 总数: ${response.data.data.pagination.total}`);
    console.log(`- 当前页: ${response.data.data.pagination.page}`);
    console.log(`- 每页数: ${response.data.data.pagination.pageSize}`);
    console.log(`- 返回数: ${response.data.data.data.length}`);
  } catch (error) {
    console.error('获取列表失败:', error.response?.data || error.message);
  }
}

/**
 * 示例5: 获取统计信息
 */
async function exampleGetStatistics() {
  console.log('\n=== 示例5: 获取统计信息 ===');
  
  try {
    const response = await client.get('/statistics');
    const stats = response.data.data;
    
    console.log('池统计信息:');
    console.log(`- 总数: ${stats.total}`);
    console.log(`- 可用: ${stats.available}`);
    console.log(`- 使用中: ${stats.using}`);
    console.log(`- 已失效: ${stats.invalid}`);
    console.log(`- 黑名单: ${stats.blacklist}`);
    console.log(`- 总使用次数: ${stats.totalUseCount}`);
    console.log(`- 平均使用次数: ${stats.avgUseCount}`);
  } catch (error) {
    console.error('获取统计失败:', error.response?.data || error.message);
  }
}

/**
 * 示例6: 释放Cookie
 */
async function exampleReleaseCookie(cookieId) {
  console.log('\n=== 示例6: 释放Cookie ===');
  
  try {
    const response = await client.post(`/cookies/${cookieId}/release`);
    console.log('释放结果:', response.data.data);
  } catch (error) {
    console.error('释放失败:', error.response?.data || error.message);
  }
}

/**
 * 示例7: 批量验证Cookie
 */
async function exampleBatchValidate() {
  console.log('\n=== 示例7: 批量验证Cookie ===');
  
  try {
    const response = await client.post('/cookies/validate/batch', {
      ids: [1, 2, 3]
    });

    console.log('批量验证结果:');
    console.log(`- 总数: ${response.data.data.total}`);
    console.log(`- 有效: ${response.data.data.results.filter(r => r.valid).length}`);
    console.log(`- 失效: ${response.data.data.results.filter(r => !r.valid).length}`);
  } catch (error) {
    console.error('批量验证失败:', error.response?.data || error.message);
  }
}

/**
 * 示例8: 监控 - 获取池状态
 */
async function exampleGetPoolStatus() {
  console.log('\n=== 示例8: 获取池状态 ===');
  
  try {
    const response = await client.get('/monitor/status');
    const status = response.data.data;
    
    console.log('池状态:');
    console.log(`- 健康状况: ${status.health}`);
    console.log(`- 使用率: ${status.utilizationRate}`);
    console.log(`- 可用率: ${status.availabilityRate}`);
    console.log(`- 告警数: ${status.alerts}`);
  } catch (error) {
    console.error('获取状态失败:', error.response?.data || error.message);
  }
}

/**
 * 示例9: 监控 - 执行健康检查
 */
async function exampleHealthCheck() {
  console.log('\n=== 示例9: 执行健康检查 ===');
  
  try {
    const response = await client.post('/monitor/health-check');
    console.log(response.data.data.report);
  } catch (error) {
    console.error('健康检查失败:', error.response?.data || error.message);
  }
}

/**
 * 示例10: 获取告警列表
 */
async function exampleGetAlerts() {
  console.log('\n=== 示例10: 获取告警列表 ===');
  
  try {
    const response = await client.get('/monitor/alerts');
    
    console.log(`未处理告警数: ${response.data.data.total}`);
    if (response.data.data.alerts.length > 0) {
      response.data.data.alerts.slice(0, 5).forEach(alert => {
        console.log(`- [${alert.type}] ${alert.message} (级别: ${alert.level})`);
      });
    }
  } catch (error) {
    console.error('获取告警失败:', error.response?.data || error.message);
  }
}

/**
 * 完整工作流示例
 */
async function completeWorkflow() {
  console.log('\n\n=====================================');
  console.log('   小红书Cookie池 - 完整工作流示例');
  console.log('=====================================');

  try {
    // 1. 导入Cookie
    await exampleImportCookies();
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. 获取统计信息
    await exampleGetStatistics();
    
    // 3. 获取随机Cookie
    const cookieId = await exampleGetRandomCookie();
    
    // 4. 验证Cookie
    if (cookieId) {
      await exampleValidateCookie(cookieId);
    }
    
    // 5. 获取列表
    await exampleGetCookieList();
    
    // 6. 释放Cookie
    if (cookieId) {
      await exampleReleaseCookie(cookieId);
    }
    
    // 7. 监控
    await exampleGetPoolStatus();
    await exampleHealthCheck();
    await exampleGetAlerts();

  } catch (error) {
    console.error('工作流出错:', error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  completeWorkflow().then(() => {
    console.log('\n示例执行完毕！');
    process.exit(0);
  });
}

module.exports = {
  exampleImportCookies,
  exampleGetRandomCookie,
  exampleValidateCookie,
  exampleGetCookieList,
  exampleGetStatistics,
  exampleReleaseCookie,
  exampleBatchValidate,
  exampleGetPoolStatus,
  exampleHealthCheck,
  exampleGetAlerts,
  completeWorkflow
};
