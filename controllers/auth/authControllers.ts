import { Request , Response } from "express"
import { UserObject } from "./commonType"
import sendResponse from "../../helper/sendResponse"
import { format } from "date-fns"
import path from "path"
import sendEmail from "../../helper/sendEmail"
const { getDb } = require('../../config/connectDB')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


const emaiReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


const logIn = async(req: Request, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')

        const { email , password } = req.body

        if(!email || !password){
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

        if(!user || user.status !== 'active'){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'No user exist with this email!!!',
            })
        }

        const pass = await bcrypt.compare(password, user.password)
        if(!pass){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Invalid password!!!',
            })
        }

        const userData = {
            id: user._id,
            email: email,
            role: user.role,
            status:user.status
        }

        const accessToken = jwt.sign(
            userData, 
            process.env.ACCESSTOKEN, { 
            expiresIn: "5m" 
        })

        const refreshToken = jwt.sign(
            userData, 
            process.env.REFRESHTOKEN,{ 
            expiresIn: "30d" 
        })

        res.cookie("refreshToken", 
            refreshToken, {
            httpOnly: true,
            signed: true,
            path: "/",
            secure: true,
            sameSite: "none",
        })

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Login successful!!!",
            meta: {
                accessToken:accessToken,
            }
        })
    }catch(err){
        console.log(err)
    }
}

const signUp = async(req: Request, res: Response) => {
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
                message: "Invalid email format"
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

        
        if(user?.status=='active' || user?.status=='inactive' || user?.status=='banned'){
            return sendResponse( res, {
                statusCode: 500,
                success: false,
                message: 'Error signing in!!!',
            })
        }

        const randomToken = Math.floor(100000 + Math.random() * 900000).toString()

        const sendVerificationEmail = async (userEmail: string, code: string) => {
            const subject = "Your Verification Code"
            const htmlContent = `
                <h2>Email Verification</h2>
                <p>Your 6-digit verification code is: <strong>${code}</strong></p>
                <p>Enter this code on the website to verify your email.</p>
            `
        
            return await sendEmail(userEmail, subject, htmlContent)
        }
        
        sendVerificationEmail(email,randomToken)
        if(user){
            await collection.updateOne(query,{ 
                $set: {
                     status: randomToken
                }}
            )

            return sendResponse( res, {
                statusCode: 200,
                success: true,
                data:{
                    id:user?._id
                },
                message: 'Check email for verification code',
            })
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const userObject:UserObject = {
            email:email,
            password:hashedPassword,
            role: '',
            status: randomToken,
            image:'',
            name:name,
            phone: null,
            dob:'',
            country:'',
            review: '',
            createdAt:format(new Date(), "MM/dd/yyyy")
        }

        const result = await collection.insertOne(userObject)
        
        sendResponse( res, {
            statusCode: 200,
            success: true,
            message: 'Check email for verification code',
            data:{
                id:result?.insertedId
            }
        })

    }catch(err){
        console.log(err)
    }
}


const logOut = async(req: Request, res: Response) => {
    try{
        res.clearCookie(
            "refreshToken",{ 
                httpOnly: true,
                signed: true,
                path: "/", 
                secure: true, 
                sameSite: "none"
        })

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Logout successful!!!",
        })
    }catch(err){
        console.log(err)
    }
}

const successResponse = async(req: Request, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')
        
        const { email , id , code } = req.body

        if(!email  || !code || !id){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'Email or id missing',
            })
        }
        const query = { email : email }
        const user = await collection.findOne(query)
        
        if(!user){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'No user found, try again',
            })
        }

        if(user.status === code){
            const updateField = {
                $set:{
                    status:'active'
                }
            }

            const verified = await collection.updateOne(query,updateField)

            const userData = {
                id: user._id,
                email: email,
                role: '',
                status:'active',
            }

            const accessToken = jwt.sign(
                userData, 
                process.env.ACCESSTOKEN, { 
                expiresIn: "5m" 
            })

            const refreshToken = jwt.sign(
                userData, 
                process.env.REFRESHTOKEN,{ 
                expiresIn: "30d" 
            })

            res.cookie("refreshToken", 
                refreshToken, {
                httpOnly: true,
                signed: true,
                secure: true,
                path: "/",
                sameSite: "none",
            })

            sendResponse(res,{
                statusCode: 200,
                success: true,
                message: 'Signup successfully!!',
                meta:{
                    accessToken: accessToken
                }
            })
        }else{
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'Failed to verify, try again',
            })
        }
    }catch(err){
        console.log(err)
    }
}

const getAccessToken = async(req: Request, res: Response) => {
    try{
        const token = req.signedCookies?.refreshToken
        if(token){
            const db = await getDb()
            const collection = db.collection('users')
            const decoded = await jwt.verify(token, process.env.REFRESHTOKEN)
            
            
            const query = { email: decoded?.email }
            const user = await collection.findOne(query)

            if(user.status === "active" && user.role === decoded.role){
                const userData = {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    status:user.status
                }
        
                const accessToken = jwt.sign(
                    userData, 
                    process.env.ACCESSTOKEN, { 
                    expiresIn: "5m" 
                })
                sendResponse(res,{
                    statusCode: 200,
                    success: true,
                    message: "Logout successful!!!",
                    meta: {
                        accessToken:accessToken,
                    }
                })

            }
        }
        
    }catch(err){
        console.log(err)
    }
}




module.exports  = {
    logIn,
    signUp,
    logOut,
    getAccessToken,
    successResponse
} 
