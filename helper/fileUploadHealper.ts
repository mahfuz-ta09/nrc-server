const multer = require('multer')
const path = require('path')
const cloudinary = require('cloudinary').v2
import * as fs from 'fs'


cloudinary.config({ 
   cloud_name: "dqae4zlgs", 
   api_key: "856842232285687", 
   api_secret: "ZcIw7rPXZkkDuHQxlk_Oa4Se_48"
})


const storage = multer.diskStorage({
    destination: (req:any, file:any, cb:any) => {
        const uploadPath = path.join(__dirname, '..' ,'uploads')
        return cb(null, uploadPath)
    },
    filename: (req:any, file:any, cb:any) => {
        return cb(null,file.originalname)
    }
})

const upload = multer({ storage: storage })



const uploadToCloud = async(file:any)  =>{
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.path,
        (error: Error, result: any) => {
            fs.unlinkSync(file.path);
            if (error) {
                reject(error)
            }
            else {
                resolve(result)
            }
        })
  })
}


const deleteFromCloud = async(publicId:string)  =>{
    try {
        console.log(publicId)
        const result = await cloudinary.uploader.destroy(publicId)
        return result
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error)
        throw error
      }
}


export const fileUploadHelper = {
  upload,
  uploadToCloud,
  deleteFromCloud
} 