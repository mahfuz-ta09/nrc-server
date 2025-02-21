const allowedOrigins = [
    'http://localhost:3000',
    'https://nrc-london.vercel.app'
]

const corsOption = {    
    origin: (origin: string | undefined, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not Allowed by CORS"));
        }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption