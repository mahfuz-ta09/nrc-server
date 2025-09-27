import { Request, Response } from "express";
import sendResponse from "./sendResponse";
const { getDb } = require('../config/connectDB')

interface AuthenticatedRequest extends Request {
    user?: { email?: string; role?: string; status?: string };
}


const clearAuthCookies = (res: Response) => {
    const opts:any = {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        domain: process.env.NODE_ENV === 'PRODUCTION' ? ".nrcedu-uk.com" : '', 
        path: "/",
    }
    res.clearCookie("nrc_ref", opts)
    res.clearCookie("nrc_acc", opts)
}

const authChecker = async (req: AuthenticatedRequest,res: Response,requiredRole: any)=> {
    try {
        const db = getDb()
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email;
        const tRole = req.user?.role;
        const tStatus = req.user?.status;
        const user = await usersCollection.findOne({ email: tEmail })


        if(!user) {
            console.log("user not found response from auth checker")
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'User not found or not authorized',
            })
        }


        if(!tEmail || !tRole || !tStatus) {
            console.log("issue with email,role and status response from auth checker")
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Unauthorized access',
            })
        }

        if(!user || user.email !== tEmail || user.role !== tRole || user.status !== tStatus) {
            console.log("issue with email,role and status response from auth checker")
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Unauthorized access',
            })
        }


        if(!requiredRole.includes(user.role)) {
            console.log("issue with role response from auth checker")
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 403,
                success: false,
                message: 'You do not have permission to perform this action',
            })
        }


        if(user.status !== 'active') {
            console.log("issue with status response from auth checker")
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 403,
                success: false,
                message: 'Your account is not active',
            })
        }

    }catch(err) {
        console.error(err)
        clearAuthCookies(res)
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: 'Internal server error',
            data: err,
        })
    }
};

export default authChecker;
