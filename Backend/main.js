const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const cookieParser=require('cookie-parser');
const dotenv = require("dotenv");
const admin = require("./router/Admin/admin");
require("./utils/db")
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(express.static(`${__dirname}/public`));
app.use(cookieParser())
app.use("/", admin);
app.use((err,req,res,next)=>{
    res.status(500).json({success:false,message:err.message})
})
app.listen(process.env.PORT, () => {
  console.log(`server is running on ${process.env.PORT}`);
});
