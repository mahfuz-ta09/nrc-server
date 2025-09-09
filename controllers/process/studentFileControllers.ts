import { Request, Response } from "express"
import sendResponse from "../../helper/sendResponse"
import authChecker from "../../helper/authChecker"
import { format } from "date-fns"
import sendEmail from "../../helper/sendEmail"
import { ObjectId } from "mongodb"
const bcrypt = require("bcrypt")
const { getDb } = require("../../config/connectDB")


const emaiReg =
  /^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


export const postStudentFile = async (req: Request, res: Response) => {
    try {
        const db = getDb()
        const applicationsCollection = db.collection("application")
        const usersCollection = db.collection("users")
        await authChecker(req, res, ["super_admin", "admin", "agent", "sub_agent"])

        const {
          name,
          email,
          phone,
          ulternative_phone,
          dob,
          passportNo,
          currentAddress,
          countryCitizen,
          testName,
          listening,
          reading,
          writing,
          speaking,
          overall,
          schoolership,
          intake,
          destinationCountry,
          program,
          uniName,
          courseStartDate,
          creatorName,
          creatorId,
          creatorEmail,
          creatorRole,
          creatorUnder,
          permission
        } = req.body
      
        if (!email || !name || !phone || !dob|| !passportNo || !countryCitizen || !testName || !overall || !destinationCountry || !program) {
          return sendResponse(res, {
            message: "Some field cant be empty while creating file!",
            success: false,
            statusCode: 400,
          })
        }

        if(!emaiReg.test(email)){
            return sendResponse(res,{
              message:"Email format error",
              success: false,
              statusCode: 400
            })
        }
      

        const query = { "personalInfo.email": email }
        const student = await applicationsCollection.findOne(query)
        
        if (student) {
          return sendResponse(res, {
            message: "A file with this email exists already!",
            statusCode: 400,
            success: false,
          })
        }

        const fileToInsert = {
          personalInfo: {
            name,
            email,
            phone,
            ulternative_phone,
            dob,
            passportNo,
            currentAddress,
            countryCitizen,
          },
          englishProficiency: {
            testName,
            listening,
            reading,
            writing,
            speaking,
            overall,
          },
          assignedUniversities: [
            {
              schoolership ,
              intake ,
              program ,
              destinationCountry ,
              feePaid: false,
              uniName ,
              courseStartDate ,
              preferedSubjects: [] ,
            },
          ],
          studentsFile: {
            permission,
            ssc: { url: "", publicId: "" },
            hsc: { url: "", publicId: "" },
            bachelor: { url: "", publicId: "" },
            master: { url: "", publicId: "" },
            other: { url: "", publicId: "" },
            sourceOfFund: { url: "", publicId: "" },
            sponsorAffidavit: { url: "", publicId: "" },
            ministryAttestation: { url: "", publicId: "" },
            accommodationConfirmation: { url: "", publicId: "" },
          },
          fileEditActivity: [
            {
              type: "create",
              creatorName,
              creatorId,
              creatorEmail,
              creatorRole,
              creatorUnder,
              createdAt: format(new Date(), "MM/dd/yyyy"),
            },
          ],
          applicationState: {
            file: { requiredSubmitted: false, requiredVerified: false },
            personalData: { requiredSubmitted: false, requiredVerified: false },
            englishProfData: { requiredSubmitted: false, requiredVerified: false },
            englishTest: { requiredSubmitted: false, requiredVerified: false },
            universityAssigned: {
              requiredSubmitted: false,
              requiredVerified: false,
            },
            applicationFinished: { finished: false, archived: false },
          },
          createdAt: format(new Date(), "MM/dd/yyyy"),
        }

      
      const user = await usersCollection.findOne({ email: email })
      
      if (!user) {
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedPassword = await bcrypt.hash(randomToken, 10)

        const userObject = {
          name,
          email,
          password: hashedPassword,
          role: "student",
          requiredPassChange: true,
          status: "active",
          image: { url: "", publicId: "" },
          phone: null,
          dob: "",
          country: "",
          review: "",
          createdAt: format(new Date(), "MM/dd/yyyy"),
        }

        const content = `
          <div style="font-family: Arial, sans-serif color: #333 line-height: 1.6">
              <h2 style="color: #2c3e50">🔑 NRC Educational Consultants Ltd. - New Account</h2>
              <p>Hello <strong>${name}</strong>,</p>
              <p>An account has been created for you with email <strong>${email}</strong>.</p>
              <p>Your temporary password is:</p>
              <div style="background: #f4f4f4 padding: 12px 20px display: inline-block border-radius: 6px margin: 15px 0 font-size: 18px font-weight: bold letter-spacing: 2px color: #2c3e50">
                  ${randomToken}
              </div>
              <p style="color:#e67e22"><strong>⚠️ Important:</strong> Please log in using this password and update it immediately from your profile for security reasons.</p>
          </div>
        `
        sendEmail(email, "Your NRC Educational Consultants Ltd. Account", content)
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


export const getStudentFileById = async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const applicationsCollection = db.collection("application")
    const { id } = req.params

    const file = await applicationsCollection.findOne({ _id: new ObjectId(id) })

    if (!file) {
      return sendResponse(res, {
        message: "File not found",
        success: false,
        statusCode: 404,
      })
    }

    sendResponse(res, {
      message: "Student file retrieved",
      success: true,
      statusCode: 200,
      data: file,
    })
  } catch (err) {
    console.error(err)
    sendResponse(res, {
      message: "Failed to fetch student file",
      success: false,
      statusCode: 500,
    })
  }
}


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
