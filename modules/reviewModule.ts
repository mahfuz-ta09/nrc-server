const express = require('express')
const router = express.Router()
const { getAllReview  , createReview , deleteReview , getReviewByPage } = require('../controllers/review/reviewControllers')


router.get('/all', 
    getAllReview)

router.patch('/create',  
    createReview)

router.patch('/delete/:id', 
    deleteReview)

router.get('/partial/:page/:item', 
    getReviewByPage)


export const reviewModules = router