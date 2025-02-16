const express = require('express')
const router = express.Router()
const { getAllSubject , getSingleSubject , createSubject , editSubject , deleteSubject } = require('../controllers/subject/subjectControllers')
const verifyUser = require('../middleware/verifyUser')

// course editorials 
router.get('/all', 
    getAllSubject)

router.get('/single/:id', 
    getSingleSubject)

router.post('/create',  
    verifyUser,
    createSubject)

router.patch('/update/:id',  
    verifyUser,
    editSubject)

router.delete('/delete/:id', 
    verifyUser,
    deleteSubject)


export const subjectModule = router