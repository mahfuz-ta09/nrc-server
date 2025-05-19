import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import sendEmail from "../../helper/sendEmail"
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

        
        if(role==='admin' || role==='super_admin'){
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'admin/super admin not allowed!!!',
            })
        }

        
        if( !name || !email || !mobile_number || !alternate_mobile || !dob || !address || !nationality
            || !passport_number || !agency_name || !agency_address || !agency_website || !experience || !services
            || !partner_universities || !license_number || !tax_id || !criminal_record || !referral){
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
            role:"agent",
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="background-color: #002c3a; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                    New Agent Application from ${name}
                </h2>
                <div style="padding: 20px; background-color: white; border-radius: 0 0 5px 5px;">
                    <h3>Personal Information</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Mobile Number:</strong> ${mobile_number}</p>
                    <p><strong>Alternate Mobile:</strong> ${alternate_mobile || "N/A"}</p>
                    <p><strong>Date of Birth:</strong> ${dob}</p>
                    <p><strong>Address:</strong> ${address}</p>
                    <p><strong>Nationality:</strong> ${nationality}</p>
                    <p><strong>Passport Number:</strong> ${passport_number || "N/A"}</p>

                    <h3>Agency Information</h3>
                    <p><strong>Agency Name:</strong> ${agency_name}</p>
                    <p><strong>Agency Address:</strong> ${agency_address}</p>
                    <p><strong>Agency Website:</strong> <a href="${agency_website}" target="_blank">${agency_website || "N/A"}</a></p>
                    <p><strong>Years of Experience:</strong> ${experience}</p>
                    <p><strong>Services Offered:</strong> ${services}</p>
                    <p><strong>Partner Universities:</strong> ${partner_universities || "N/A"}</p>

                    <h3>Compliance Details</h3>
                    <p><strong>License Number:</strong> ${license_number}</p>
                    <p><strong>Tax ID:</strong> ${tax_id}</p>
                    <p><strong>Criminal Record:</strong> ${criminal_record === "yes" ? "Yes" : "No"}</p>
                    <p><strong>Referred By:</strong> ${referral}</p>

                    <h3>Attached Documents</h3>
                    <p><strong>License Document:</strong> ${lsUploaded.url ? lsUploaded.url : "Not Provided ❌"}</p>
                    <p><strong>Background Check Document:</strong> ${bgUploaded.url ? bgUploaded.url : "Not Provided ❌"}</p>
                </div>
                <p style="text-align: center; font-size: 12px; color: #777;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>

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