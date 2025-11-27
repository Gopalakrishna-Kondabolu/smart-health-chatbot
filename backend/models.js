// backend/models.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    allergies: [String]
  },
  { timestamps: true }
);

// ✅ updated message schema
const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: String, enum: ["user", "bot"], required: true },
    content: { type: String, required: true },
    sessionId: { type: String, default: null } // ✅ added so server.js can save it
  },
  { timestamps: true }
);


const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    time: { type: Date, required: true },
    done: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const Message = mongoose.model("Message", messageSchema);
export const Reminder = mongoose.model("Reminder", reminderSchema);
