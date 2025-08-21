import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"
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

        const id = req.params.id;
        const { country, serial, countryFull , currency } = req.body;
        const files: any = req.files;


        if (!country &&!serial &&!countryFull &&!files["countryFlag"]?.[0] &&!files["famousFile"]?.[0] &&!currency) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'All fields missing!!!',
            });
        }

        

        const query = { _id: new ObjectId(id) };
        const countryObj = await collection.findOne(query);

        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'No country exists with the given id!!!',
            });
        }

        let uploadedFlag: any = null;
        let uploadedFamous: any = null;

        
        if (files["countryFlag"]?.[0]) {
            uploadedFlag = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0]);
            const ss = await fileUploadHelper.deleteFromCloud(countryObj.countryFlag_Id);
            console.log(ss)
        }

        
        if (files["famousFile"]?.[0]) {
            uploadedFamous = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0]);
            const ss = await fileUploadHelper.deleteFromCloud(countryObj.famousFile_Id);
            console.log(ss)
        }

        const insertedObject = {
            country: country ? country.toUpperCase() : countryObj.country,
            countryFull: countryFull ? countryFull.toLowerCase() : countryObj.countryFull,
            currency: currency ? currency : countryObj.currency,
            serial: serial ? Number(serial) : Number(countryObj.serial),

            countryFlag_url: uploadedFlag?.url ?? countryObj.countryFlag_url,
            countryFlag_Id: uploadedFlag?.public_id ?? countryObj.countryFlag_Id,

            famousFile_url: uploadedFamous?.url ?? countryObj.famousFile_url,
            famousFile_Id: uploadedFamous?.public_id ?? countryObj.famousFile_Id,

            universityList: countryObj.universityList
        };

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
        res.status(400).json({
            success: false,
            message: 'Internal Server Error',
            error,
        });
    }
}

const createCountryBase = async( req:AuthenticatedRequest, res:Response) => {
    try{
        const db = getDb()
        const collection = db.collection('country-uni')
        await authChecker(req,res,["admin","super_admin"])
        
        const { country , serial , countryFull , currency } = req.body
        const files:any = req.files

        if(!country || !serial || !countryFull || !files["countryFlag"]?.[0] || !files["famousFile"]?.[0] || !currency){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Field missing!!!',
            })
        }

        const exist = await collection.findOne({
            $or: [
                { country: country?.toUpperCase() },
                { countryFull: countryFull?.toLowerCase() }
            ]
        })
        
        if(exist ){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Already exist!!!',
            })
        }


        const local_country:any = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0])
        const local_flag:any   = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0])


        const insertedObject = {
            country : country.toUpperCase(),
            countryFull : countryFull.toLowerCase(),
            currency:currency,
            serial : Number(serial),

            countryFlag_url : local_country.url,
            countryFlag_Id : local_country.public_id,

            famousFile_url : local_flag.url,
            famousFile_Id : local_flag.public_id,
            
            universityList: []
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
        
        if (countryObj?.universityList.length){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'First delete all university!!!',
            });
        }



        if(countryObj?.countryFlag_Id) await fileUploadHelper.deleteFromCloud(countryObj.countryFlag_Id)
        if(countryObj?.famousFile_Id) await fileUploadHelper.deleteFromCloud(countryObj.famousFile_Id)
        

        
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
            statusCode: 200,
            success: true,
            message: "Successfully deleted!!!",
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