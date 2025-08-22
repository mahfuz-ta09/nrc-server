import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { createAgentRequest , getAllAgentReq , getAllAgents , updateAgentStatus } = require('../controllers/sAdmin/agentControllers')
const verifyUser = require('../middleware/verifyUser')

router.post('/create',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "license_document", maxCount: 1 },
        { name: "background_check", maxCount: 1 },
        { name: "proof_of_address", maxCount: 1 },
        { name: "id_document", maxCount: 1 }
    ]),
    createAgentRequest)

router.get('/request',
    verifyUser,
    getAllAgentReq)

router.get('/all',
    verifyUser,
    getAllAgents)

router.patch('/update/:id/:applicationStat/:docStat',
    verifyUser,
    updateAgentStatus)

export const agentModule = router