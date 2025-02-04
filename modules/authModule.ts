const express = require('express')
const router = express.Router()
const { logIn , signUp , logOut } = require('../controllers/auth/authControllers')
const multer  = require('multer')
const upload = multer()


router.post('/login', upload.none(),logIn)
router.post('/signup',upload.none(),signUp)
router.get('/logout',upload.none(),logOut)


export const authModule = router