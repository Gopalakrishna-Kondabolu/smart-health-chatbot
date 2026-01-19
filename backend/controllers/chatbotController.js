// backend/controllers/chatbotController.js
import fetch from "node-fetch";
import { Message } from "../models.js";
import dotenv from "dotenv";

/* -------------------- Rule-based fallback -------------------- */
dotenv.config();

const rules = [
  {
    name: "EMERGENCY",
    keywords: [
      "chest pain",
      "severe bleeding",
      "unconscious",
      "stroke",
      "shortness of breath",
    ],
    response:
      "⚠️ This may be an emergency. Please call your local emergency number immediately or go to the nearest hospital.",
  },
  {
    name: "FLU / COLD",
    keywords: ["fever", "cough", "sore throat", "runny nose", "body ache"],
    response:
      "This sounds like a viral flu or cold. Are you experiencing fever, chest pain, or breathlessness? If not, rest well, stay hydrated, and monitor symptoms for 2–3 days.",
  },
  {
    name: "MIGRAINE",
    keywords: ["headache", "nausea", "sensitivity to light", "throbbing"],
    response:
      "Symptoms suggest migraine. Rest in a dark, quiet room and stay hydrated. Seek medical advice if frequent or severe.",
  },
  {
    name: "GASTROENTERITIS",
    keywords: ["vomiting", "diarrhea", "stomach pain", "nausea"],
    response:
      "Possible gastroenteritis. Drink ORS, avoid oily foods, and eat light meals. Visit a doctor if symptoms worsen.",
  },
  {
    name: "SKIN RASH",
    keywords: ["rash", "itching", "red patches"],
    response:
      "For mild rashes, keep the area clean and dry. Avoid scratching. If spreading or painful, consult a dermatologist.",
  },
  {
    name: "DIABETES RISK",
    keywords: [
      "frequent urination",
      "excessive thirst",
      "unexplained weight loss",
      "fatigue",
    ],
    response:
      "These may indicate high blood sugar levels. Consider a blood test and consult a healthcare professional.",
  },
];

function matchRules(text) {
  const t = text.toLowerCase();

  // Emergency check first
  const emergency = rules[0];
  if (emergency.keywords.some((k) => t.includes(k))) {
    return emergency.response;
  }

  let bestMatch = { score: 0, response: null };

  for (let i = 1; i < rules.length; i++) {
    let score = 0;
    for (const keyword of rules[i].keywords) {
      if (t.includes(keyword)) score++;
    }
    if (score > bestMatch.score) {
      bestMatch = { score, response: rules[i].response };
    }
  }

  if (bestMatch.score > 0) return bestMatch.response;

  if (t.includes("diet") || t.includes("nutrition"))
    return "Maintain a balanced diet with fruits, vegetables, proteins, and adequate hydration.";

  if (t.includes("exercise"))
    return "Aim for at least 150 minutes of moderate exercise per week. Start slowly.";

  if (t.includes("covid"))
    return "If you have COVID-like symptoms, isolate yourself and seek medical advice if breathing issues occur.";

  return "I’m a healthcare assistant, not a doctor. Please describe your symptoms clearly for better guidance.";
}

/* -------------------- AI Integration (OpenRouter) -------------------- */

async function fetchOpenRouter(message) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Smart Healthcare Chatbot",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "You are a smart healthcare chatbot. Speak politely and naturally like a doctor. Ask 1–2 follow-up questions if needed. Give safe, non-diagnostic medical advice. Never prescribe medicines or doses. Avoid repeating the same response.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("AI service error:", error);
    return null;
  }
}

/* -------------------- Chat Controller -------------------- */

export const chatHandler = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not found in token" });
    }

    let reply = await fetchOpenRouter(message);

    // fallback if AI fails or returns empty
    if (!reply) {
      reply = matchRules(message);
    }

    // save user message
    await Message.create({
      userId: req.user.userId,
      sender: "user",
      content: message,
      sessionId: sessionId || null,
    });

    // save bot reply
    await Message.create({
      userId: req.user.userId,
      sender: "bot",
      content: reply,
      sessionId: sessionId || null,
    });

    return res.status(200).json({
reply: reply || "I’m here to help. Could you describe your symptoms in more detail?"
});
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
