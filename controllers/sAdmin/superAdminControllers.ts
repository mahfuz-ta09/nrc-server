import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import { ObjectId } from "mongodb"
import { format } from "date-fns"
import authChecker from "../../helper/authChecker"
import sendEmail from "../../helper/sendEmail"
const bcrypt = require("bcrypt")
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}

const emaiReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const createAdmin = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const db = await getDb()
        const collection = db.collection('users')
        const { email , password } = req.body
        
        await authChecker(req, res, ["super_admin"])

        if(!email || !password ){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'No empty field allowed!!!',
            })
        }

        if(emaiReg.test(email) === false){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Invalid email format!!!',
            })
        }

        if(password.length < 6){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Password is to short!!!',
            })
        }
        
        
        await authChecker(req, res, ["super_admin"]);
        
        const query = { email: email }
        const user = await collection.findOne(query)
        
        if(user){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'User already exist, Change his role from users page',
            })
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const userObject = {
            email:email,
            password:hashedPassword,
            role: 'admin',
            status: 'active',
            image:'',
            publicid:'',
            name:'',
            phone:'',
            dob:'',
            country:'',
            review:'',
            createdAt:format(new Date(), "MM/dd/yyyy"),
            requiredPassChange:  true
        }

        const result = await collection.insertOne(userObject)
        if (result?.insertedId) {
            const content = `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #2c3e50;">🎉 Welcome to NRC Educational Consultants Ltd.</h2>

                    <p>Hello <strong>${email}</strong>,</p>
                    <p>We’re excited to let you know that your account has been created and you are now an <strong>Admin</strong> of NRC Educational Consultants Ltd.</p>

                    <p>Your login credentials are as follows:</p>
                    <div style="background: #f4f4f4; padding: 12px 20px; display: inline-block; border-radius: 6px; margin: 15px 0; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #2c3e50;">
                        ✉️ Email: ${email}<br/>
                        🔑 Password: ${password}
                    </div>

                    <p style="color:#e67e22;">
                        <strong>⚠️ Important:</strong> Please log in using these credentials and change your password immediately from your profile settings for security reasons.
                    </p>

                    <p style="margin-top: 20px;">Welcome aboard!<br/>
                    <strong>NRC Educational Consultants Ltd. Team</strong></p>
                </div>
            `
            sendEmail(email, "Welcome to NRC Educational Consultants Ltd. - Admin Access", content)
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "New Admin created!!!",
            data: result
        })
    }catch(err){
        console.log(err)
    }
}


const getAllAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("users")

        await authChecker(req, res, ["super_admin"])

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        // Filters
        const { name, email, status } = req.query

        const filter: any = { role: "admin" }

        if (name) filter.name = { $regex: name as string, $options: "i" } // case-insensitive search
        if (email) filter.email = { $regex: email as string, $options: "i" }
        if (status) filter.status = status; // e.g. "active" | "inactive"

        // Count total documents for pagination
        const totalDocs = await collection.countDocuments(filter)

        // Fetch paginated & filtered data
        const admins = await collection
            .find(filter, { projection: { password: 0 } })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Successful!!!",
            data: admins,
            meta: {
                total: totalDocs,
                page,
                limit,
                totalPages: Math.ceil(totalDocs / limit),
            },
        });
    } catch (err) {
        console.error(err);
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Internal server error",
            data: err,
        });
    }
};


const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const collection = db.collection("users");

    await authChecker(req, res, ["super_admin"]);


    const { email, name, status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.total as string) || 10;
    const skip = (page - 1) * limit;
    
   
    const filter: any = { role: { $nin: ["admin", "super_admin", "agent"] } };

    if (name) filter.name = { $regex: name as string, $options: "i" };
    if (email) filter.email = { $regex: email as string, $options: "i" };
    if (status) filter.status = status;


    const users = await collection
      .find(filter, { projection: { password: 0 } })
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .toArray();

    const totalCount = await collection.countDocuments(filter);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "successful!!!",
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      data: users,
    });
  } catch (err) {
    console.log(err);
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Internal server error",
      data: err,
    });
  }
};



const updateAdminStatus = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const id = req.params.id
        const status = req.params.status
        
        if(!id){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'Id required',
            })
        }

        
        // Role check
        await authChecker(req, res, ["super_admin"])
        
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
        
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data found!'
            })
        }

        const options = { upsert: true }
        const doc = {
            $set: {
                status:status,
            }
        }

        const admins = await collection.updateOne(query, doc, options)
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: admins,
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


const updateUserRole = async(req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const id = req.params.id
        const role = req.params.role
        
        if(!id){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'Id required',
            })
        }

        
        // Role check
        await authChecker(req, res, ["super_admin"])
        
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
        
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data found!'
            })
        }

        const options = { upsert: true }
        const doc = {
            $set: {
                role:role,
            }
        }

        const admins = await collection.updateOne(query, doc, options)
        
        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'successful!!!',
            data: admins,
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
    createAdmin,
    getAllAdmin,
    getAllUsers,
    updateAdminStatus,
    updateUserRole
}