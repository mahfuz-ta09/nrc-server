const express = require('express')
const router = express.Router()
import { fileUploadHelper } from "../helper/fileUploadHealper"
const verifyUser = require('../middleware/verifyUser')
const { getAllData , createProceed , editProcessData , 
    deleteProcessData , getSingleData } = require('../controllers/process/processControllers')
import { getStudentFileState, postStudentFile, getCondisionedFiles } from "../controllers/process/studentFileControllers"

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
        { name: "proficiencyCirtificate", maxCount: 1 },
        { name: "ssc", maxCount: 1 },
        { name: "hsc", maxCount: 1 },
        { name: "bachelor", maxCount: 1 },
        { name: "master", maxCount: 1 },
        { name: "other", maxCount: 1 }
    ]),
    createProceed)

router.patch('/update/:id',
    verifyUser, 
    editProcessData)

router.delete('/delete/:id', 
    verifyUser,
    deleteProcessData)




// these routes below will be handled by super admin/admin/agent/sub/agents

router.post('/file',  
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "files", maxCount: 25 },
    ]),
    postStudentFile)

router.get('/stat',  
    verifyUser,
    getStudentFileState)

router.get('/get-all',  
    verifyUser,
    getCondisionedFiles)


export const precessModule = router