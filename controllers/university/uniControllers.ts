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

const addUniversity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["admin", "super_admin"]);

        const id = req.params.id;

        const {
            campusHousing,internshipOpportunities,workPermitAvailable,postStudyWorkVisa,partTimeWorkAllowed,
            englishProf,qualifications,universityName,lowFee,highFee,scholarship,initialDeposite,aboutUni,
            minimumGPA,gpaScale,requiredEducationLevel,prerequisiteSubjects,preferredBackgrounds,
            city,state,address,website,admissionEmail,phone,applicationFee,currency,feeStructure,
            submissionMethod,portalUrl,apiEndpoint,hasAPIIntegration,processingTime,
            worldRanking,nationalRanking,accreditation,intakes,
            acceptanceRate,internationalStudentRatio,tags,
        } = req.body;

        const files: any = req.files;

        if (!englishProf || !qualifications || !universityName || !initialDeposite || !aboutUni || !files["universityImage"]?.[0]) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `missing field is not allowed!`,
            });
        }

        const exist = await collection.findOne({
            _id: new ObjectId(id),
            'universityList.universityName': universityName.toUpperCase()
        });
        
        if (exist) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'this university name already exist!!!',
            });
        }

        const file: any = await fileUploadHelper.uploadToCloud(files["universityImage"]?.[0]);
        const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let parsedEnglishProf = englishProf;
        if (typeof englishProf === 'string') {
            try {
                parsedEnglishProf = JSON.parse(englishProf);
            } catch (e) {
                parsedEnglishProf = englishProf;
            }
        }

        const acceptedTests = convertEnglishProfToTests(parsedEnglishProf);

        let parsedQualifications = qualifications;
        if (typeof qualifications === 'string') {
        try {
            parsedQualifications = JSON.parse(qualifications);
        } catch (e) {
            parsedQualifications = [qualifications];
        }
        }

        
        let parsedIntakes = intakes ? (typeof intakes === 'string' ? JSON.parse(intakes) : intakes) : [
            {
                name: 'Fall 2025',
                startMonth: 'September',
                applicationDeadline: '2025-06-30',
                isOpen: true
            },
            {
                name: 'Spring 2026',
                startMonth: 'January',
                applicationDeadline: '2025-10-31',
                isOpen: true
            }
        ];

        let parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
        let parsedAccreditation = accreditation ? (typeof accreditation === 'string' ? JSON.parse(accreditation) : accreditation) : [];
        let parsedPrerequisites = prerequisiteSubjects ? (typeof prerequisiteSubjects === 'string' ? JSON.parse(prerequisiteSubjects) : prerequisiteSubjects) : [];
        let parsedBackgrounds = preferredBackgrounds ? (typeof preferredBackgrounds === 'string' ? JSON.parse(preferredBackgrounds) : preferredBackgrounds) : [];
        const insertedObject = {
            universityId: generateId(),
            universityName: universityName.toUpperCase(),
            universitySlug: universityName.toLowerCase().replace(/\s+/g, '-'),
            aboutUni: aboutUni,
            
            universityImage: {
                url: file?.secure_url,
                publicId: file?.public_id
            },
        
            location: {
                city: city || '',
                state: state || '',
                address: address || '',
            },
        
            contact: {
                website: website || '',
                email: admissionEmail || '',
                phone: phone || '',
                admissionEmail: admissionEmail || '',
            },
        
            
            tuitionFees: {
                currency: currency || 'USD',
                lowFee: Number(lowFee) || 0,
                highFee: Number(highFee) || 0,
                feeStructure: feeStructure || 'per_year',
                applicationFee: Number(applicationFee) || 0,
            },
        
            scholarship: {
                available: scholarship && scholarship !== '-' && scholarship !== '',
                amount: scholarship || '-',
                types: [],
                eligibilityCriteria: '',
            },
        
            initialDeposite: Number(initialDeposite) || 0,
            rankings: {
                worldRanking: worldRanking ? Number(worldRanking) : undefined,
                nationalRanking: nationalRanking ? Number(nationalRanking) : undefined,
                subjectRankings: [],
            },
        
            accreditation: parsedAccreditation,
            admissionRequirements: {
                minimumGPA: {
                scale: gpaScale || '4.0',
                value: Number(minimumGPA) || 2.5,
                },
                gpaEquivalents: generateGPAEquivalents(Number(minimumGPA) || 2.5, gpaScale || '4.0'),
                requiredEducationLevel: requiredEducationLevel || 'bachelors',
                prerequisiteSubjects: parsedPrerequisites,
                preferredBackgrounds: parsedBackgrounds,
            },
        
            englishProf: parsedEnglishProf,
            qualifications: Array.isArray(parsedQualifications) ? parsedQualifications : [parsedQualifications],
            subjects: [],
            intakes: parsedIntakes,
            applicationProcess: {
                submissionMethod: submissionMethod || 'manual',
                portalUrl: portalUrl || '',
                apiEndpoint: apiEndpoint || '',
                hasAPIIntegration: hasAPIIntegration === 'true' || hasAPIIntegration === true || false,
                processingTime: processingTime || '4-6 weeks',
            },
            studentProfile: {
                averageGPA: undefined,
                acceptanceRate: acceptanceRate ? Number(acceptanceRate) : undefined,
                internationalStudentRatio: internationalStudentRatio ? Number(internationalStudentRatio) : undefined,
                popularNationalities: [],
            },
            tags: parsedTags,
            features: {
                campusHousing: campusHousing === 'true' || campusHousing === true || false,
                internshipOpportunities: internshipOpportunities === 'true' || internshipOpportunities === true || false,
                workPermitAvailable: workPermitAvailable === 'true' || workPermitAvailable === true || false,
                postStudyWorkVisa: postStudyWorkVisa === 'true' || postStudyWorkVisa === true || false,
                partTimeWorkAllowed: partTimeWorkAllowed === 'true' || partTimeWorkAllowed === true || false,
            },
            status: 'active',
            popularityScore: 0,
            lastUpdated: format(new Date(), "MM/dd/yyyy"),
            createdAt: format(new Date(), "MM/dd/yyyy"),
        };

        const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $push: {
            universityList: insertedObject
            }
        }
        );

        if (!result.acknowledged) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Insertion failed!!!",
            data: result,
        });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "University inserted successfully!!!",
            data: result,
        });
        
    } catch (err) {
        console.log(err);
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: 'Internal server error',
            data: err
        });
    }
};

