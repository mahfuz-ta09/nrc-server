import { fileUploadHelper } from "../helper/fileUploadHealper"

const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
const { uploadImage } = require('../controllers/imageUpload/imageUploadControllers')

router.post("/upload", 
    verifyUser,
    fileUploadHelper.upload.array("images", 5),
    uploadImage)

export const fileUploader = router