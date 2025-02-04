import { SourceOrigin } from "module"

const allowedOrigins = [
    'https://nrc-london.vercel.app',
    'http://localhost:3000',
]

const corsOption = {
    origin: (origin: string | undefined, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not Allowed by CORS"));
        }
    },
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    optionSuccessStatus: 200
}

module.exports = corsOption