const express = require('express');
const router = express.Router();
const CookieController = require('../controllers/CookieController');

// Cookie管理路由
// 重要：特定路由必须在参数化路由之前定义
router.post('/import', CookieController.importCookies);
router.get('/random', CookieController.getRandomCookie);
router.post('/validate/batch', CookieController.batchValidateCookies);  // 这个必须在 /:id/validate 之前
router.post('/:id/validate', CookieController.validateCookie);
router.post('/:id/release', CookieController.releaseCookie);
router.post('/:id/blacklist', CookieController.addToBlacklist);
router.put('/:id', CookieController.updateCookie);
router.delete('/:id', CookieController.deleteCookie);
router.get('/', CookieController.getCookieList);
router.get('/:id', CookieController.getCookieDetail);

module.exports = router;

