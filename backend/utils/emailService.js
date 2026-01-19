import nodemailer from "nodemailer";

export const sendAlertEmail = async (user, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.ALERT_EMAIL,
    to: process.env.DOCTOR_EMAIL, // or guardian email
    subject: "⚠️ Health Risk Alert – Smart Healthcare Chatbot",
    text: `
High-risk health symptoms detected.

Patient Name: ${user?.name || "Unknown"}
Symptoms: ${message}
Time: ${new Date().toLocaleString()}

Immediate medical attention is advised.
`
  };

  await transporter.sendMail(mailOptions);
};
