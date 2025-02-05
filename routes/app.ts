import { authModule } from "../modules/authModule"
import { universityModules } from "../modules/universityModules"



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
]

allRoutes.forEach(route => router.use(route.path,route.route))
module.exports = router