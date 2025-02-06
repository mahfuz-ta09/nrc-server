const express = require('express')
const router = express.Router()
const { getAllSubject , getSingleSubject , createSubject , editSubject , deleteSubject } = require('../controllers/subject/subjectControllers')


// course editorials 
router.get('/all', 
    getAllSubject)

router.get('/single/:id', 
    getSingleSubject)

router.post('/create',  
    createSubject)

router.patch('/update/:id',  
    editSubject)

router.delete('/delete/:id', 
    deleteSubject)


export const subjectModule = router