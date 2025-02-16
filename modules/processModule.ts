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
    createProceed)

router.patch('/update/:id',
    verifyUser, 
    editProcessData)

router.delete('/delete/:id', 
    verifyUser,
    deleteProcessData)


// router.get('/partial/:page/:item', 
//     getReviewBypage)


export const precessModule = router