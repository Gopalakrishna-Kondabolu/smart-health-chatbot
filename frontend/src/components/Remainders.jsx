import React, { useState } from "react";
import "../styles.css";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [text, setText] = useState("");
  const [dateTime, setDateTime] = useState("");

  const addReminder = () => {
    if (!text.trim() || !dateTime) return;
    setReminders([...reminders, { text, dateTime }]);
    setText("");
    setDateTime("");
  };

  return (
    <div className="reminders-container">
      <h2 className="section-title">📅 Advanced Reminders</h2>
      <ul className="reminder-list">
        {reminders.map((r, i) => (
          <li key={i} className="reminder-item">
            ⏰ <strong>{r.text}</strong>  
            <span className="reminder-time">
              {new Date(r.dateTime).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      <div className="reminder-input">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a reminder..."
          className="reminder-text"
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="datetime-picker"
        />
        <button onClick={addReminder} className="add-btn">
          ➕ Add
        </button>
      </div>
    </div>
  );
};

export default Reminders;
