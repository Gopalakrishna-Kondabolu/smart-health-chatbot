// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Message, Reminder } from "./models.js";
import { chatHandler } from "./controllers/chatbotController.js"; 
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("❌ Mongo error:", e));

// ✅ JWT Auth middleware (MOVED UP)
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    console.log("JWT VERIFY SECRET:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Chat route (NOW SAFE)
app.post("/api/chat", auth, chatHandler);
// ---------- Auth ----------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, age, gender, allergies } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: name || "User",
      email,
      password: hashed,
      age,
      gender,
      allergies,
    });
    await user.save();
    res.json({ message: "Registered" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("JWT SIGN SECRET:", process.env.JWT_SECRET);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/profile
app.get("/api/user/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      age: user.age || null,
      gender: user.gender || null,
      allergies: user.allergies || [],
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Reminders ----------
app.post("/api/reminders", auth, async (req, res) => {
  try {
    const { title, time } = req.body;
    if (!title || !time)
      return res.status(400).json({ message: "Missing fields" });

    const reminder = await Reminder.create({
      userId: req.user.userId,
      title,
      time: new Date(time)
    });
    res.json(reminder);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/reminders", auth, async (req, res) => {
  const reminders = await Reminder.find({ userId: req.user.userId }).sort({ time: 1 });
  res.json(reminders);
});

app.patch("/api/reminders/:id/done", auth, async (req, res) => {
  const r = await Reminder.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { $set: { done: true } },
    { new: true }
  );
  res.json(r);
});

// ---------- Emergency ----------
app.post("/api/emergency", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return res.status(400).json({ message: "Missing location data" });

    // Optional: Save location to DB (you can create an Emergency model)
    // const emergency = await Emergency.create({ userId: req.user.userId, latitude, longitude });

    console.log(`🚨 Emergency location from ${req.user.email}: ${latitude}, ${longitude}`);

    // Optional: Send SMS via Twilio or email
    // const twilio = require("twilio");
    // const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Emergency! Patient at https://maps.google.com/?q=${latitude},${longitude}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: process.env.AMBULANCE_PHONE
    // });

    res.json({ message: "Emergency location sent successfully!" });
  } catch (err) {
    console.error("Emergency error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/test-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Smart Healthcare Bot" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: "✅ Email Test Successful",
      text: "This is a test email from Smart Healthcare Chatbot.",
    });

    res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
    console.error("EMAIL ERROR:", err);
  }
});

// Root
app.get("/", (_req, res) =>
  res.send("✅ Smart Healthcare Chatbot API is running.")
);

app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 API on http://localhost:${process.env.PORT || 5000}`)
);

