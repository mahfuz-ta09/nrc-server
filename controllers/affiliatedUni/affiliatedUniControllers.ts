import { format } from "date-fns"
import authChecker from "../../helper/authChecker"
const { getDb } = require('../../config/connectDB')
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import { Request, Response } from "express"
import { ObjectId } from "mongodb"


interface AuthenticatedRequest extends Request {
    user?: any
}

export const createAffiliatedUni = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        const blogsCollection = db.collection("blogs")
        await authChecker(req, res, ["super_admin", "admin"])

        const {
            name,
            slug,
            location,
            content,
            status,
            meta_title,
            meta_description,
            meta_keywords,
            } = req.body

            if (!name || !slug || !location || !meta_title) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Some required fields are missing.",
            })
        }

        const query = { $or: [{ slug }, { name }] }
        const [existingUni, existingBlog] = await Promise.all([
            collection.findOne(query),
            blogsCollection.findOne(query),
        ])

        if (existingUni || existingBlog) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "A document with the same name or slug already exists.",
            })
        }

        const affiliatedUni: any = {
            type: "affiliated",
            name,
            slug,
            location,
            content,
            status,
            meta_title,
            meta_description,
            meta_keywords,
            bodyImages: [],
            logo: { url: "", publicID: "" },
            header_image: { url: "", publicID: "" },
            creationHistory: {
                date: format(new Date(), "MM/dd/yyyy"),
                email: req?.user?.email,
                id: req?.user?.id,
                role: req?.user?.role,
            },
            updateHistory: [],
            stats: { views: 0, likes: 0, commentsCount: 0 },
            comments: [],
        }

        const files: any = req.files || {}

        
        if (files["header_image"]?.[0]) {
            const headerImage:any = await fileUploadHelper.uploadToCloud(files["header_image"][0])
            affiliatedUni.header_image = {
                url: headerImage.secure_url,
                publicID: headerImage.public_id,
            }
        }

        if (files["logo"]?.[0]) {
            const logo:any = await fileUploadHelper.uploadToCloud(files["logo"][0])
            affiliatedUni.logo = {
                url: logo.secure_url,
                publicID: logo.public_id,
            }
        }

        
        let body = content
        try {
            body = JSON.parse(content)
        } catch {
            
        }

        if (files["content_image"]?.length > 0) {
            const uploadedUrls: { url: string; publicID: string }[] = []
            for (let i = 0; i < files["content_image"].length; i++) {
                const uploaded:any = await fileUploadHelper.uploadToCloud(files["content_image"][i])
                uploadedUrls.push({ url: uploaded.secure_url, publicID: uploaded.public_id })
                body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url)
            }
            affiliatedUni.bodyImages = uploadedUrls
            affiliatedUni.content = body
        }

        
        const insertResult = await collection.insertOne(affiliatedUni)

        if (!insertResult?.insertedId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to insert document",
            })
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Document inserted successfully",
            data: insertResult,
        })
    } catch (err) {
        console.error("createAffiliatedUni error:", err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err,
        })
    }
}


const getAllAffiliationDashboard = async(req: AuthenticatedRequest, res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        await authChecker(req,res ,['super_admin','admin'])
        
        const query: any = {}

        if (req.query.status) query.status = req.query.status
        if (req.query.category) query.categories = { $in: [req.query.category] }
        if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === "true"

        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit

        const documents = await collection
        .find(query)
        .sort({ "createHistory.date": -1 })
        .skip(skip)
        .limit(limit)
        .toArray()

        const total = await collection.countDocuments(query)
        const totalCount = await collection.countDocuments()

        if(!documents.length){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'no data founded!',
            })
        }
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!',
            data: documents,
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
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}

const deleteAffiliatedUni = async(req: AuthenticatedRequest , res: Response) =>{
    try{
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        await authChecker(req,res,['super_admin','admin'])
        
        const id = req.params.id
        if(!id){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'id missing'
            })    
        }

        const query = { _id: new ObjectId(id)}
        const document = await collection.findOne(query)
        
        if(!document){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'no university found!'
            })    
        }

        if(document?.logo){
            await fileUploadHelper.deleteFromCloud(document?.logo?.publicID)
        }

        if(document?.header_image){
            await fileUploadHelper.deleteFromCloud(document?.header_image?.publicID)
        }

        if(document?.images?.length){
            for(let image of document?.bodyImages || []){
                await fileUploadHelper.deleteFromCloud(image?.publicID)
            }
        }

        const result = await collection.deleteOne(query)
        if(!result.deletedCount){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'cant delete the document'
            })    
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'deleted successfully',
            data: result
        })
    }catch(err){
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}

