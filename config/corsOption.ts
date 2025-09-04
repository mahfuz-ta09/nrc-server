const urlList = [
    "http://localhost:3000",
    "https://nrc-london.vercel.app",
    "https://nrcedu-uk.com",
    "https://www.nrcedu-uk.com",
    'https://api.nrcedu-uk.com',
]
const corsOption = {    
    origin: function (origin: any, callback: any) {
        if (!origin || urlList.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption

