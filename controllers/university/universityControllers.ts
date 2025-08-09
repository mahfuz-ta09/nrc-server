import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}


const getAllCountryBase = async( req:AuthenticatedRequest, res:Response) => {
        try {
        const db = getDb();
        const collection = db.collection("country-uni");
        
        
        const countryBase = await collection.find({}).toArray()
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
        const db = getDb();
        const collection = db.collection('country-uni');
        const usersCollection = db.collection('users');

        const tEmail = req.user?.email || null;
        const tRole = req.user?.role || null;
        const tStatus = req.user?.status || null;

        const user1 = await usersCollection.findOne({ email: tEmail, status: tStatus, role: tRole });
        if (!user1) {
            return sendResponse(res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            });
        }

        
        const id = req.params.id;
        const { country, serial, countryFull } = req.body;
        const files: any = req.files;


        if (
            !country &&
            !serial &&
            !countryFull &&
            !files["countryFlag"]?.[0] &&
            !files["famousFile"]?.[0]
        ) {
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
};

const createCountryBase = async( req:AuthenticatedRequest, res:Response) => {
    try{
        const db = getDb()
        const collection = db.collection('country-uni')
        const usersCollection = db.collection('users')

        
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const { country , serial , countryFull } = req.body
        const files:any = req.files

        if(!country || !serial || !countryFull || !files["countryFlag"]?.[0] || !files["famousFile"]?.[0]){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Field missing!!!',
            })
        }

        
        const local_country:any = await fileUploadHelper.uploadToCloud(files["countryFlag"]?.[0])
        const local_flag:any   = await fileUploadHelper.uploadToCloud(files["famousFile"]?.[0])


        const insertedObject = {
            country : country.toUpperCase(),
            countryFull : countryFull.toLowerCase(),
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
    }catch(err){

    }
}




// old from here 

const createUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const { name, country, tuitionFee, requardQualification, 
            initialDepossit , englishTest , SCHOLARSHIP } = req.body        

        if(!country || !name || !tuitionFee){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Country name required!!!',
            })
        }

        let cntry:any , cntryId, flg:any , flgId
        const uni = await collection.findOne({
            country: country.toUpperCase(),
            url:  { $exists: true},
            flag: { $exists: true},
        })


        if(uni){
            cntry = uni.url
            flg = uni.flag
        }else{
            const files:any = req.files
            if(files["file"]?.[0] || files["flag"]?.[0]){
                let local_country:any = await fileUploadHelper.uploadToCloud(files["file"]?.[0])
                let local_flag:any   = await fileUploadHelper.uploadToCloud(files["flag"]?.[0])

                cntryId = local_country.public_id
                flgId = local_flag.public_id

                cntry = local_country.url
                flg = local_flag.url
            }else{
                return sendResponse(res,{
                    statusCode: 400,
                    success: false,
                    message: "Flag and country image required for new country"
                })
            }
        }

        const insertedObject = {
            name:name,
            country:country.toUpperCase(),
            url:cntry,
            flag:flg,
            cntryId:cntryId,
            flgId:flgId,
            tuitionFee:tuitionFee,
            SCHOLARSHIP:SCHOLARSHIP,
            requardQualification:requardQualification,
            initialDepossit:initialDepossit,
            englishTest:englishTest,
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

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Inserted successfully!!!",
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


const deleteUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const id  = req.params.id
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
        const total = await collection.countDocuments({ country : exist?.country })
        
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data exist',
                data: exist,
            })
        }

        if(total === 1){
            if(exist?.flgId) await fileUploadHelper.deleteFromCloud(exist?.flgId)
            if(exist?.cntryId) await fileUploadHelper.deleteFromCloud(exist?.cntryId)
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

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Successfully deleted!!!",
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

const editUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const id = req.params.id
        const { name , country, tuitionFee, requardQualification, initialDepossit , 
            englishTest , SCHOLARSHIP } = req.body

        const query = { _id : new ObjectId(id) }

        const university = await collection.findOne(query)
        if(!university){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No university exist with the id!!!",
            })
        }
        
        let cntryId , flgId , flag , url

        const files:any = req.files
        if(files["file"]?.[0] || files["flag"]?.[0]){
            let local_country:any = await fileUploadHelper.uploadToCloud(files["file"]?.[0])
            let local_flag:any   = await fileUploadHelper.uploadToCloud(files["flag"]?.[0])

            cntryId = local_country.public_id
            flgId = local_flag.public_id

            url = local_country.url
            flag = local_flag.url
        }


        const field = {
            name:name?name:university?.name,
            country:country?country.toUpperCase():university?.country,
            url:url?url:university?.url,
            flag:flag?flag:university?.flag,
            cntryId:cntryId?cntryId:university?.cntryId,
            flgId:flgId?flgId:university?.flgId,
            tuitionFee:tuitionFee?tuitionFee:university?.tuitionFee,
            requardQualification:requardQualification?requardQualification:university?.requardQualification,
            initialDepossit:initialDepossit?initialDepossit:university?.initialDepossit,
            englishTest:englishTest?englishTest:university?.englishTest,
            SCHOLARSHIP:SCHOLARSHIP?SCHOLARSHIP:university?.SCHOLARSHIP,
        }

        const updateDoc = {
            $set: field,
        }

        const result = await collection.updateOne(query, updateDoc)

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Failed to update!!!",
            })
        }
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Successfully updated!!!",
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

const getAllUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const university = await collection.find({}).sort({"_id": -1}).toArray()
        const countCourse     = await collection.countDocuments()

        const metaData = {
            page: 0,
            limit: 0,
            total: countCourse,
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            meta: metaData,
            data: university,
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


const getSingleUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const id = req.params.id 
        const query = { _id : new ObjectId(id)}
        const university = await collection.findOne(query,{projection: { courseContent: 0, studentData: 0 }})

        if(!university){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No data exist!!!",
              }
          )
        }

        sendResponse(res,{
            statusCode: 200,
            success: false,
            message: "Showing university details",
            data: university,
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

const getUniOriginName = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('university');

        const country = await collection.aggregate([
            {
                $group: {
                    _id: "$country",
                    image: { $first: "$url" },
                    flag: { $first: "$flag" }
                }
            },
            {
                $project: {
                    _id: 1,
                    country: "$_id",
                    image: 1,
                    flag: 1,
                }
            }
        ]).toArray()


        const uniqueCountryCount = await collection.distinct("country")
        const totalUniqueCountries = uniqueCountryCount.length

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            data: country,
            meta: {
                total: totalUniqueCountries
            }
        });
    } catch (err) {
        console.log(err)
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Internal server error',
            data: err
        })
    }
}


const getUniversityByCountry = async( req: Request , res: Response) =>{
    try {
        const db = getDb();
        const collection = db.collection("university");

        const country = req.params.country;
        
        const universities = await collection.find({ country: country }).toArray();
        
        if (universities.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No universities found for this country",
            })
        }

        res.status(200).json({
            success: true,
            message: "Universities retrieved successfully",
            data: universities,
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


module.exports = {
    createUniversity,
    editUniversity,
    deleteUniversity,
    getAllUniversity,
    getSingleUniversity,
    getUniOriginName,
    getUniversityByCountry,









    // new
    createCountryBase,
    getAllCountryBase,
    editCountryBase
}