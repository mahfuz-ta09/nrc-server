const bcrypt = require("bcrypt")
import { ObjectId } from "mongodb";
import { format } from "date-fns";
import sendEmail from "../../helper/sendEmail";
const { getDb } = require("../../config/connectDB")
import authChecker from "../../helper/authChecker";
import sendResponse from "../../helper/sendResponse";
import { fileUploadHelper } from "../../helper/fileUploadHealper";
import { Response, Request } from "express";


const emaiReg =
  /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


interface AuthenticatedRequest extends Request {
    user?: any;
}

  
const makeEmptyUniversity = (overrides: any = {}) => {
    return {
        universityId: overrides.universityId || "",
        universityName: overrides.universityName || "",
        program: overrides.program || "",
        intake: overrides.intake || "",
        submissionMethod: overrides.submissionMethod || "manual",
        apiIntegration: overrides.apiIntegration || {
            enabled: false,
            universityApiEndpoint: "",
            lastSyncedAt: "",
            autoSubmitEnabled: false,
            apiStatus: "disconnected",
            errorMessage: "",
        },
        manualSubmission: overrides.manualSubmission || {
            portalUrl: "",
            hasCredentials: false,
            credentialsId: "",
            submissionSteps: [],
            lastPortalCheckAt: "",
        },
        emailSubmission: overrides.emailSubmission || {
            recipientEmail: "",
            ccEmails: [],
            emailTemplate: "",
            attachmentRequired: false,
            sentAt: "",
            emailId: "",
        },

        status: overrides.status || {
            current: "draft",
            submittedAt: "",
            acknowledgedAt: "",
            lastStatusCheck: format(new Date(), "MM/dd/yyyy"),
            responseDeadline: "",
            finalDecision: undefined,
            decisionDate: "",
            decisionNotes: "",
        },

        references: overrides.references || {
            applicationId: "",
            referenceNumber: "",
            trackingUrl: "",
        },

        submittedDocuments: Array.isArray(overrides.submittedDocuments)
        ? overrides.submittedDocuments
        : [],

        requirements: overrides.requirements || {
            minimumGPA: undefined,
            englishTestRequired: false,
            additionalDocuments: [],
            interviewRequired: false,
            applicationFee: undefined,
            feePaid: false,
            feePaymentDate: "",
            feeReceiptUrl: "",
        },

        assignedTo: overrides.assignedTo || undefined,

        notes: Array.isArray(overrides.notes) ? overrides.notes : [],

        reminders: Array.isArray(overrides.reminders) ? overrides.reminders : [],

        timeline: Array.isArray(overrides.timeline) ? overrides.timeline : [],

        priority: overrides.priority || 5,
        isPriority: overrides.isPriority || false,

        createdAt: overrides.createdAt || format(new Date(), "MM/dd/yyyy"),
        updatedAt: overrides.updatedAt || format(new Date(), "MM/dd/yyyy"),
    };
};


const normalizeUniversityApplicationsPayload = (payloadValue: any) => {
    let entries: any[] = [];

    if (!payloadValue) return [];

    if (typeof payloadValue === "string") {
        try {
            const parsed = JSON.parse(payloadValue);
            entries = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            entries = [];
        }
    } else if (Array.isArray(payloadValue)) {
        entries = payloadValue;
    } else if (typeof payloadValue === "object") {
        entries = [payloadValue];
    } else {
        entries = [];
    }

    return entries.map((entry: any) => makeEmptyUniversity(entry));
};


