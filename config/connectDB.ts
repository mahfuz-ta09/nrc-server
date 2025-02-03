const { MongoClient } = require("mongodb")

const uri = process.env.DATABASE_URI

let db:any
let client:any
let isConnected = false

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