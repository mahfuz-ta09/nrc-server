const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"
const { uploadImage } = require('../controllers/imageUpload/imageUploadControllers')

router.post("/upload", 
    verifyUser,
    fileUploadHelper.upload.array("images", 10),
    uploadImage)

export const fileUploader = router