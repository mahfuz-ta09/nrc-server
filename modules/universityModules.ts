import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { createUniversity , getAllUniversity , getSingleUniversity , deleteUniversity , editUniversity,getUniOriginName ,getUniversityByCountry,
    addUniversity , deleteUniversityFromCountry , getUniversity , editUniversityField
} = require('../controllers/university/universityControllers')
const verifyUser = require('../middleware/verifyUser')


router.get('/all',
    verifyUser,
    getAllUniversity)

router.get('/single/:id', 
    getSingleUniversity)

router.post('/create',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "file", maxCount: 1 },
        { name: "flag", maxCount: 1 }
    ]),
    createUniversity)

router.patch('/update/:id',
    verifyUser,
    editUniversity)

router.delete('/delete/:id',
    verifyUser, 
    deleteUniversity)

router.get('/uni-area', 
    getUniOriginName)

router.get('/all/:country', 
    getUniversityByCountry)







    
router.post('/add/:id',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "universityImage", maxCount: 1 },
    ]),
    addUniversity)


router.patch('/edit/:id/:universityName',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "universityImage", maxCount: 1 },
    ]),
    editUniversityField)


router.delete('/remove/:id/:university',
    verifyUser,
    deleteUniversityFromCountry)


router.get('/', 
    getUniversity)



export const universityModules = router