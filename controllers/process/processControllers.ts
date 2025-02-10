import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { format } from "date-fns"
const { getDb } = require('../../config/connectDB')


const createProceed = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const { name,mobile_number,emergency_number,email,role,dob,ssc_institution,ssc_group,ssc_result,hsc_institution,
            hsc_group,hsc_result,other_deg,other_institution,other_group,other_result,master_institution,master_group,
            master_result,en_proficiency,listening,reading,writing,speaking,exam_taken_time,prefered_country,referral,refused,country_name} = req.body
        
        if(!email){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "You must login to proceed"
            })
        }
        
        if(role==='admin' || role==='super_admin'){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "Admin can't access."
            })
        }

        const query = { email:email }
        const exist = await collection.findOne(query)

        if(exist){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'You have finished processing. Update or delete to process again!!',
                data: exist,
            })
        }
       

        const insertedObject = {
            name:name,
            mobile_number:mobile_number,
            emergency_number:emergency_number,
            email:email,
            dob:dob,
            ssc_institution:ssc_institution,
            ssc_group:ssc_group,
            ssc_result:ssc_result,
            hsc_institution:hsc_institution,
            hsc_group:hsc_group,
            hsc_result:hsc_result,
            other_deg:other_deg,
            other_institution:other_institution,
            other_group:other_group,
            other_result:other_result,
            master_institution:master_institution,
            master_group:master_group,
            master_result:master_result,
            en_proficiency:en_proficiency,
            listening:listening,
            reading:reading,
            writing:writing,
            speaking:speaking,
            exam_taken_time:exam_taken_time,
            prefered_country:prefered_country,
            referral:referral,
            refused:refused,
            country_name:country_name,
            condition:"initial",
            updated:0,
            last_updated:"initial",
            data_added: format(new Date(), "MM/dd/yyyy"),
        }

        console.log(insertedObject)


        const result = await collection.insertOne(insertedObject)

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "Failed to comment!!!",
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Commented successfully!!!",
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


const deleteReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')

        const email  = req.params.email
        
        const query = { email : email }
        const exist = await collection.findOne(query)

        if(!exist){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'You are not logged in or never commented!',
                data: exist,
            })
        }
       
        const result = await collection.deleteOne(query)
        if(result?.deletedCount===0){
            console.log(result)
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
            message: "You have deleted your comment!!!",
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

const editReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')

        const id = req.params.id
        const { name , email , url , comment} = req.body

        const query = { _id : new ObjectId(id) }

        const userComment = await collection.findOne(query)
        if(!userComment){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "User not logged in!!!",
            })
        }
        
        const field = {
            name: name? name : userComment.name,
            email: email? email : userComment.email,
            url: url? url : userComment.url,
            comment: comment? comment : userComment.comment
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

const getAllReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')

        const review = await collection.find({}).sort({"_id": -1}).toArray()
        const countCourse     = await collection.countDocuments()

        const metaData = {
            page: 0,
            limit: 0,
            total: countCourse,
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Review retrieval successful!!!',
            meta: metaData,
            data: review,
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


const getSingleReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')

        const id = req.params.id 
        const query = { _id : new ObjectId(id)}
        const review = await collection.findOne(query)

        if(!review){
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
            message: "Your comment",
            data: review,
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



const getReviewBypage = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')

        
        const { page, item } = req.params
        const pageNumber = parseInt(page, 10) || 1
        const itemsPerPage = parseInt(item, 10) || 3


        const totalReviews = await collection.countDocuments();
        const reviews = await collection.find()
          .skip((pageNumber - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .sort({ createdAt: -1 }).toArray()
    

        const meta = {
            total: totalReviews,
            page: pageNumber,
            limit: Math.ceil(totalReviews / itemsPerPage),
            totalPages: Math.ceil(totalReviews / itemsPerPage)
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Review retrieval successful!!!',
            meta: meta,
            data: reviews,
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
    getReviewBypage,
    getSingleReview,
    getAllReview,
    editReview,
    deleteReview,
    createProceed
}