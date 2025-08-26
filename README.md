🚗 Vehicle Rental App

A full-stack Vehicle Rental System built with MERN stack (MongoDB, Express, React, Node.js).
This project allows users to browse vehicles, make bookings (hourly/daily), save favorites, manage bookings, and includes an admin panel for managing users and vehicles.

🌟 Features
User Features

🔹 Register, login, and manage account

🔹 Browse available vehicles (cars, bikes, etc.)

🔹 Book vehicles hourly or daily

🔹 Cancel or complete bookings

🔹 Save favorite vehicles to wishlist

🔹 View booking history and invoices

🔹 Reset password via email OTP

Admin Features

🛠 Manage users (add, delete, change roles)

🛠 Manage vehicles (add, edit, delete)

🛠 View all bookings and send invoices

🛠 Generate reports on bookings and availability

Chatbot

🤖 AI-based assistant for queries about vehicles, bookings, prices, and recommendations

Reviews

⭐ Users can post and view reviews for vehicles

📁 Project Structure
VehicalRent/
├─ backend/           # Node.js + Express backend
│  ├─ controllers/    # API controllers
│  ├─ models/         # Mongoose models
│  ├─ routes/         # API routes
│  ├─ utils/          # Helper functions (sendEmail, OTP, etc.)
│  └─ .env            # Environment variables (ignored)
├─ frontend/          # React + Vite frontend
│  ├─ src/            # React components & pages
│  └─ .env            # Environment variables (ignored)
└─ README.md


⚙️ Backend Setup

1.Navigate to backend folder:
->cd backend


2.Install dependencies:
->npm install

3.Create .envref (reference for environment variables):
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

->Note: Use .envref as reference.

4.Run the backend:
->nodemon app.js

⚡ Frontend Setup

1.Navigate to frontend folder:
->cd frontend

2.Install dependencies:
->npm install

3.Create .envref for reference:
VITE_API_URL=http://localhost:8000
VITE_APP_CLOUD_NAME_CLOUDINARY=your_cloud_name
VITE_UPLOAD_PRESET=vehicalRent

4.Run frontend:
npm run dev

📧 Email Configuration

The backend uses Gmail SMTP with nodemailer for sending invoices and OTPs.
Set your credentials in .env:

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

💡 Notes

🚫 Do not commit your .env files to GitHub
✅ Use .envref for reference of required environment variables
🕒 Backend runs on port 8000 by default
🌐 Frontend runs on port 5173

📌 Tech Stack

Frontend: React, Vite, TailwindCSS

Backend: Node.js, Express

Database: MongoDB, Mongoose

Auth: JWT, bcrypt

Email: Nodemailer

AI Chatbot: Ollama model (gemma:2b)

Cloud Storage: Cloudinary

👨‍💻 Author
Ravi Jethva

📧 ravijethva2004@gmail.com

GitHub: jethvaravi5556

🚀 License

MIT License
