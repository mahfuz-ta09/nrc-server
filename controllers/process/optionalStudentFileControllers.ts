const bcrypt = require("bcrypt")
import { ObjectId } from "mongodb";
import { format } from "date-fns";
import sendEmail from "../../helper/sendEmail";
const { getDb } = require("../../config/connectDB")
import authChecker from "../../helper/authChecker";
import sendResponse from "../../helper/sendResponse";
import { fileUploadHelper } from "../../helper/fileUploadHealper";


const emaiReg =
  /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


  
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


export const postStudentFile = async (req: any, res: any) => {
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

// ---------- PATCH handler (update application) ----------
export const patchStudentFile = async (req: any, res: any) => {
  try {
    const db = getDb();
    const applicationsCollection = db.collection("application");

    await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"]);
 
    const { id } = req.params || req.query || {}; // depends on your route pattern
    if (!id) {
      return sendResponse(res, { message: "Missing application id", success: false, statusCode: 400 });
    }

    const objId = ObjectId ? new ObjectId(id) : id;
    const existing = await applicationsCollection.findOne({ _id: objId });
    if (!existing) {
      return sendResponse(res, { message: "Application not found", success: false, statusCode: 404 });
    }

    // We will merge existing with incoming; do not overwrite arrays blindly except where intended
    const incoming = req.body || {};

    // Handle universityApplications (or preferredUniversity old name)
    const incomingUniRaw = incoming.universityApplications || incoming.preferredUniversity || incoming.preferredUniversities;
    if (incomingUniRaw) {
      // normalize incoming universities into full objects
      const incomingUnis = normalizeUniversityApplicationsPayload(incomingUniRaw);

      // existing.universityApplications might be undefined => ensure array
      existing.universityApplications = Array.isArray(existing.universityApplications) ? existing.universityApplications : [];

      // Merge by universityId if present, else append new entries
      for (const incUni of incomingUnis) {
        if (incUni.universityId) {
          const idx = existing.universityApplications.findIndex((u: any) => u.universityId === incUni.universityId);
          if (idx >= 0) {
            // Merge fields (shallow merge, prefer incoming when present, fill missing)
            existing.universityApplications[idx] = {
              ...existing.universityApplications[idx],
              ...incUni,
              // keep createdAt if exists
              createdAt: existing.universityApplications[idx].createdAt || incUni.createdAt || format(new Date(), "MM/dd/yyyy"),
              updatedAt: format(new Date(), "MM/dd/yyyy"),
            };
          } else {
            // new entry (set timestamps)
            existing.universityApplications.push({
              ...makeEmptyUniversity(incUni),
              createdAt: incUni.createdAt || format(new Date(), "MM/dd/yyyy"),
              updatedAt: format(new Date(), "MM/dd/yyyy"),
            });
          }
        } else {
          // No universityId — attempt best-effort: if one existing entry with same universityName -> merge, else append
          const idx = existing.universityApplications.findIndex((u: any) => u.universityName && u.universityName === incUni.universityName);
          if (idx >= 0) {
            existing.universityApplications[idx] = {
              ...existing.universityApplications[idx],
              ...incUni,
              updatedAt: format(new Date(), "MM/dd/yyyy"),
            };
          } else {
            existing.universityApplications.push({
              ...makeEmptyUniversity(incUni),
              createdAt: format(new Date(), "MM/dd/yyyy"),
              updatedAt: format(new Date(), "MM/dd/yyyy"),
            });
          }
        }
      }
    }

    const updatableSimpleFields = [
      "name","email","phone","alternativePhone","dob","passportNo","currentAddress","countryCitizen","gender","maritalStatus","referral"
    ];

    for (const key of updatableSimpleFields) {
      if (incoming[key] !== undefined) existing[key] = incoming[key];
    }

    // Handle englishProficiency / academicInfo / preferredUniversities (keep backwards compatibility)
    if (incoming.englishProficiency !== undefined) {
      existing.englishProficiency = typeof incoming.englishProficiency === "string" ? (() => { try { return JSON.parse(incoming.englishProficiency) } catch { return incoming.englishProficiency } })() : incoming.englishProficiency;
    }
    if (incoming.academicInfo !== undefined) {
      existing.academicInfo = typeof incoming.academicInfo === "string" ? (() => { try { return JSON.parse(incoming.academicInfo) } catch { return incoming.academicInfo } })() : incoming.academicInfo;
    }
    if (incoming.preferredUniversities !== undefined) {
      existing.preferredUniversities = typeof incoming.preferredUniversities === "string" ? (() => { try { return JSON.parse(incoming.preferredUniversities) } catch { return incoming.preferredUniversities } })() : incoming.preferredUniversities;
    }

    // Files: accept new upload via req.files same as POST (append)
    const files =
      Array.isArray(req.files)
        ? req.files
        : (req.files as { [fieldname: string]: Express.Multer.File[] })?.files;

    existing.files = Array.isArray(existing.files) ? existing.files : [];
    if (files && files.length) {
      for (const file of files) {
        try {
          const respondedData: any = await fileUploadHelper.uploadToCloud(file);
          if (respondedData && respondedData.secure_url) {
            existing.files.push({
              fileName: file.originalname,
              url: respondedData.secure_url,
              publicID: respondedData.public_id,
              uploadedAt: format(new Date(), "MM/dd/yyyy HH:mm"),
            });
          }
        } catch (e) {
          console.error("file upload error (patch):", e);
        }
      }
    }

    // Optionally push a history entry if provided or if update performed by admin
    const historyEntry = incoming.historyEntry || null;
    if (historyEntry) {
      existing.history = Array.isArray(existing.history) ? existing.history : [];
      existing.history.push({
        comment: historyEntry.comment || "Updated",
        stage: historyEntry.stage || "updated",
        by: {
          id: req.user?.id || "",
          email: req.user?.email || "",
          role: req.user?.role || "",
        },
        date: format(new Date(), "MM/dd/yyyy"),
      });
    }

    // Update lastUpdated timestamp
    existing.lastUpdated = format(new Date(), "MM/dd/yyyy");

    // Finally persist update
    // Remove _id in case it exists in `existing`
    const _id = existing._id;
    if (_id) delete existing._id;

    const updateResult = await applicationsCollection.updateOne(
      { _id: objId },
      { $set: existing }
    );

    if (updateResult.modifiedCount === 0) {
      return sendResponse(res, { message: "No changes saved", success: true, statusCode: 200 });
    }

    return sendResponse(res, { message: "Application updated", success: true, statusCode: 200, data: { modifiedCount: updateResult.modifiedCount } });
  } catch (err) {
    console.error("patchStudentFile ERR:", err);
    return sendResponse(res, { message: "Something went wrong", success: false, statusCode: 500 });
  }
};
