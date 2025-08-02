// utils/sendEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // use 587 instead of 465
  secure: false, // use TLS (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER, // e.g. yourname@gmail.com
    pass: process.env.EMAIL_PASS, // App password
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error); // 🔥 will show timeout if it occurs
  } else {
    console.log("Email transporter is ready to send emails");
  }
});

export const sendEmail = async (to, subject, html ,attachments = []) => {
  try {
    await transporter.sendMail({
      from: `"VehicleRent" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error; // So frontend gets 500
  }
};