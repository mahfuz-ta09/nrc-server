import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
const bcrypt = require("bcrypt")
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

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
                ,referral, role } = req.body

        if(role==='admin' || role==='super_admin'){
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: 'admin/super admin not allowed!!!',
            })
        }

        if(    !name||!email||!mobile_number||!dob||!address||!nationality||!agency_name||!agency_address||!experience||!services||!license_number||!license_document||!tax_id||!criminal_record||!background_check){
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
            status:"initial",
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


const getAllAgentReq = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('agents')
        const usersCollection = db.collection('users')

                        
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

        
        const agents = await collection.find(
            { role: "agent", status: "initial" }).sort({ _id: -1 }).toArray()
        
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


const getAllAgents = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('agents')
        const usersCollection = db.collection('users')
        

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

        const users = await collection.find(
            { status : "accepted" }
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


const updateAgentStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection('agents')
        const userCollection = db.collection('users')

        const id = req.params.id;
        const status = req.params.status;

        if (!id) {
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: 'Id required',
            })
        }

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await userCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }
        
        const query = { _id: new ObjectId(id) };
        const exist = await collection.findOne(query);

        if (!exist) {
            return sendResponse(res, {
                statusCode: 500,
                success: false,
                message: 'No data found!',
            });
        }


        const agentUpdate = await collection.updateOne(query, { $set: { status } })

        if (agentUpdate.modifiedCount === 1) {
            const userQuery = { email: exist.email }
            await userCollection.updateOne(
                userQuery,
                {
                    $set: {
                        role: 'agent',
                        phone: exist.mobile_number,
                        country: exist.nationality,
                        status: 'accepted'
                    }
                },
                { upsert: false }
            )
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Successful!',
            data: agentUpdate,
        });
    } catch (err) {
        console.log(err);
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: 'Internal server error',
            data: err,
        });
    }
}



module.exports = {
    createAgentRequest,
    getAllAgentReq,
    getAllAgents,
    updateAgentStatus
}