const getUniversity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection("country-uni");

        const { all, country, page: pageParam, total: totalParam, uniName } = req.query;
        
        const page = pageParam ? Number(pageParam) : undefined;
        const total = totalParam ? Number(totalParam) : undefined;

        let matchStage: any = {};
        
        if (country && country !== '') {
            if (ObjectId.isValid(country as string)) {
                matchStage._id = new ObjectId(country as string);
            } else {
                matchStage.country = (country as string).toLowerCase();
            }
        }

        
        if (all === "all") {
            const countries = await collection.find(matchStage).toArray();
            
            if (!countries || countries.length === 0) {
                return sendResponse(res, {
                    statusCode: 404,
                    success: false,
                    message: "No countries found matching the criteria",
                    data: []
                });
            }

            let allUniversities = countries.flatMap((c: any) => {
                const universities = c.universityList || [];
                
                return universities.map((uni: any) => ({
                    ...uni,
                    countryId: c._id,
                    countryName: c.country,
                    countrySlug: c.slug
                }));
            });

            if (uniName && uniName !== '') {
                const uniNameLower = (uniName as string).toLowerCase();
                allUniversities = allUniversities.filter((u: any) =>
                    u.universityName?.toLowerCase().includes(uniNameLower)
                );
            }
            
            return sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "All universities retrieved successfully",
                meta: {
                    totalCount: allUniversities.length,
                },
                data: allUniversities
            });
        }

        if (!page || !total) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "For paginated results, provide 'page' and 'total' query parameters.",
                data: []
            });
        }

        
        const pipeline: any[] = [
            { $match: matchStage },
            { $unwind: "$universityList" },
            {
                $addFields: {
                    "universityList.countryId": "$_id",
                    "universityList.countryName": "$country",
                    "universityList.countrySlug": "$slug"
                }
            },
            { $replaceRoot: { newRoot: "$universityList" } }
        ];

        
        if (uniName && uniName !== '') {
            const regex = new RegExp(uniName as string, "i");
            pipeline.push({ $match: { universityName: regex } });
        }

        pipeline.push({ $skip: (page - 1) * total });
        pipeline.push({ $limit: total });

        const universities = await collection.aggregate(pipeline).toArray();

        // ========== COUNT TOTAL (for pagination metadata) ==========
        const countPipeline: any[] = [
            { $match: matchStage },
            { $unwind: "$universityList" }
        ];

        if (uniName && uniName !== '') {
            const regex = new RegExp(uniName as string, "i");
            countPipeline.push({ $match: { "universityList.universityName": regex } });
        }

        countPipeline.push({ $count: "count" });

        const countResult = await collection.aggregate(countPipeline).toArray();
        const totalCount = countResult[0]?.count || 0;

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / total);
        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Universities retrieved successfully",
            meta: {
                page,
                limit: total,
                totalCount,
                totalPages,
                // hasNextPage: page < totalPages,
                // hasPrevPage: page > 1,
                // filtered: !!(uniName && uniName !== ''),
                // countryFilter: !!(country && country !== '')
            },
            data: universities
        });

    } catch (err: any) {
        console.error("Error in getUniversity:", err);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: 'Internal server error',
            data: err.message
        });
    }
};


