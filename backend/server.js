// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Message, Reminder } from "./models.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.error("Mongo error:", e));

// Auth middleware
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
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, age, gender, allergies } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, age, gender, allergies });
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

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Simple Symptom Engine ----------
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

const clean = (s) => s.toLowerCase();

function matchRules(text) {
  const t = clean(text);
  // emergency first
  const emergency = rules[0];
  if (emergency.keywords.some(k => t.includes(k))) return emergency.response;

  // others by score
  let best = { score: 0, resp: null };
  for (let i = 1; i < rules.length; i++) {
    const r = rules[i];
    let score = 0;
    for (const kw of r.keywords) if (t.includes(kw)) score++;
    if (score > best.score) best = { score, resp: r.response };
  }
  if (best.score > 0) return best.resp;

  // FAQs (simple)
  if (t.includes("diet") || t.includes("nutrition"))
    return "General tip: prefer whole foods, fruits/vegetables, adequate protein, and hydrate well. For specific conditions, consult a dietician.";
  if (t.includes("exercise"))
    return "Aim for 150 minutes/week moderate activity + 2 days strength training. Start slow and increase gradually.";
  if (t.includes("covid"))
    return "If COVID-like symptoms: isolate, test if available, rest, hydrate. Seek care if breathing difficulty/high fever.";

  return "I’m a health assistant, not a doctor. Please describe your symptoms (e.g., 'fever, cough, sore throat') or ask a general health question.";
}

// ---------- Chat ----------
app.post("/api/chat/message", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "No message" });
    const reply = matchRules(message);
    await Message.create({ userId: req.user.userId, text: message, reply });
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/chat/history", auth, async (req, res) => {
  const msgs = await Message.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(msgs);
});

// ---------- Reminders ----------
app.post("/api/reminders", auth, async (req, res) => {
  try {
    const { title, time } = req.body; // time as ISO date string
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

// Root
app.get("/", (_req, res) => res.send("Smart Healthcare Chatbot API is running."));

app.listen(process.env.PORT || 5000, () =>
  console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);
