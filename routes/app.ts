import { authModule } from "../modules/authModule"
import { universityModules } from "../modules/universityModules"
import { subjectModule } from "../modules/subjectModule"
import { reviewModules } from "../modules/reviewModule"



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
        path: '/subject',
        route: subjectModule
    },
    {
        path: '/review',
        route: reviewModules
    },
]

allRoutes.forEach(route => router.use(route.path,route.route))
module.exports = router