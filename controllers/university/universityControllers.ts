import { Request , Response } from "express"
import { ObjectId } from "mongodb"
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"
const { getDb } = require('../../config/connectDB')


interface AuthenticatedRequest extends Request {
    user?: any
}



const createUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const { name, country, tuitionFee, requardQualification, 
            initialDepossit , englishTest , SCHOLARSHIP } = req.body        

        if(!country || !name || !tuitionFee){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'Country name required!!!',
            })
        }

        let cntry:any , cntryId, flg:any , flgId
        const uni = await collection.findOne({
            country: country.toUpperCase(),
            url:  { $exists: true},
            flag: { $exists: true},
        })


        if(uni){
            cntry = uni.url
            flg = uni.flag
        }else{
            const files:any = req.files
            if(files["file"]?.[0] || files["flag"]?.[0]){
                let local_country:any = await fileUploadHelper.uploadToCloud(files["file"]?.[0])
                let local_flag:any   = await fileUploadHelper.uploadToCloud(files["flag"]?.[0])

                cntryId = local_country.public_id
                flgId = local_flag.public_id

                cntry = local_country.url
                flg = local_flag.url
            }else{
                return sendResponse(res,{
                    statusCode: 400,
                    success: false,
                    message: "Flag and country image required for new country"
                })
            }
        }

        const insertedObject = {
            name:name,
            country:country.toUpperCase(),
            url:cntry,
            flag:flg,
            cntryId:cntryId,
            flgId:flgId,
            tuitionFee:tuitionFee,
            SCHOLARSHIP:SCHOLARSHIP,
            requardQualification:requardQualification,
            initialDepossit:initialDepossit,
            englishTest:englishTest,
        }

        const result = await collection.insertOne(insertedObject)

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Insertion failed!!!",
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Inserted successfully!!!",
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


const deleteUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const id  = req.params.id
        const query = { _id : new ObjectId(id) }
        const exist = await collection.findOne(query)
        const total = await collection.countDocuments({ country : exist?.country })
        
        if(!exist){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: 'No data exist',
                data: exist,
            })
        }

        if(total === 1){
            if(exist?.flgId) await fileUploadHelper.deleteFromCloud(exist?.flgId)
            if(exist?.cntryId) await fileUploadHelper.deleteFromCloud(exist?.cntryId)
        }

        const result = await collection.deleteOne(query)
        if(!result.acknowledged){
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
            message: "Successfully deleted!!!",
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

const editUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }


        const id = req.params.id
        const { name , country, tuitionFee, requardQualification, initialDepossit , 
            englishTest , SCHOLARSHIP } = req.body

        const query = { _id : new ObjectId(id) }

        const university = await collection.findOne(query)
        if(!university){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No university exist with the id!!!",
            })
        }
        
        let cntryId , flgId , flag , url

        const files:any = req.files
        if(files["file"]?.[0] || files["flag"]?.[0]){
            let local_country:any = await fileUploadHelper.uploadToCloud(files["file"]?.[0])
            let local_flag:any   = await fileUploadHelper.uploadToCloud(files["flag"]?.[0])

            cntryId = local_country.public_id
            flgId = local_flag.public_id

            url = local_country.url
            flag = local_flag.url
        }


        const field = {
            name:name?name:university?.name,
            country:country?country.toUpperCase():university?.country,
            url:url?url:university?.url,
            flag:flag?flag:university?.flag,
            cntryId:cntryId?cntryId:university?.cntryId,
            flgId:flgId?flgId:university?.flgId,
            tuitionFee:tuitionFee?tuitionFee:university?.tuitionFee,
            requardQualification:requardQualification?requardQualification:university?.requardQualification,
            initialDepossit:initialDepossit?initialDepossit:university?.initialDepossit,
            englishTest:englishTest?englishTest:university?.englishTest,
            SCHOLARSHIP:SCHOLARSHIP?SCHOLARSHIP:university?.SCHOLARSHIP,
        }

        const updateDoc = {
            $set: field,
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

const getAllUniversity = async( req: AuthenticatedRequest , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const university = await collection.find({}).sort({"_id": -1}).toArray()
        const countCourse     = await collection.countDocuments()

        const metaData = {
            page: 0,
            limit: 0,
            total: countCourse,
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            meta: metaData,
            data: university,
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


const getSingleUniversity = async( req: Request , res: Response) =>{
    try {
        const db = getDb()
        const collection = db.collection('university')

        const id = req.params.id 
        const query = { _id : new ObjectId(id)}
        const university = await collection.findOne(query,{projection: { courseContent: 0, studentData: 0 }})

        if(!university){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "No data exist!!!",
              }
          )
        }

        sendResponse(res,{
            statusCode: 200,
            success: false,
            message: "Showing university details",
            data: university,
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

const getUniOriginName = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('university');

        const country = await collection.aggregate([
            {
                $group: {
                    _id: "$country",
                    image: { $first: "$url" },
                    flag: { $first: "$flag" }
                }
            },
            {
                $project: {
                    _id: 1,
                    country: "$_id",
                    image: 1,
                    flag: 1,
                }
            }
        ]).toArray()


        const uniqueCountryCount = await collection.distinct("country")
        const totalUniqueCountries = uniqueCountryCount.length

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Course retrieval successful!!!',
            data: country,
            meta: {
                total: totalUniqueCountries
            }
        });
    } catch (err) {
        console.log(err)
        sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Internal server error',
            data: err
        })
    }
}


