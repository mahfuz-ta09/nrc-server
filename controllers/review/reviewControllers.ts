import e, { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}



const createReview = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection("users")

        const { comment, email } = req.body
        if (!comment || !email) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "You must login to comment.",
            });
        }


        const user = await collection.findOne({ email })


        if (!user) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "User not found.",
            });
        }


        if (user.review && user.review.trim() !== "") {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "You have already commented. Update or delete to comment again.",
            });
        }


        const result = await collection.updateOne(
            { email },
            { $set: { review: comment } }
        )

        if (!result.modifiedCount) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to add comment.",
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Comment added successfully!",
            data: result,
        });
    } catch (err) {
        console.error(err);
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Internal server error.",
            data: err,
        });
    }
}


const deleteReview = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const id  = req.params.id
        const query = { _id : new ObjectId(id)}

        const exist = await collection.findOne(query)
        if(!exist?.review){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'You are not logged in or never commented!',
            })
        }

                
        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user = await collection.findOne({ email: tEmail , status: tStatus , role: tRole })

        if(!user){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const insertedObject = {
            $unset: { review: "" }
        }
        
        const result = await collection.updateOne(query,insertedObject)
        if(result?.modifiedCount === 0){
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
            message: "You have deleted your comment!!!",
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


const getAllReview = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("users")

        const review = await collection.find({ 
            $and: [
                { review: { $exists: true } }, 
                { review: { $ne: "" } }, 
                { review: { $ne: null } }
            ] 
        })
        .sort({ "_id": -1 })
        .toArray();

        const countReviews = await collection.countDocuments({ 
            $and: [
                { review: { $exists: true } }, 
                { review: { $ne: "" } }, 
                { review: { $ne: null } }
            ] 
        });

        const metaData = {
            total: countReviews,
        };

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Review retrieval successful!!!",
            meta: metaData,
            data: review,
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




// const getSingleReview = async( req: Request , res: Response) =>{
//     try {
//         const db = getDb()
//         const collection = db.collection('users')

//         const id = req.params.id 
//         const query = { _id : new ObjectId(id)}
//         const review = await collection.findOne(query)

//         if(!review){
//             return sendResponse(res,{
//                 statusCode: 400,
//                 success: false,
//                 message: "No data exist!!!",
//               }
//           )
//         }

//         sendResponse(res,{
//             statusCode: 200,
//             success: false,
//             message: "Your comment",
//             data: review,
//         })
//     } catch (err) {
//         console.log(err)
//         sendResponse(res,{
//             statusCode: 400,
//             success: false,
//             message: 'Internel server error',
//             data: err
//         })
//     }
// }



const getReviewByPage = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("users")
        const { page, item } = req.params

        const pageNumber = parseInt(page as string, 10) || 1
        const itemsPerPage = parseInt(item as string, 10) || 3

        const filter = { 
            $and: [
                { review: { $exists: true } }, 
                { review: { $ne: "" } }, 
                { review: { $ne: null } }
            ] 
        }


        const totalReviews = await collection.countDocuments(filter)

        const reviews = await collection
            .find(filter, { projection: { image: 1, email:1 ,name:1 ,review: 1, createdAt: 1 } })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .toArray()
            

            
        const meta = {
            total: totalReviews,
            page: pageNumber,
            limit: itemsPerPage,
            totalPages: Math.ceil(totalReviews / itemsPerPage),
        };

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Review retrieval successful!",
            meta: meta,
            data: reviews,
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        })
    }
}



module.exports = {
    getReviewByPage,
    getAllReview,
    deleteReview,
    createReview
}