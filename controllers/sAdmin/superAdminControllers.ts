import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
const bcrypt = require("bcrypt")


const emaiReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const createAdmin = async(req: Request, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')

        const { name , email , password } = req.body

        if(!email || !password || !name){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'No empty field allowed!!!',
            })
        }

        if(emaiReg.test(email) === false){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Invalid email format!!!',
            })
        }

        if(password.length < 6){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Password is to short!!!',
            })
        }
        const query = { email: email }
        
        const user = await collection.findOne(query)
        if(user){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'User already exist!!!, Please login.',
            })
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const userObject = {
            email:email,
            password:hashedPassword,
            role: ''
        }

        const result = await collection.insertOne(userObject)

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Signup successful!!!",
            data: result
        })
    }catch(err){
        console.log(err)
    }
}


module.exports = {
    createAdmin
}