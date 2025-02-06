const express = require('express')
const router = express.Router()
const { createUniversity , getAllUniversity , getSingleUniversity , deleteUniversity , editUniversity } = require('../controllers/university/universityControllers')

// course editorials 
router.get('/all', 
    getAllUniversity)

router.get('/single/:id', 
    getSingleUniversity)

router.post('/create',  
    createUniversity)

router.patch('/update/:id',  
    editUniversity)

router.delete('/delete/:id', 
    deleteUniversity)


export const universityModules = router