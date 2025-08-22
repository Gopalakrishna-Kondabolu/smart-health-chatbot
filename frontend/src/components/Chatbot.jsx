import React, { useState } from "react";
import { sendMessage } from "../services/api";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input) return;
    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const res = await sendMessage(input);
      const botMessage = { sender: "bot", text: res.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", maxWidth: "500px", margin: "auto" }}>
      <h3>Smart Healthcare Chatbot</h3>
      <div style={{ minHeight: "200px", border: "1px solid #eee", padding: "10px", marginBottom: "10px", overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === "user" ? "right" : "left", margin: "5px 0" }}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
          </div>
        ))}
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." />
      <button onClick={handleSend}>Send</button>
    </div>
  );
};

export default Chatbot;
