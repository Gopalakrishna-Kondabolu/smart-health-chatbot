// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Message, Reminder } from "./models.js";
import fetch from "node-fetch"; // for OpenRouter API calls

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("❌ Mongo error:", e));

// JWT Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

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

// ---------- Symptom Rules (fallback if AI fails) ----------
const rules = [
  {
    name: "EMERGENCY",
    keywords: ["chest pain", "severe bleeding", "unconscious", "stroke", "shortness of breath"],
    response:
      "⚠️ This may be an emergency. Call your local emergency number immediately or go to the nearest hospital."
  },
  {
    name: "FLU / COLD",
    keywords: ["fever", "cough", "sore throat", "runny nose", "body ache"],
    response:
      "Looks like a viral flu/cold. Stay hydrated, rest, consider paracetamol for fever, and monitor symptoms. If it persists >3–5 days or worsens, consult a doctor."
  },
  {
    name: "MIGRAINE",
    keywords: ["headache", "nausea", "sensitivity to light", "throbbing"],
    response:
      "Symptoms suggest migraine. Rest in a dark quiet room, stay hydrated, consider doctor-advised pain relief. Keep a trigger diary (sleep, stress, foods)."
  },
  {
    name: "GASTROENTERITIS",
    keywords: ["vomiting", "diarrhea", "stomach pain", "nausea"],
    response:
      "May be gastroenteritis. Take ORS, avoid oily/spicy foods, small frequent sips of water. Seek care if blood in stool, high fever, or dehydration."
  },
  {
    name: "SKIN RASH",
    keywords: ["rash", "itching", "red patches"],
    response:
      "For mild rashes: keep area clean and dry, avoid scratching, try hypoallergenic moisturizer. If spreading, painful, or with fever—consult a dermatologist."
  },
  {
    name: "DIABETES RISK",
    keywords: ["frequent urination", "excessive thirst", "unexplained weight loss", "fatigue"],
    response:
      "These can be signs of high blood sugar. Consider a fasting blood sugar test and speak with a physician soon."
  }
];

function matchRules(text) {
  const t = text.toLowerCase();
  const emergency = rules[0];
  if (emergency.keywords.some(k => t.includes(k))) return emergency.response;

  let best = { score: 0, resp: null };
  for (let i = 1; i < rules.length; i++) {
    const r = rules[i];
    let score = 0;
    for (const kw of r.keywords) if (t.includes(kw)) score++;
    if (score > best.score) best = { score, resp: r.response };
  }
  if (best.score > 0) return best.resp;

  if (t.includes("diet") || t.includes("nutrition"))
    return "General tip: prefer whole foods, fruits/vegetables, adequate protein, and hydrate well. For specific conditions, consult a dietician.";
  if (t.includes("exercise"))
    return "Aim for 150 minutes/week moderate activity + 2 days strength training. Start slow and increase gradually.";
  if (t.includes("covid"))
    return "If COVID-like symptoms: isolate, test if available, rest, hydrate. Seek care if breathing difficulty/high fever.";

  return "I’m a health assistant, not a doctor. Please describe your symptoms (e.g., 'fever, cough, sore throat') or ask a general health question.";
}

// ---------- OpenRouter Setup ----------
async function fetchOpenRouter(message) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",  // change for production
        "X-Title": "Smart Healthcare Chatbot"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",  // good free model
        messages: [
          { role: "system", content: "You are a helpful healthcare assistant. Keep responses short, clear, and not diagnostic." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, I couldn’t process that.";
  } catch (err) {
    console.error("OpenRouter error:", err);
    return "⚠️ Error contacting AI service.";
  }
}
// ---------- Chat ----------
app.post("/api/chat", auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body; // optional sessionId for grouping chats
    if (!message) return res.status(400).json({ message: "No message" });

    // --- Get bot reply (AI first, fallback to rules) ---
    let reply;
    try {
      reply = await fetchOpenRouter(message);
    } catch (err) {
      console.error("⚠️ OpenRouter failed, using rules:", err.message);
      reply = matchRules(message);
    }

    // --- Save user message ---
    await Message.create({
      userId: req.user.userId,
      sender: "user",
      content: message,
      sessionId: sessionId || null
    });

    // --- Save bot reply ---
    await Message.create({
      userId: req.user.userId,
      sender: "bot",
      content: reply,
      sessionId: sessionId || null
    });

    res.json({ reply });
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all previous chats (for dashboard)
app.get("/api/chat/history", auth, async (req, res) => {
  try {
    const msgs = await Message.find({ userId: req.user.userId })
      .sort({ createdAt: 1 });
    res.json(msgs);
  } catch (e) {
    console.error("History error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch a specific chat session
app.get("/api/chat/session/:sessionId", auth, async (req, res) => {
  try {
    const msgs = await Message.find({
      userId: req.user.userId,
      sessionId: req.params.sessionId
    }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (e) {
    console.error("Session history error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear chat history for fresh chat page
app.delete("/api/chat/clear", auth, async (req, res) => {
  try {
    await Message.deleteMany({ userId: req.user.userId });
    res.json({ message: "Chat history cleared" });
  } catch (e) {
    console.error("Clear chat error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Reminders ----------
app.post("/api/reminders", auth, async (req, res) => {
  try {
    const { title, time } = req.body;
    if (!title || !time) return res.status(400).json({ message: "Missing fields" });
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
// ---------- Emergency Location ----------
// POST /api/emergency
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

// Root
app.get("/", (_req, res) => res.send("✅ Smart Healthcare Chatbot API is running."));

app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 API on http://localhost:${process.env.PORT || 5000}`)
);

