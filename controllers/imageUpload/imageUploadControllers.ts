import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import authChecker from "../../helper/authChecker"
import { fileUploadHelper } from "../../helper/fileUploadHealper"

interface AuthenticatedRequest extends Request {
    user?: any
}
const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        authChecker(req,res,["super_admin","admin"])

        const allImage:any = req.files
        const images = []
        
        if(!allImage || allImage.length === 0){
            return sendResponse(res, { 
                message: "No image provided",
                statusCode: 400,
                success: false,
                data: null
             })
        }

        for (let i = 0; i < allImage.length; i++) {
            const file = allImage[i];
            const fileObj:any = await fileUploadHelper.uploadToCloud(file)
            
            images.push({url:fileObj?.secure_url, publicID:fileObj?.public_id})
        }

        if(images.length === 0){
            return sendResponse(res, { 
                message: "Image upload failed",
                statusCode: 400,
                success: false,
                data: null
             })
        }
        
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Image uploaded successfully!!!",
            data: images,
        })
    } catch (error) {
        console.error("Error uploading image:", error)
        sendResponse(res, { 
            message: "Internal Server Error",
            statusCode: 400,
            success: false,
            data: error
         })
    }   
}

module.exports = { 
    uploadImage
}