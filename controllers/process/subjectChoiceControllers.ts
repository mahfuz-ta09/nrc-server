import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
import authChecker from "../../helper/authChecker"
const { getDb } = require('../../config/connectDB')
import { format } from "date-fns";

interface AuthenticatedRequest extends Request {
    user?: any;
}

interface StudentProfile {
    educationLevel: string;
    gpa: number;
    gpaScale: string;
    englishProficiency: {
        testType: string;
        overallScore: number;
        listening?: number;
        reading?: number;
        writing?: number;
        speaking?: number;
    };
    previousSubjects: string[];
    preferredField: string;
    budget: number;
    age?: number;
}

interface MatchResult {
    subject: any;
    matchScore: number;
    matchReasons: string[];
}
 

const getCountries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res,["super_admin","admin","agent"]);
        const countries = await collection
            .find(
                { type: 'study-option', status: 'published' },
                { 
                    projection: { 
                        _id: 1, 
                        country: 1, 
                        slug: 1, 
                        currency: 1,
                        countryFlg: 1,
                        serial: 1
                    } 
                }
            )
            .sort({ serial: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: 'Countries fetched successfully',
            data: countries
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};


const getUniversitiesByCountry = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        const { countryId } = req.query;

        if (!countryId || typeof countryId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing country ID'
            });
        }

        const country = await collection.findOne(
            { _id: new ObjectId(countryId) },
            { projection: { universityList: 1, country: 1, currency: 1 } }
        );

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        
        const activeUniversities = (country.universityList || []).filter(
            (uni: any) => uni.status === 'active'
        );

        res.status(200).json({
            success: true,
            message: 'Universities fetched successfully',
            data: {
                country: country.country,
                currency: country.currency,
                universityList: activeUniversities
            }
        });
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error
        });
    }
};



export {
    getCountries,
    getUniversitiesByCountry,
};