import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

const createSubject = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')
        const usersCollection = db.collection('users')


        const { name , country , initialDepossit , tuitionFee , entryRequ , engTest , duration , details } = req.body
            
        if(!name || !country || !initialDepossit || !tuitionFee || !entryRequ || !engTest || !duration || !details){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No empty field allowed"
            })
        }
    
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const insertedObject = {
            name:name,
            country:country.toUpperCase(),
            tuitionFee:tuitionFee,
            duration:duration,
            initialDepossit:initialDepossit,
            entryRequ:entryRequ,
            engTest:engTest,
            details:details,
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


const deleteSubjects = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')
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
        
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data exist',
                data: exist,
            })
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

const editSubject = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')
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
        
        const { 
            name , country , initialDepossit , tuitionFee , entryRequ , engTest , duration , details
         } = req.body
         
        const query = { _id : new ObjectId(id) }

        const subjects = await collection.findOne(query)
        if(!subjects){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No university exist with the id!!!",
            })
        }
        
        const field = {
            name:name?name:subjects?.name,
            country:country?country.toUpperCase():subjects?.country,
            initialDepossit:initialDepossit?initialDepossit.toUpperCase():subjects?.initialDepossit,
            tuitionFee:tuitionFee?tuitionFee.toUpperCase():subjects?.tuitionFee,
            entryRequ:entryRequ?entryRequ.toUpperCase():subjects?.entryRequ,
            engTest:engTest?engTest.toUpperCase():subjects?.engTest,
            duration:duration?duration.toUpperCase():subjects?.duration,
            details:details?details.toUpperCase():subjects?.details,
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

const getAllSubjects = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')

        const subjects = await collection.find({}).sort({"_id": -1}).toArray()
        const countCourse  = await collection.countDocuments()

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
            data: subjects,
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


const getSingleSubjects = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')

        const id = req.params.id 
        const query = { _id : new ObjectId(id)}
        const subject = await collection.findOne(query)

        if(!subject){
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
            message: "Showing subject details",
            data: subject,
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

const getSubjectOrigin = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('subjects');

        const country = await collection.aggregate([
            {
                $group: {
                    _id: "$country",
                }
            },
            {
                $project: {
                    _id: 1,
                    country: "$_id",
                }
            }
        ]).toArray()


        const uniqueCountryCount = await collection.distinct("country")
        const totalUniqueSubjcts = uniqueCountryCount.length

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            data: country,
            meta: {
                total: totalUniqueSubjcts
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


const getSubjectsByCountry = async( req: Request , res: Response) =>{
    try {
        const db = getDb();
        const collection = db.collection("subjects")

        const country = req.params.country
        const subjects = await collection.find({ country: country }).toArray()
        
        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No subjects found for this country",
            })
        }

        res.status(200).json({
            success: true,
            message: "Universities retrieved successfully",
            data: subjects,
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
    createSubject,
    editSubject,
    getAllSubjects,
    getSingleSubjects,
    deleteSubjects,
    getSubjectOrigin,
    getSubjectsByCountry
}