const updateAffiliatedUni = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        await authChecker(req, res, ["super_admin", "admin"])

        for (const key in req.body) {
            if (req.body[key] === "undefined" || req.body[key] === "null") {
                req.body[key] = ""
            }
        }

        const id = req.params.id
            if (!id) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "id missing",
            })
        }

        const query = { _id: new ObjectId(id) }
        const document = await collection.findOne(query)

        if (!document) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "no affiliated university found!",
            })
        }

        const {
            name, slug,location, content,
            status, meta_title, meta_description, meta_keywords
        } = req.body

        const isEmpty = (val: any): boolean => {
            if (val == null) return true
            if (typeof val === "string") return val.trim().length === 0
            if (Array.isArray(val)) return val.length === 0
            if (typeof val === "object") return Object.keys(val).length === 0
            if (typeof val === "boolean") return !val
            return false
        }

        if (isEmpty(name) && isEmpty(slug) && isEmpty(location) &&
            isEmpty(meta_title) && isEmpty(meta_description) &&
            isEmpty(content) &&
            isEmpty(status) && isEmpty(meta_keywords) &&
            isEmpty(req.files)) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "nothing to update",
            })
        }

        const updatedDocument: any = {
            name: name || document?.name,
            slug: slug || document?.slug,
            location: location || document?.location,
            content: document.content,
            status: status || document?.status,
            meta_title: meta_title || document?.meta_title,
            meta_description: meta_description || document?.meta_description,
            meta_keywords: meta_keywords || document?.meta_keywords,
            bodyImages: document?.bodyImages || [],
            logo: document?.logo,
            header_image: document?.header_image,
            creationHistory: document?.creationHistory,
            updateHistory: [
                ...(document?.updateHistory || []),
                {
                date: format(new Date(), "MM/dd/yyyy"),
                email: req?.user?.email,
                id: req?.user?.id,
                role: req?.user?.role,
                },
            ],
            stats: document?.stats,
            comments: document?.comments,
        }

        const image: any = req?.files || {}

        
        if (image?.["logo"]?.[0]) {
            if (document?.logo?.publicID) {
                await fileUploadHelper.deleteFromCloud(document.logo.publicID)
            }
            const doc: any = await fileUploadHelper.uploadToCloud(image["logo"][0])
            updatedDocument.logo = { url: doc.secure_url, publicID: doc.public_id }
        }
        
        if (image?.["header_image"]?.[0]) {
            if (document?.header_image?.publicID) {
                await fileUploadHelper.deleteFromCloud(document.header_image.publicID)
            }
            const doc: any = await fileUploadHelper.uploadToCloud(image["header_image"][0])
            updatedDocument.header_image = { url: doc.secure_url, publicID: doc.public_id }
        }

        
        if (content) {
            let body
            try {
                body = JSON.parse(content)
            } catch {
                body = content
            }

            for (const item of updatedDocument.bodyImages) {
                if (item?.publicID) {
                await fileUploadHelper.deleteFromCloud(item.publicID)
                }
            }

            updatedDocument.content = body
            const uploadedUrls: { url: string; publicID: string }[] = []

            if (image?.["content_image"]?.length > 0) {
                for (let i = 0; i < image["content_image"].length; i++) {
                const uploaded: any = await fileUploadHelper.uploadToCloud(image["content_image"][i])
                uploadedUrls.push({ url: uploaded.secure_url, publicID: uploaded.public_id })
                body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url)
                }
                updatedDocument.bodyImages = uploadedUrls
                updatedDocument.content = body
            }
        }
        

        const result = await collection.updateOne(query, { $set: updatedDocument })

        if (!result.modifiedCount) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "failed to update the document",
                data: result,
            })
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "document updated successfully",
            data: result,
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

const getAllAffiliatedUni = async (req: AuthenticatedRequest, res: Response) =>{
    try{
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        
        const projection = {
            slug: 1,
            name: 1,
            header_image: { url: 1 },
            location: 1,
            description: 1,
        }

        const documents = await collection
        .find({}, { projection })
        .sort({ "createHistory.date": -1 })
        .toArray()

        if(!documents.length){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'no data founded!',
            })
        }
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!',
            data: documents,
        })

    }catch(err){
        console.log(err)
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}

const getAffiliationUniBySlug = async(req: AuthenticatedRequest, res: Response) =>{
    try{
        const db = getDb()
        const collection = db.collection("affiliated-uni")
        
        const slug = req.params.slug
        const query = { slug: slug }

        const document = await collection.findOne(query)
        
        if(!document){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'no data founded!',
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!',
            data: document,
        })
    }catch(err){
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
    createAffiliatedUni,
    getAllAffiliationDashboard,
    deleteAffiliatedUni,
    updateAffiliatedUni,
    getAllAffiliatedUni,
    getAffiliationUniBySlug
}