const urlList = [
  "http://localhost:3000",
  "https://nrc-london.vercel.app",
  "https://www.nrcedu-uk.com",
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
  methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
}

module.exports = corsOption
