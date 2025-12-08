const bcrypt = require("bcrypt") 
import { format } from "date-fns"
import { ObjectId } from "mongodb"
import { Request, Response } from "express"
import sendEmail from "../../helper/sendEmail"
import authChecker from "../../helper/authChecker"
const { getDb } = require("../../config/connectDB")
import sendResponse from "../../helper/sendResponse"
import { fileUploadHelper } from "../../helper/fileUploadHealper"


interface AuthenticatedRequest extends Request {
    user?: any
}

const emaiReg =
  /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


export const postStudentFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getDb()
        const applicationsCollection = db.collection("application")
        const usersCollection = db.collection("users")
        await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"])
        const files =
          Array.isArray(req.files)
          ? req.files 
          : (req.files as { [fieldname: string]: Express.Multer.File[] })?.files;
      
        if (!req.body?.email || !req.body.name ) {
          return sendResponse(res, {
            message: "Some field cant be empty while creating file!",
            success: false,
            statusCode: 400,
          })
        }

        if(!emaiReg.test(req.body.email)){
            return sendResponse(res,{
              message:"Email format error",
              success: false,
              statusCode: 400
            })
        }
      

        const query = { email : req.body.email }
        const student = await applicationsCollection.findOne(query)
        
        if (student) {
          return sendResponse(res, {
            message: "A file with this email exists already!",
            statusCode: 400,
            success: false,
          })
        }

      const fileToInsert = {
        permission: {
          permission_personalInfo: false,
          permission_englishProficiency: false,
          permission_prefferedUniSub: false,
          permission_studentsFile: false
        },
        
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        alternativePhone: req.body.alternativePhone,
        dob: req.body.dob,
        passportNo: req.body.passportNo,
        currentAddress: req.body.currentAddress,
        countryCitizen: req.body.countryCitizen,
        refusedCountry: JSON.parse(req.body.refusedCountry)||[],
        gender: req.body.gender,
        maritalStatus: req.body.maritalStatus,

        englishProficiency: req.body.englishProficiency? JSON.parse(req.body.englishProficiency) : {},
        academicInfo: JSON.parse(req.body.academicInfo) || [],
        preferredUniversities: JSON.parse(req.body.preferredUniversities),
        files:[] as {fileName:string,url:string,publicID:string,uploadedAt:string}[],

        // applicationStatus: [
        history: [
          {
            comment:"Application Open",
            stage: "created",
            by:{
              id: req.user.id,
              email: req.user.email,
              role: req.user.role,
            },
            date: format(new Date(), "MM/dd/yyyy"),
          },
        ],

        
        communication: [],

        applicationState: {
            personalInfo: { complete: false, verified: false },
            englishProficiency: { complete: false, verified: false },
            prefferedUniSub: { complete: false, verified: false },
            studentsFile: { complete: false, verified: false },
            applicationFinished: { finished: false, archived: false },
        },

        progress: {
          submitted: false,
          verified: false,
          underReview: false,
          offered: false,
          accepted: false,
          rejected: false,
        },

        referral: "",
        createdAt: format(new Date(), "MM/dd/yyyy"),
        lastUpdated: format(new Date(), "MM/dd/yyyy"),
      };
 
      const user = await usersCollection.findOne(query)
      
      if(files){
        for(const file of files){
          const respondedData:any = await fileUploadHelper.uploadToCloud(file)
          if(respondedData && respondedData.secure_url){
            fileToInsert.files.push({
              fileName: file.originalname, 
              url: respondedData.secure_url,
              publicID: respondedData.public_id,
              uploadedAt: format(new Date(), "MM/dd/yyyy HH:mm"),
            })
          }
        }
      }


      if (!user) {
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedPassword = await bcrypt.hash(randomToken, 10)

        const userObject = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          role: "student",
          roleData:{
            role: "student",
            status: "active",
          },
          requiredPassChange: true,
          image: { url: "", publicId: "" },
          phone: req.body.phone,
          dob: req.body.dob ,
          country: req.body.countryCitizen,
          review: "",
          createdAt: format(new Date(), "MM/dd/yyyy"),
        }

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
        `
        sendEmail(req.body.email, "Your NRC Educational Consultants Ltd. Account", content)
        await usersCollection.insertOne(userObject)
      }

      const result = await applicationsCollection.insertOne(fileToInsert)
      
      if (!result.insertedId) {
        return sendResponse(res, {
          message: "Failed to insert document",
          success: false,
          statusCode: 400,
        })
      }

      sendResponse(res, {
        message: "Document inserted successfully!",
        success: true,
        statusCode: 201,
        data: result,
      })
    } catch (err) {
      console.error(err)
      sendResponse(res, {
        message: "Something went wrong!",
        success: false,
        statusCode: 500,
      })
    }
}


export const editStudentFile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = getDb();
      const filesCollection = db.collection("application");
      await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent", "student"]);

      const recievedData = req.body || {};
      const query = { _id: new ObjectId(req.params.id) };
      const insertedData: any = {};
      const changes: string[] = [];

      const doc = await filesCollection.findOne(query, { projection: { permission: 1 } });
      if (!doc) {
        return sendResponse(res, { 
          message: "Document not found", 
          success: false, 
          statusCode: 404 });
      }

      
      if (recievedData.personalInfo) {
          if (req.user.role === "student" && doc.permission.permission_personalInfo === false) {
            return forbidden(res, "personal info");
          }
          Object.assign(insertedData, recievedData.personalInfo);
      }
 
      let shouldUnsetEnglish = false;
      if (recievedData.englishProficiency) {
          if (req.user.role === "student" && doc.permission.permission_englishProficiency === false) {
            return forbidden(res, "english proficiency");
          }

          insertedData.englishProficiency = recievedData.englishProficiency;
          shouldUnsetEnglish = true;
          changes.push("english proficiency updated");
      }
 
      if (recievedData.academicInfo) {
          if (req.user.role === "student" && doc.permission.permission_personalInfo === false) {
            return forbidden(res, "academic info");
          }

          insertedData.academicInfo = recievedData.academicInfo;
          changes.push("academic info updated");
      }

      
      if (recievedData.preferredUniversities?.length > 0) {
          if (req.user.role === "student" && doc.permission.permission_prefferedUniSub === false) {
            return forbidden(res, "preferred universities");
          }

          insertedData.preferredUniversities = recievedData.preferredUniversities;
          changes.push("preferred universities updated");
      }


      
      if (recievedData.permission && req.user.role !== "student") {
          const newPermissions: any = {};
          for (const [key, value] of Object.entries(recievedData.permission)) {
            if (value === "true" || value === "false") {
              newPermissions[key] = value === "true";
              changes.push(`${key} permission updated`);
            }
          }

          if (Object.keys(newPermissions).length > 0) {
            insertedData.permission = newPermissions;
          }
      }

      if (recievedData.applicationState && req.user.role !== "student") {
          const newState: any = {};
          const allowedFields = ["verified", "complete", "finished", "archived"];

          for (const [section, state] of Object.entries(recievedData.applicationState as Record<string, any>)) {
            const sectionObj: any = {};
            const stateObj = state as Record<string, any>;

            if (stateObj && typeof stateObj === "object") {
              for (const field of allowedFields) {
                const val = stateObj[field];
                if (val === "true" || val === "false") {
                  sectionObj[field] = val === "true";
                }
              }
            }

            if (Object.keys(sectionObj).length > 0) {
              newState[section] = sectionObj;
              changes.push(`${section} status updated`);
            }
        }

        if (Object.keys(newState).length > 0) {
          insertedData.applicationState = newState;
        }
      }

      
      if (req.body.deletedFiles) {
          if (req.user.role === "student" && doc.permission.permission_studentsFile === false) {
            return forbidden(res, "file deletion");
          }
          const deletedArray = JSON.parse(req.body.deletedFiles)
          for (const id of deletedArray) {
            await fileUploadHelper.deleteFromCloud(id);
          }
          changes.push("files deleted");
      }

      const filesArray: any[] = [];

      if (req.files && Object.keys(req.files).length > 0) {
          const uploadedFiles = Array.isArray(req.files)
            ? req.files
            : req.files.files;

          for (const file of uploadedFiles) {
            const uploaded:any = await fileUploadHelper.uploadToCloud(file);
            filesArray.push({
              fileName: file.originalname,
              url: uploaded.secure_url,
              publicID: uploaded.public_id,
              uploadedAt: format(new Date(), "MM/dd/yyyy HH:mm"),
            });
            changes.push(`file ${file.originalname} added`);
          }
      }

      if(insertedData.email) {
        delete insertedData.email;
        // return sendResponse(res, {
        //   message: "Email cannot be changed",
        //   success: false,
        //   statusCode: 400,
        // });
      }

        
      const pipeline: any[] = [];
      const comment = changes.join(", ");
      insertedData.lastUpdated = format(new Date(), "MM/dd/yyyy");
      const deletedArray = req.body.deletedFiles ? JSON.parse(req.body.deletedFiles) : [];

      if (shouldUnsetEnglish) pipeline.push({ $unset: "englishProficiency" });
      pipeline.push({
        $set: {
          ...insertedData,
          files: {
            $concatArrays: [
              {
                $filter: {
                  input: "$files",
                  as: "file",
                  cond: { $not: { $in: ["$$file.publicID", deletedArray] } }
                }
              },
              filesArray
            ]
          },
          history: {
            $concatArrays: [
              "$history",
              [
                {
                  stage: "updated",
                  by: {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role
                  },
                  comment,
                  date: format(new Date(), "MM/dd/yyyy")
                }
              ]
            ]
          }
        }
      });

      const response = await filesCollection.updateOne(query, pipeline);

      return sendResponse(res, {
        message: "Data updated successfully",
        success: true,
        statusCode: 200,
        data: response,
      });

    } catch (err) {
      console.error(err);
      sendResponse(res, {
        message: "Something went wrong!",
        success: false,
        statusCode: 500,
      });
    }
};


// Helper
function forbidden(res: Response, label: string) {
  return sendResponse(res, {
    message: `You don't have permission to edit ${label}`,
    success: false,
    statusCode: 403,
  });
}

