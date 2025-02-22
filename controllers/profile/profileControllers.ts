import { Request , Response } from "express"
import sendResponse from "../../helper/sendResponse"
const bcrypt = require("bcrypt")
import { format } from "date-fns"
import { ObjectId } from "mongodb"
import sendEmail from "../../helper/sendEmail"
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


const emailContact = async(req: Request , res: Response) =>{
    try{
        const { fullName, email, phone, country, state, message } = req.body;

        
        if (!fullName || !email || !phone || !country || !state || !message) {
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'Failed !!!',
            })
        }
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="background-color: #0073e6; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                    New Inquiry from ${fullName}
                </h2>
                <div style="padding: 20px; background-color: white; border-radius: 0 0 5px 5px;">
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Country:</strong> ${country}</p>
                    <p><strong>State:</strong> ${state}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background-color: #f1f1f1; padding: 10px; border-radius: 5px;">${message}</p>
                </div>
                <p style="text-align: center; font-size: 12px; color: #777;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        `


        const emailResponse = await sendEmail(
            "Info@nrclondon.co.uk",
            "New Enquiry Submission",
            htmlContent
        )

        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Successfull !!!',
            data: emailResponse
        })
    }catch(err){
        console.log(err)
        sendResponse(res,{
            statusCode: 500,
            success: false,
            message: 'Failed !!!',
        })
    }
}


module.exports  = {
    getSingleUserById,
    updateSingleUser,
    emailContact
} 
