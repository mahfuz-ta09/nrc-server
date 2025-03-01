import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
const bcrypt = require("bcrypt")
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

const emaiReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const createAdmin = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')
        const { email , password } = req.body
        
        if(!email || !password ){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'No empty field allowed!!!',
            })
        }

        if(emaiReg.test(email) === false){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Invalid email format!!!',
            })
        }

        if(password.length < 6){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Password is to short!!!',
            })
        }
        
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await collection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }
        
        const query = { email: email }
        
        const user = await collection.findOne(query)
        if(user){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'User already exist!!!, Please login.',
            })
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const userObject = {
            email:email,
            password:hashedPassword,
            role: 'admin',
            status: 'active',
            image:'',
            publicid:'',
            name:'',
            phone:'',
            dob:'',
            country:'',
            review:'',
            createdAt:format(new Date(), "MM/dd/yyyy"),
            requiredPassChange:  true
        }

        const result = await collection.insertOne(userObject)

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "New Admin created!!!",
            data: result
        })
    }catch(err){
        console.log(err)
    }
}


const getAllAdmin = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await collection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }
        
        const admins = await collection.find({role: "admin"},{
            projection: {password:0}
        }).sort({"_id": -1}).toArray()
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: admins,
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


const getAllUsers = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')
        
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await collection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }
        
        const users = await collection.find(
            { role: { $nin: ["admin", "super_admin","agent"]}},
            { projection: { password: 0 } }
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
            statusCode: 400,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}


const updateAdminStatus = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const id = req.params.id
        const status = req.params.status
        
        if(!id){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'Id required',
            })
        }

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await collection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }
        
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
        console.log(exist)
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data found!'
            })
        }

        const options = { upsert: true }
        const doc = {
            $set: {
                status:status,
            }
        }

        const admins = await collection.updateOne(query, doc, options)
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: admins,
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
    createAdmin,
    getAllAdmin,
    getAllUsers,
    updateAdminStatus
}