import { SourceOrigin } from "module"
const allowedOrigin = require('./allowedOrigin')

const corsOption = {
    origin: (origin: SourceOrigin, callback:any) => {
        if(allowedOrigin.indexOf(origin) !== -1 || !origin){
            callback(null, true)
        }else{
            callback(new Error("Not Allowed by CORS"))
        }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    optionSuccessStatus: 200
}

module.exports = corsOption