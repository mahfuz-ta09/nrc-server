const express = require('express')
const router = express.Router()
const { logIn , signUp } = require('../controllers/auth/authControllers')
const multer  = require('multer')
const upload = multer()



router.post('/login', upload.none(),logIn)
router.post('/signup',upload.none(),signUp)


export const authModule = router