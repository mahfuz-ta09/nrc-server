const express = require('express')
const router = express.Router()
const { getAllData , createProceed , editProcessData , deleteProcessData , getSingleData } = require('../controllers/process/processControllers')

// course editorials 
router.get('/all', 
    getAllData)

router.get('/single/:id', 
    getSingleData)

router.post('/create',  
    createProceed)

router.patch('/update/:id',  
    editProcessData)

router.delete('/delete/:email', 
    deleteProcessData)

// router.get('/partial/:page/:item', 
//     getReviewBypage)


export const precessModule = router