import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import sendEmail from "../../helper/sendEmail"
import authChecker from "../../helper/authChecker"
const bcrypt = require("bcrypt")
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

interface MulterFiles {
    [fieldname: string]: Express.Multer.File[];
}

const createAgentRequest = async(req: Request, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('agents')
        const { 
            name,email,role,mobile_number,alternate_mobile,dob,address,nationality,passport_number,
            agency_name,agency_address,agency_website,experience,services,partner_universities,
            license_number,tax_id,criminal_record,referral
        } = req.body

        await authChecker(req, res, ["user"])
        
        if(role==='admin' || role==='super_admin'){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'admin/super admin not allowed!!!',
            })
        }

        
        if( !email ){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Not Logged in or some required field missing!!!',
            })
        }

        const query = { email: email }
        const application = await collection.findOne(query)
        
        if(application){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Already applied',
            })
        }
        
        const files = req.files as MulterFiles
        const licenseDocument = files["license_document"]?.[0]
        const backgroundCheck = files["background_check"]?.[0]
        
        if(!licenseDocument || !backgroundCheck){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Already applied, delete or edit from your profile',
            })
        }

        const userObject = {
            ...req.body,
            license_document:'',
            license_document_pId:'',
            background_check:'',
            background_check_pId:'',
            role:"pending_agent",
            status:"initial",
            createdAt:format(new Date(), "MM/dd/yyyy"),
        }

        const bgUploaded:any = await fileUploadHelper.uploadToCloud(backgroundCheck) 
        const lsUploaded:any = await fileUploadHelper.uploadToCloud(licenseDocument) 
        
        
        userObject.license_document = lsUploaded.url
        userObject.background_check = bgUploaded.url                
        
        
        userObject.license_document_pId = lsUploaded.public_id
        userObject.background_check_pId = bgUploaded.public_id   

        const htmlContent = `
            <div  style="margin: 0; padding: 20px; background-color: #f5f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">


                <div style="max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #002c3a 0%, #005577 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 44, 58, 0.3);">
                    
                    
                    <div style="background: linear-gradient(135deg, #002c3a, #003d4f); padding: 30px 40px; text-align: center; position: relative;">
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #00bcd4, #4fc3f7, #81c784);"></div>
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00bcd4, #4fc3f7); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0, 188, 212, 0.3);">
                            <span style="color: white; font-size: 24px; font-weight: bold;">📋</span>
                        </div>
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">New Agent Application</h1>
                        <p style="color: #b0d4e8; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Application submitted by <strong style="color: #81c784;">${name}</strong></p>
                    </div>

                    
                    <div style="background-color: white; padding: 40px;">
                        
                        <!-- Personal Information Section -->
                        <div style="margin-bottom: 35px;">
                            <h2 style="color: #002c3a; font-size: 20px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #e8f4f8; display: flex; align-items: center;">
                                <span style="width: 8px; height: 8px; background: linear-gradient(135deg, #002c3a, #005577); border-radius: 50%; margin-right: 12px;"></span>
                                Personal Information
                            </h2>
                            <div style="background: #f8fbff; padding: 25px; border-radius: 12px; border-left: 4px solid #00bcd4;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Full Name</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 600;">${name}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Email Address</span>
                                        <span style="color: #005577; font-size: 16px; font-weight: 500;">${email}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Mobile Number</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${mobile_number}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Alternate Contact</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${alternate_mobile || "N/A"}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Date of Birth</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${dob}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Nationality</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${nationality}</span>
                                    </div>
                                </div>
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e8f4f8;">
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Address</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${address}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Passport Number</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${passport_number || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div style="margin-bottom: 35px;">
                            <h2 style="color: #002c3a; font-size: 20px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #e8f4f8; display: flex; align-items: center;">
                                <span style="width: 8px; height: 8px; background: linear-gradient(135deg, #4fc3f7, #81c784); border-radius: 50%; margin-right: 12px;"></span>
                                Agency Information
                            </h2>
                            <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #4fc3f7;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Agency Name</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 600;">${agency_name}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Experience</span>
                                        <span style="color: #005577; font-size: 16px; font-weight: 500;">${experience} years</span>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Agency Address</span>
                                    <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${agency_address}</span>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Website</span>
                                    <a href="${agency_website || '#'}" style="color: #00bcd4; font-size: 16px; font-weight: 500; text-decoration: none;" target="_blank">${agency_website || "N/A"}</a>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Services Offered</span>
                                    <span style="color: #002c3a; font-size: 16px; font-weight: 500; line-height: 1.5;">${services}</span>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Partner Universities</span>
                                    <span style="color: #002c3a; font-size: 16px; font-weight: 500; line-height: 1.5;">${partner_universities || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        
                        <div style="margin-bottom: 35px;">
                            <h2 style="color: #002c3a; font-size: 20px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #e8f4f8; display: flex; align-items: center;">
                                <span style="width: 8px; height: 8px; background: linear-gradient(135deg, #81c784, #66bb6a); border-radius: 50%; margin-right: 12px;"></span>
                                Legal & Compliance
                            </h2>
                            <div style="background: #f1f8e9; padding: 25px; border-radius: 12px; border-left: 4px solid #81c784;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">License Number</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 600;">${license_number}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Tax ID</span>
                                        <span style="color: #002c3a; font-size: 16px; font-weight: 500;">${tax_id}</span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Criminal Record</span>
                                        <span style="color: ${criminal_record === "yes" ? "#d32f2f" : "#2e7d32"}; font-size: 16px; font-weight: 600;">
                                            ${criminal_record === "yes" ? "Yes ⚠️" : "No ✅"}
                                        </span>
                                    </div>
                                    <div style="margin-bottom: 12px;">
                                        <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Referral Source</span>
                                        <span style="color: #005577; font-size: 16px; font-weight: 500; text-transform: capitalize;">${referral}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div style="margin-bottom: 35px;">
                            <h2 style="color: #002c3a; font-size: 20px; font-weight: 700; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #e8f4f8; display: flex; align-items: center;">
                                <span style="width: 8px; height: 8px; background: linear-gradient(135deg, #ff7043, #ff8a65); border-radius: 50%; margin-right: 12px;"></span>
                                Attached Documents
                            </h2>
                            <div style="background: #fff3e0; padding: 25px; border-radius: 12px; border-left: 4px solid #ff7043;">
                                <div style="margin-bottom: 20px;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                        <div>
                                            <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Business License</span>
                                            <span style="color: #002c3a; font-size: 16px; font-weight: 500;">License Document</span>
                                        </div>
                                        <div style="text-align: right;">
                                            ${lsUploaded.url 
                                                ? `<a href="${lsUploaded.url}" style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;" target="_blank">📄 View Document</a>`
                                                : `<span style="background: linear-gradient(135deg, #f44336, #ef5350); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">❌ Not Provided</span>`
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                        <div>
                                            <span style="color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Background Check</span>
                                            <span style="color: #002c3a; font-size: 16px; font-weight: 500;">Verification Document</span>
                                        </div>
                                        <div style="text-align: right;">
                                            ${bgUploaded.url 
                                                ? `<a href="${bgUploaded.url}" style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 14px; font-weight: 600;" target="_blank">📄 View Document</a>`
                                                : `<span style="background: linear-gradient(135deg, #f44336, #ef5350); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">❌ Not Provided</span>`
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div style="text-align: center; margin: 40px 0; padding: 25px; background: linear-gradient(135deg, rgba(0, 44, 58, 0.05), rgba(0, 85, 119, 0.05)); border-radius: 12px;">
                            <h3 style="color: #002c3a; margin-bottom: 20px; font-size: 18px; font-weight: 700;">Application Review</h3>
                            <div style="display: inline-flex; gap: 15px;">
                                <a href="#" style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                                    ✅ Approve Application
                                </a>
                                <a href="#" style="background: linear-gradient(135deg, #ff9800, #ffb74d); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
                                    📋 Request Info
                                </a>
                                <a href="#" style="background: linear-gradient(135deg, #f44336, #ef5350); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                                    ❌ Decline
                                </a>
                            </div>
                        </div>
                    </div>

                    
                    <div style="background: linear-gradient(135deg, #002c3a, #003d4f); padding: 30px; text-align: center; border-top: 4px solid #00bcd4;">
                        <div style="max-width: 500px; margin: 0 auto;">
                            <!-- Company Logo/Icon -->
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #00bcd4, #4fc3f7); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);">
                                <span style="color: white; font-size: 20px; font-weight: bold;">🏢</span>
                            </div>
                            
                            <!-- Company Name -->
                            <h3 style="color: white; margin: 0 0 8px; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Your Company Name</h3>
                            <p style="color: #81c784; margin: 0 0 15px; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Agent Application Management System</p>
                            
                            <!-- Contact Information -->
                            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin: 20px 0; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #00bcd4; font-size: 16px;">📧</span>
                                    <a href="mailto:support@yourcompany.com" style="color: #b0d4e8; text-decoration: none; font-size: 14px; font-weight: 500;">support@yourcompany.com</a>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #00bcd4; font-size: 16px;">📞</span>
                                    <span style="color: #b0d4e8; font-size: 14px; font-weight: 500;">+1 (555) 123-4567</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="color: #00bcd4; font-size: 16px;">🌐</span>
                                    <a href="https://yourcompany.com" style="color: #b0d4e8; text-decoration: none; font-size: 14px; font-weight: 500;" target="_blank">yourcompany.com</a>
                                </div>
                            </div>

                            
                            <div style="display: flex; justify-content: center; gap: 15px; margin: 20px 0;">
                                <a href="#" style="width: 36px; height: 36px; background: rgba(0, 188, 212, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.3s ease;" target="_blank">
                                    <span style="color: #00bcd4; font-size: 16px;">📘</span>
                                </a>
                                <a href="#" style="width: 36px; height: 36px; background: rgba(0, 188, 212, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.3s ease;" target="_blank">
                                    <span style="color: #00bcd4; font-size: 16px;">🐦</span>
                                </a>
                                <a href="#" style="width: 36px; height: 36px; background: rgba(0, 188, 212, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.3s ease;" target="_blank">
                                    <span style="color: #00bcd4; font-size: 16px;">💼</span>
                                </a>
                            </div>

                            
                            <div style="border-top: 1px solid rgba(129, 199, 132, 0.3); padding-top: 20px; margin-top: 25px;">
                                <p style="color: #81c784; font-size: 12px; line-height: 1.6; margin: 0; opacity: 0.8;">
                                    <strong>Automated System Email</strong> • Please do not reply directly to this message<br>
                                    This email contains confidential information. If received in error, please delete and notify sender.
                                </p>
                                <p style="color: #4fc3f7; font-size: 11px; margin: 8px 0 0; opacity: 0.7;">
                                    © 2024 Your Company Name. All rights reserved. | Privacy Policy | Terms of Service
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
      

`


        const emailResponse = await sendEmail(
            "info@nrcedu-uk.com",
            "New Enquiry Submission",
            htmlContent
        )

        
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
            statusCode: 400,
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
            statusCode: 400,
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
                statusCode: 400,
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
                statusCode: 400,
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
            statusCode: 400,
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