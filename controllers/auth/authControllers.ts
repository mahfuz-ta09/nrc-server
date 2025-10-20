import { Request, Response } from "express"
import { UserObject } from "./commonType"
import sendResponse from "../../helper/sendResponse"
import { format } from "date-fns"
import sendEmail from "../../helper/sendEmail"
import authChecker from "../../helper/authChecker"
const { getDb } = require("../../config/connectDB")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const emaiReg =
  /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/




const setCookie = (res: Response,name: string,value: string,maxAge?: number) => {
    
    if(name==='nrc_ref') res.cookie(name, value, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        domain: process.env.NODE_ENV === 'PRODUCTION' ? ".nrcedu-uk.com" : '',
        path: "/",
        maxAge,
    })
    
    if(name==='nrc_acc') res.cookie(name, value, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        domain: process.env.NODE_ENV === 'PRODUCTION' ? ".nrcedu-uk.com" : '',
        path: "/",
    })
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


const logIn = async (req: Request, res: Response) => {
    try {
        const db = await getDb()
        const collection = db.collection("users")

        const { email, password } = req.body

        if (!email || !password) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "No empty field allowed!!!",
        })
        }

        if (emaiReg.test(email) === false) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Invalid email format!!!",
        })
        }

        if (password.length < 6) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Password is too short!!!",
        })
        }

        const user = await collection.findOne({ email })

        if (!user || user.status !== "active") {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "No user exists with this email!!!",
        })
        }

        const pass = await bcrypt.compare(password, user.password)
        if (!pass) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Invalid password!!!",
        })
        }

        const userData = {
            id: user._id,
            email: email,
            role: user.role,
            status: user.status,
        }

        const accessToken = jwt.sign(userData, process.env.ACCESSTOKEN, {
            expiresIn: "5m",
        })

        const refreshToken = jwt.sign(userData, process.env.REFRESHTOKEN, {
            expiresIn: "7d",
        })

        
        setCookie(res, "nrc_ref", refreshToken, 7 * 24 * 60 * 60 * 1000)
        setCookie(res, "nrc_acc", accessToken)

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful!!!",
            data: { user: userData }, 
        })
    } catch (err) {
        console.error(err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Login failed",
            data: err,
        })
    }
}

const signUp = async (req: Request, res: Response) => {
    try {
        const db = await getDb()
        const collection = db.collection("users")
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "All fields are required",
            })
        }

        if (!emaiReg.test(email)) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Invalid email format",
        })
        }

        if (password.length < 6) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Password must be at least 6 characters long",
        })
        }

        const existingUser = await collection.findOne({ email })

        if (existingUser && existingUser.status === "active") {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Email already registered",
            })
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        await sendEmail(
            email,
            "Your Verification Code",
            `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #2c3e50;">🔐 Email Verification</h2>
                <p>Hello,</p>
                <p>Thank you for signing up with <strong>NRC Educational Consultants Ltd.</strong>. To complete your registration, please use the verification code below:</p>
                
                <div style="background: #f4f4f4; padding: 12px 20px; display: inline-block; border-radius: 6px; margin: 15px 0; font-size: 18px; font-weight: bold; letter-spacing: 3px; color: #2c3e50;">
                    ${verificationCode}
                </div>
                
                <p>Simply enter this 6-digit code on our website to verify your email address.</p>
                <p style="color: #e74c3c; font-weight: bold;">⚠️ For your security, do not share this code with anyone.</p>
                
                <p>If you did not request this verification, please ignore this email.</p>
                
                <p style="margin-top: 20px;">Best regards,<br/><strong>NRC Educational Consultants Ltd. Team</strong></p>
            </div>
            `
        )

        if (existingUser) {
            await collection.updateOne(
                { email },
                { $set: { status: verificationCode } }
        )

        return sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Verification code resent to your email",
                data: { id: existingUser._id },
            })
        }

        
        const hashedPassword = await bcrypt.hash(password, 10)

        const userObject = {
            name,
            email,
            password: hashedPassword,
            role: "user",
            roleData:{},
            requiredPassChange: false,
            status: verificationCode,
            image: { url: "", publicId: "" },
            phone: null,
            dob: "",
            country: "",
            review: "",
            createdAt: format(new Date(), "MM/dd/yyyy"),
        }

        const result = await collection.insertOne(userObject)

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Check your email for verification code",
            data: { id: result.insertedId },
        })
    } catch (err) {
        console.error(err)
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Signup failed",
            data: err,
        })
    }
}

const successResponse = async (req: Request, res: Response) => {
    try {
        const db = await getDb()
        const collection = db.collection("users")

        const { email, id, code } = req.body

        if (!email || !id || !code) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing email, id or verification code",
            })
        }

        const user = await collection.findOne({ email })

        if (!user) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No user found with this email",
            })
        }

        if (user.status !== code) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid verification code",
            })
        }

        
        await collection.updateOne({ email }, { $set: { status: "active" } })

        const userData = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: "active",
        }

        const accessToken = jwt.sign(userData, process.env.ACCESSTOKEN, {
            expiresIn: "5m",
        })

        const refreshToken = jwt.sign(userData, process.env.REFRESHTOKEN as string, {
            expiresIn: "7d",
        })

        setCookie(res, "nrc_ref", refreshToken, 7 * 24 * 60 * 60 * 1000)
        setCookie(res, "nrc_acc", accessToken)

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Signup successful! Account verified",
            data: { user: userData },
        })
    } catch (err) {
        console.error(err)
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Verification failed",
            data: err,
        })
    }
}
const logOut = async (req: Request, res: Response) => {
    try {
        clearAuthCookies(res)
            sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "User logged out!",
        })
    } catch (err) {
        console.error(err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Logout failed",
            data: err,
        })
    }
}


const getAccessToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.nrc_ref
        
        if (!token) {
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No refresh token provided",
            })
        }

        let decoded
        try {
            decoded = await jwt.verify(token, process.env.REFRESHTOKEN)
        } catch (jwtError: any) {
            if (jwtError.name === "TokenExpiredError") {
                clearAuthCookies(res)
                return sendResponse(res, {
                    statusCode: 400,
                    success: false,
                    message: "Refresh token expired. Please login again.",
                })
            }
            throw jwtError
        }

        const db = await getDb()
        const collection = db.collection("users")

        const user = await collection.findOne({ email: decoded?.email })

        if (!user || user.status !== "active" || user.role !== decoded.role) {
            clearAuthCookies(res)
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid user or permissions. Please login again.",
            })
        }

        const userData = {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
        }

        const accessToken = jwt.sign(userData, process.env.ACCESSTOKEN, {
            expiresIn: "5m",
        })

        setCookie(res, "nrc_acc", accessToken)

        sendResponse(res, {
            statusCode: 200,
            success: true,
            data: { user: userData },
        })
    } catch (err) {
        console.error("Error in getAccessToken:", err)
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err,
        })
    }
}

const resetPassword = async (req: Request, res: Response) => {
    try {
        const db = await getDb()
        const collection = db.collection("users")
        const { email } = req.body

        if (!email) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Email required to reset password",
            })
        }

        const user = await collection.findOne({ email })
        if (!user) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "No user exist with this email",
            })
        }

        const randomToken = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedPassword = await bcrypt.hash(randomToken, 10)

        const changed = await collection.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        )

        if (changed?.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to reset. Try again",
            })
        }

        const content = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #2c3e50;">🔑 NRC Educational Consultants Ltd. - Password Reset</h2>

                <p>Hello <strong>${user?.name}</strong>,</p>
                <p>You requested to reset the password for your account associated with <strong>${email}</strong>.</p>
                
                <p>Your new temporary password is:</p>
                
                <div style="background: #f4f4f4; padding: 12px 20px; display: inline-block; border-radius: 6px; margin: 15px 0; font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #2c3e50;">
                    ${randomToken}
                </div>
                <p style="color:#e67e22;"><strong>⚠️ Important:</strong> Please log in using this password and update it immediately from your profile for security reasons.</p>
                <p>If you did not request a password reset, please ignore this email or contact our support team right away.</p>
                <p style="margin-top: 20px;">Best regards,<br/><strong>NRC Educational Consultants Ltd. Support Team</strong></p>
            </div>
        `
        sendEmail(email, "Reset password request", content)

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Successful. Check your email",
        })
    } catch (err) {
        console.error(err)
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Password reset failed",
            data: err,
        })
    }
}

module.exports = {
  logIn,
  signUp,
  logOut,
  getAccessToken,
  successResponse,
  resetPassword,
}
