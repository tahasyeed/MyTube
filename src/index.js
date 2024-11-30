// require('dotenv').config({path: './env'})


import dotenv from "dotenv"
import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})


const app = express();


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`)
            
        })
    })
    .catch((err) => {
    console.log("MongoDb connectio Failed !!", err);
})

















// import express from "express";
// const app = express()




// ; (async () => {
//     // Connect to the database
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", () => {
//             console.log("Error: " + error);
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`app is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("ERROR : " + error)
//         throw error
//     }

// })()