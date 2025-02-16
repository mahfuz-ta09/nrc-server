const express = require('express')
const router = express.Router()
const { createAgentRequest , getAllAgentReq , getAllAgents , updateAgentStatus } = require('../controllers/sAdmin/agentControllers')
const verifyUser = require('../middleware/verifyUser')

router.post('/create',createAgentRequest)
router.get('/request',
    verifyUser,
    getAllAgentReq)
router.get('/all',
    verifyUser,
    getAllAgents)
router.patch('/update/:id/:status',
    verifyUser,
    updateAgentStatus)

export const agentModule = router