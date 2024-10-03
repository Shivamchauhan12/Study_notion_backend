const express=require('express');
const app=express();

const userRoutes=require('./routes/User')
const courseRoutes=require('./routes/Course')
const profileRoutes=require('./routes/Profile')
const paymentRoutes=require('./routes/Payment')

const database=require('./config/database');
const {cloudinaryConnect}=require('./config/cloudinary')
const cookieParser=require('cookie-parser')
const cors=require('cors')
const dotenv=require('dotenv')
const fileUpload=require('express-fileupload')

const PORT=process.env.PORT || 4000;

dotenv.config();

database.connect();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:"http:localhost:3000",
        credentials:true
    })
)

cloudinaryConnect();

app.use("/api/v1/auth",userRoutes)
app.use("/api/v1/profile",profileRoutes)
app.use("/api/v1/course",courseRoutes)
app.use("/api/v1/payment",paymentRoutes)


app.get("/",async(req,res)=>{
    res.json({
        success:true,
        message:"this app is runnign"
    })
})

app.listen(PORT,()=>{
    console.log(`app is runnig on ${PORT}`)
})