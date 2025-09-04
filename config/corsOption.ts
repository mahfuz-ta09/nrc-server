const urlList = [
    "http://localhost:3000",
    "https://nrc-london.vercel.app",
    "https://nrcedu-uk.com",
    "https://www.nrcedu-uk.com",
    'https://api.nrcedu-uk.com',
]
const corsOption = {    
    origin: 'https://www.nrcedu-uk.com',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption

