const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Multi-Session WhatsApp Admin Routes
router.get('/sessions', whatsappController.getSessions);
router.post('/sessions/create', whatsappController.createSession);
router.post('/sessions/:sessionId/restart', whatsappController.restartSession);
router.post('/sessions/:sessionId/logout', whatsappController.logoutSession);
router.delete('/sessions/:sessionId', whatsappController.deleteSession);
router.post('/sessions/:sessionId/set-active', whatsappController.setActiveSession);
router.post('/test-message', whatsappController.sendTestMessage);

module.exports = router;
