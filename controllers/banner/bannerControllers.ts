import { ObjectId } from "mongodb"
import { Request, Response } from "express"
const { getDb } = require('../../config/connectDB')
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"


export const createBanner = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("banners")
        
        await authChecker(req, res, ["super_admin",'admin'])  
        
        const { serial , title, description, status } = req.body
        const imgFile:any = req.files 
        
        if(!serial || !title  || !description || !status || !imgFile["bannerImg"]){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Missing field is not allowed',
            })
        } 
        
        const uploadRes:any = await fileUploadHelper.uploadToCloud(imgFile["bannerImg"]?.[0]) 
        
        const banner = {
            serial:Number(serial),
            title,
            description,
            imageUrl:{
                url: uploadRes.secure_url,
                public: uploadRes.public_id
            },
            status: status ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } 
        
        const result = await collection.insertOne(banner) 
        
        sendResponse(res, {
          statusCode: 201,
          success: true,
          message: "Banner created successfully",
          data: result,
        })
    } catch (error) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Banner creation failed",
        data: error,
      })
    }
}

export const getAllBanners = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("banners")
        const status = req.params.status

        const filter = {
        ...(status ==='all' ? {} : { status })
        }
        

        const banners = await collection.find(filter).sort({ serial: 1 }).toArray()
        const totalBanner = await collection.countDocuments(filter)
        

        sendResponse(res, {
        statusCode: 200,
        success: true,
        data: banners,
        meta: {
            total: totalBanner
        }
        })
    } catch (error) {
        sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Failed to fetch banners",
        data: error,
        })
    }
}

export const getBannerById = async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const collection = db.collection("banners")
    const { id } = req.params

    const banner = await collection.findOne({ _id: new ObjectId(id) })

    if (!banner) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Banner not found",
        data: null,
      })
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Banner retrieved successfully",
      data: banner,
    })
  } catch (error) {
    sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Failed to fetch banner",
        data: error,
    })
  }
}


export const updateBanner = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("banners")
        
        await authChecker(req, res, ["super_admin",'admin'])
        
        const { id } = req.params  
        const { serial ,title , description, status } = req.body
        

        const query = { _id: new ObjectId(id) } 
        const file:any = req.files
        const exist = await collection.findOne(query)
        
        if(!exist){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No document found",
            })
        }

        let uploadRes:any 
        
        if (file['bannerImg']?.[0]){
            if(exist?.imageUrl?.public)await fileUploadHelper.deleteFromCloud(exist?.imageUrl?.public)
            uploadRes = await fileUploadHelper.uploadToCloud(file['bannerImg']?.[0]) 
        }   


        const updateData = {
            title: title ? title : exist.title,
            serial: serial ? Number(serial) : Number(exist.serial),
            description: description ? description : exist.description,
            status: status ? status : exist.status,
            imageUrl:{
                url : file['bannerImg']?.[0] ? uploadRes.secure_url : exist.imageUrl.url ,
                public : file['bannerImg']?.[0] ? uploadRes.public_id : exist.imageUrl.public 
            },
            updatedAt: new Date(),
            createdAt: exist?.createdAt,
        }
        const result = await collection.updateOne(
            query,
            { $set: updateData }
        )   
        
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Banner updated successfully",
            data: result,
        })
    }catch (error) {
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Failed to update banner",
            data: error,
        })
    }
}


export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("banners")

        await authChecker(req, res, ["super_admin",'admin'])
        const { id } = req.params
        
        if(!id){
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "No id found",
                data: null,
            })
        }
        const query = { _id : new ObjectId(id)}
        const exist = await collection.findOne(query)

        if(!exist){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No document found",
            })
        }
        

        if(exist?.imageUrl?.public) await fileUploadHelper.deleteFromCloud(exist?.imageUrl?.public)
        const result = await collection.deleteOne(query)

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Banner deleted successfully",
            data: result,
        })
    } catch (error) {
        console.log(error)
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Failed to delete banner",
            data: error,
        })
    }
}
