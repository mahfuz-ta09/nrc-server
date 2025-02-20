const express = require('express')
const router = express.Router()
const { logIn , signUp , logOut , getAccessToken , successResponse} = require('../controllers/auth/authControllers')
const multer  = require('multer')
const upload = multer()


router.post('/verify',successResponse)
router.post('/login', upload.none(),logIn)
router.post('/signup',upload.none(),signUp)
router.post('/logout',upload.none(),logOut)
router.post('/access-token',upload.none(),getAccessToken)


export const authModule = router