export const getStudentFileState = async(req: AuthenticatedRequest,res: Response) =>{
    try{
      const db = getDb()
      const filesCollection = db.collection('application')
      await authChecker(req,res,["super_admin","admin","agent","sub_agent"])
      
      const values = await filesCollection.find({}).project({ applicationState: 1, _id: 0}).toArray();
      const summary:any = {
          personalInfo: { complete: 0, verified: 0 },
          englishProficiency: { complete: 0, verified: 0 },
          universityApplications: { complete: 0, verified: 0 },
          studentsFile: { complete: 0, verified: 0 },
      };
      
      values.forEach((doc:any) => {
        const app = doc.applicationState || {};
        if(!app?.applicationFinished?.archived && !app?.applicationFinished?.finished){
          for (const key of Object.keys(summary)) {
            const section = app[key];
            if (section) {
              if (section.complete===false) summary[key].complete++;
              if (section.complete===true && section.verified===false) summary[key].verified++;
            }
          }
        }
      });

      
      sendResponse(res, {
          message: "Student file states retrieved successfully",
          success: true,
          statusCode: 200,
          data: summary,
      });
    }catch(err){
      console.error(err)
      sendResponse(res, {
        message: "Something went wrong!",
        success: false,
        statusCode: 500,
      })
    }
}


