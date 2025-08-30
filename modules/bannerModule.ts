import express from "express"
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../controllers/banner/bannerControllers"
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { fileUploadHelper } from "../helper/fileUploadHealper"





router.get("/all/:status", getAllBanners)
router.get("/:id", getBannerById)

router.post("/create",  
    verifyUser,
    fileUploadHelper.upload.fields([{ name: "bannerImg", maxCount: 1 }]),
    createBanner)

router.put("/update/:id",  
    verifyUser,
    fileUploadHelper.upload.fields([{ name: "bannerImg", maxCount: 1 }]),
    updateBanner)


router.delete("/delete/:id", 
    verifyUser,
    deleteBanner)

export const bannerModule = router