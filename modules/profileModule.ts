const express = require('express')
const router = express.Router()
const { getSingleUserById , updateSingleUser} = require('../controllers/profile/profileControllers')


router.get('/:id',getSingleUserById)
router.patch('/update/:id',updateSingleUser)


export const profileModule = router