import { ObjectId } from "mongodb"
import { Request, Response } from "express"
import authChecker from "../../helper/authChecker"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import { format } from "date-fns"
const { getDb } = require('../../config/connectDB')

interface AuthenticatedRequest extends Request {
    user?: any
}

const createBlog = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const blogsCollection = db.collection("blogs")
        const affiliatCollection = db.collection("affiliated-uni")

        await authChecker(req, res, ["super_admin", "admin"])

        const {
            title,slug,content, categories,tags,
            status,meta_title,meta_description,meta_keywords,
        } = req.body

        if (!title || !slug || !content || !categories || 
            !meta_title ||!meta_description || !meta_keywords) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "some empty field is not allowed",
            })
        }

        const query = { slug: slug }

        const [existingBlog, existingAffi] = await Promise.all([
            blogsCollection.findOne(query),
            affiliatCollection.findOne(query),
        ])

        if (existingBlog || existingAffi) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "A document with this slug already exists.",
            })
        }

        const normalizeToArray = (val: any): string[] => {
            if (!val) return []
            return Array.isArray(val) ? val : [val]
            }

        const normalizedCategories = normalizeToArray(categories)
        const normalizedTags = normalizeToArray(tags)
        const normalizedKeywords = normalizeToArray(meta_keywords)

        const blog: any = {
            type: "blog",
            title,
            slug: slug,
            status: status || "draft",

            categories: normalizedCategories,
            tags: normalizedTags,
            
            meta: {
                keywords: normalizedKeywords,
                ogTitle: meta_title || "",
                ogDescription: meta_description || "",
                ogImage: { url: "", publicID: "" },
            },

            content: content,
            bodyImages: [],
            featuredImage: { url: "", publicID: "" },
            stats: { views: 0, likes: 0, commentsCount: 0 },
            comments: [],
            publishedAt: status === "published" ? format(new Date(), "MM/dd/yyyy") : undefined,
            createHistory: {
                date: format(new Date(), "MM/dd/yyyy"),
                email: req?.user?.email,
                id: req?.user?.id,
                role: req?.user?.role,
            },
            updatedAt: [],
        }


        
        const files: any = req.files || {} 
        const uploadPromises: Promise<any>[] = []

        if (files["header_image"]?.[0]) {
            uploadPromises.push(fileUploadHelper.uploadToCloud(files["header_image"][0]))
        } else {
            uploadPromises.push(Promise.resolve(null))
        }

        if (files["content_image"]?.length > 0) {
            uploadPromises.push(Promise.all(files["content_image"].map((file: any) => fileUploadHelper.uploadToCloud(file))))
        } else {
            uploadPromises.push(Promise.resolve([]))
        }

        console.log(content)
        const [headerImage, contentUploads] = await Promise.all(uploadPromises)
        
        
        if (headerImage) {
            blog.meta.ogImage = {
                url: headerImage.secure_url,
                publicID: headerImage.public_id,
            }
        }

        let htmlDoc: any = ""
        try {
            htmlDoc = JSON.parse(content)
        } catch {}

        
        if (contentUploads.length > 0) {
            let updatedBody = htmlDoc

            contentUploads.forEach((uploaded: any, index: number) => {
                updatedBody = updatedBody.replace(`__IMAGE_${index}__`, uploaded.secure_url)
                blog.bodyImages.push({ url: uploaded.secure_url, publicID: uploaded.public_id })
            })

            blog.content = updatedBody
        }
        
        const result = await blogsCollection.insertOne(blog)

        if (!result.insertedId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to insert blog document.",
            })
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Blog created successfully.",
            data: result,
        })
    } catch (err) {
        console.error("createBlog error:", err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err,
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
            bodyImages: 0,
            featuredImage: 0,
            status: 0,
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
            stat:1,
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
        
        const blog = await collection.findOne(query, { projection: {bodyImages:0,isFeatured:0,status:0,updatedAt:0} })
        

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
        const db = getDb();
        const collection = db.collection("blogs");
        const affiliatCollection = db.collection("affiliated-uni");

        await authChecker(req, res, ["super_admin", "admin"]);

        const {title,slug,status,meta_title,meta_keywords,meta_description,tags,categories,content} = req.body;

        let parsedContent: any = {};
        try {
            parsedContent = content ? JSON.parse(content) : {};
        } catch {}

        const isEmpty = (val: any): boolean => {
            if (val == null) return true;
            if (typeof val === "string") return val.trim().length === 0;
            if (Array.isArray(val)) return val.length === 0;
            if (typeof val === "object") return Object.keys(val).length === 0;
            if (typeof val === "boolean") return !val;
            return false;
        };

        const imga: any = req.files;

        if (isEmpty(title) &&isEmpty(slug) &&isEmpty(status) &&isEmpty(meta_title) &&isEmpty(meta_keywords) &&
            isEmpty(meta_description) &&isEmpty(tags) &&isEmpty(categories) &&isEmpty(parsedContent) &&isEmpty(imga?.["header_image"]?.[0]) &&isEmpty(imga?.["content_image"]?.[0])) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "All fields are empty, nothing to update",
            }); 
        }

        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid blog ID",
            });
        }

        const blog = await collection.findOne({ _id: new ObjectId(id) });
        if (!blog) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Blog not found",
            });
        }

        if (slug) {
            const query = { slug };
            const [existingBlog, existingAffi] = await Promise.all([
                collection.findOne(query),
                affiliatCollection.findOne(query),
            ]);

            if ((existingBlog && existingBlog._id.toString() !== id) ||
                existingAffi) {
                return sendResponse(res, {
                    statusCode: 400,
                    success: false,
                    message: "A document with this slug already exists.",
                });
            }
        }

        const normalizeToArray = (val: any): string[] => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return [val];
        };

        const updatedDoc: any = {
            title: title || blog.title,
            slug: slug || blog.slug,
            status: status || blog.status,
            meta: {
                keywords: meta_keywords ? normalizeToArray(meta_keywords) : blog?.meta?.keywords,
                ogTitle: meta_title || blog?.meta?.ogTitle,
                ogDescription: meta_description || blog?.meta?.ogDescription,
                ogImage: blog?.meta?.ogImage,
            },
            categories: categories || blog.categories,
            tags: tags || blog.tags,
            stats: blog?.stats,
            createHistory: blog?.createHistory,
            comments: blog.comments,
            updatedAt: [
                ...(blog?.updatedAt || []),
                {
                date: new Date(),
                email: req?.user?.email || "",
                id: req?.user?.id || "",
                role: req?.user?.role || "",
                },
            ],
            content: parsedContent || blog?.content,
            publishedAt: status === "published" ? format(new Date(), "MM/dd/yyyy") : blog?.publishedAt,
            bodyImages: blog?.bodyImages,
        };

        
        if (imga?.["header_image"]?.[0]) {
            if (blog.meta?.ogImage?.publicID) {
                await fileUploadHelper.deleteFromCloud(blog.meta.ogImage.publicID);
            }
            const headerImage: any = await fileUploadHelper.uploadToCloud(
                imga["header_image"][0]
            );
            updatedDoc.meta.ogImage = {
                url: headerImage.secure_url,
                publicID: headerImage.public_id,
            };
        }

        if (content) {
            let body = parsedContent;
            const uploadedUrls: { url: string; publicID: string }[] = [];

            if (Array.isArray(blog.bodyImages) && blog.bodyImages.length > 0) {
                for (const img of blog.bodyImages) {
                    if (img.publicID) await fileUploadHelper.deleteFromCloud(img.publicID);
                }
            }

            if (imga?.["content_image"]?.length > 0) {
                for (let i = 0; i < imga["content_image"].length; i++) {
                    const uploaded: any = await fileUploadHelper.uploadToCloud(
                        imga["content_image"][i]
                    );
                    uploadedUrls.push({
                        url: uploaded.secure_url,
                        publicID: uploaded.public_id,
                    });
                    body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url);
                }
            }

            updatedDoc.bodyImages = uploadedUrls;
            updatedDoc.content = body;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedDoc }
        );

        if (!result?.modifiedCount) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No changes were made to the blog.",
                data: result,
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Blog updated successfully",
            data: result,
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

        for(let image of blog?.bodyImages || []){
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
                data: result
            }) 
        }
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Blog deleted',
            data: result
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
}

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