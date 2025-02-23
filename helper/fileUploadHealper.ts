const multer = require('multer')
const path = require('path')
const cloudinary = require('cloudinary').v2
import * as fs from 'fs'


cloudinary.config({ 
   cloud_name:process.env.cloud_name, 
   api_key:process.env.api_key, 
   api_secret:process.env.api_secret,
})

const uploadPath = path.resolve(process.cwd(), 'helper', 'uploads');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req:any , file:any , cb: any) => {
        cb(null, uploadPath);
    },
    filename: (req:any , file:any , cb: any) => {
        cb(null, file.originalname);
    }
})
const upload = multer({ storage })


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