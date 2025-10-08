import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"
import { format } from "date-fns"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

const getAllCountryBaseName= async( req:AuthenticatedRequest, res:Response) => {
        try {
            const db = getDb();
            const collection = db.collection("country-uni");
        
            const countryBase = await collection.find({},{projection: {country : 1}}).toArray()
            const countBaseCount = await collection.countDocuments()
            
            if (countryBase.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No Country found",
                })
            }

            const metaData = {
                page: 0,
                limit: 0,
                total: countBaseCount,
            }
            res.status(200).json({
                success: true,
                message: "Country retrieved successfully",
                data: countryBase,
                meta: metaData
            })
        }catch(error){
            console.error("Error fetching universities:", error)
            res.status(400).json({
                success: false,
                message: "Internal Server Error",
                error,
            })
        }
}

const getAllCountryBase = async( req:AuthenticatedRequest, res:Response) => {
        try {
        const db = getDb();
        const collection = db.collection("country-uni");
        
        
        const countryBase = await collection.find({},{projection: {universityList : 0,famousFile_Id:0,countryFlag_Id:0}}).sort({serial: 1}).toArray()
        const countBaseCount = await collection.countDocuments()
        
        
        if (countryBase.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No Country found",
            })
        }

        const metaData = {
            page: 0,
            limit: 0,
            total: countBaseCount,
        }
        res.status(200).json({
            success: true,
            message: "Country retrieved successfully",
            data: countryBase,
            meta: metaData
        })
    } catch (error) {
        console.error("Error fetching universities:", error)
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        })
    }
}


const editCountryBase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection('country-uni')
        await authChecker(req,res,["admin","super_admin"])

        const id = req.params.id
        const { country, serial, slug , currency , content } = req.body
        const files: any = req.files


        if (!country && !serial && !slug && !files["countryFlag"]?.[0] && !files["famousFile"]?.[0] && !currency && !content) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'nothing to update',
            });
        }

        const exist = await collection.findOne({
            $or: [
                { country: country?.toLowerCase() },
                { slug : slug }
            ]
        })
        
        if(exist ){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'a document already exist with this name',
            })
        }

    
        const query = { _id: new ObjectId(id) };
        const countryObj = await collection.findOne(query)

        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'No country exists with the given id!!!',
            });
        }

        let uploadedFlag: any = null
        let uploadedFamous: any = null

        if (files["countryFlag"]?.[0]) {
            uploadedFlag = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0]);
            await fileUploadHelper.deleteFromCloud(countryObj.countryFlg?.publicId);
        }

        
        if (files["famousFile"]?.[0]) {
            uploadedFamous = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0]);
            await fileUploadHelper.deleteFromCloud(countryObj?.famousFile?.publicId);
        }


        const insertedObject = {
            country: country ? country.toLowerCase() : countryObj.country,
            slug: slug ? slug.toLowerCase() : countryObj.slug,
            currency: currency ? currency : countryObj.currency,
            serial: serial ? Number(serial) : Number(countryObj.serial),
            
            content: content? content : countryObj.content,
            bodyImages: countryObj?.bodyImages,

            countryFlg:{
                url : uploadedFlag?.secure_url ? uploadedFlag?.secure_url : countryObj?.countryFlg?.url,
                publicId : uploadedFlag?.public_id ? uploadedFlag?.public_id : countryObj.countryFlg?.publicId,
            },

            famousFile:{
                url : uploadedFamous?.secure_url ? uploadedFamous?.secure_url : countryObj.famousFile.url,
                publicId : uploadedFamous?.public_id ? uploadedFamous?.public_id : countryObj.famousFile.publicId,
            },
            createdAt: countryObj.createdAt,
            updatedAt: format(new Date(), "MM/dd/yyyy"),

            universityList: countryObj.universityList
        };
        
        if (content) {
            let body
            try {
                body = JSON.parse(content)
            } catch {
                body = content
            }


            insertedObject.content = body
            const uploadedUrls: { url: string; publicID: string }[] = []

            if (files?.["content_image"]?.length > 0) {
                for (const item of insertedObject.bodyImages) {
                    if (item?.publicID) {
                    await fileUploadHelper.deleteFromCloud(item.publicID)
                    }
                }
                for (let i = 0; i < files["content_image"].length; i++) {
                    const uploaded: any = await fileUploadHelper.uploadToCloud(files["content_image"][i])
                    uploadedUrls.push({ url: uploaded.secure_url, publicID: uploaded.public_id })
                    body = body.replace(`__IMAGE_${i}__`, uploaded.secure_url)
                }
                insertedObject.bodyImages = uploadedUrls
                insertedObject.content = body
            }
        }
        

        const updateDoc = { $set: insertedObject };
        const result = await collection.updateOne(query, updateDoc);

        if (!result.acknowledged) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Failed to update!!!',
            });
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Successfully updated!!!',
            data: result,
        });
    } catch (error) {
        console.error(error);
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Successfully updated!!!',
            data:error,
        });
    }
}

const createCountryBase = async( req:AuthenticatedRequest, res:Response) => {
    try{
        const db = getDb()
        const collection = db.collection('country-uni')
        await authChecker(req,res,["admin","super_admin"])
        
        const { country , serial , slug , currency , content } = req.body
        const files:any = req.files

        if(!country || !serial || !slug || !files["countryFlag"]?.[0] || !files["famousFile"]?.[0] || !currency || !content){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Field missing!!!',
            })
        }

        const exist = await collection.findOne({
            $or: [
                { country: country?.toLowerCase() },
                { slug : slug }
            ]
        })
        
        if(exist ){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'a document already exist with this name',
            })
        }


        const local_country:any = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0])
        const local_flag:any   = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0])


        const insertedObject:any = {
            country : country.toLowerCase(),
            slug : slug,
            currency:currency,
            serial : Number(serial),
            
            content:content,
            bodyImages: [],

            countryFlg:{
                url : local_country?.secure_url,
                publicId : local_country?.public_id,
            },

            famousFile:{
                url : local_flag?.secure_url,
                publicId : local_flag?.public_id,
            },
            createdAt: format(new Date(), "MM/dd/yyyy"),
            updatedAt: format(new Date(), "MM/dd/yyyy"),
            
            universityList: []
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
            insertedObject.bodyImages = uploadedUrls
            insertedObject.content = body
        }

        
        const result = await collection.insertOne(insertedObject)
        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Insertion failed!!!",
                data: result,
            })
        }

        return sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Inserted successfully!!!",
            data: result,
        })
    }catch(error){
        console.error(error);
        res.status(400).json({
            success: false,
            message: 'Internal Server Error',
            error,
        });
    }
}

const deleteCountryBase = async(req:AuthenticatedRequest , res: Response) =>{
    try{
        const db = getDb()
        const collection = db.collection('country-uni')
        await authChecker(req, res, ["admin","super_admin"])


        const id = req.params.id;
        
        if ( !id ){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Id missing!!!',
            });
        }

        const query = {_id: new ObjectId(id)};
        const countryObj = await collection.findOne(query);
        
        if (!countryObj){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'No matching data found with the id!!!',
            });
        }
        
        if (Array.isArray(countryObj?.universityList) && countryObj.universityList.length > 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'First delete all university!!!',
            });
        }



        if(countryObj?.countryFlg?.publicId) await fileUploadHelper.deleteFromCloud(countryObj?.countryFlg?.publicId)
        if(countryObj?.famousFile?.publicId) await fileUploadHelper.deleteFromCloud(countryObj?.famousFile?.publicId)
        
        
        if(countryObj?.bodyImages){
            for(let image of countryObj?.bodyImages || []){
                await fileUploadHelper.deleteFromCloud(image?.publicID)
            }
        }
        const result = await collection.deleteOne(query)
        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Failed to delete!!!",
                data: result,
            })
        }

        return sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Successfully deleted!!!",
            data: result,
        })
    }catch(error){
        console.error(error);
        sendResponse(res,{
            statusCode: 400,
            success: false,
            message: "something went wrong",
            data: error,
        })
    }
}




module.exports = {
    createCountryBase,
    getAllCountryBase,
    editCountryBase,
    deleteCountryBase,
    getAllCountryBaseName
}