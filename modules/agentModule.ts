const express = require('express')
const router = express.Router()
const { createAgentRequest , getAllAgentReq , getAllAgents , updateAgentStatus } = require('../controllers/sAdmin/agentControllers')


router.post('/create',createAgentRequest)
router.get('/request',getAllAgentReq)
router.get('/all',getAllAgents)
router.patch('/update/:id/:status',updateAgentStatus)

export const agentModule = router