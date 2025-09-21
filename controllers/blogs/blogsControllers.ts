import { ObjectId } from "mongodb"
import { Request, Response } from "express"
import authChecker from "../../helper/authChecker"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')

interface AuthenticatedRequest extends Request {
    user?: any
}

const createBlog = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")

        await authChecker(req,res,["super_admin","admin"])

        console.log("req.body.content: ",JSON.parse(req.body.content).body)
        console.log(req.files)
        if( !req.body.title || !req.body.slug || !req.body.content || !req.body.author 
            || !req.body.categories || !req.body.meta_title || !req.body.meta_description || !req.body.meta_keywords){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'Title, slug, content and author are required',
            })
        }

        const existingBlog = await collection.findOne({ slug: req.body.slug.toLowerCase().replace(/\s+/g, "-") })
        if (existingBlog) {
            return sendResponse(res, { 
                message: "Blog with this slug already exists",
                statusCode: 400,
                success: false,
                data: null
             })
        }
        
        const normalizeToArray = (val: any): string[] => {
            if (!val) return []
            if (Array.isArray(val)) return val
            return [val]
        }

        const categories = normalizeToArray(req.body.categories)
        const tags = normalizeToArray(req.body.tags)
        const meta_keywords = normalizeToArray(req.body.meta_keywords)
        const blog = {
            title: req.body.title,
            slug: req.body.slug.toLowerCase().replace(/\s+/g, "-"),
            description: req.body.description || "",
            
            author: req.body.author,
            status: req.body.status || "draft",
            isFeatured: req.body.isFeatured ==='true',
            
            categories: categories || [],
            tags: tags || [],

            meta:{
                keywords: meta_keywords || [],
                ogTitle: req.body.meta_title || "",
                ogDescription: req.body?.meta_description || "",
                ogImage: { url:'' , publicID:''},
            },

            content: req.body.content || { summary: "", body: "" , section:  []},

            images: req?.body?.images || [], 
            featuredImage: req.body.featuredImage || { url: "", publicID: "" },
            
            stats: { views: 0, likes: 0, commentsCount: 0 },
            comments: [],
            
            publishedAt: req.body.status === "published" ? new Date() : undefined,
            
            createHistory: {
                date: new Date(),
                email: req?.user?.email,
                id: req?.user?.id,
                role: req?.user?.role,
            },
            updatedAt: [
                { date: new Date(), email: "", id: "", role: "" },
            ],
        }

        const imga:any = req.files
        
        if(imga['header_image']?.[0]){
            const headerImage:any = await fileUploadHelper.uploadToCloud(imga['header_image']?.[0])
            blog.meta.ogImage = {url:headerImage.secure_url, publicID:headerImage.public_id}
        }
        
        const content = JSON.parse(req.body.content)
        let body = content.body
        let uploadedUrls: { url: string, publicID: string }[] = []

        if (imga['content_image']?.length > 0) {
            for (let i = 0; i < imga['content_image'].length; i++) {
                const uploaded: any = await fileUploadHelper.uploadToCloud(imga['content_image'][i])
                uploadedUrls.push({ url: uploaded.secure_url, publicID: uploaded.public_id })
                body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url)
            }

            blog.images = uploadedUrls
 

            blog.content = {
                summary: content.summary || "",
                body,
                section: content.sections || []
            }
        }

        const result = await collection.insertOne(blog)
        if(!result.insertedId){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'You have finished processing. Update or delete to process again!!',
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Proceeded successfully!!!",
            data: result,
        })
    } catch (err) {
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}


const getUniqueBlogCategories = async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const collection = db.collection("blogs")

    const blogs = await collection.find({ status: "published" }, { projection: { categories: 1 } }).toArray()

    let allCategories: string[] = []
    for (const blog of blogs) {
      if (blog.categories) {
        try {
            allCategories.push(...blog.categories)
        } catch (e) {
          console.error("Invalid categories JSON:", blog.categories)
        }
      }
    }

    const uniqueCategories = [...new Set(allCategories)]

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: uniqueCategories,
    })
  } catch (err) {
    console.log(err)
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Internal server error",
      data: err,
    })
  }
}
const getBlogByCategory = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const category = req.params.category
        let query: any = { status: "published" }

        if (category && category !== "all") {
            query.categories = { $regex: category, $options: "i" }
        }

        const blogs = await collection
        .find(query, {
            projection: {
            content: 0,
            images: 0,
            featuredImage: 0,
            status: 0,
            stats: 0,
            comments: 0,
            },
        }).skip(skip).limit(limit).toArray()

        const total = await collection.countDocuments(query)
        const totalCount = await collection.countDocuments({ status: "published" })

        sendResponse(res, {
        statusCode: 200,
        success: true,
        data: blogs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalCount,
        },
        })
    } catch (err) {
        console.log(err)
        sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Internal server error",
        data: err,
        })
    }
}


const getBlogs = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")

        const query: any = {}

        if (req.query.status) query.status = req.query.status
        if (req.query.category) query.categories = { $in: [req.query.category] }
        if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === "true"

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const projection = {
            slug: 1,
            tags: 1,
            title: 1,
            author: 1,
            categories: 1,
            stats: 1,
            isFeatured: 1,
            status: 1,
            publishedAt: 1,
            createHistory: 1,
            meta: 1,
        }

        const blogs = await collection
        .find(query)
        .project(projection)
        .sort({ "createHistory.date": -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

        const total = await collection.countDocuments(query)
        const totalCount = await collection.countDocuments()

        sendResponse(res, {
        message: "Blogs fetched successfully",
        statusCode: 200,
        success: true,
        data: blogs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalCount,
        },
        })
    } catch (err) {
        console.error(err)
        sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Internal server error",
        data: err,
        })
    }
}


// client request only
const getBlogBySlug = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")

        const query = { 
            slug: req.params.slug ,
            status : req.params.status
        }
        
        if(!req.params.slug || !req.params.status || req.params.status != 'published'){
            return sendResponse(res,{
                message: "Blog slug&status is required",
                statusCode: 400,
                success: false,
            }) 
        }
        
        const blog = await collection.findOne(query, { projection: {images:0,isFeatured:0,status:0,updatedAt:0} })
        

        if (!blog){
            return sendResponse(res,{
                message: "Blog not found",
                statusCode: 404,
                success: false,
            }) 
        }


        await collection.updateOne(
            { _id: blog._id },
            { $inc: { "stats.views": 1 } }
        )

        sendResponse(res,{
            statusCode: 200,
            success: true,
            data: blog
        })
    } catch (err) {
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}
const getSingleBlogBySlug = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")
        await authChecker(req,res,['super_admin','admin'])

        const query = { slug: req.params.slug }
        if(!req.params.slug){
            return sendResponse(res,{
                message: "Blog slug&status is required",
                statusCode: 400,
                success: false,
            }) 
        }
        
        const blog = await collection.findOne(query)
        

        if (!blog){
            return sendResponse(res,{
                message: "Blog not found",
                statusCode: 404,
                success: false,
            }) 
        }


        await collection.updateOne(
            { _id: blog._id },
            { $inc: { "stats.views": 1 } }
        )

        sendResponse(res,{
            statusCode: 200,
            success: true,
            data: blog
        })
    } catch (err) {
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}


