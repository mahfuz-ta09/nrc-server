import { fileUploadHelper } from "../helper/fileUploadHealper"

const express = require('express')
const router = express.Router()
const { getAllData , createProceed , editProcessData , deleteProcessData , getSingleData } = require('../controllers/process/processControllers')
const verifyUser = require('../middleware/verifyUser')

// course editorials 
router.get('/all',
    verifyUser,
    getAllData)


router.get('/single/:id',
    verifyUser,
    getSingleData)

router.post('/create',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "en_result", maxCount: 1 },
        { name: "ssc_result", maxCount: 1 },
        { name: "hsc_result", maxCount: 1 },
        { name: "bachelor_result", maxCount: 1 },
        { name: "masters_result", maxCount: 1 },
        { name: "other_result", maxCount: 1 }
    ]),
    createProceed)

// router.post('/file',  
//     verifyUser,
//     fileUploadHelper.upload.fields([
//         { name: "en_result", maxCount: 1 },
//         { name: "ssc_result", maxCount: 1 },
//         { name: "hsc_result", maxCount: 1 },
//         { name: "bachelor_result", maxCount: 1 },
//         { name: "masters_result", maxCount: 1 },
//         { name: "other_result", maxCount: 1 }
//     ]),
//     post)

router.patch('/update/:id',
    verifyUser, 
    editProcessData)

router.delete('/delete/:id', 
    verifyUser,
    deleteProcessData)


export const precessModule = router