const express = require('express')
const router = express.Router()
import { fileUploadHelper } from "../helper/fileUploadHealper"
const verifyUser = require('../middleware/verifyUser')
const { createBlog , getBlogs , getBlogBySlug , updateBlog , deleteBlog , getBlogByCategory , 
    getUniqueBlogCategories,getSingleBlogBySlug} = require('../controllers/blogs/blogsControllers')


router.get("/categories",
    getUniqueBlogCategories)

router.post("/create", 
    verifyUser,
    fileUploadHelper.upload.fields([
        { name: "header_image", maxCount: 1 },
        { name: "content_image", maxCount: 10 },
    ]),
    createBlog)

router.get("/all",
    getBlogs)

router.get("/single/:slug/:status", 
    getBlogBySlug)

router.get("/all-stat/:slug", 
    verifyUser,
    getSingleBlogBySlug)

router.get("/read/:category/:page/:limit", 
    getBlogByCategory)

router.put("/:id",
    verifyUser,
    updateBlog)
    

router.delete("/delete/:id", 
    verifyUser,
    deleteBlog)


export const blogsModule = router