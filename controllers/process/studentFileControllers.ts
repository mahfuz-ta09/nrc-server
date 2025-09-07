import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import authChecker from "../../helper/authChecker"



export const postStudentFIle = async(req:Request,res: Response) => {
    try{
        const db = getDb()
        const applicationsCollection = db.collection("application")
        const usersCollection = db.collection("user")
        await authChecker(req,res,['super_admin','admin','agent','sub_agent'])


        const { name , email } = req.body

        

    }catch(err){
        console.log(err)
        sendResponse(res,{
            message:"Something went wrong!",
            success:false,
            statusCode:400
        })
    }
}