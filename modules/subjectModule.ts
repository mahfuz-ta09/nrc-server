

const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"
const { getSubjectOrigin , getSubjectsByCountry , getAllSubjects , getSingleSubjects , createSubject , editSubject 
    ,updateSubject } = require('../controllers/subject/subjectController')
 const { getSubject , addSubject, deleteSubject } = require('../controllers/subject/subjectsControllers')


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

router.get('/sub-area', 
    getSubjectOrigin)
    
router.get('/all/:country', 
    getSubjectsByCountry)






// new part 
router.get('/', 
    getSubject)

router.post('/add/:countryId/:universityId/:universityName',
    verifyUser,
    addSubject)

router.delete('/remove/:countryId/:universityId/:subjectId', 
    verifyUser,
    deleteSubject)

export const subjectModule = router