import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
const { getDb } = require('../../config/connectDB')


const createReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const { comment , email} = req.body
        const query = { email : email }
        

        if( !comment || !email ){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "You must login to comment"
            })
        }

        const exist = await collection.findOne({ review: { $exists: true, $ne: "" } })
        if(exist){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'You have already commented. Update or delete to comment again',
                data: exist,
            })
        }
       

        const insertedObject = {
            $set:{
                review:comment
            }
        }
        const result = await collection.updateOne(query,insertedObject)

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: "Failed to comment!!!",
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Commented successfully!!!",
            data: result,
        })
    } catch (err) {
        console.log(err)
        sendResponse(res,{
            statusCode: 500,
            success: false,
            message: 'Internel server error',
            data: err
        })
    }
}


const deleteReview = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('users')

        const id  = req.params.id
        const query = { _id : new ObjectId(id) }
        
        const exist = await collection.findOne(query)
        if(!exist?.review){
            return sendResponse(res,{
                statusCode: 500,
                success: false,
                message: 'You are not logged in or never commented!',
            })
        }

        const insertedObject = {
            $unset: { review: "" }
        }
        
        const result = await collection.updateOne(query,insertedObject)
        if(result?.modifiedCount === 0){
            console.log(result)
            return sendResponse(res,{
                statusCode: 500,
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
            statusCode: 500,
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

        const review = await collection.find({ review: { $exists: true } })
            .sort({ "_id": -1 })
            .toArray();

        const countReviews = await collection.countDocuments({ review: { $exists: true } })

        const metaData = {
            total: countReviews,
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Review retrieval successful!!!",
            meta: metaData,
            data: review,
        })
    }catch(err){
        console.error(err);
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Internal server error",
            data: err,
        })
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
//                 statusCode: 500,
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
//             statusCode: 500,
//             success: false,
//             message: 'Internel server error',
//             data: err
//         })
//     }
// }



const getReviewByPage = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("users");


        const pageNumber = parseInt(req.query.page as string, 10) || 1
        const itemsPerPage = parseInt(req.query.item as string, 10) || 3


        const filter = { review: { $exists: true } }
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
        res.status(500).json({
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