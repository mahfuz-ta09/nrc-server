
const corsOption = {    
    origin: 'https://nrc-london.vercel.app',
    // origin: 'http://localhost:3000',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption