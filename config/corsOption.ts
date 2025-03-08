
// origin: 'https://nrc-london.vercel.app',
// origin: 'http://localhost:3000',

const corsOption = {    
    origin: 'https://www.nrcedu-uk.com/',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption

