const urlList = [
    'http://localhost:3000',
    'https://nrc-london.vercel.app',
    'https://www.nrcedu-uk.com'
] 


const corsOption = {    
    origin: function (origin:any, callback:any) {
      if (urlList.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    // origin:'https://www.nrcedu-uk.com',
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ["Content-Type", "Authorization","authorization"],
    optionSuccessStatus: 200
}

module.exports = corsOption

