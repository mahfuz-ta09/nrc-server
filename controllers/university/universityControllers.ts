import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


const createUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const { name, ranking, tuitionFee, requiredDocs, applicationFee, duration, intakes, entryRequirements, applicationDeadlines} = req.body
        const file = req?.file

        console.log("asd",req.body)
        
        if(!name  || !ranking || !tuitionFee || !requiredDocs || !applicationFee || !duration || !intakes || !entryRequirements || !applicationDeadlines){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "No empty field allowed"
            })
        }


        const uploaded:any = await fileUploadHelper.uploadToCloud(file)
        console.log("sdf=============",uploaded)

        if(!uploaded.url){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Failed to upload!!!',
                data: uploaded,
            })
        }
        const insertedObject = {
            name:name,
            url:uploaded?.url,
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
        const collection = db.collection('course')

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
        const { name , total_classes , explain_classes, total_assignment, explain_assignment, total_exams, explain_exams, course_fee , duration, explain_durations, class_starts, class_ends, enroled_start, enroled_end, description } = req.body
        const file = req?.file


        const query = { _id : new ObjectId(id) }

        const course = await collection.findOne(query)

        if(!course){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "No course exist with the id!!!",
            })
        }
        
        let uploaded:any

        if(file) uploaded = await fileUploadHelper.uploadToCloud(file)

        const field:any = {
            name : name ? name : course.name,
            image : uploaded?.url ? uploaded.url : course.image,
            total_classes : total_classes ? total_classes : course.total_classes ,
            explain_classes : explain_classes ? explain_classes : course.explain_classes,
            total_assignment : total_assignment ? total_assignment : course.total_assignment,
            explain_assignment : explain_assignment ? explain_assignment : course.explain_assignment,
            total_exams : total_exams ? total_exams : course.total_exams,
            explain_exams : explain_exams ? explain_exams : course.explain_exams,
            course_fee : course_fee ? course_fee : course.course_fee,
            total_enroled : course.total_enroled,
            duration : duration ? duration : course.duration,
            explain_durations : explain_durations ? explain_durations : course.explain_durations,
            class_starts : class_starts ? class_starts : course.class_starts,
            class_ends : class_ends ? class_ends : course.class_ends,
            enroled_start : enroled_start ? enroled_start : course.enroled_start,
            enroled_end : enroled_end ? enroled_end : course.enroled_end,
            description : description ? description : course.description,
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