const getUniversityByCountry = async( req: Request , res: Response) =>{
    try {
        const db = getDb();
        const collection = db.collection("university");

        const country = req.params.country;
        
        const universities = await collection.find({ country: country }).toArray();
        
        if (universities.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No universities found for this country",
            })
        }

        res.status(200).json({
            success: true,
            message: "Universities retrieved successfully",
            data: universities,
        })
    } catch (error) {
        console.error("Error fetching universities:", error)
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        })
    }
}












const addUniversity = async(req: AuthenticatedRequest , res: Response) => {
    try{
        const db = getDb()
        const collection = db.collection('country-uni')
        const usersCollection = db.collection('users')

        const tEmail = req.user?.email || null
        const tRole = req.user?.role || null
        const tStatus = req.user?.status || null
        const user1 = await usersCollection.findOne({ email: tEmail , status: tStatus , role: tRole })
        
        if(!user1){
            return sendResponse( res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            })
        }

        const id = req.params.id

        const { englishProf , qualifications , universityName , lowFee , highFee , scholarship , initialDeposite , aboutUni } = req.body        
        const files:any = req.files

        
        if( !englishProf || !qualifications || !universityName  || !initialDeposite || !aboutUni || !files["universityImage"]?.[0]){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: `missing field is not allowed!`,
            })
        }

        
        const exist = await collection.findOne({ _id: new ObjectId(id),'universityList.universityName':universityName.toUpperCase() }) 
        if(exist){
            return sendResponse( res, {
                statusCode: 400,
                success: false,
                message: 'this university name already exist!!!',
            })
        }       
        const file:any = await fileUploadHelper.uploadToCloud(files["universityImage"]?.[0])

        const insertedObject = {
            englishProf:englishProf,
            qualifications:qualifications,
            universityName:universityName.toUpperCase(),
            lowFee:lowFee,
            highFee:highFee,
            scholarship:scholarship?scholarship:'-',
            initialDeposite:initialDeposite,
            aboutUni:aboutUni,
            subjects:  [],
            universityImage: {
                url: file?.url,
                public_id: file?.public_id
            }
        }
        
        const result = await collection.updateOne(
            {_id: new ObjectId(id)},
            {
                $push:{
                    universityList: insertedObject
                }
            }
        )

        if(!result.acknowledged){
            return sendResponse(res,{
                statusCode: 400,
                success: false,
                message: "Insertion failed!!!",
                data: result,
            })
        }

        sendResponse(res,{
            statusCode: 200,
            success: true,
            message: "Inserted successfully!!!",
            data: result,
        })
    }catch(error){
        console.error("Error fetching universities:", error)
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        })
    }
}


const deleteUniversityFromCountry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        const usersCollection = db.collection('users');

        const tEmail = req.user?.email || null;
        const tRole = req.user?.role || null;
        const tStatus = req.user?.status || null;

        const user1 = await usersCollection.findOne({ email: tEmail, status: tStatus, role: tRole });

        if (!user1) {
            return sendResponse(res, {
                statusCode: 411,
                success: false,
                message: 'Unauthorized!!!',
            });
        }

        const id = req.params.id;
        const university = req.params.university;

        if (!id || !university) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Id or university name missing!!!',
            });
        }

        
        const countryObj = await collection.findOne({
            _id: new ObjectId(id),
            'universityList.universityName': university.toUpperCase()
        });

        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'No matching university found!!!',
            });
        }

        
        const uniData = countryObj.universityList.find(
            (u:any) => u.universityName === university.toUpperCase()
        );

        if (uniData?.universityImage?.public_id) {
            await fileUploadHelper.deleteFromCloud(uniData.universityImage.public_id);
        }
        
        
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { universityList: { universityName: university.toUpperCase() } } }
        );

        if (result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Failed to delete university!!!',
            });
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'University deleted successfully!!!',
            data: result,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error,
        });
    }
};


