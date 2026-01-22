const CookieService = require('../services/CookieService');
const CookieModel = require('../models/CookieModel');
const logger = require('../config/logger');

class CookieController {
  /**
   * 导入Cookie
   * POST /api/cookies/import
   */
  static async importCookies(req, res) {
    try {
      const { cookies } = req.body;

      if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({
          code: 400,
          message: '请提供cookies数组',
          data: null
        });
      }

      const result = await CookieService.importCookies(cookies);

      res.json({
        code: 200,
        message: '导入成功',
        data: result
      });
    } catch (error) {
      logger.error(`导入Cookie错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 获取随机未使用的Cookie
   * GET /api/cookies/random
   */
  static async getRandomCookie(req, res) {
    try {
      const cookie = await CookieService.getRandomUnusedCookie();

      res.json({
        code: 200,
        message: '获取成功',
        data: cookie
      });
    } catch (error) {
      logger.error(`获取随机Cookie错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 验证Cookie
   * POST /api/cookies/:id/validate
   */
  static async validateCookie(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          code: 400,
          message: 'Cookie ID不能为空',
          data: null
        });
      }

      const result = await CookieService.validateCookie(parseInt(id));

      res.json({
        code: 200,
        message: '验证完成',
        data: result
      });
    } catch (error) {
      logger.error(`验证Cookie错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 批量验证Cookie
   * POST /api/cookies/validate/batch
   */
   static async batchValidateCookies(req, res) {
     try {
       const { ids } = req.body;

       // 验证输入 - ids是可选的，但如果提供了必须是数组
       if (ids !== undefined && !Array.isArray(ids)) {
         return res.status(400).json({
           code: 400,
           message: 'ids必须是数组或不提供',
           data: null
         });
       }

       const results = await CookieService.batchValidateCookies(ids);

      res.json({
        code: 200,
        message: '验证完成',
        data: {
          total: results.length,
          results
        }
      });
    } catch (error) {
      logger.error(`批量验证Cookie错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 释放Cookie
   * POST /api/cookies/:id/release
   */
  static async releaseCookie(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          code: 400,
          message: 'Cookie ID不能为空',
          data: null
        });
      }

      const result = await CookieService.releaseCookie(parseInt(id));

      res.json({
        code: 200,
        message: '释放成功',
        data: result
      });
    } catch (error) {
      logger.error(`释放Cookie错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 获取Cookie列表
   * GET /api/cookies?page=1&pageSize=10&status=0
   */
  static async getCookieList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const status = req.query.status !== undefined ? parseInt(req.query.status) : undefined;
      const ip = req.query.ip;

      const result = await CookieModel.findAll(page, pageSize, { status, ip });

      res.json({
        code: 200,
        message: '获取成功',
        data: result
      });
    } catch (error) {
      logger.error(`获取Cookie列表错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 获取Cookie详情
   * GET /api/cookies/:id
   */
  static async getCookieDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          code: 400,
          message: 'Cookie ID不能为空',
          data: null
        });
      }

      const cookie = await CookieModel.findById(parseInt(id));

      if (!cookie) {
        return res.status(404).json({
          code: 404,
          message: 'Cookie不存在',
          data: null
        });
      }

      res.json({
        code: 200,
        message: '获取成功',
        data: cookie
      });
    } catch (error) {
      logger.error(`获取Cookie详情错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 获取统计信息
   * GET /api/statistics
   */
  static async getStatistics(req, res) {
    try {
      const stats = await CookieService.getStatistics();

      res.json({
        code: 200,
        message: '获取成功',
        data: stats
      });
    } catch (error) {
      logger.error(`获取统计信息错误: ${error.message}`);
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

   /**
    * 添加到黑名单
    * POST /api/cookies/:id/blacklist
    */
   static async addToBlacklist(req, res) {
     try {
       const { id } = req.params;
       const { reason } = req.body;

       if (!id) {
         return res.status(400).json({
           code: 400,
           message: 'Cookie ID不能为空',
           data: null
         });
       }

       const result = await CookieService.addToBlacklist(parseInt(id), reason || '');

       res.json({
         code: 200,
         message: '操作成功',
         data: result
       });
     } catch (error) {
       logger.error(`添加黑名单错误: ${error.message}`);
       res.status(500).json({
         code: 500,
         message: error.message,
         data: null
       });
     }
   }

   /**
    * 编辑Cookie
    * PUT /api/cookies/:id
    */
   static async updateCookie(req, res) {
     try {
       const { id } = req.params;
       const { ip, cookie, validUntil, status } = req.body;

       if (!id) {
         return res.status(400).json({
           code: 400,
           message: 'Cookie ID不能为空',
           data: null
         });
       }

       // 验证必填字段
       if (!cookie || !ip) {
         return res.status(400).json({
           code: 400,
           message: 'Cookie和IP不能为空',
           data: null
         });
       }

       // 验证状态值是否有效
       if (status !== undefined && ![0, 1, 2, 3].includes(parseInt(status))) {
         return res.status(400).json({
           code: 400,
           message: '状态值无效（0:可用, 1:使用中, 2:失效, 3:黑名单）',
           data: null
         });
       }

       const result = await CookieService.updateCookie(parseInt(id), {
         ip,
         cookie,
         validUntil,
         status: status !== undefined ? parseInt(status) : undefined
       });

       if (!result) {
         return res.status(404).json({
           code: 404,
           message: 'Cookie不存在',
           data: null
         });
       }

       res.json({
         code: 200,
         message: '编辑成功',
         data: result
       });
     } catch (error) {
       logger.error(`编辑Cookie错误: ${error.message}`);
       res.status(500).json({
         code: 500,
         message: error.message,
         data: null
       });
     }
   }

   /**
    * 删除Cookie
    * DELETE /api/cookies/:id
    */
   static async deleteCookie(req, res) {
     try {
       const { id } = req.params;

       if (!id) {
         return res.status(400).json({
           code: 400,
           message: 'Cookie ID不能为空',
           data: null
         });
       }

       const result = await CookieService.deleteCookie(parseInt(id));

       if (!result) {
         return res.status(404).json({
           code: 404,
           message: 'Cookie不存在',
           data: null
         });
       }

       res.json({
         code: 200,
         message: '删除成功',
         data: result
       });
      } catch (error) {
        logger.error(`删除Cookie错误: ${error.message}`);
        res.status(500).json({
          code: 500,
          message: error.message,
          data: null
        });
      }
    }
}

module.exports = CookieController;
