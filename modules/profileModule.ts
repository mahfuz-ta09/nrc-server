import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { getSingleUserById , updateSingleUser , emailContact} = require('../controllers/profile/profileControllers')
const verifyUser = require('../middleware/verifyUser')

router.get('/:email',
    verifyUser,
    getSingleUserById)

router.patch('/update/:id',
    verifyUser,
    fileUploadHelper.upload.single('file'),
    updateSingleUser)

    
router.post('/email-contact',
        verifyUser,
        emailContact)

export const profileModule = router