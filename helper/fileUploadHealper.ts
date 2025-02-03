const multer = require('multer')
const path = require('path')
const cloudinary = require('cloudinary').v2
import * as fs from 'fs'


cloudinary.config({ 
   cloud_name: "dmxiz25qo", 
   api_key: "885554742652777", 
   api_secret: "iZZ_BhLcIc9zsTN_ad3vPDo_Zfs"
})


const storage = multer.diskStorage({
    destination: (req:any, file:any, cb:any) => {
        const uploadPath = path.join(__dirname, 'uploads')
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