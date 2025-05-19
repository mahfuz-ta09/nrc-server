import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { format } from "date-fns"
import sendEmail from "../../helper/sendEmail"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}
interface MulterFiles {
    [fieldname: string]: Express.Multer.File[];
}
type CloudinaryFile = {
    url: string;
    public_id: string;
};
  
type InsertedObject = {
  email: string;
  name: string;
  mobile_number: string;
  emergency_number: string;
  dob: string;
  en_proficiency: string;
  en_result: CloudinaryFile;
  ssc_result: CloudinaryFile;
  hsc_result: CloudinaryFile;
  bachelor_result: CloudinaryFile;
  masters_result: CloudinaryFile;
  other_result: CloudinaryFile;
  exam_taken_time: string;
  prefered_country: string;
  referral: string;
  refused: string;
  country_name: string;
  condition: string;
  updated: number;
  last_updated: string;
  data_added: string;
};
  


const createProceed = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const usersCollection = db.collection('users')
        const { 
            email,
            role,
            name,
            mobile_number,
            emergency_number,
            dob,
            en_proficiency,
            exam_taken_time,
            prefered_country,
            referral,
            refused,
            country_name
         } = req.body
        
        if(!email){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "You must login to proceed"
            })
        }
        
        if(role==='admin' || role==='super_admin'){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Admin can't access."
            })
        }

        const query = { email:email }
        const exist = await collection.findOne(query)


        const tEmail = req.user?.email || null;
        const tRole = req.user?.role || null;
        const tStatus = req.user?.status || null;

        const user = await usersCollection.findOne({ email: tEmail , status: tStatus })

        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        if(exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'You have finished processing. Update or delete to process again!!',
                data: exist,
            })
        }

        const files = req.files as MulterFiles
        const engRes = files["en_result"]?.[0]
        const sscRes = files["ssc_result"]?.[0]
        const hscRes = files["hsc_result"]?.[0]
        const bacRes = files["bachelor_result"]?.[0]
        const masRes = files["masters_result"]?.[0]
        const othRes = files["other_result"]?.[0]

        let engResF:any , sscResF:any , hscResF:any , bacResF:any , masResF:any , othResF:any
        if(engRes) engResF = await fileUploadHelper.uploadToCloud(engRes) 
        if(sscRes) sscResF = await fileUploadHelper.uploadToCloud(sscRes) 
        if(hscRes) hscResF = await fileUploadHelper.uploadToCloud(hscRes) 
        if(bacRes) bacResF = await fileUploadHelper.uploadToCloud(bacRes) 
        if(masRes) masResF = await fileUploadHelper.uploadToCloud(masRes) 
        if(othRes) othResF = await fileUploadHelper.uploadToCloud(othRes) 
        
        
        const insertedObject:any = {
            email:email,
            name:name,
            mobile_number:mobile_number,
            emergency_number:emergency_number,
            dob:dob,
            en_proficiency:en_proficiency,
            en_result:{url:engResF?.secure_url, public_id:engResF?.public_id},
            ssc_result:{url:sscResF?.secure_url, public_id:sscResF?.public_id},
            hsc_result:{url:hscResF?.secure_url, public_id:hscResF?.public_id},
            bachelor_result:{url:bacResF?.secure_url, public_id:bacResF?.public_id},
            masters_result:{url:masResF?.secure_url, public_id:masResF?.public_id},
            other_result:{url:othResF?.secure_url, public_id:othResF?.public_id},
            exam_taken_time:exam_taken_time,
            prefered_country:prefered_country,
            referral:referral,
            refused:refused,
            country_name:country_name,
            condition:"initial",
            updated:0,
            last_updated:"initial",
            data_added: format(new Date(), "MM/dd/yyyy"),
        }

        const result = await collection.insertOne(insertedObject)

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Failed to proceed!!!",
                data: result,
            })
        }
        
        const content = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="background-color: #002c3a; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                nrc-edu uk Application Submission
                </h2>
                <div style="padding: 20px; background-color: white; border-radius: 0 0 5px 5px;">
                <h3>Personal Information</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mobile Number:</strong> ${mobile_number}</p>
                <p><strong>Emergency Number:</strong> ${emergency_number}</p>
                <p><strong>Date of Birth:</strong> ${dob}</p>

                <h3>English Proficiency</h3>
                <p><strong>Test Type:</strong> ${en_proficiency}</p>
                <p><strong>Result link:</strong> ${engResF?.secure_url}</p>
                

                <h3>Academic Results</h3>
                <p><strong>SSC Result:</strong>        ${sscResF?.secure_url}</p>
                <p><strong>HSC Result:</strong>        ${hscResF?.secure_url}</p>
                <p><strong>Bachelor Result:</strong>   ${bacResF?.secure_url}</p>
                <p><strong>Masters Result:</strong>    ${masResF?.secure_url}</p>
                <p><strong>Other Result:</strong>      ${othResF?.secure_url}</p>

                <h3>Preferences</h3>
                <p><strong>Preferred Country:</strong> ${prefered_country}</p>
                <p><strong>Referral Source:</strong> ${referral}</p>
                <p><strong>Previously Refused Entry:</strong> ${refused}</p>
                <p><strong>Refused Country (if any):</strong> ${country_name}</p>
                </div>

                <p style="text-align: center; font-size: 12px; color: #777; margin-top: 20px;">
                This information was submitted via the NRC-London application form.
                </p>
            </div>
            `;

        sendEmail(
            "info@nrcedu-uk.com",
            "Student's application data",
            content
        )
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Proceeded successfully!!!",
            data: result,
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


const deleteProcessData = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const usersCollection = db.collection('users')

        const id  = req.params.id
        
        if(!id){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Error finding id!!!"
            })
        }

        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)

        
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

        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'You are not logged in or never submited data!',
                data: exist,
            })
        }
       
        const result = await collection.deleteOne(query)
        if(result?.deletedCount===0){
            console.log(result)
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Failed to delete!!!",
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Deleted!!!",
            data: result,
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

const editProcessData = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const usersCollection = db.collection('users')
        const id = req.params.email
        const { email,
                role,
                name,
                mobile_number,
                emergency_number,
                dob,
                en_proficiency,
                en_result,
                ssc_result,
                hsc_result,
                bachelor_result,
                masters_result,
                other_result,
                exam_taken_time,
                prefered_country,
                referral,
                refused,
                country_name,
                condition
        } = req.body
        

        const query = { _id : new ObjectId(id) }

        const data = await collection.findOne(query)
        if(!data){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "User not logged in!!!",
            })
        }
    
        
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

        const insertedObject = {
            email : email ? email: data?.email,
            role : role ? role: data?.role,
            name : name ? name: data?.name,
            mobile_number : mobile_number ? mobile_number: data?.mobile_number,
            emergency_number : emergency_number ? emergency_number: data?.emergency_number,
            dob : dob ? dob: data?.dob,
            en_proficiency : en_proficiency ? en_proficiency: data?.en_proficiency,
            en_result : en_result ? en_result: data?.en_result,
            ssc_result : ssc_result ? ssc_result: data?.ssc_result,
            hsc_result : hsc_result ? hsc_result: data?.hsc_result,
            bachelor_result : bachelor_result ? bachelor_result: data?.bachelor_result,
            masters_result : masters_result ? masters_result: data?.masters_result,
            other_result : other_result ? other_result: data?.other_result,
            exam_taken_time : exam_taken_time ? exam_taken_time: data?.exam_taken_time,
            prefered_country : prefered_country ? prefered_country: data.prefered_country,
            referral : referral ? referral: data.referral,
            refused : refused ? refused: data.refused,
            country_name : country_name ? country_name: data.country_name,
            condition: condition? condition : data?.condition,
            updated: data?.updated+1,
            last_updated:format(new Date(), "MM/dd/yyyy"),
        }

        const updateDoc = {
            $set: insertedObject,
        }

        const result = await collection.updateOne(query, updateDoc)
        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Failed to update!!!",
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Successfully updated!!!",
            data: result,
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

const getAllData = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const usersCollection = db.collection('users')

        const data = await collection.find({}).sort({"_id": -1}).toArray()
        const countCourse     = await collection.countDocuments()
        

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

        const metaData = {
            page: 0,
            limit: 0,
            total: countCourse,
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Review retrieval successful!!!',
            meta: metaData,
            data: data,
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


const getSingleData = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('application')
        const usersCollection = db.collection('users')

        const email = req.params.email 
        const query = { email : email }
        const data = await collection.findOne(query)

        if(!data){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No data exist!!!",
              }
          )
        }
        
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

        sendResponse(res,{
            statusCode: 200,
            success: false,
            message: "Loading...",
            data: data,
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
    getSingleData,
    getAllData,
    editProcessData,
    deleteProcessData,
    createProceed
}