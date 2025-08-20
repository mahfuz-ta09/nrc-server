import { fileUploadHelper } from "../helper/fileUploadHealper"

const express = require('express')
const router = express.Router()
const { getSubjectOrigin , getSubjectsByCountry , getAllSubjects , getSingleSubjects , createSubject , editSubject , deleteSubjects 
    ,deleteSubject,updateSubject,addSubject,getSubject} = require('../controllers/subject/subjectController')
const verifyUser = require('../middleware/verifyUser')


router.get('/all', 
    getAllSubjects)

router.get('/single/:id', 
    getSingleSubjects)

router.post('/create',  
    verifyUser,
    fileUploadHelper.upload.none(),
    createSubject)

router.patch('/update/:id',  
    verifyUser,
    fileUploadHelper.upload.none(),
    editSubject)

router.delete('/delete/:id', 
    verifyUser,
    deleteSubjects)

router.get('/sub-area', 
    getSubjectOrigin)
    
router.get('/all/:country', 
    getSubjectsByCountry)





router.get('/', 
    getSubject)

router.post('/add/:countryId/:universityName',
    verifyUser,
    addSubject)

router.delete('/remove/:id/:countryID/:countryName', 
    verifyUser,
    deleteSubject)

    
export const subjectModule = router