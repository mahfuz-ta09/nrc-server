const express = require('express')
const router = express.Router()
const { createProceed } = require('../controllers/process/processControllers')

// course editorials 
// router.get('/all', 
//     getAllReview)

// router.get('/single/:id', 
//     getSingleReview)

router.post('/create',  
    createProceed)

// router.patch('/update/:id',  
//     editReview)

// router.delete('/delete/:email', 
//     deleteReview)

// router.get('/partial/:page/:item', 
//     getReviewBypage)


export const precessModule = router