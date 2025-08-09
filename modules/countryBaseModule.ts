import { fileUploadHelper } from "../helper/fileUploadHealper"
const express = require('express')
const router = express.Router()
const { createCountryBase,getAllCountryBase,editCountryBase,deleteCountryBase} = require('../controllers/countryBase/countryBaseControllers')
const verifyUser = require('../middleware/verifyUser')



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
  

router.delete('/base/delete/:id',  
    verifyUser,
    deleteCountryBase)
  

export const countryBaseModule = router