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


        const { name , destination , tuitionFee , requiredDocs , applicationFee , duration , intakes , 
            entryRequirements , applicationDeadlines } = req.body
            
        if(!name || !destination || !tuitionFee || !requiredDocs || !applicationFee || !duration || !intakes || 
            !entryRequirements || !applicationDeadlines){
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
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const insertedObject = {
            name:name,
            destination:destination,
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


const deleteSubject = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')
        const usersCollection = db.collection('users')

        const id  = req.params.id
        
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
            
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

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

        const id = req.params.id
        const { name, destination, ranking, tuitionFee, requiredDocs, applicationFee, duration, intakes, entryRequirements, applicationDeadlines} = req.body

        const query = { _id : new ObjectId(id) }

        const subject = await collection.findOne(query)
        if(!subject){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No university exist with the id!!!",
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


        const field = {
            name:name? name : subject?.name, 
            ranking:ranking? ranking : subject?.ranking, 
            destination:destination? destination : subject?.destination,
            tuitionFee:tuitionFee? tuitionFee : subject?.tuitionFee, 
            requiredDocs:requiredDocs? requiredDocs : subject?.requiredDocs, 
            applicationFee:applicationFee? applicationFee : subject?.applicationFee, 
            duration:duration? duration : subject?.duration, 
            intakes:intakes? intakes : subject?.intakes, 
            entryRequirements:entryRequirements? entryRequirements : subject?.entryRequirements, 
            applicationDeadlines:applicationDeadlines? applicationDeadlines : subject?.applicationDeadlines, 
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

const getAllSubject = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')

        const courses = await collection.find({}, { 
                projection: { courseContent: 0, studentData: 0 , courseSchedule: 0}
            }).sort({"_id": -1}).toArray()
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
            data: courses,
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

const getSingleSubject = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('subjects')

        const id = req.params.id 
        const query = { _id : new ObjectId(id)}
        const course = await collection.findOne(query,{projection: { courseContent: 0, studentData: 0 }})

        if(!course){
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
            data: course,
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



module.exports = {
    createSubject,
    editSubject,
    deleteSubject,
    getAllSubject,
    getSingleSubject
}