
// origin: 'https://nrc-london.vercel.app',
// origin: 'http://localhost:3000',
//   origin: 'https://www.nrcedu-uk.com',
// const allowedOrigins = ['https://www.nrcedu-uk.com', 'https://nrc-london.vercel.app']
// origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//     } else {
//         callback(new Error('Not allowed by CORS'));
//     }
// },
const corsOption = {    
    origin: 'https://www.nrcedu-uk.com',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption

