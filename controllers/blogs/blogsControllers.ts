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

        if(!req.body.title || !req.body.slug || !req.body.content || !req.body.author){
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
        
        
        const blog = {
            title: req.body.title,
            slug: req.body.slug.toLowerCase().replace(/\s+/g, "-"),
            meta:{
                keywords: req.body.tags || [],
                ogTitle: req.body.title || "",
                ogDescription: req.body?.description || "",
                ogImage: { url:'' , publicID:''},
            },
            content: req.body.content || { summary: "", body: "", sections: [] },
            categories: req.body.categories || [],
            tags: req.body.tags || [],

            images: JSON.parse(req.body.urlLists) ,

            author: req.body.author,
            stats: { views: 0, likes: 0, commentsCount: 0 },
            comments: [],
            status: req.body.status || "draft",
            isFeatured: req.body.isFeatured || false,
            publishedAt: req.body.status === "published" ? new Date() : undefined,
            createHistory: {
                date: new Date(),
                email: req?.user?.email,
                id: req?.user?.id,
                role: req?.user?.role,
            },
            updatedAt: [
                { date: new Date(), email: "", id: "", role: "", count: 0 },
            ],
        }

        const imga:any = req.files
        if(imga['header_image']?.[0]){
            const headerImage:any = await fileUploadHelper.uploadToCloud(imga['header_image']?.[0])
            blog.meta.ogImage = {url:headerImage.secure_url, publicID:headerImage.public_id}
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


const getBlogs = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const collection = db.collection("blogs");

    const query: any = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.categories = { $in: [req.query.category] };
    if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === "true";

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projection = {
      slug: 1,
      tags: 1,
      images: 1,
      title: 1,
      author: 1,
      categories: 1,
      stats: 1,
      isFeatured: 1,
      status: 1,
      publishedAt: 1,
      createHistory: 1,
      meta: 1,
    };

    const blogs = await collection
      .find(query)
      .project(projection)
      .sort({ "createHistory.date": -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);
    const totalCount = await collection.countDocuments();

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
    });
  } catch (err) {
    console.error(err);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      data: err,
    });
  }
};



const getBlogBySlug = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("blogs")

        const blog = await collection.findOne({ slug: req.params.slug })

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

        const blogId = new ObjectId(req.params.id)
        const existingBlog = await collection.findOne({ _id: blogId })
        if (!existingBlog) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Blog not found",
                data: null,
            })
        }

        const updateData: any = {}

        if (req.body.title) updateData.title = req.body.title
        if (req.body.slug) updateData.slug = req.body.slug.toLowerCase().replace(/\s+/g, "-")
        if (req.body.meta) updateData.meta = req.body.meta
        if (req.body.content) updateData.content = req.body.content
        if (req.body.categories) updateData.categories = req.body.categories
        if (req.body.tags) updateData.tags = req.body.tags
        if (req.body.featuredImage) updateData.featuredImage = req.body.featuredImage
        if (req.body.author) updateData.author = req.body.author
        if (req.body.status) {
            updateData.status = req.body.status
            if (req.body.status === "published" && !existingBlog.publishedAt) {
                updateData.publishedAt = new Date()
            }
        }

        if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured

        const updateHistory = {
            date: new Date(),
            email: req?.user?.email || "",
            id: req?.user?.id || "",
            role: req?.user?.role || "",
            count: existingBlog.updatedAt?.length
                ? existingBlog.updatedAt.length
                : 0,
        }

        const result = await collection.updateOne(
            { _id: blogId },
            {
                $set: updateData,
                $push: { updatedAt: updateHistory },
            }
        )

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Blog updated successfully",
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
            if(image?.publicID) await fileUploadHelper.deleteFromCloud(image?.publicID);
        }

        if(blog?.meta?.ogImage?.publicID){
            await fileUploadHelper.deleteFromCloud(blog.meta.ogImage.publicID);
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



module.exports = {
    createBlog,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    getBlogs
}