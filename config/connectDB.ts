const { MongoClient } = require("mongodb")

const uri = process.env.DATABASE_URI
// mongodb+srv://mahfuzta09:nlSs7NBLOvnUpMw6@cluster0.8goaquo.mongodb.net/?retryWrites=true&w=majority&appName=cluster0
let db:any
let client:any
let isConnected = false
console.log(uri)
// if (!uri) {
//     throw new Error("MongoDB URI is not defined! Check Railway environment variables.")
// }


const connectDb = async() =>{
    if(isConnected && db){
        console.log("Using existing database connection.")
        return db
    }

    try{
        client = new MongoClient(uri)
        await client.connect()
        db = client.db()
        isConnected = true

        console.log("Database connected successfully!")
        return db
    }catch(err:any){
        console.error('Error connecting to database:',err)
    }
}


const getDb = () =>{
    if(!db){
        throw new Error('Connection yet not established!')
    }
    return db
}

module.exports = {
    connectDb,
    getDb
}