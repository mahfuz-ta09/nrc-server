import { Request , Response } from "express"
import sendResponse from "../../helper/sendResponse"
const bcrypt = require("bcrypt")
import { format } from "date-fns"
import { ObjectId } from "mongodb"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

const getSingleUserById = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')

        const id  = req.params.id
        const query = { _id: new ObjectId(id) }
    
        const user = await collection.findOne(query, { projection: { password: 0 } })
        
        if(!user){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'User not found!!!',
                data: user,
            })
        }

        const { email , role , status } = req?.user

        if(user.email !== email || role !== user?.role || status !== 'active'){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Forbidden access!!!',
            })
        }


        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'User found!!!',
            data: user,
        })
    }catch(err){
        console.log(err)
    }
}

const updateSingleUser = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')

        const { name , phone , image , dob , country , password , review } = req.body
        const id  = req.params.id

        const query = { _id : new ObjectId(id) }
        const user = await collection.findOne(query)
        if(!user){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'User not found!!!',
                data: user,
            })
        }

        if(password && password?.length < 6){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Password is to short!!!',
            })
        }

        const { email , role , status } = req?.user

        if(user.email !== email || role !== user?.role || status !== 'active'){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Forbidden access!!!',
            })
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const doc = {
            $set: {
                name: name || user.name,
                image: (typeof image === "string" && image) ? image : user.image,
                phone: phone || user.phone,
                country: country || user.country,
                review: review || user.review,
                dob: dob || user.dob,
                password: password ? hashedPassword : user.password,
            }
        }

        const response = await collection.updateOne(query, doc)

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'User successful!!!',
            data: response,
        })
    }catch(err){
        console.log(err)
    }
}

module.exports  = {
    getSingleUserById,
    updateSingleUser
} 
