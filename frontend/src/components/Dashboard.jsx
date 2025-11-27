import React, { useState } from "react";
import Reminders from "./Remainders";
import Emergency from "./Emergency";
import "./dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(null);

  const sections = [
    { id: "reminders", title: "⏰ Reminders" },
    { id: "emergency", title: "⚠️ Emergency" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "reminders":
        return <Reminders />;
      case "emergency":
        return <Emergency />;
      default:
        return (
          <p className="text-gray-500 text-center">
            Select a section above 👆
          </p>
        );
    }
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>

      {/* Cards */}
      <div className="cards-container">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`card ${activeTab === section.id ? "active" : ""}`}
            onClick={() => setActiveTab(section.id)}
          >
            <h2>{section.title}</h2>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="card content-area">{renderContent()}</div>
    </div>
  );
};

export default Dashboard;
