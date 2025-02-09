const express = require('express')
const router = express.Router()
const { getAllReview , getSingleReview , createReview , editReview , deleteReview , getReviewBypage } = require('../controllers/review/reviewControllers')

// course editorials 
router.get('/all', 
    getAllReview)

router.get('/single/:id', 
    getSingleReview)

router.post('/create',  
    createReview)

router.patch('/update/:id',  
    editReview)

router.delete('/delete/:id', 
    deleteReview)

router.get('/partial/:page/:item', 
    getReviewBypage)


export const reviewModules = router