# Intelixir - AI-Powered Social News Platform

## 🚀 Quick Start

### 1. Setup Environment Variables
```bash
cd backend
# Edit .env file with your API keys
```

### 2. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

### 3. Start Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin**: http://localhost:3000/admin

## 🔑 Required API Keys

1. **News API**: Get from https://newsapi.org/
2. **Gemini AI**: Get from https://makersuite.google.com/app/apikey  
3. **SMTP**: Gmail app password or other email service

## 👑 Default Admin Login
- **Email**: admin@intelixir.com
- **Password**: secure_admin_password_123

**⚠️ Change these credentials immediately!**

## ✨ Features

- ✅ AI-curated news with Gemini AI
- ✅ Social features (like, comment, share)
- ✅ Personalized feeds
- ✅ Email digests
- ✅ Admin dashboard
- ✅ Mobile responsive
- ✅ GDPR compliant

## 🏗️ Project Structure

```
intelixir-platform/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── scripts/         # Database scripts
│   ├── uploads/         # File uploads
│   ├── tests/           # Test files
│   ├── package.json     # Backend dependencies
│   └── .env            # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── styles/      # CSS files
│   │   └── utils/       # Utility functions
│   ├── public/          # Static files
│   ├── package.json     # Frontend dependencies
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT Authentication**
- **Multer** for file uploads
- **Sharp** for image processing
- **Nodemailer** for emails
- **NewsAPI** integration
- **Google Gemini AI** integration

### Frontend
- **React 18** + **React Router**
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Query** for state management
- **React Hook Form** for forms
- **Framer Motion** for animations

## 📱 Development Commands

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
npm run seed         # Seed database

# Frontend
npm start            # Start development server
npm build            # Build for production
npm test             # Run tests
```

## 🌐 Production Deployment

See `docs/DEPLOYMENT.md` for production setup instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Need Help?

- Check the documentation in `docs/` folder
- Open an issue on GitHub
- Contact the development team

---

**Happy coding! 🎉**