const editUniversityField = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const collection = db.collection("country-uni");
    await authChecker(req, res, ["admin", "super_admin"]);

    const id = req.params.id;
    const universityId = req.params.universityId ;

    const {
        campusHousing,internshipOpportunities,workPermitAvailable,postStudyWorkVisa,partTimeWorkAllowed,
        englishProf,qualifications,universityName,lowFee,highFee,scholarship,initialDeposite,aboutUni,
        city,state,address,website,admissionEmail,phone,applicationFee,currency,feeStructure,
        minimumGPA,gpaScale,requiredEducationLevel,prerequisiteSubjects,preferredBackgrounds,
        submissionMethod,portalUrl,apiEndpoint,hasAPIIntegration,processingTime,
        worldRanking,nationalRanking,accreditation,intakes,
        acceptanceRate,internationalStudentRatio,tags,status,
    } = req.body;

    const files: any = req.files;
    const existingDoc = await collection.findOne({
            _id: new ObjectId(id),"universityList.universityId": universityId
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
        if (currentUni?.universityImage?.publicId) {
            await fileUploadHelper.deleteFromCloud(currentUni.universityImage.publicId);
        }
        const uploaded: any = await fileUploadHelper.uploadToCloud(files["universityImage"][0]);
        newImageData = {
            url: uploaded.secure_url,
            publicId: uploaded.public_id
        };
    }

    const safeParse = (value: any, fallback: any = undefined) => {
        if (value === undefined) return fallback;
        if (typeof value === 'string') {
            try {
            return JSON.parse(value);
            } catch (e) {
            return value;
            }
        }
        return value;
    };

    
    const updatedUniversity = {
        universityId: universityId,
        
        
        universityName: universityName ? universityName.toUpperCase() : currentUni.universityName,
        universitySlug: universityName 
            ? universityName.toLowerCase().replace(/\s+/g, '-')
            : currentUni.universitySlug || currentUni.universityName.toLowerCase().replace(/\s+/g, '-'),
        aboutUni: aboutUni ?? currentUni.aboutUni,
        
        universityImage: newImageData,
        location: {
            city: city ?? currentUni.location?.city ?? '',
            state: state ?? currentUni.location?.state ?? '',
            address: address ?? currentUni.location?.address ?? '',
        },
      
        contact: {
            website: website ?? currentUni.contact?.website ?? '',
            email: admissionEmail ?? currentUni.contact?.email ?? '',
            phone: phone ?? currentUni.contact?.phone ?? '',
            admissionEmail: admissionEmail ?? currentUni.contact?.admissionEmail ?? '',
        },
        
        tuitionFees: {
            currency: currency ?? currentUni.tuitionFees?.currency ?? currentUni.currency ?? 'USD',
            lowFee: lowFee !== undefined ? Number(lowFee) : (currentUni.tuitionFees?.lowFee ?? currentUni.lowFee ?? 0),
            highFee: highFee !== undefined ? Number(highFee) : (currentUni.tuitionFees?.highFee ?? currentUni.highFee ?? 0),
            feeStructure: feeStructure ?? currentUni.tuitionFees?.feeStructure ?? 'per_year',
            applicationFee: applicationFee !== undefined ? Number(applicationFee) : (currentUni.tuitionFees?.applicationFee ?? 0),
        },
      
        scholarship: {
            available: scholarship !== undefined 
            ? (scholarship && scholarship !== '-' && scholarship !== '')
            : (currentUni.scholarship?.available ?? false),
            amount: scholarship ?? currentUni.scholarship?.amount ?? currentUni.scholarship ?? '-',
            types: currentUni.scholarship?.types || [],
            eligibilityCriteria: currentUni.scholarship?.eligibilityCriteria || '',
        },
      
        initialDeposite: initialDeposite !== undefined ? Number(initialDeposite) : currentUni.initialDeposite,
      
        rankings: {
            worldRanking: worldRanking !== undefined ? Number(worldRanking) : currentUni.rankings?.worldRanking,
            nationalRanking: nationalRanking !== undefined ? Number(nationalRanking) : currentUni.rankings?.nationalRanking,
            subjectRankings: currentUni.rankings?.subjectRankings || [],
        },
      
        accreditation: accreditation !== undefined ? safeParse(accreditation, []) : (currentUni.accreditation || []),
        admissionRequirements: {
            minimumGPA: {
            scale: gpaScale ?? currentUni.admissionRequirements?.minimumGPA?.scale ?? '4.0',
            value: minimumGPA !== undefined 
                ? Number(minimumGPA) 
                : (currentUni.admissionRequirements?.minimumGPA?.value ?? 2.5),
            },
            gpaEquivalents: minimumGPA !== undefined
            ? generateGPAEquivalents(Number(minimumGPA), gpaScale || '4.0')
            : (currentUni.admissionRequirements?.gpaEquivalents || []),
            requiredEducationLevel: requiredEducationLevel ?? currentUni.admissionRequirements?.requiredEducationLevel ?? 'bachelors',
            prerequisiteSubjects: prerequisiteSubjects !== undefined 
            ? safeParse(prerequisiteSubjects, []) 
            : (currentUni.admissionRequirements?.prerequisiteSubjects || []),
            preferredBackgrounds: preferredBackgrounds !== undefined 
            ? safeParse(preferredBackgrounds, []) 
            : (currentUni.admissionRequirements?.preferredBackgrounds || []),
        },
        
        englishProf: englishProf ? safeParse(englishProf) : currentUni.englishProf,
        qualifications: qualifications 
            ? (Array.isArray(safeParse(qualifications)) ? safeParse(qualifications) : [safeParse(qualifications)])
            : currentUni.qualifications,
      
            
        subjects: currentUni.subjects ?? [],
        intakes: intakes !== undefined ? safeParse(intakes, []) : (currentUni.intakes || []),
        applicationProcess: {
            submissionMethod: submissionMethod ?? currentUni.applicationProcess?.submissionMethod ?? 'manual',
            portalUrl: portalUrl ?? currentUni.applicationProcess?.portalUrl ?? '',
            apiEndpoint: apiEndpoint ?? currentUni.applicationProcess?.apiEndpoint ?? '',
            hasAPIIntegration: hasAPIIntegration !== undefined 
            ? (hasAPIIntegration === 'true' || hasAPIIntegration === true)
            : (currentUni.applicationProcess?.hasAPIIntegration ?? false),
            processingTime: processingTime ?? currentUni.applicationProcess?.processingTime ?? '4-6 weeks',
        },
       
        studentProfile: {
            averageGPA: currentUni.studentProfile?.averageGPA,
            acceptanceRate: acceptanceRate !== undefined 
            ? Number(acceptanceRate) 
            : currentUni.studentProfile?.acceptanceRate,
            internationalStudentRatio: internationalStudentRatio !== undefined 
            ? Number(internationalStudentRatio) 
            : currentUni.studentProfile?.internationalStudentRatio,
            popularNationalities: currentUni.studentProfile?.popularNationalities || [],
        },
       
        tags: tags !== undefined ? safeParse(tags, []) : (currentUni.tags || []),
        
        
        features: {
            campusHousing: campusHousing !== undefined 
            ? (campusHousing === 'true' || campusHousing === true)
            : (currentUni.features?.campusHousing ?? false),
            internshipOpportunities: internshipOpportunities !== undefined 
            ? (internshipOpportunities === 'true' || internshipOpportunities === true)
            : (currentUni.features?.internshipOpportunities ?? false),
            workPermitAvailable: workPermitAvailable !== undefined 
            ? (workPermitAvailable === 'true' || workPermitAvailable === true)
            : (currentUni.features?.workPermitAvailable ?? false),
            postStudyWorkVisa: postStudyWorkVisa !== undefined 
            ? (postStudyWorkVisa === 'true' || postStudyWorkVisa === true)
            : (currentUni.features?.postStudyWorkVisa ?? false),
            partTimeWorkAllowed: partTimeWorkAllowed !== undefined 
            ? (partTimeWorkAllowed === 'true' || partTimeWorkAllowed === true)
            : (currentUni.features?.partTimeWorkAllowed ?? false),
        },
      
        status: status ?? currentUni.status ?? 'active',
        popularityScore: currentUni.popularityScore ?? 0,
        lastUpdated: format(new Date(), "MM/dd/yyyy"),
        createdAt: currentUni.createdAt,
    };

    
    const result = await collection.updateOne({
        _id: new ObjectId(id),
        "universityList.universityId": universityId
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
      message: "University updated successfully!!!",
      data: result
    });
    
  } catch (err) {
    console.log(err);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: 'Internal server error',
      data: err
    });
  }
};