const updateBlog = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")

        await authChecker(req, res, ["super_admin", "admin"])

        const { id } = req.params
        if (!ObjectId.isValid(id)) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Invalid blog ID",
        })
        }

        const blog = await collection.findOne({ _id: new ObjectId(id) })
        if (!blog) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Blog not found",
        })
        }

        const normalizeToArray = (val: any): string[] => {
            if (!val) return []
            if (Array.isArray(val)) return val
            return [val]
        }

        const updatedBlog: any = { ...blog }
        console.log('category',req.body.categories,blog.categories)
        console.log('tags',req.body.tags,blog.tags)
        console.log('meta_keywords',req.body.meta_keywords,blog.meta_keywords)
        console.log('isFeatured',req.body.isFeatured,blog.isFeatured)
        console.log(req.body.title)
        updatedBlog.title = req.body.title || blog.title
        updatedBlog.slug = req.body.slug?.toLowerCase().replace(/\s+/g, "-") || blog.slug
        updatedBlog.description = req.body.description || blog.description
        updatedBlog.author = req.body.author || blog.author
        updatedBlog.status = req.body.status || blog.status
        updatedBlog.isFeatured = req.body.isFeatured !== ''
            ? req.body.isFeatured === "true"
            : blog.isFeatured

        updatedBlog.categories = req.body.categories !== ''
            ? normalizeToArray(req.body.categories)
            : blog.categories

        updatedBlog.tags = req.body.tags !== ''
            ? normalizeToArray(req.body.tags)
            : blog.tags

        updatedBlog.meta = {
            keywords:req.body.meta_keywords !== ''
                ? normalizeToArray(req.body.meta_keywords)
                : blog.meta.keywords,
            ogTitle: req.body.meta_title || blog.meta.ogTitle,
            ogDescription: req.body.meta_description || blog.meta.ogDescription,
            ogImage: blog.meta.ogImage,
        }

        const imga: any = req.files

        if (imga?.["header_image"]?.[0]) {
            if (blog.meta.ogImage?.publicID) {
                await fileUploadHelper.deleteFromCloud(blog.meta.ogImage.publicID)
            }
            const headerImage: any = await fileUploadHelper.uploadToCloud(
                imga["header_image"][0]
            )
            updatedBlog.meta.ogImage = {
                url: headerImage.secure_url,
                publicID: headerImage.public_id,
            }
        }

        if (req.body.content) {
            const newContent = JSON.parse(req.body.content)

            if (newContent.body && newContent.body !== blog.content.body) {
                if (Array.isArray(blog.images) && blog.images.length > 0) {
                    for (const img of blog.images) {
                        if (img.publicID) {
                            await fileUploadHelper.deleteFromCloud(img.publicID)
                        }
                    }
                }

                let body = newContent.body
                const uploadedUrls: { url: string; publicID: string }[] = []

                if (imga?.["content_image"]?.length > 0) {
                    for (let i = 0; i < imga["content_image"].length; i++) {
                            const uploaded: any = await fileUploadHelper.uploadToCloud(
                            imga["content_image"][i]
                        )
                        uploadedUrls.push({
                            url: uploaded.secure_url,
                            publicID: uploaded.public_id,
                        })
                        body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url)
                    }
                    }

                    updatedBlog.images = uploadedUrls
                    updatedBlog.content = {
                    summary: newContent.summary || "",
                    body,
                    section: newContent.sections || [],
                }
            }
        }

        updatedBlog.updatedAt = [
            ...(blog.updatedAt || []),
            {
                date: new Date(),
                email: req?.user?.email || "",
                id: req?.user?.id || "",
                role: req?.user?.role || "",
            },
        ]

        
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedBlog }
        )

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Blog updated successfully",
            data: result,
        })
    } catch (err) {
        console.log(err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err,
        })
    }
}

const deleteBlog = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")
        await authChecker(req,res,["super_admin","admin"])

        if(!req.params.id){
            return sendResponse(res,{
                message: "Blog ID is required",
                statusCode: 400,
                success: false,
            }) 
        }

        const query = { _id: new ObjectId(req.params.id) }

        const blog = await collection.findOne(query)

        if (!blog){
            return sendResponse(res,{
                message: "Blog not found",
                statusCode: 404,
                success: false,
            }) 
        }

        for(let image of blog?.images || []){
            if(image?.publicID) await fileUploadHelper.deleteFromCloud(image?.publicID)
        }

        if(blog?.meta?.ogImage?.publicID){
            await fileUploadHelper.deleteFromCloud(blog.meta.ogImage.publicID)
        }
        const result = await collection.deleteOne(query)
        if (result.deletedCount === 0){
            return sendResponse(res,{
                message: "Blog not found",
                statusCode: 404,
                success: false,
            }) 
        }
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Blog deleted'
        })
    } catch (err) {
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}
const getAllBlogSlug = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("blogs");

        console.log("from get all blog slug object")

        const slugs = await collection
        .find({ status: 'published' }, { projection: { slug: 1, _id: 0 } })
        .toArray();
        

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "All slugs retrieved",
            data: slugs,
        });
    } catch (err) {
        sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Internal server error",
        data: err,
        });
    }
};

module.exports = {
    createBlog,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    getBlogByCategory,
    getSingleBlogBySlug,
    getUniqueBlogCategories,
    getBlogs,
    getAllBlogSlug
}