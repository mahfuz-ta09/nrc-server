import { ObjectId } from "mongodb"
import { format } from "date-fns";
import { Request , Response } from "express"
import sendResponse from "../../helper/sendResponse"
import authChecker from "../../helper/authChecker"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}


const getSubject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        
        const { countryId, universityId, page, total } = req.query as {
            page?: string;
            total?: string;
            countryId?: string;
            universityId?: string;
        };

        if (!countryId || typeof countryId !== "string") {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid or missing country ID",
            });
        }

        if (!universityId || typeof universityId !== "string") {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid or missing university ID",
            });
        }

        const country = await collection.findOne({
            _id: new ObjectId(countryId)
        });

        if (!country) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Country not found!!!"
            });
        }
        
        const university = country.universityList?.find(
            (u: any) => u.universityId === universityId
        );

        if (!university) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "University not found!!!"
            });
        }

        let subjects = university.subjects || [];
        const pageNum = parseInt(page || "1", 10);
        const totalNum = parseInt(total || "10", 10);
        const start = (pageNum - 1) * totalNum;
        const end = start + totalNum;
        
        const paginatedSubjects = subjects.slice(start, end);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Subjects fetched successfully!",
            data: {
                subjects: paginatedSubjects,
                total: subjects.length,
                page: pageNum,
                totalPages: Math.ceil(subjects.length / totalNum)
            }
        });

    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};


const addSubject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);
        
        const { countryId, universityId, countryName } = req.params;
        
        if (!countryId || !universityId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing country ID or university ID!!!",
            });
        }

        const {
            qualifications,
            subjectName,
            programLevel,
            degree,
            duration,
            programType,
            faculty,
            credits,
            modeOfStudy,
            language,
            intakes,
            cost,
            applicationDeadline,
            description,
            careerOpportunities,
            accreditation,
            placement
        } = req.body;
        
        if (!subjectName || !programLevel || !programType || !faculty || !credits || 
            !modeOfStudy || !language || !intakes || !placement || !cost || 
            !duration || !applicationDeadline) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing required subject fields!!!",
            });
        }

        const newSubject = {
            _id: new ObjectId(),
            subjectName,
            programLevel,
            degree: degree || '',
            duration: {
                value: Number(duration?.value || duration),
                unit: duration?.unit || 'months'
            },
            qualifications: qualifications || {},
            programType,
            faculty,
            credits: Number(credits),
            modeOfStudy,
            language,
            intakes,
            cost: Number(cost),
            applicationDeadline,
            description: description || '',
            careerOpportunities: careerOpportunities || '',
            accreditation: accreditation || '',
            placement,
            createdAt: format(new Date(), "MM/dd/yyyy"),
            updatedAt: format(new Date(), "MM/dd/yyyy")
        };

        const result = await collection.updateOne(
            { 
                _id: new ObjectId(countryId), 
                "universityList.universityId": universityId 
            },
            { 
                $push: { "universityList.$.subjects": newSubject } 
            }
        );

        if (result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to add subject!!!"
            });
        }
        
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Subject added successfully!",
            data: result
        });
    } catch (error) {
        console.error("Error adding subject:", error);
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};


const updateSubject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);

        const { countryId, universityId, subjectId } = req.params;
        const updateData = req.body;

        if (!countryId || !universityId || !subjectId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing required parameters!!!",
            });
        }

        // Build update object
        const updateFields: any = {};
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && updateData[key] !== null) {
                updateFields[`universityList.$[uni].subjects.$[subj].${key}`] = updateData[key];
            }
        });

        updateFields['universityList.$[uni].subjects.$[subj].updatedAt'] = format(new Date(), "MM/dd/yyyy");

        const result = await collection.updateOne(
            { 
                _id: new ObjectId(countryId)
            },
            { 
                $set: updateFields
            },
            { 
                arrayFilters: [ 
                    { "uni.universityId": universityId }, 
                    { "subj._id": new ObjectId(subjectId) } 
                ] 
            }
        );

        if (result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to update subject!!!"
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Subject updated successfully!",
        });

    } catch (error) {
        console.error("Error updating subject:", error);
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};


const deleteSubject = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);

        const { countryId, universityId, subjectId } = req.params;

        if (!countryId || !universityId || !subjectId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing required parameters!!!",
            });
        }

        const result = await collection.updateOne(
            { 
                _id: new ObjectId(countryId), 
                "universityList.universityId": universityId 
            },
            { 
                $pull: { 
                    "universityList.$.subjects": { 
                        _id: new ObjectId(subjectId) 
                    } 
                } 
            }
        );

        if (result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Failed to delete subject!!!"
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Subject deleted successfully!",
        });
    } catch (error) {
        console.error("Error deleting subject:", error);
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};



module.exports =  { 
    getSubject, 
    addSubject, 
    updateSubject, 
    deleteSubject 
};