const deleteUniversity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const collection = db.collection('country-uni')
        await authChecker(req, res, ["admin","super_admin"])

        const id = req.params.id
        const universityId = req.params.universityId

        if (!id || !universityId) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Id or university name missing!!!',
            })
        }

        const countryObj = await collection.findOne({
            _id: new ObjectId(id),
            'universityList.universityId': universityId
        })

        if (!countryObj) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'No matching university found!!!',
            })
        }

        
        const uniData = countryObj.universityList.find(
            (u:any) => u.universityId === universityId
        )

        if(uniData?.subjects?.length>0){
            return sendResponse(res,{
                statusCode:400,
                success: false,
                data: "University containing subjects cant be deleted"
            })
        }

        if (uniData?.universityImage?.publicId) {
            await fileUploadHelper.deleteFromCloud(uniData.universityImage.publicId)
        }
        
        
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { universityList: { universityId: universityId } } }
        )

        if (result.modifiedCount === 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Failed to delete university!!!',
            })
        }

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'University deleted successfully!!!',
            data: result,
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error,
        })
    }
}


// const getUniversityById = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const db = getDb();
//         const collection = db.collection("country-uni");
//         const { countryId, universityId } = req.params;

//         if (!ObjectId.isValid(countryId)) {
//             return sendResponse(res, {
//                 statusCode: 400,
//                 success: false,
//                 message: "Invalid country ID format"
//             });
//         }

//         const country = await collection.findOne(
//             { 
//                 _id: new ObjectId(countryId),
//                 "universityList.universityId": universityId
//             },
//             {
//                 projection: {
//                     "universityList.$": 1,
//                     country: 1,
//                     slug: 1,
//                     currency: 1
//                 }
//             }
//         );

//         if (!country || !country.universityList || country.universityList.length === 0) {
//             return sendResponse(res, {
//                 statusCode: 404,
//                 success: false,
//                 message: "University not found"
//             });
//         }

//         const university = {
//             ...country.universityList[0],
//             countryId: country._id,
//             countryName: country.country,
//             countrySlug: country.slug,
//             countryCurrency: country.currency
//         };

//         return sendResponse(res, {
//             statusCode: 200,
//             success: true,
//             message: "University retrieved successfully",
//             data: university
//         });

//     } catch (err: any) {
//         console.error("Error in getUniversityById:", err);
//         return sendResponse(res, {
//             statusCode: 500,
//             success: false,
//             message: 'Internal server error',
//             error: err.message
//         });
//     }
// };

// const searchUniversities = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const db = getDb();
//         const collection = db.collection("country-uni");
//         const { query, country, limit = 10 } = req.query;

//         if (!query || query === '') {
//             return sendResponse(res, {
//                 statusCode: 400,
//                 success: false,
//                 message: "Search query is required"
//             });
//         }

//         let matchStage: any = {};
        
//         if (country && country !== '') {
//             if (ObjectId.isValid(country as string)) {
//                 matchStage._id = new ObjectId(country as string);
//             } else {
//                 matchStage.country = (country as string).toLowerCase();
//             }
//         }

//         const searchRegex = new RegExp(query as string, "i");

//         const pipeline: any[] = [
//             { $match: matchStage },
//             { $unwind: "$universityList" },
//             {
//                 $match: {
//                     $or: [
//                         { "universityList.universityName": searchRegex },
//                         { "universityList.aboutUni": searchRegex },
//                         { "universityList.location.city": searchRegex }
//                     ]
//                 }
//             },
//             {
//                 $addFields: {
//                     "universityList.countryId": "$_id",
//                     "universityList.countryName": "$country",
//                     "universityList.countrySlug": "$slug"
//                 }
//             },
//             { $replaceRoot: { newRoot: "$universityList" } },
//             { $limit: Number(limit) }
//         ];

//         const results = await collection.aggregate(pipeline).toArray();

//         return sendResponse(res, {
//             statusCode: 200,
//             success: true,
//             message: "Search completed successfully",
//             meta: {
//                 query,
//                 resultCount: results.length,
//                 limit: Number(limit)
//             },
//             data: results
//         });

//     } catch (err: any) {
//         console.error("Error in searchUniversities:", err);
//         return sendResponse(res, {
//             statusCode: 500,
//             success: false,
//             message: 'Internal server error',
//             error: err.message
//         });
//     }
// };

// ========== HELPER: GET UNIVERSITIES BY COUNTRY SLUG ==========
// const getUniversitiesByCountrySlug = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const db = getDb();
//         const collection = db.collection("country-uni");
//         const { slug } = req.params;
//         const { page = 1, limit = 10 } = req.query;

//         const country = await collection.findOne({ slug });

//         if (!country) {
//             return sendResponse(res, {
//                 statusCode: 404,
//                 success: false,
//                 message: "Country not found"
//             });
//         }

//         const universities = country.universityList || [];
//         const totalCount = universities.length;
//         const totalPages = Math.ceil(totalCount / Number(limit));
//         const startIndex = (Number(page) - 1) * Number(limit);
//         const endIndex = startIndex + Number(limit);

//         const paginatedUniversities = universities.slice(startIndex, endIndex).map((uni: any) => ({
//             ...uni,
//             countryId: country._id,
//             countryName: country.country,
//             countrySlug: country.slug
//         }));

//         return sendResponse(res, {
//             statusCode: 200,
//             success: true,
//             message: "Universities retrieved successfully",
//             meta: {
//                 page: Number(page),
//                 limit: Number(limit),
//                 totalCount,
//                 totalPages,
//             },
//             data: paginatedUniversities
//         });

//     } catch (err: any) {
//         console.error("Error in getUniversitiesByCountrySlug:", err);
//         return sendResponse(res, {
//             statusCode: 500,
//             success: false,
//             message: 'Internal server error',
//             error: err.message
//         });
//     }
// };




function convertEnglishProfToTests(englishProf: any): any[] {
    const tests: any[] = [];

    if (!englishProf) return tests;
    if (englishProf.IELTS || englishProf.ielts) {
            const ielts = englishProf.IELTS || englishProf.ielts;
            tests.push({
            testType: 'IELTS',
            minimumOverallScore: Number(ielts.overall || ielts.overallScore || 6.5),
            sectionRequirements: {
                reading: Number(ielts.reading || 6.0),
                writing: Number(ielts.writing || 6.0),
                listening: Number(ielts.listening || 6.0),
                speaking: Number(ielts.speaking || 6.0),
            }
        });
    }

    if (englishProf.TOEFL || englishProf.toefl) {
        const toefl = englishProf.TOEFL || englishProf.toefl;
        tests.push({
        testType: 'TOEFL',
        minimumOverallScore: Number(toefl.overall || toefl.totalScore || 90),
        sectionRequirements: {
                reading: Number(toefl.reading || 22),
                writing: Number(toefl.writing || 21),
                listening: Number(toefl.listening || 22),
                speaking: Number(toefl.speaking || 23),
            }
        });
    }

    if (englishProf.PTE || englishProf.pte) {
            const pte = englishProf.PTE || englishProf.pte;
            tests.push({
            testType: 'PTE',
            minimumOverallScore: Number(pte.overall || pte.overallScore || 58),
        });
    }

    if (englishProf.Duolingo || englishProf.duolingo) {
            const duolingo = englishProf.Duolingo || englishProf.duolingo;
            tests.push({
            testType: 'Duolingo',
            minimumOverallScore: Number(duolingo.overall || duolingo.score || 105),
        });
    }

    if (tests.length === 0) {
        tests.push({
        testType: 'IELTS',
        minimumOverallScore: 6.5,
            sectionRequirements: {
                reading: 6.0,
                writing: 6.0,
                listening: 6.0,
                speaking: 6.0,
            }
        });
    }

    return tests;
}
function generateGPAEquivalents(gpaValue: number, currentScale: string): any[] {
    const equivalents: any[] = [];

    let normalizedGPA = gpaValue;
    if (currentScale === '100') normalizedGPA = gpaValue / 25;
    else if (currentScale === '10.0') normalizedGPA = gpaValue / 2.5;
    else if (currentScale === '5.0') normalizedGPA = gpaValue / 1.25;

    equivalents.push({ scale: '4.0', minimumValue: Number(normalizedGPA.toFixed(2)) });
    equivalents.push({ scale: '5.0', minimumValue: Number((normalizedGPA * 1.25).toFixed(2)) });
    equivalents.push({ scale: '10.0', minimumValue: Number((normalizedGPA * 2.5).toFixed(2)) });
    equivalents.push({ scale: '100', minimumValue: Number((normalizedGPA * 25).toFixed(2)) });

    return equivalents;
}


export { addUniversity, editUniversityField, getUniversity , deleteUniversity };