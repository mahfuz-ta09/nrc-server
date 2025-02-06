import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


const createUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const navCollection = db.collection('nav')

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
            country:country,
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

        const insertedData = { id: result.insertedId, country }

        await navCollection.updateOne({}, { $setOnInsert: { "university": [], "test-prep": [] } }, { upsert: true })
        const update = {
            $push: { ["university"]: insertedData }
        }

        const options = { returnDocument: "after" }
        await navCollection.findOneAndUpdate({}, update, options)

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
            country:country?country:university?.country,
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
        const course = await collection.findOne(query,{projection: { courseContent: 0, studentData: 0 }})

        if(!course){
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
            data: course,
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



module.exports = {
    createUniversity,
    editUniversity,
    deleteUniversity,
    getAllUniversity,
    getSingleUniversity
}