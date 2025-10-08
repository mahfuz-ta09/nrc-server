import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { createCountryBase,getAllCountryBase,editCountryBase,deleteCountryBase,getAllCountryBaseName} = require('../controllers/countryBase/countryBaseControllers')
const verifyUser = require('../middleware/verifyUser')



router.get('/base/all',
    verifyUser,
    getAllCountryBase)

router.get('/base/country',
    verifyUser,
    getAllCountryBaseName)

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