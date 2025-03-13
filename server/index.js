import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken'


import './helpers/database.js'
import route from './routes/index.routes.js';
const app = express();
dotenv.config();
app.use(cookieParser())

dotenv.config();

app.use(cors(
    {
        origin:"http://localhost:5173",
        credentials:true
    }
    
))

app.use(express.json())
app.get("/",(req,res)=>{
    res.send("Hello World")
})
app.use(route)

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})