export const getApplicationByCondition = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = getDb();
      const filesCollection = db.collection("application");
      await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"]);

      const query: any = {};
      
      Object.entries(req.query).forEach(([section, sectionVal]) => {
        Object.entries(sectionVal as object).forEach(([key, val]) => {
          if (val === "true" || val === "false") {
            if(key==='verified')query[`applicationState.${section}.complete`] = true
            query[`applicationState.${section}.${key}`] = false;
          }
        });
      });

      
      if (Object.keys(query).length === 0) {
        return sendResponse(res, {
          message: "No valid query parameters provided",
          success: false,
          statusCode: 400,
        });
      }


      const files = await filesCollection.find(query).toArray();

      sendResponse(res, {
        message: "Conditioned student files retrieved successfully",
        success: true,
        statusCode: 200,
        data: files,
      });
    } catch (err) {
      console.error(err);
      sendResponse(res, {
        message: "Something went wrong!",
        success: false,
        statusCode: 500,
      });
    }
};


export const getAllStudentFiles = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const applicationsCollection = db.collection("application")
        const files = await applicationsCollection.find({}).toArray()
        sendResponse(res, {
          message: "All student files retrieved",
          success: true,
          statusCode: 200,
          data: files,
      })
    } catch (err) {
        console.error(err)
        sendResponse(res, {
          message: "Failed to fetch student files",
          success: false,
          statusCode: 500,
        })
    }
}

export const getStudentFileByIdentifier = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const applicationsCollection = db.collection("application");
        const { identifier } = req.params;

        await authChecker(req, res, ["student","admin","super_admin","agent","sub_admin"]);

        let query: any = {};

        if(ObjectId.isValid(identifier) && String(new ObjectId(identifier)) === identifier) {
            query = { _id: new ObjectId(identifier) };
        }else{
            query = { email: identifier };
        }
        
        const file = await applicationsCollection.findOne(query);
        if (!file) {
            return sendResponse(res, {
              message: "File not found",
              success: false,
              statusCode: 404,
            });
        }

        return sendResponse(res, {
            message: "Student file retrieved",
            success: true,
            statusCode: 200,
            data: file,
        });
    } catch (err) {
        console.error(err);
        return sendResponse(res, {
          message: "Failed to fetch student file",
          success: false,
          statusCode: 500,
        });
    }
};



export const updateStudentFile = async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const applicationsCollection = db.collection("application")
    const { id } = req.params

    const updateDoc = { $set: req.body }

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    )

    if (!result.modifiedCount) {
      return sendResponse(res, {
        message: "No changes applied",
        success: false,
        statusCode: 400,
      })
    }

    sendResponse(res, {
      message: "Student file updated successfully",
      success: true,
      statusCode: 200,
    })
  } catch (err) {
    console.error(err)
    sendResponse(res, {
      message: "Failed to update student file",
      success: false,
      statusCode: 500,
    })
  }
}


export const deleteStudentFile = async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const applicationsCollection = db.collection("application")
    const { id } = req.params

    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(id),
    })

    if (!result.deletedCount) {
      return sendResponse(res, {
        message: "File not found or already deleted",
        success: false,
        statusCode: 404,
      })
    }

    sendResponse(res, {
      message: "Student file deleted successfully",
      success: true,
      statusCode: 200,
    })
  } catch (err) {
    console.error(err)
    sendResponse(res, {
      message: "Failed to delete student file",
      success: false,
      statusCode: 500,
    })
  }
}
