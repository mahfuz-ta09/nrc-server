import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { createUniversity , getAllUniversity , getSingleUniversity , deleteUniversity , editUniversity,getUniOriginName ,getUniversityByCountry,
    createCountryBase,getAllCountryBase,editCountryBase
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


// new shit
  
router.get('/base/all',
    verifyUser,
    getAllCountryBase)

router.post('/base/create',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "countryFlag", maxCount: 1 },
        { name: "famousFile", maxCount: 1 }
    ]),
    createCountryBase)
  

router.patch('/base/edit/:id',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "countryFlag", maxCount: 1 },
        { name: "famousFile", maxCount: 1 }
    ]),
    editCountryBase)
  

export const universityModules = router