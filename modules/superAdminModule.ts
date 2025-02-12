const express = require('express')
const router = express.Router()
const { createAdmin , getAllAdmin , getAllUsers , updateAdminStatus } = require('../controllers/sAdmin/superAdminControllers')


router.post('/create',createAdmin)
router.get('/admin/all',getAllAdmin)
router.get('/users/all',getAllUsers)
router.patch('/update/:id/:status',updateAdminStatus)

export const superAdminModule = router