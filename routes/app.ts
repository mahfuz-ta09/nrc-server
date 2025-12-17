import { authModule } from "../modules/authModule"
import { universityModules } from "../modules/universityModules"
import { subjectModule } from "../modules/subjectModule"
import { reviewModules } from "../modules/reviewModule"
import { precessModule } from "../modules/processModule"
import { superAdminModule } from "../modules/superAdminModule"
import { agentModule } from "../modules/agentModule"
import { profileModule } from "../modules/profileModule"
import { countryBaseModule } from "../modules/countryBaseModule"
import { bannerModule } from "../modules/bannerModule"
import { blogsModule } from "../modules/blogsModule"
import { affiliatedUniModule } from "../modules/affiliatedUniModule"
import { fileUploader } from "../modules/fileUploader"
import { subjectChoiceModels } from "../modules/subjectChoiceModels"



const express = require('express')
const router = express.Router()


const allRoutes = [
    {
        path: '/auth',
        route: authModule
    },
    {
        path: '/university',
        route: universityModules
    },
    {
        path: '/country',
        route: countryBaseModule
    },
    {
        path: '/subject',
        route: subjectModule
    },
    {
        path: '/review',
        route: reviewModules
    },
    {
        path: '/process',
        route: precessModule
    },
    {
        path: '/super_admin',
        route: superAdminModule
    },
    {
        path: '/agent',
        route: agentModule
    },
    {
        path: '/profile',
        route: profileModule
    },
    {
        path: '/banner',
        route: bannerModule
    },
    {
        path: '/blog',
        route: blogsModule
    },
    {
        path: '/affiliated-uni',
        route: affiliatedUniModule
    },
    {
        path: '/file',
        route: fileUploader
    },
    {
        path: '/application',
        route: subjectChoiceModels
    },
]

allRoutes.forEach(route => router.use(route.path,route.route))
module.exports = router