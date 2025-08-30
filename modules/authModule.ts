const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
const { logIn , signUp , logOut , getAccessToken , successResponse , resetPassword } = require('../controllers/auth/authControllers')
const multer  = require('multer')
const upload = multer()



router.post('/verify',successResponse)
router.post('/login', upload.none(),logIn)
router.post('/signup',upload.none(),signUp)

router.post('/logout',
    verifyUser,
    upload.none(),logOut)
    
router.post('/access-token',upload.none(),getAccessToken)
router.post('/reset',upload.none(),resetPassword)


export const authModule = router