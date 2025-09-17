require('dotenv').config()
import express, { Express, Request, Response } from "express"
const app: Express = express()
const cors =  require('cors')
const corsOption = require('./config/corsOption')
const cookieParser = require('cookie-parser')
const { connectDb } = require('./config/connectDB')
const routes = require('./routes/app')
const port = process.env.PORT || 7373


connectDb()
app.use(cors(corsOption))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.PARSERSECRET))


app.use('/app/v1',routes)

app.get('/', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Server is running fine...!!!',
  })
})


app.all('*',(req:Request,res:Response) =>{
  console.log("object")
  res.json({ message: '404 Not Found'})
})

app.listen(port, () => {
    console.log(`server running on http://localhost/${port}`)
})