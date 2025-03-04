const express = require('express')
const router = express.Router()
const { createAdmin , getAllAdmin , getAllUsers , updateAdminStatus } = require('../controllers/sAdmin/superAdminControllers')
const verifyUser = require('../middleware/verifyUser')


router.post('/create',
    verifyUser,
    createAdmin)

router.get('/admin/all',
    verifyUser,
    getAllAdmin)

router.get('/users/all',
    verifyUser,
    getAllUsers)

router.patch('/update/:id/:status',
    verifyUser,
    updateAdminStatus)

export const superAdminModule = router