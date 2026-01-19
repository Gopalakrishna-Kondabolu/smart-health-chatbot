import React, { useState, useEffect, useRef } from "react";
import "../styles.css";

const Chatbot = () => {
  const [messages, setMessages] = useState(() => {
  try {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Corrupted chatMessages in localStorage. Resetting...");
    localStorage.removeItem("chatMessages");
    return [];
  }
});
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null); // ✅ Ref for chat container

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    // Auto-scroll whenever messages update
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

const sendMessage = async () => {
  if (!input.trim()) return;

  const newMessages = [...messages, { text: input, sender: "user" }];
  setMessages(newMessages);
  setInput("");

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ message: input }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const text = await res.text();

let data;
try {
  data = JSON.parse(text);
} catch (e) {
  console.error("Invalid JSON from backend:", text);
  throw new Error("Backend returned invalid JSON");
}
    setMessages((prev) => [
      ...prev,
      { text: data.reply || "No response", sender: "bot" },
    ]);
  } catch (error) {
    console.error("Chatbot fetch error:", error);
    setMessages((prev) => [
      ...prev,
      { text: "Error connecting to chatbot", sender: "bot" },
    ]);
  }
};

  return (
    <div className="chat-container">
      <h2 className="chat-title">💬 Smart Healthcare Assistant</h2>
      <div className="chat-box" ref={chatBoxRef} style={{ overflowY: "auto", maxHeight: "400px" }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          className="chat-input"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-send-btn" onClick={sendMessage}>
          🚀
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
