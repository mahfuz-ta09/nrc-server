const express = require('express')
const router = express.Router()
const { createUniversity , getAllUniversity , getSingleUniversity , deleteUniversity , editUniversity,getUniOriginName ,getUniversityByCountry} = require('../controllers/university/universityControllers')
const verifyUser = require('../middleware/verifyUser')


// course editorials 
router.get('/all',
    verifyUser,
    getAllUniversity)

router.get('/single/:id', 
    getSingleUniversity)

router.post('/create',  
    verifyUser,
    createUniversity)

router.patch('/update/:id',
    verifyUser,  
    editUniversity)

router.delete('/delete/:id',
    verifyUser, 
    deleteUniversity)

router.get('/uni-area', 
    getUniOriginName)

router.get('/all/:country', 
    getUniversityByCountry)


export const universityModules = router