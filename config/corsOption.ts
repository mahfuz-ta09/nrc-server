const allowedOrigins = [
    'http://localhost:3000',
    'https://nrc-london.vercel.app'
]

const corsOption = {    
    origin: 'https://nrc-london.vercel.app',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption