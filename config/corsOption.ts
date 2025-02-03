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
    optionSuccessStatus: 200
}

module.exports = corsOption