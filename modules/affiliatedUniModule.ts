const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"
const { createAffiliatedUni, getAllBlogsDashboard, deleteAffiliatedUni, updateAffiliatedUni } = require('../controllers/affiliatedUni/affiliatedUniControllers')


router.post('/create',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "header_image", maxCount: 1 },
        { name: "logo", maxCount: 1 },
        { name: "content_image", maxCount: 10 },
    ]),
    createAffiliatedUni)

router.patch('/update/:id',
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "header_image", maxCount: 1 },
        { name: "logo", maxCount: 1 },
        { name: "content_image", maxCount: 10 },
    ]),
    updateAffiliatedUni)

router.get('/get-all',
    verifyUser,
    getAllBlogsDashboard)


router.delete('/remove-one/:id',
    verifyUser,
    deleteAffiliatedUni)

export const affiliatedUniModule = router