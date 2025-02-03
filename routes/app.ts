import { authModule } from "../modules/authModule"



const express = require('express')
const router = express.Router()


const allRoutes = [
    {
        path: '/auth',
        route: authModule
    }
]

allRoutes.forEach(route => router.use(route.path,route.route))
module.exports = router