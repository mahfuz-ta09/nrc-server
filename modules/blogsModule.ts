const express = require('express')
const router = express.Router()
import { fileUploadHelper } from "../helper/fileUploadHealper"
const verifyUser = require('../middleware/verifyUser')
const { createBlog , getBlogs , getBlogBySlug , updateBlog , deleteBlog} = require('../controllers/blogs/blogsControllers')


router.post("/create", 
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "header_image", maxCount: 1 },
    ]),
    createBlog)

router.get("/all",
    getBlogs)

router.get("/:slug", 
    getBlogBySlug)

router.put("/:id",
    verifyUser,
    updateBlog)
    

router.delete("/delete/:id", 
    verifyUser,
    deleteBlog)


export const blogsModule = router