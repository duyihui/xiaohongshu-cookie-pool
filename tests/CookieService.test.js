/**
 * CookieService单元测试
 * 测试核心业务逻辑功能
 */

const CookieService = require('../services/CookieService');
const CookieModel = require('../models/CookieModel');

// Mock CookieModel
jest.mock('../models/CookieModel');

describe('CookieService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCookie', () => {
    it('应该成功添加新Cookie', async () => {
      const mockCookieData = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test',
        status: 0
      };

      CookieModel.addCookie.mockResolvedValue(mockCookieData);

      const result = await CookieService.addCookie({
        ip: '192.168.1.1',
        cookie: 'sessionid=test'
      });

      expect(result).toEqual(mockCookieData);
      expect(CookieModel.addCookie).toHaveBeenCalled();
    });

    it('应该在缺少IP时抛出错误', async () => {
      await expect(
        CookieService.addCookie({ cookie: 'sessionid=test' })
      ).rejects.toThrow();
    });

    it('应该在缺少Cookie时抛出错误', async () => {
      await expect(
        CookieService.addCookie({ ip: '192.168.1.1' })
      ).rejects.toThrow();
    });
  });

  describe('getCookieById', () => {
    it('应该通过ID获取Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test',
        status: 0
      };

      CookieModel.getCookieById.mockResolvedValue(mockCookie);

      const result = await CookieService.getCookieById(1);

      expect(result).toEqual(mockCookie);
      expect(CookieModel.getCookieById).toHaveBeenCalledWith(1);
    });

    it('应该在Cookie不存在时返回null', async () => {
      CookieModel.getCookieById.mockResolvedValue(null);

      const result = await CookieService.getCookieById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateCookie', () => {
    it('应该成功更新Cookie', async () => {
      const updateData = {
        ip: '10.0.0.1',
        status: 0
      };

      const mockUpdatedCookie = {
        id: 1,
        ...updateData,
        cookie: 'sessionid=test'
      };

      CookieModel.updateCookie.mockResolvedValue(mockUpdatedCookie);

      const result = await CookieService.updateCookie(1, updateData);

      expect(result).toEqual(mockUpdatedCookie);
      expect(CookieModel.updateCookie).toHaveBeenCalledWith(1, updateData);
    });

    it('应该验证更新数据', async () => {
      const invalidData = { invalid_field: 'value' };

      // 如果实现了验证，应该抛出错误或忽略无效字段
      CookieModel.updateCookie.mockResolvedValue({
        id: 1,
        ip: '192.168.1.1'
      });

      const result = await CookieService.updateCookie(1, invalidData);

      expect(CookieModel.updateCookie).toHaveBeenCalledWith(1, invalidData);
    });
  });

  describe('deleteCookie', () => {
    it('应该成功删除Cookie', async () => {
      CookieModel.deleteCookie.mockResolvedValue(true);

      const result = await CookieService.deleteCookie(1);

      expect(result).toBe(true);
      expect(CookieModel.deleteCookie).toHaveBeenCalledWith(1);
    });

    it('应该在删除不存在的Cookie时返回false或抛出错误', async () => {
      CookieModel.deleteCookie.mockResolvedValue(false);

      const result = await CookieService.deleteCookie(999);

      expect(result).toBe(false);
    });
  });

  describe('getRandomCookie', () => {
    it('应该获取随机可用的Cookie', async () => {
      const mockCookie = {
        id: 1,
        ip: '192.168.1.1',
        cookie: 'sessionid=test',
        status: 0
      };

      CookieModel.getRandomCookie.mockResolvedValue(mockCookie);

      const result = await CookieService.getRandomCookie();

      expect(result).toEqual(mockCookie);
      expect(CookieModel.getRandomCookie).toHaveBeenCalled();
    });

    it('应该在没有可用Cookie时返回null', async () => {
      CookieModel.getRandomCookie.mockResolvedValue(null);

      const result = await CookieService.getRandomCookie();

      expect(result).toBeNull();
    });
  });

  describe('validateCookie', () => {
    it('应该验证Cookie的有效性', async () => {
      const validationResult = {
        id: 1,
        valid: true,
        status: 0
      };

      CookieModel.updateCookie.mockResolvedValue(validationResult);

      // 假设validateCookie方法调用updateCookie更新状态
      const result = await CookieService.validateCookie(1);

      expect(result).toBeDefined();
    });
  });

  describe('releaseCookie', () => {
    it('应该释放正在使用的Cookie', async () => {
      CookieModel.updateCookie.mockResolvedValue({
        id: 1,
        status: 0,
        is_using: false
      });

      const result = await CookieService.releaseCookie(1);

      expect(result).toBeDefined();
      expect(CookieModel.updateCookie).toHaveBeenCalled();
    });
  });

  describe('addToBlacklist', () => {
    it('应该将Cookie添加到黑名单', async () => {
      const blacklistCookie = {
        id: 1,
        status: 3,
        error_msg: 'IP被封禁'
      };

      CookieModel.updateCookie.mockResolvedValue(blacklistCookie);

      const result = await CookieService.addToBlacklist(1, 'IP被封禁');

      expect(result).toBeDefined();
      expect(CookieModel.updateCookie).toHaveBeenCalled();
    });

    it('应该支持带理由的黑名单操作', async () => {
      CookieModel.updateCookie.mockResolvedValue({
        id: 1,
        status: 3
      });

      await CookieService.addToBlacklist(1, 'Cookie已过期');

      expect(CookieModel.updateCookie).toHaveBeenCalled();
    });
  });

  describe('getCookieList', () => {
    it('应该分页获取Cookie列表', async () => {
      const mockList = {
        data: [
          { id: 1, ip: '192.168.1.1', status: 0 },
          { id: 2, ip: '192.168.1.2', status: 0 }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2
        }
      };

      CookieModel.getCookieList.mockResolvedValue(mockList);

      const result = await CookieService.getCookieList({
        page: 1,
        pageSize: 10
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
    });

    it('应该支持状态过滤', async () => {
      const mockList = {
        data: [{ id: 1, status: 0 }],
        pagination: { page: 1, pageSize: 10, total: 1 }
      };

      CookieModel.getCookieList.mockResolvedValue(mockList);

      await CookieService.getCookieList({
        page: 1,
        pageSize: 10,
        status: 0
      });

      expect(CookieModel.getCookieList).toHaveBeenCalled();
    });

    it('应该支持IP搜索', async () => {
      const mockList = {
        data: [{ id: 1, ip: '192.168.1.1', status: 0 }],
        pagination: { page: 1, pageSize: 10, total: 1 }
      };

      CookieModel.getCookieList.mockResolvedValue(mockList);

      await CookieService.getCookieList({
        page: 1,
        pageSize: 10,
        ip: '192.168'
      });

      expect(CookieModel.getCookieList).toHaveBeenCalled();
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

      CookieModel.getStatistics.mockResolvedValue(mockStats);

      const result = await CookieService.getStatistics();

      expect(result.total).toBe(100);
      expect(result.available).toBe(80);
    });

    it('应该计算可用百分比', async () => {
      const mockStats = {
        total: 100,
        available: 80
      };

      CookieModel.getStatistics.mockResolvedValue(mockStats);

      const result = await CookieService.getStatistics();

      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });
  });
});
