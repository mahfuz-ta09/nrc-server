const express = require('express')
const router = express.Router()
const { getSingleUserById , updateSingleUser , emailContact} = require('../controllers/profile/profileControllers')
const verifyUser = require('../middleware/verifyUser')


router.get('/:id',verifyUser,getSingleUserById)
router.patch('/update/:id',verifyUser,updateSingleUser)
router.post('/email-contact',verifyUser,emailContact)



export const profileModule = router