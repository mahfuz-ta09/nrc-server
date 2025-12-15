const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"
const { getCountryBySlug, createCountryBase,getAllCountryBase,
    editCountryBase,deleteCountryBase,countryBaseCollectionName} = require('../controllers/countryBase/countryBaseControllers')



router.get('/base/all',
    verifyUser,
    getAllCountryBase)

router.get('/base/country',
    verifyUser,
    countryBaseCollectionName)

router.get('/unique/:slug',
    getCountryBySlug)

// router.get('/unique/:slug',
//     countryBaseCollectionName)

router.post('/base/create',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "countryFlag", maxCount: 1 },
        { name: "famousFile", maxCount: 1 },
        { name: "content_image", maxCount: 10 },
    ]),
    createCountryBase)


router.patch('/base/edit/:id',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "countryFlag", maxCount: 1 },
        { name: "famousFile", maxCount: 1 },
        { name: "content_image", maxCount: 10 },
    ]),
    editCountryBase)
  

router.delete('/base/delete/:id',  
    verifyUser,
    deleteCountryBase)
  


export const countryBaseModule = router