const getUniversity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("country-uni");

        const { all, country, page: pageParam, total: totalParam } = req.query;
    
        const page = pageParam ? Number(pageParam) : undefined;
        const total = totalParam ? Number(totalParam) : undefined;

        let matchStage: any = {};
        if (country) {
            matchStage.country = (country as string).toUpperCase();
        }

        if (all === "all") {
            const countries = await collection.find(matchStage).toArray();
            const allUniversities = countries.flatMap((c:any) => c.universityList || []);
            return res.json({
                success: true,
                total: allUniversities.length,
                data: allUniversities
            });
        }

        if (!page || !total) {
            return res.status(400).json({
                success: false,
                message: "For paginated results, provide 'page' and 'total'."
            });
        }

        const pipeline: any[] = [
            { $match: matchStage },
            { $unwind: "$universityList" },
            {
                $addFields: {
                "universityList.countryId": "$_id" // attach country id to university object
                }
            },
            { $replaceRoot: { newRoot: "$universityList" } },
            { $skip: (page - 1) * total },
            { $limit: total }
        ];

        const universities = await collection.aggregate(pipeline).toArray();

        const countPipeline: any[] = [
            { $match: matchStage },
            { $unwind: "$universityList" },
            { $count: "count" }
        ];
        const countResult = await collection.aggregate(countPipeline).toArray();
        const totalCount = countResult[0]?.count || 0;

        res.json({
            success: true,
            meta: {
                page,
                total,
                totalCount
            },
            data: universities
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: "Internal Server Error",
            error,
        });
    }
};

const editUniversityField = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("country-uni");
        const usersCollection = db.collection("users");

        const tEmail = req.user?.email || null;
        const tRole = req.user?.role || null;
        const tStatus = req.user?.status || null;
        const user1 = await usersCollection.findOne({
            email: tEmail,
            status: tStatus,
            role: tRole
        });

        if (!user1) {
            return sendResponse(res, {
                statusCode: 411,
                success: false,
                message: "Unauthorized!!!"
            });
        }

        const id = req.params.id;
        const UniversityName  = req.params.universityName;

        const {
            englishProf,
            qualifications,
            universityName,
            lowFee,
            highFee,
            scholarship,
            initialDeposite,
            aboutUni
        } = req.body;

        
        const files: any = req.files;

        const existingDoc = await collection.findOne(
            {
                _id: new ObjectId(id),
                "universityList.universityName": UniversityName.toUpperCase()
            },
            { 
                projection: { "universityList.$": 1 } 
            }
        );

        if (!existingDoc || !existingDoc.universityList?.[0]) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "University not found!!!"
            });
        }

        const currentUni = existingDoc.universityList[0];

        
        let newImageData = currentUni.universityImage;
        if (files?.["universityImage"]?.[0]) {
            if (currentUni?.universityImage?.public_id) {
                await fileUploadHelper.deleteFromCloud(
                currentUni.universityImage.public_id
                );
            }
            const uploaded:any = await fileUploadHelper.uploadToCloud(
                files["universityImage"][0]
            );
            newImageData = {
                url: uploaded.url,
                public_id: uploaded.public_id
            };
        }


        const DELETE_MARKER = '-1'

        function mergeWithDelete<T extends Record<string, any>>(
                oldObj: T,
                newObj: Partial<T>,
                deleteMarker: any = DELETE_MARKER
            ): T {
                const result: T = { ...oldObj };
                
                for (const key in newObj) {
                    const typedKey = key as keyof T;
                    const value = newObj[typedKey];

                    if (value === deleteMarker) {
                        delete result[typedKey];
                    } else if (value !== undefined) {
                    result[typedKey] = value as T[keyof T];
                    }
                }

            return result;
        }


        const updatedUniversity = {
            englishProf: englishProf
                ? mergeWithDelete(currentUni.englishProf, englishProf, "-1")
                : currentUni.englishProf,

            qualifications: qualifications
                ? mergeWithDelete(currentUni.qualifications, qualifications, "-1")
                : currentUni.qualifications,

            universityName: universityName
                ? universityName.toUpperCase()
                : currentUni.universityName,

            lowFee: lowFee ?? currentUni.lowFee,
            highFee: highFee ?? currentUni.highFee,
            scholarship: scholarship ?? currentUni.scholarship,
            initialDeposite: initialDeposite ?? currentUni.initialDeposite,
            aboutUni: aboutUni ?? currentUni.aboutUni,

            subjects: currentUni.subjects ?? [],

            universityImage: newImageData ?? currentUni.universityImage,
        };



        
        const result = await collection.updateOne(
            {
                _id: new ObjectId(id),
                "universityList.universityName": UniversityName.toUpperCase()
            },
            {
                $set: {
                "universityList.$": updatedUniversity
                }
            }
        );

        if (!result.modifiedCount) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Update failed!!!",
                data: result
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Updated successfully!!!",
            data: result
        });
    } catch (error) {
        console.error("Error updating university:", error);
        res.status(400).json({
        success: false,
        message: "Internal Server Error",
        error
        });
    }
};


module.exports = {
    createUniversity,
    editUniversity,
    deleteUniversity,
    getAllUniversity,
    getSingleUniversity,
    getUniOriginName,
    getUniversityByCountry,



    addUniversity,
    deleteUniversityFromCountry,
    getUniversity,
    editUniversityField,
}