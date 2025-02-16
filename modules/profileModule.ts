const express = require('express')
const router = express.Router()
const { getSingleUserById , updateSingleUser} = require('../controllers/profile/profileControllers')
const verifyUser = require('../middleware/verifyUser')


router.get('/:id',verifyUser,getSingleUserById)
router.patch('/update/:id',verifyUser,updateSingleUser)


export const profileModule = router