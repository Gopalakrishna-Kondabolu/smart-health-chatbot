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

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    reply: { type: String, required: true }
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