const ensureDefaultsForInsert = (obj: any, reqUser: any) => {
    return {
      permission: {
        permission_personalInfo: false,
        permission_englishProficiency: false,
        permission_prefferedUniSub: false,
        permission_studentsFile: false,
        ...(obj.permission || {}),
      },

      name: obj.name || "",
      email: obj.email || "",
      phone: obj.phone || "",
      alternativePhone: obj.alternativePhone || "",
      dob: obj.dob || "",
      passportNo: obj.passportNo || "",
      currentAddress: obj.currentAddress || "",
      countryCitizen: obj.countryCitizen || "",
      refusedCountry: Array.isArray(obj.refusedCountry) ? obj.refusedCountry : (obj.refusedCountry ? (() => { try { return JSON.parse(obj.refusedCountry) } catch { return [] } })() : []),
      gender: obj.gender || "",
      maritalStatus: obj.maritalStatus || "",

      englishProficiency: obj.englishProficiency ? (typeof obj.englishProficiency === "string" ? (() => { try { return JSON.parse(obj.englishProficiency) } catch { return {} } })() : obj.englishProficiency) : {},
      academicInfo: obj.academicInfo ? (typeof obj.academicInfo === "string" ? (() => { try { return JSON.parse(obj.academicInfo) } catch { return [] } })() : obj.academicInfo) : [],
      preferredUniversities: obj.preferredUniversities ? (typeof obj.preferredUniversities === "string" ? (() => { try { return JSON.parse(obj.preferredUniversities) } catch { return [] } })() : obj.preferredUniversities) : [],
      files: Array.isArray(obj.files) ? obj.files : [],

      history: Array.isArray(obj.history) ? obj.history : [
        {
          comment: "Application Open",
          stage: "created",
          by: {
            id: reqUser?.id || "",
            email: reqUser?.email || "",
            role: reqUser?.role || "",
          },
          date: format(new Date(), "MM/dd/yyyy"),
        },
      ],

      communication: Array.isArray(obj.communication) ? obj.communication : [],

      applicationState: obj.applicationState || {
        personalInfo: { complete: false, verified: false },
        englishProficiency: { complete: false, verified: false },
        prefferedUniSub: { complete: false, verified: false },
        studentsFile: { complete: false, verified: false },
        applicationFinished: { finished: false, archived: false },
      },

      progress: obj.progress || {
        submitted: false,
        verified: false,
        underReview: false,
        offered: false,
        accepted: false,
        rejected: false,
      },

      referral: obj.referral || "",
      createdAt: obj.createdAt || format(new Date(), "MM/dd/yyyy"),
      lastUpdated: format(new Date(), "MM/dd/yyyy"),

      
      universityApplications: obj.universityApplications || obj.preferredUniversity || [],

      adminNotes: Array.isArray(obj.adminNotes) ? obj.adminNotes : [],
      communications: Array.isArray(obj.communications) ? obj.communications : [],
      tasks: Array.isArray(obj.tasks) ? obj.tasks : [],
      alerts: Array.isArray(obj.alerts) ? obj.alerts : [],
      documentVersions: Array.isArray(obj.documentVersions) ? obj.documentVersions : [],
      payments: Array.isArray(obj.payments) ? obj.payments : [],
      metadata: obj.metadata || {},
    };
};


export const postStudentFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = getDb();
      const applicationsCollection = db.collection("application");
      const usersCollection = db.collection("users");

      await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"]);

      const files =
        Array.isArray(req.files)
          ? req.files
          : (req.files as { [fieldname: string]: Express.Multer.File[] })?.files;

          
      if (!req.body?.email || !req.body?.name) {
        return sendResponse(res, {
          message: "Some required fields (name or email) are missing.",
          success: false,
          statusCode: 400,
        });
      }

      if (!emaiReg.test(req.body.email)) {
        return sendResponse(res, {
          message: "Email format error",
          success: false,
          statusCode: 400,
        });
      }

      const existing = await applicationsCollection.findOne({ email: req.body.email });
      if (existing) {
        return sendResponse(res, {
          message: "A file with this email exists already!",
          statusCode: 400,
          success: false,
        });
      }

      // 1) Normalize and prepare base object (ensure defaults)
      // Parse incoming universityApplications or preferredUniversity -> normalized list of full objects
      const rawUniPayload = req.body.universityApplications || req.body.preferredUniversity || req.body.preferredUniversities;
      const normalizedUnis = normalizeUniversityApplicationsPayload(rawUniPayload);

      // 2) ensure all other fields defaulted
      const base = ensureDefaultsForInsert(req.body, req.user);

      // Attach normalized universityApplications (ensuring full-detail objects)
      base.universityApplications = normalizedUnis;

      // 3) Files upload handling: push uploaded files into base.files
      base.files = base.files || [];
      if (files && files.length) {
        for (const file of files) {
          try {
            const respondedData: any = await fileUploadHelper.uploadToCloud(file);
            if (respondedData && respondedData.secure_url) {
              base.files.push({
                fileName: file.originalname,
                url: respondedData.secure_url,
                publicID: respondedData.public_id,
                uploadedAt: format(new Date(), "MM/dd/yyyy HH:mm"),
              });
            }
          } catch (e) {
            console.error("file upload error:", e);
          }
        }
      }
      console.log(req.body)
      // 4) create user if missing (same logic you had)
      const user = await usersCollection.findOne({ email: req.body.email });
      if (!user) {
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(randomToken, 10);

        const userObject = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          role: "student",
          roleData: {
            role: "student",
            status: "active",
          },
          requiredPassChange: true,
          image: { url: "", publicId: "" },
          phone: req.body.phone || "",
          dob: req.body.dob || "",
          country: req.body.countryCitizen || "",
          review: "",
          createdAt: format(new Date(), "MM/dd/yyyy"),
        };

        const content = `
            <div style="font-family: Arial, sans-serif color: #333 line-height: 1.6">
                <h2 style="color: #2c3e50">🔑 NRC Educational Consultants Ltd. - New Account</h2>
                <p>Hello <strong>${req.body.name}</strong>,</p>
                <p>An account has been created for you with email <strong>${req.body.email}</strong>.</p>
                <p>Your temporary password is:</p>
                <div style="background: #f4f4f4 padding: 12px 20px display: inline-block border-radius: 6px margin: 15px 0 font-size: 18px font-weight: bold letter-spacing: 2px color: #2c3e50">
                    ${randomToken}
                </div>
                <p style="color:#e67e22"><strong>⚠️ Important:</strong> Please log in using this password and update it immediately from your profile for security reasons.</p>
            </div>
          `;
        // fire and forget email
        sendEmail(req.body.email, "Your NRC Educational Consultants Ltd. Account", content);
        await usersCollection.insertOne(userObject);
      }

      // 5) Ensure top-level arrays (adminNotes, tasks, alerts, etc.) exist as arrays
      base.adminNotes = base.adminNotes || [];
      base.communications = base.communications || [];
      base.tasks = base.tasks || [];
      base.alerts = base.alerts || [];
      base.documentVersions = base.documentVersions || [];
      base.payments = base.payments || [];
      base.metadata = base.metadata || {};

      // 6) Insert into DB
      console.log(base)
      const result = await applicationsCollection.insertOne(base);

      if (!result.insertedId) {
        return sendResponse(res, {
          message: "Failed to insert document",
          success: false,
          statusCode: 400,
        });
      }

      return sendResponse(res, {
        message: "Document inserted successfully!",
        success: true,
        statusCode: 201,
        data: result,
      });
    } catch (err) {
      console.error("postStudentFile ERR:", err);
      return sendResponse(res, {
        message: "Something went wrong!",
        success: false,
        statusCode: 500,
      });
    }
};


// export const patchStudentFile = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//       const db = getDb();
//       const applicationsCollection = db.collection("application");

//       await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"]);
  
//       const { id } = req.params || req.query || {};
//       if (!id) {
//         return sendResponse(res, { message: "Missing application id", success: false, statusCode: 400 });
//       }

//       const objId = ObjectId ? new ObjectId(id) : id;
//       const existing = await applicationsCollection.findOne({ _id: objId });
//       if (!existing) {
//         return sendResponse(res, { message: "Application not found", success: false, statusCode: 404 });
//       }

//       // We will merge existing with incoming; do not overwrite arrays blindly except where intended
//       const incoming = req.body || {};

//       // Handle universityApplications (or preferredUniversity old name)
//       const incomingUniRaw = incoming.universityApplications || incoming.preferredUniversity || incoming.preferredUniversities;
//       if (incomingUniRaw) {
//         // normalize incoming universities into full objects
//         const incomingUnis = normalizeUniversityApplicationsPayload(incomingUniRaw);

//         // existing.universityApplications might be undefined => ensure array
//         existing.universityApplications = Array.isArray(existing.universityApplications) ? existing.universityApplications : [];

//         // Merge by universityId if present, else append new entries
//         for (const incUni of incomingUnis) {
//           if (incUni.universityId) {
//             const idx = existing.universityApplications.findIndex((u: any) => u.universityId === incUni.universityId);
//             if (idx >= 0) {
//               // Merge fields (shallow merge, prefer incoming when present, fill missing)
//               existing.universityApplications[idx] = {
//                 ...existing.universityApplications[idx],
//                 ...incUni,
//                 // keep createdAt if exists
//                 createdAt: existing.universityApplications[idx].createdAt || incUni.createdAt || format(new Date(), "MM/dd/yyyy"),
//                 updatedAt: format(new Date(), "MM/dd/yyyy"),
//               };
//             } else {
//               // new entry (set timestamps)
//               existing.universityApplications.push({
//                 ...makeEmptyUniversity(incUni),
//                 createdAt: incUni.createdAt || format(new Date(), "MM/dd/yyyy"),
//                 updatedAt: format(new Date(), "MM/dd/yyyy"),
//               });
//             }
//           } else {
//             // No universityId — attempt best-effort: if one existing entry with same universityName -> merge, else append
//             const idx = existing.universityApplications.findIndex((u: any) => u.universityName && u.universityName === incUni.universityName);
//             if (idx >= 0) {
//               existing.universityApplications[idx] = {
//                 ...existing.universityApplications[idx],
//                 ...incUni,
//                 updatedAt: format(new Date(), "MM/dd/yyyy"),
//               };
//             } else {
//               existing.universityApplications.push({
//                 ...makeEmptyUniversity(incUni),
//                 createdAt: format(new Date(), "MM/dd/yyyy"),
//                 updatedAt: format(new Date(), "MM/dd/yyyy"),
//               });
//             }
//           }
//         }
//       }

//       const updatableSimpleFields = [
//         "name","email","phone","alternativePhone","dob","passportNo","currentAddress","countryCitizen","gender","maritalStatus","referral"
//       ];

//       for (const key of updatableSimpleFields) {
//         if (incoming[key] !== undefined) existing[key] = incoming[key];
//       }

//       // Handle englishProficiency / academicInfo / preferredUniversities (keep backwards compatibility)
//       if (incoming.englishProficiency !== undefined) {
//         existing.englishProficiency = typeof incoming.englishProficiency === "string" ? (() => { try { return JSON.parse(incoming.englishProficiency) } catch { return incoming.englishProficiency } })() : incoming.englishProficiency;
//       }
//       if (incoming.academicInfo !== undefined) {
//         existing.academicInfo = typeof incoming.academicInfo === "string" ? (() => { try { return JSON.parse(incoming.academicInfo) } catch { return incoming.academicInfo } })() : incoming.academicInfo;
//       }
//       if (incoming.preferredUniversities !== undefined) {
//         existing.preferredUniversities = typeof incoming.preferredUniversities === "string" ? (() => { try { return JSON.parse(incoming.preferredUniversities) } catch { return incoming.preferredUniversities } })() : incoming.preferredUniversities;
//       }

//       // Files: accept new upload via req.files same as POST (append)
//       const files =
//         Array.isArray(req.files)
//           ? req.files
//           : (req.files as { [fieldname: string]: Express.Multer.File[] })?.files;

//       existing.files = Array.isArray(existing.files) ? existing.files : [];
//       if (files && files.length) {
//         for (const file of files) {
//           try {
//             const respondedData: any = await fileUploadHelper.uploadToCloud(file);
//             if (respondedData && respondedData.secure_url) {
//               existing.files.push({
//                 fileName: file.originalname,
//                 url: respondedData.secure_url,
//                 publicID: respondedData.public_id,
//                 uploadedAt: format(new Date(), "MM/dd/yyyy HH:mm"),
//               });
//             }
//           } catch (e) {
//             console.error("file upload error (patch):", e);
//           }
//         }
//       }

//       // Optionally push a history entry if provided or if update performed by admin
//       const historyEntry = incoming.historyEntry || null;
//       if (historyEntry) {
//         existing.history = Array.isArray(existing.history) ? existing.history : [];
//         existing.history.push({
//           comment: historyEntry.comment || "Updated",
//           stage: historyEntry.stage || "updated",
//           by: {
//             id: req.user?.id || "",
//             email: req.user?.email || "",
//             role: req.user?.role || "",
//           },
//           date: format(new Date(), "MM/dd/yyyy"),
//         });
//       }

//       // Update lastUpdated timestamp
//       existing.lastUpdated = format(new Date(), "MM/dd/yyyy");

//       // Finally persist update
//       // Remove _id in case it exists in `existing`
//       const _id = existing._id;
//       if (_id) delete existing._id;

//       const updateResult = await applicationsCollection.updateOne(
//         { _id: objId },
//         { $set: existing }
//       );

//       if (updateResult.modifiedCount === 0) {
//         return sendResponse(res, { message: "No changes saved", success: true, statusCode: 200 });
//       }

//       return sendResponse(res, { message: "Application updated", success: true, statusCode: 200, data: { modifiedCount: updateResult.modifiedCount } });
//     } catch (err) {
//         console.error("patchStudentFile ERR:", err);
//         return sendResponse(res, { 
//             message: "Something went wrong", 
//             success: false, 
//             statusCode: 500 
//         });
//     }
// };


interface StudentProfile {
    academicInfo: {
        highestQualification?: string;
        gpa?: number;
        gpaScale?: string;
        previousSubjects?: string[];
        fieldOfStudy?: string;
    };
    englishProficiency?: {
        testType?: string;
        overallScore?: number;
        listening?: number;
        reading?: number;
        writing?: number;
        speaking?: number;
    };
    preferredProgram?: string;
    preferredLevel?: string;
    maxBudget?: number;
}

interface MatchResult {
    subject: any;
    matchScore: number;
    matchReasons: string[];
}

interface UniversityWithSubjects {
    universityId: string;
    universityName: string;
    location: any;
    tuitionFees: any;
    matchedSubjects: any[];
}


export const searchUniversity = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb();
        const collection = db.collection('country-uni');
        await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"]);

        const { countryId, studentProfile } = req.body as {
            countryId: string;
            studentProfile: StudentProfile;
        };
        console.log(req.body)
        console.log(req.body.studentProfile.academicInfo)
        console.log(req.body.studentProfile.englishProficiency)
        // Validation
        if (!countryId || !studentProfile) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: 'Missing required parameters: countryId and studentProfile'
            });
        }

        // Fetch country and universities
        const country = await collection.findOne({
            _id: new ObjectId(countryId)
        });

        if (!country) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'Country not found'
            });
        }

        if (!country.universityList || country.universityList.length === 0) {
            return sendResponse(res, {
                statusCode: 200,
                success: true,
                message: 'No universities found in this country',
                data: { universities: [] }
            });
        }

        // Process each university and match subjects
        const universitiesWithMatches: UniversityWithSubjects[] = [];

        for (const university of country.universityList) {
            // Only process active universities
            if (university.status !== 'active') continue;

            // Skip universities without subjects
            if (!university.subjects || university.subjects.length === 0) continue;
console.log("every iterations: ",university.subjects, studentProfile, university)
            // Match subjects for this university
            const matchedSubjects = university.subjects
                .map((subject: any) => 
                    calculateMatch(subject, studentProfile, university)
                )
                .filter((result: MatchResult) => result.matchScore >= 40) // Minimum 40% match
                .sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore); // Sort by match score

            // Apply additional filters
            let filteredSubjects = matchedSubjects;

            // Filter by preferred program
            if (studentProfile.preferredProgram) {
                filteredSubjects = filteredSubjects.filter((result: MatchResult) => {
                    const subject = result.subject;
                    const normalizedPreference = studentProfile.preferredProgram!.toLowerCase();
                    const facultyMatch = subject.faculty?.toLowerCase().includes(normalizedPreference);
                    const subjectMatch = subject.subjectName?.toLowerCase().includes(normalizedPreference);
                    return facultyMatch || subjectMatch;
                });
            }

            // Filter by preferred level
            if (studentProfile.preferredLevel) {
                filteredSubjects = filteredSubjects.filter((result: MatchResult) => 
                    result.subject.programLevel === studentProfile.preferredLevel
                );
            }

            // Filter by budget
            if (studentProfile.maxBudget) {
                filteredSubjects = filteredSubjects.filter((result: MatchResult) => 
                    result.subject.cost <= studentProfile.maxBudget!
                );
            }

            // Only include university if it has matching subjects
            if (filteredSubjects.length > 0) {
                universitiesWithMatches.push({
                    universityId: university.universityId,
                    universityName: university.universityName,
                    location: university.location,
                    tuitionFees: university.tuitionFees,
                    matchedSubjects: filteredSubjects.map((result: MatchResult) => ({
                        ...result.subject,
                        matchScore: result.matchScore,
                        matchReasons: result.matchReasons
                    }))
                });
            }
        }

        // Sort universities by best match score
        universitiesWithMatches.sort((a, b) => {
            const maxScoreA = Math.max(...a.matchedSubjects.map(s => s.matchScore));
            const maxScoreB = Math.max(...b.matchedSubjects.map(s => s.matchScore));
            return maxScoreB - maxScoreA;
        });

        return sendResponse(res, {
            statusCode: 200,
            success: true,
            message: `Found ${universitiesWithMatches.length} universities with matching programs`,
            data: {
                universities: universitiesWithMatches,
                totalUniversities: universitiesWithMatches.length,
                totalPrograms: universitiesWithMatches.reduce((sum, uni) => sum + uni.matchedSubjects.length, 0),
                country: country.country
            }
        });

    } catch (error: any) {
        console.error('Error in searchUniversity:', error);
        return sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};



function calculateMatch(subject: any,profile: StudentProfile,university: any): MatchResult {
    let score = 0;
    const maxScore = 100;
    const reasons: string[] = [];

    // 1. Education Level Match (20 points)
    const educationLevelMatch = checkEducationLevel(
        profile.academicInfo?.highestQualification || '',
        subject.programLevel,
        university.admissionRequirements?.requiredEducationLevel
    );
    score += educationLevelMatch.score;
    if (educationLevelMatch.reason) reasons.push(educationLevelMatch.reason);

    // 2. GPA Match (20 points)
    const gpaMatch = checkGPA(
        profile.academicInfo?.gpa || 0,
        profile.academicInfo?.gpaScale || '4.0',
        university.admissionRequirements?.minimumGPA
    );
    score += gpaMatch.score;
    if (gpaMatch.reason) reasons.push(gpaMatch.reason);

    // 3. English Proficiency Match (20 points)
    const englishMatch = checkEnglishProficiency(
        profile.englishProficiency,
        university.englishProf
    );
    score += englishMatch.score;
    if (englishMatch.reason) reasons.push(englishMatch.reason);

    // 4. Budget Match (15 points)
    const budgetMatch = checkBudget(profile.maxBudget || 0, subject.cost);
    score += budgetMatch.score;
    if (budgetMatch.reason) reasons.push(budgetMatch.reason);

    // 5. Field/Faculty Match (15 points)
    const fieldMatch = checkFieldMatch(
        profile.preferredProgram || profile.academicInfo?.fieldOfStudy || '',
        subject.faculty,
        subject.subjectName
    );
    score += fieldMatch.score;
    if (fieldMatch.reason) reasons.push(fieldMatch.reason);

    // 6. Prerequisites Match (10 points)
    const prereqMatch = checkPrerequisites(
        profile.academicInfo?.previousSubjects || [],
        university.admissionRequirements?.prerequisiteSubjects
    );
    score += prereqMatch.score;
    if (prereqMatch.reason) reasons.push(prereqMatch.reason);

    return {
        subject: {
            id: subject.id || subject._id?.toString(),
            subjectName: subject.subjectName,
            programLevel: subject.programLevel,
            degree: subject.degree,
            duration: subject.duration,
            cost: subject.cost,
            intakes: subject.intakes,
            programType: subject.programType,
            faculty: subject.faculty,
            modeOfStudy: subject.modeOfStudy,
            qualifications: subject.qualifications,
            accreditation: subject.accreditation,
            description: subject.description,
            careerOpportunities: subject.careerOpportunities,
            applicationDeadline: subject.applicationDeadline,
            language: subject.language,
            credits: subject.credits,
            placement: subject.placement
        },
        matchScore: Math.round(score),
        matchReasons: reasons
    };
}

// ============================================
// Helper Functions (same as previous implementation)
// ============================================

function checkEducationLevel(studentLevel: string,programLevel: string,requiredLevel?: string): { score: number; reason: string | null } {
    const levels: Record<string, number> = {
        'high_school': 1,
        'diploma': 2,
        'associate': 3,
        'bachelors': 4,
        'masters': 5,
        'doctorate': 6
    };

    const programLevelMap: Record<string, number> = {
        'Certificate': 2,
        'Diploma': 2,
        'Foundation': 2,
        'Associate Degree': 3,
        'Undergraduate': 4,
        'Graduate': 5,
        'Doctorate': 6
    };

    const studentLevelNum = levels[studentLevel.toLowerCase()] || 0;
    const programLevelNum = programLevelMap[programLevel] || 0;
    const requiredLevelNum = requiredLevel ? levels[requiredLevel.toLowerCase()] || 0 : 0;

    if (studentLevelNum >= Math.max(programLevelNum - 1, requiredLevelNum)) {
        return {
            score: 20,
            reason: 'Your education level matches the program requirements'
        };
    } else if (studentLevelNum >= programLevelNum - 2) {
        return {
            score: 10,
            reason: 'You may need additional qualifications for this program'
        };
    }

    return { score: 0, reason: null };
}

function checkGPA(studentGPA: number,studentScale: string,minimumGPA?: { value: number; scale: string }): { score: number; reason: string | null } {
    if (!minimumGPA || studentGPA === 0) {
        return { score: 20, reason: 'No specific GPA requirement' };
    }

    const normalizeGPA = (gpa: number, scale: string): number => {
        const scaleNum = parseFloat(scale);
        return (gpa / scaleNum) * 4.0;
    };

    const normalizedStudentGPA = normalizeGPA(studentGPA, studentScale);
    const normalizedMinGPA = normalizeGPA(minimumGPA.value, minimumGPA.scale);

    if (normalizedStudentGPA >= normalizedMinGPA + 0.5) {
        return {
            score: 20,
            reason: `Your GPA (${studentGPA}) exceeds the minimum requirement`
        };
    } else if (normalizedStudentGPA >= normalizedMinGPA) {
        return {
            score: 15,
            reason: `Your GPA (${studentGPA}) meets the minimum requirement`
        };
    } else if (normalizedStudentGPA >= normalizedMinGPA - 0.3) {
        return {
            score: 10,
            reason: `Your GPA is slightly below requirement (may need other strong qualifications)`
        };
    }

    return { score: 0, reason: null };
}

