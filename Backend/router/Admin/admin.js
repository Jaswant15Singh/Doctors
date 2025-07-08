const express = require("express");
const upload = require("../../utils/multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { executeQuery } = require("../../utils/db");
const router = express.Router();
const { pool } = require("../../utils/db");

router.post("/add-user", async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const client = await pool.connect();
    await client.query("begin");
    const id = await client.query(
      "INSERT INTO admin_def (name,created_date) values ($1,now()) returning id",
      [name]
    );
    await client.query(
      "INSERT INTO user_def (password,admin_id) values ($1,$2)",
      [hashedPassword, id.rows[0].id]
    );
    await client.query("COMMIT");
    res
      .status(200)
      .json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  }
});

router.put("/update-user/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  let query = "";
  try {
    const isPresent = await executeQuery(
      "SELECT * from user_def u where admin_id = $1 or teacher_id = $2",
      [id, id]
    );

    if (isPresent.rows[0].admin_id) {
      query = "INNER JOIN admin_def d on u.admin_id = d.id";
    }
    if (isPresent.rows[0].teacher_id) {
      query = "INNER JOIN teacher_def d on u.teacher_id = d.id";
    }

    const userDetails=await executeQuery(`select * from user_def u ${query} where name =$1 and d.id <> $2`,[name,id]);
    console.log(userDetails.rows[0]);
    
  } catch (error) {}
});

router.post("/login", async (req, res) => {
  const { name, password } = req.body;
  let userType = null;
  try {
    const userData = await executeQuery(
      "SELECT * FROM user_def u inner join admin_def a on a.id=u.admin_id where a.name =$1",
      [name]
    );
    const user = userData.rows[0];
    if (userData.rows.length < 1) {
      return res
        .status(404)
        .json({ success: false, message: "User doesnt exists" });
    }
    const userPassword = userData.rows[0].password;
    const hashedPassword = await bcrypt.compare(password, userPassword);
    if (!hashedPassword) {
      return res
        .status(404)
        .json({ success: false, message: "Wrong password" });
    }
    if (user.admin_id) {
      userType = "admin";
    } else if (user.teacher_id) {
      userType = "teacher";
    }
    const token = await jwt.sign(
      { userType, name: user.name, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1hr" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.json({ message: "Logged in successfully", token, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/add-doctor",
  upload.single("doctor_profile"),
  async (req, res, next) => {
    const { name, specialization } = req.body;

    const doctor_profile =
      req.file.fieldname === "doctor_profile"
        ? req.file.destination.replace("public/", "")
        : "";
    console.log(name, specialization);

    try {
      const data = await executeQuery(
        "insert into doctor_def (name,specialization,profile_image) values ($1,$2,$3)",
        [name, specialization, doctor_profile]
      );
      res.status(200).json({ success: true, data: data.rows });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
