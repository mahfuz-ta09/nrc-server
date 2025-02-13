import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
const bcrypt = require("bcrypt")
const { getDb } = require('../../config/connectDB')

const createAgentRequest = async(req: Request, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('agents')
        const { name
                ,email
                ,mobile_number
                ,alternate_mobile
                ,dob
                ,address
                ,nationality
                ,passport_number
                ,agency_name
                ,agency_address
                ,agency_website
                ,experience
                ,services
                ,partner_universities
                ,license_number
                ,license_document
                ,tax_id
                ,criminal_record
                ,background_check
                ,referral } = req.body

        if(    !name
            || !email
            || !mobile_number
            || !dob
            || !address
            || !nationality
            || !agency_name
            || !agency_address
            || !experience
            || !services
            || !license_number
            || !license_document
            || !tax_id
            || !criminal_record
            || !background_check){
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: 'Not Logged in/ some required field missing!!!',
            })
        }

        const query = { email: email }
        
        const application = await collection.findOne(query)
        if(application){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Already applied, delete or edit from your profile',
            })
        }

        const userObject = {
            ...req.body,
            role:"agent",
            state:"initial",
            createdAt:format(new Date(), "MM/dd/yyyy"),
        }

        const result = await collection.insertOne(userObject)

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Request successful!!!",
            data: result
        })
    }catch(err){
        console.log(err)
    }
}


const getAllAgentReq = async(req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('agents')
        
        const agents = await collection.find(
            { role: "agent", state: "initial" }).sort({ _id: -1 }).toArray()
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: agents,
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


const getAllAgents = async(req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('agents')
        
        const users = await collection.find(
            { state : "accepted" }
        ).sort({ _id: -1 }).toArray()

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: users,
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


const updateAgentStatus = async(req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('agents')

        const id = req.params.id
        const status = req.params.status
        
        
        if(!id){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'Id required',
            })
        }

        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)

        if(!exist){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'No data found!'
            })
        }

        const options = { upsert: true }
        const doc = {
            $set: {
                state:status,
            }
        }

        const agent = await collection.updateOne(query, doc, options)

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: agent,
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
    createAgentRequest,
    getAllAgentReq,
    getAllAgents,
    updateAgentStatus
}