function checkEnglishProficiency(studentProf: StudentProfile['englishProficiency'],universityProf?: any): { score: number; reason: string | null } {
    if (!universityProf || !studentProf) {
        return { score: 20, reason: 'English proficiency not specified' };
    }

    const testType = studentProf.testType?.toUpperCase() || '';
    const requiredScores = universityProf[testType] || universityProf[studentProf.testType || ''];

    if (!requiredScores) {
        return { score: 15, reason: 'Your English test is acceptable' };
    }

    let meetsRequirement = true;
    const sections = ['overall', 'listening', 'reading', 'writing', 'speaking'];

    for (const section of sections) {
        if (requiredScores[section] && studentProf[section as keyof typeof studentProf]) {
            if (studentProf[section as keyof typeof studentProf]! < requiredScores[section]) {
                meetsRequirement = false;
                break;
            }
        }
    }

    if (meetsRequirement && requiredScores.overall && studentProf.overallScore) {
        if (studentProf.overallScore >= requiredScores.overall + 1) {
            return {
                score: 20,
                reason: `Your ${testType} score exceeds requirements`
            };
        }
        return {
            score: 18,
            reason: `Your ${testType} score meets requirements`
        };
    }

    return {
        score: meetsRequirement ? 15 : 5,
        reason: meetsRequirement ? 'Acceptable English proficiency' : 'May need to improve English scores'
    };
}

function checkBudget(studentBudget: number, programCost: number): { score: number; reason: string | null } {
    if (!programCost || studentBudget === 0) {
        return { score: 15, reason: 'Cost information available upon request' };
    }

    const ratio = studentBudget / programCost;

    if (ratio >= 1.2) {
        return {
            score: 15,
            reason: `Program cost ($${programCost.toLocaleString()}) is well within your budget`
        };
    } else if (ratio >= 1.0) {
        return {
            score: 13,
            reason: `Program cost ($${programCost.toLocaleString()}) matches your budget`
        };
    } else if (ratio >= 0.8) {
        return {
            score: 8,
            reason: `Program cost ($${programCost.toLocaleString()}) is slightly above budget (scholarships may help)`
        };
    } else if (ratio >= 0.6) {
        return {
            score: 4,
            reason: `Program cost is above budget - strong scholarship opportunities recommended`
        };
    }

    return { score: 0, reason: null };
}

function checkFieldMatch(preferredField: string,faculty: string,subjectName: string): { score: number; reason: string | null } {
    if (!preferredField) {
        return { score: 10, reason: 'Field preference not specified' };
    }

    const normalizeField = (field: string) => field.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefField = normalizeField(preferredField);
    const facultyNorm = normalizeField(faculty || '');
    const subjectNorm = normalizeField(subjectName || '');

    if (facultyNorm.includes(prefField) || prefField.includes(facultyNorm)) {
        return {
            score: 15,
            reason: `Matches your preferred field of ${preferredField}`
        };
    } else if (subjectNorm.includes(prefField) || prefField.includes(subjectNorm)) {
        return {
            score: 12,
            reason: `Related to your preferred field of ${preferredField}`
        };
    }

    return { score: 5, reason: null };
}

function checkPrerequisites(studentSubjects: string[],prerequisites?: string[]): { score: number; reason: string | null } {
    if (!prerequisites || prerequisites.length === 0) {
        return { score: 10, reason: 'No specific prerequisites required' };
    }

    if (!studentSubjects || studentSubjects.length === 0) {
        return { score: 5, reason: null };
    }

    const normalizeSubject = (subj: string) => subj.toLowerCase().replace(/[^a-z0-9]/g, '');
    const studentSubjsNorm = studentSubjects.map(normalizeSubject);
    const prereqsNorm = prerequisites.map(normalizeSubject);

    const matchedCount = prereqsNorm.filter(prereq =>
        studentSubjsNorm.some(studSubj =>
            studSubj.includes(prereq) || prereq.includes(studSubj)
        )
    ).length;

    const matchRatio = matchedCount / prereqsNorm.length;

    if (matchRatio >= 0.8) {
        return {
            score: 10,
            reason: 'You have completed most prerequisite subjects'
        };
    } else if (matchRatio >= 0.5) {
        return {
            score: 7,
            reason: 'You have completed some prerequisite subjects'
        };
    } else if (matchRatio > 0) {
        return {
            score: 4,
            reason: 'Some prerequisite subjects may be needed'
        };
    }

    return { score: 0, reason: null };
}
