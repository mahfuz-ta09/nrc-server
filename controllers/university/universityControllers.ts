import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


const createUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const { name, url, country, ranking, tuitionFee, requiredDocs, applicationFee, duration, intakes, entryRequirements, applicationDeadlines} = req.body

        
        if(!name  || !country || !url || !ranking || !tuitionFee || !requiredDocs || !applicationFee || !duration || !intakes || !entryRequirements || !applicationDeadlines){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "No empty field allowed"
            })
        }

        const insertedObject = {
            name:name,
            country:country.toUpperCase(),
            url:url,
            ranking:ranking,
            tuitionFee:tuitionFee,
            requiredDocs:requiredDocs,
            applicationFee:applicationFee,
            duration:duration,
            intakes:intakes,
            entryRequirements:entryRequirements,
            applicationDeadlines:applicationDeadlines,
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


const deleteUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const id  = req.params.id
        
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)

        if(!exist){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'No data exist',
                data: exist,
            })
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

const editUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const id = req.params.id
        const { name, url, country, ranking, tuitionFee, requiredDocs, applicationFee, duration, intakes, entryRequirements, applicationDeadlines} = req.body

        const query = { _id : new ObjectId(id) }

        const university = await collection.findOne(query)
        if(!university){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "No university exist with the id!!!",
            })
        }
        
        const field = {
            name:name?name:university?.name,
            country:country?country.toUpperCase():university?.country,
            url:url?url:university?.url,
            ranking:ranking?ranking:university?.ranking,
            tuitionFee:tuitionFee?tuitionFee:university?.tuitionFee,
            requiredDocs:requiredDocs?requiredDocs:university?.requiredDocs,
            applicationFee:applicationFee?applicationFee:university?.applicationFee,
            duration:duration?duration:university?.duration,
            intakes:intakes?intakes:university?.intakes,
            entryRequirements:entryRequirements?entryRequirements:university?.entryRequirements,
            applicationDeadlines:applicationDeadlines?applicationDeadlines:university?.applicationDeadlines,
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

const getAllUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

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


const getUniOriginName = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const country = await await collection.aggregate([
            {
                $group: {
                    _id: "$country",
                    image: { $first: "$url" }
                }
            },
            {
                $project: {
                    _id: 1,
                    country: "$_id",
                    image: 1
                }
            }
        ]).toArray()
        const total = await collection.countDocuments()

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            data: country,
            meta:{
                total: total
            }
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