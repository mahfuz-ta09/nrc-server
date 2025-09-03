import { Request , Response , NextFunction } from "express"
import sendResponse from "../helper/sendResponse";
const jwt = require('jsonwebtoken')

interface AuthenticatedRequest extends Request {
    user?: any
}

interface AuthenticatedResponse extends Response {
    user?: any
}


const verifyUser = (req:AuthenticatedRequest, res: AuthenticatedResponse, next:NextFunction ) => {
    const token = req.headers.authorization

    console.log(token)
    
    if (!token) {
        return sendResponse( res, {
            statusCode: 401,
            success: false,
            message: 'Unauthorized access!!!',
        })
    }

    try {
        const secretKey = process.env.ACCESSTOKEN
        const decoded = jwt.verify(token, secretKey)
        req.user = decoded
        
        next()
    } catch (error) {
        return sendResponse( res, {
            statusCode: 401,
            success: false,
            message: 'Invalid or expired token!!!',
        })
    }
}


module.exports = verifyUser
