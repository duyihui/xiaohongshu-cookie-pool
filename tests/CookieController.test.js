/**
 * CookieController单元测试
 * 测试API端点的请求处理
 */

const CookieController = require('../controllers/CookieController');
const CookieService = require('../services/CookieService');

// Mock CookieService
jest.mock('../services/CookieService');

describe('CookieController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request和response对象
    req = {
      params: {},
      body: {},
      query: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getCookies', () => {
    it('应该返回Cookie列表', async () => {
      const mockCookies = {
        data: [{ id: 1, ip: '192.168.1.1', status: 0 }],
        pagination: { page: 1, pageSize: 10, total: 1 }
      };

      CookieService.getCookieList.mockResolvedValue(mockCookies);
      req.query = { page: 1, pageSize: 10 };

      await CookieController.getCookies(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.any(String)
        })
      );
    });

    it('应该处理查询参数', async () => {
      const mockCookies = {
        data: [{ id: 1, status: 0 }],
        pagination: { page: 1, pageSize: 10, total: 1 }
      };

      CookieService.getCookieList.mockResolvedValue(mockCookies);
      req.query = { page: 2, pageSize: 20, status: 0, ip: '192.168' };

      await CookieController.getCookies(req, res);

      expect(CookieService.getCookieList).toHaveBeenCalled();
    });

    it('应该在错误时返回500状态', async () => {
      CookieService.getCookieList.mockRejectedValue(new Error('数据库错误'));
      req.query = { page: 1, pageSize: 10 };

      await CookieController.getCookies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCookieById', () => {
    it('应该返回指定ID的Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test'
      };

      CookieService.getCookieById.mockResolvedValue(mockCookie);
      req.params = { id: 1 };

      await CookieController.getCookieById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          data: mockCookie
        })
      );
    });

    it('应该在Cookie不存在时返回404', async () => {
      CookieService.getCookieById.mockResolvedValue(null);
      req.params = { id: 999 };

      await CookieController.getCookieById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('应该在无效ID时返回400', async () => {
      req.params = { id: 'invalid' };

      await CookieController.getCookieById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addCookie', () => {
    it('应该成功添加新Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test'
      };

      CookieService.addCookie.mockResolvedValue(mockCookie);
      req.body = {
        ip: '192.168.1.1',
        cookie: 'sessionid=test'
      };

      await CookieController.addCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          data: mockCookie
        })
      );
    });

    it('应该验证必填字段', async () => {
      req.body = { ip: '192.168.1.1' };

      await CookieController.addCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateCookie', () => {
    it('应该成功更新Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '10.0.0.1',
        cookie: 'sessionid=updated',
        status: 0
      };

      CookieService.updateCookie.mockResolvedValue(mockCookie);
      req.params = { id: 1 };
      req.body = {
        ip: '10.0.0.1',
        cookie: 'sessionid=updated',
        status: 0
      };

      await CookieController.updateCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.stringContaining('编辑')
        })
      );
    });

    it('应该在无效ID时返回400', async () => {
      req.params = { id: 'invalid' };
      req.body = { status: 0 };

      await CookieController.updateCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该在Cookie不存在时返回404', async () => {
      CookieService.updateCookie.mockRejectedValue(
        new Error('Cookie不存在')
      );
      req.params = { id: 999 };
      req.body = { status: 0 };

      await CookieController.updateCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteCookie', () => {
    it('应该成功删除Cookie', async () => {
      CookieService.deleteCookie.mockResolvedValue(true);
      req.params = { id: 1 };

      await CookieController.deleteCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.stringContaining('删除')
        })
      );
    });

    it('应该在无效ID时返回400', async () => {
      req.params = { id: 'invalid' };

      await CookieController.deleteCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该在Cookie不存在时返回404', async () => {
      CookieService.deleteCookie.mockResolvedValue(false);
      req.params = { id: 999 };

      await CookieController.deleteCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validateCookie', () => {
    it('应该验证Cookie', async () => {
      const validationResult = {
        valid: true,
        ip: '192.168.1.1'
      };

      CookieService.validateCookie.mockResolvedValue(validationResult);
      req.params = { id: 1 };

      await CookieController.validateCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.stringContaining('验证')
        })
      );
    });
  });

  describe('releaseCookie', () => {
    it('应该释放Cookie', async () => {
      CookieService.releaseCookie.mockResolvedValue({
        id: 1,
        is_using: false
      });
      req.params = { id: 1 };

      await CookieController.releaseCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.stringContaining('释放')
        })
      );
    });
  });

  describe('addToBlacklist', () => {
    it('应该将Cookie添加到黑名单', async () => {
      CookieService.addToBlacklist.mockResolvedValue({
        id: 1,
        status: 3
      });
      req.params = { id: 1 };
      req.body = { reason: 'IP被封禁' };

      await CookieController.addToBlacklist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          message: expect.stringContaining('成功')
        })
      );
    });

    it('应该在无效ID时返回400', async () => {
      req.params = { id: 'invalid' };
      req.body = { reason: 'test' };

      await CookieController.addToBlacklist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRandomCookie', () => {
    it('应该返回随机Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test'
      };

      CookieService.getRandomCookie.mockResolvedValue(mockCookie);

      await CookieController.getRandomCookie(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          data: mockCookie
        })
      );
    });

    it('应该在无可用Cookie时返回404', async () => {
      CookieService.getRandomCookie.mockResolvedValue(null);

      await CookieController.getRandomCookie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getStatistics', () => {
    it('应该返回统计信息', async () => {
      const mockStats = {
        total: 100,
        available: 80,
        using: 5,
        invalid: 10,
        blacklist: 5
      };

      CookieService.getStatistics.mockResolvedValue(mockStats);

      await CookieController.getStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          data: mockStats
        })
      );
    });
  });
});
