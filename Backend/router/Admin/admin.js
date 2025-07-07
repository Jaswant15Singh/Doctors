const express = require("express");
const upload = require("../../utils/multer");
const { log } = require("node:console");
const router = express.Router();

router.post(
  "/add-doctor",
  upload.single("doctor_profile"),
  async (req, res, next) => {
    const { name,specialization} = req.body;
    console.log(req.file);
    
    const doctor_profile=req.file.fieldname=== 'doctor_profile'?req.file.destination.replace("public/",''):'';    
    console.log(name,specialization);
    
    try {
      const data = await executeQuery("insert into doctor_def (name,specialization,profile_image) values ($1,$2,$3)",[name,specialization,doctor_profile]);
      res.status(200).json({ success: true, data:data.rows});
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
