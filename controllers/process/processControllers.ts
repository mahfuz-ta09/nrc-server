import { format } from "date-fns"
import { ObjectId } from "mongodb"
import { Request , Response } from "express"
import sendEmail from "../../helper/sendEmail"
const { getDb } = require('../../config/connectDB')
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"


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
            phone,
            ulternative_phone,
            dob,
            testName,
            examTakenTime,
            destinationCountry,
            referral,
            refused,
            refusedCountry
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


        await authChecker(req, res, ["user"])

        if(exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'You have finished processing. Update or delete to process again!!',
                data: exist,
            })
        }

        const files = req.files as MulterFiles
        const engRes = files["proficiencyCirtificate"]?.[0]
        const sscRes = files["ssc"]?.[0]
        const hscRes = files["hsc"]?.[0]
        const bacRes = files["bachelor"]?.[0]
        const masRes = files["master"]?.[0]
        const othRes = files["other"]?.[0]

        let engResF:any , sscResF:any , hscResF:any , bacResF:any , masResF:any , othResF:any
        if(engRes) engResF = await fileUploadHelper.uploadToCloud(engRes) 
        if(sscRes) sscResF = await fileUploadHelper.uploadToCloud(sscRes) 
        if(hscRes) hscResF = await fileUploadHelper.uploadToCloud(hscRes) 
        if(bacRes) bacResF = await fileUploadHelper.uploadToCloud(bacRes) 
        if(masRes) masResF = await fileUploadHelper.uploadToCloud(masRes) 
        if(othRes) othResF = await fileUploadHelper.uploadToCloud(othRes) 
        
        
        const fileToInsert = {
        personalInfo: {
            name,
            email,
            phone,
            ulternative_phone,
            dob,
            passportNo: "",
            currentAddress: "",
            countryCitizen: "",
            refused,
            refusedCountry,
            allowEditPermission: false,
        },
        englishProficiency: {
            testName,
            listening: "",
            reading: "",
            writing: "",
            speaking: "",
            overall: "",
            examTakenTime,
            allowEditPermission: false,
        },
        prefferedUniversities:[
            {}
        ],
        assignedUniversities: [
            {
                schoolership: "", 
                intake: "",
                program: "",
                destinationCountry,
                feePaid: false,
                uniName: "",
                courseStartDate: "",
                preferedSubjects: [],
                allowEditPermission: false,
            },
        ],
        studentsFile: {
            permission: false,
            ssc: { url: sscResF?.secure_url || "", publicId: sscResF?.public_id || "" },
            hsc: { url: hscResF?.secure_url || "", publicId: hscResF?.public_id || "" },
            bachelor: {
                url: bacResF?.secure_url || "",
                publicId: bacResF?.public_id || "",
            },
            master: {
                url: masResF?.secure_url || "",
                publicId: masResF?.public_id || "",
            },
            other: {
                url: othResF?.secure_url || "",
                publicId: othResF?.public_id || "",
            },
            sourceOfFund: { url: "", publicId: "" },
            sponsorAffidavit: { url: "", publicId: "" },
            ministryAttestation: { url: "", publicId: "" },
            accommodationConfirmation: { url: "", publicId: "" },
            proficiencyCirtificate: { url: engResF?.secure_url || "", publicId: engResF?.public_id || "" },
            editHistoryByStudent: [],
        },
        fileEditActivity: [
            {
                type: "create",
                creatorName:name,
                creatorId:"",
                creatorEmail:email,
                creatorRole:"student",
                creatorUnder:"self",
                createdAt: format(new Date(), "MM/dd/yyyy"),
            },
        ],
        applicationState: {
            file: { requiredSubmitted: false, requiredVerified: false },
            personalData: { requiredSubmitted: false, requiredVerified: false },
            englishProfData: { requiredSubmitted: false, requiredVerified: false },
            englishTest: { requiredSubmitted: false, requiredVerified: false },
            universityAssigned: { requiredSubmitted: false, requiredVerified: false },
            applicationFinished: { finished: false, archived: false },
        },
        createdAt: format(new Date(), "MM/dd/yyyy"),
        referral,
        };

        const result = await collection.insertOne(fileToInsert)

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
                <p><strong>Mobile Number:</strong> ${phone}</p>
                <p><strong>Emergency Number:</strong> ${ulternative_phone}</p>
                <p><strong>Date of Birth:</strong> ${dob}</p>

                <h3>English Proficiency</h3>
                <p><strong>Test Type:</strong> ${testName}</p>
                <p><strong>Result link:</strong> ${engResF?.secure_url}</p>
                

                <h3>Academic Results</h3>
                <p><strong>SSC Result:</strong>        ${sscResF?.secure_url}</p>
                <p><strong>HSC Result:</strong>        ${hscResF?.secure_url}</p>
                <p><strong>Bachelor Result:</strong>   ${bacResF?.secure_url}</p>
                <p><strong>Masters Result:</strong>    ${masResF?.secure_url}</p>
                <p><strong>Other Result:</strong>      ${othResF?.secure_url}</p>

                <h3>Preferences</h3>
                <p><strong>Preferred Country:</strong> ${destinationCountry}</p>
                <p><strong>Referral Source:</strong> ${referral}</p>
                <p><strong>Previously Refused Entry:</strong> ${refused}</p>
                <p><strong>Refused Country (if any):</strong> ${refusedCountry}</p>
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