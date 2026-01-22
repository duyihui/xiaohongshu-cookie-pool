/**
 * API 客户端
 * 负责与后端API通信
 */

class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * 发送HTTP请求
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, {
                ...defaultOptions,
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * GET请求
     */
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

     /**
      * POST请求
      */
     post(endpoint, body = {}) {
         return this.request(endpoint, {
             method: 'POST',
             body: JSON.stringify(body),
         });
     }

     /**
      * PUT请求
      */
     put(endpoint, body = {}) {
         return this.request(endpoint, {
             method: 'PUT',
             body: JSON.stringify(body),
         });
     }

     /**
      * DELETE请求
      */
     delete(endpoint, body = {}) {
         return this.request(endpoint, {
             method: 'DELETE',
             body: JSON.stringify(body),
         });
     }

    /**
     * 获取统计信息
     */
    getStatistics() {
        return this.get('/statistics');
    }

    /**
     * 获取Cookie列表
     */
    getCookies(page = 1, pageSize = 10, status = '', ip = '') {
        return this.get('/cookies', {
            page,
            pageSize,
            ...(status && { status }),
            ...(ip && { ip }),
        });
    }

    /**
     * 获取单个Cookie详情
     */
    getCookieDetail(id) {
        return this.get(`/cookies/${id}`);
    }

    /**
     * 导入Cookie
     */
    importCookies(cookies) {
        return this.post('/cookies/import', { cookies });
    }

    /**
     * 获取随机Cookie
     */
    getRandomCookie() {
        return this.get('/cookies/random');
    }

    /**
     * 验证单个Cookie
     */
    validateCookie(id) {
        return this.post(`/cookies/${id}/validate`);
    }

    /**
     * 批量验证Cookie
     */
    batchValidateCookies(ids) {
        return this.post('/cookies/validate/batch', { ids });
    }

    /**
     * 释放Cookie
     */
    releaseCookie(id) {
        return this.post(`/cookies/${id}/release`);
    }

    /**
     * 添加到黑名单
     */
    blacklistCookie(id, reason = '') {
        return this.post(`/cookies/${id}/blacklist`, { reason });
    }

     /**
      * 批量添加黑名单
      */
     batchBlacklistCookies(ids, reason = '') {
         return this.post('/cookies/blacklist/batch', { ids, reason });
     }

     /**
      * 更新Cookie
      */
     updateCookie(id, updateData) {
         return this.put(`/cookies/${id}`, updateData);
     }

     /**
      * 删除Cookie
      */
     deleteCookie(id) {
         return this.delete(`/cookies/${id}`);
     }

     /**
      * 检查服务器健康状态
      */
     healthCheck() {
         return this.request('/health', { method: 'GET' });
     }
}

// 创建全局API客户端实例
const api = new ApiClient('/api');
