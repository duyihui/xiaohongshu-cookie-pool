const express = require('express');
const router = express.Router();
const MonitorController = require('../controllers/MonitorController');

router.get('/status', MonitorController.getPoolStatus);
router.post('/health-check', MonitorController.performHealthCheck);
router.get('/alerts', MonitorController.getAlerts);
router.post('/alerts/:id/resolve', MonitorController.resolveAlert);
router.get('/export', MonitorController.exportMonitoringData);

module.exports = router;
