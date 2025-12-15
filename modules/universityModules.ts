const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"
// const { createUniversity , getAllUniversity , getSingleUniversity , editUniversity,getUniOriginName ,getUniversityByCountry,
//         deleteUniversityFromCountry 
//     } = require('../controllers/university/universityControllers')

const { addUniversity , editUniversityField, getUniversity, deleteUniversity } = require('../controllers/university/uniControllers')
 
// router.get('/all',
//     verifyUser,
//     getAllUniversity)

// router.get('/single/:id', 
//     getSingleUniversity)

// router.post('/create',  
//     verifyUser,
//     fileUploadHelper.upload.fields([
//         { name: "file", maxCount: 1 },
//         { name: "flag", maxCount: 1 }
//     ]),
//     createUniversity)

// router.patch('/update/:id',
//     verifyUser,
//     editUniversity)

// router.delete('/delete/:id',
//     verifyUser, 
//     deleteUniversity)

// router.get('/uni-area', 
//     getUniOriginName)

// router.get('/all/:country', 
//     getUniversityByCountry)






    

    
router.post('/add/:id',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "universityImage", maxCount: 1 },
    ]),
    addUniversity)
    
// router.post('/add/:id',
//     verifyUser,
//     fileUploadHelper.upload.fields([
//         { name: "universityImage", maxCount: 1 },
//     ]),
//     addUniversity)


router.patch('/edit/:id/:universityId',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "universityImage", maxCount: 1 },
    ]),
    editUniversityField)


// router.delete('/remove/:id/:university',
//     verifyUser,
//     deleteUniversityFromCountry)


router.delete('/remove/:id/:universityId',
    verifyUser,
    deleteUniversity)


router.get('/', 
    getUniversity)


// router.get('/all/uni/:countryId',
//     verifyUser,
//     getUniversity)
export const universityModules = router