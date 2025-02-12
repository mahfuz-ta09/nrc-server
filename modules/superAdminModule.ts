const express = require('express')
const router = express.Router()
const { createAdmin } = require('../controllers/sAdmin/superAdminControllers')


router.post('/signup',createAdmin)


export const superAdminModule = router