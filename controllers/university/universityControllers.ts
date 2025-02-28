import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

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


        const { name, country, tuitionFee, requardQualification, initialDepossit , englishTest , SCHOLARSHIP} = req.body        

        if(!name  || !country || !tuitionFee || !requardQualification || !initialDepossit || !englishTest || !SCHOLARSHIP){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "No empty field allowed"
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
                    statusCode: 500,
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
                statusCode: 500,
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
            statusCode: 500,
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
                statusCode: 500,
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
                statusCode: 500,
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
            statusCode: 500,
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
                statusCode: 500,
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
                statusCode: 500,
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
            statusCode: 500,
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
            statusCode: 500,
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
                statusCode: 500,
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
            statusCode: 500,
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
            statusCode: 500,
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
        res.status(500).json({
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
    getUniversityByCountry
}