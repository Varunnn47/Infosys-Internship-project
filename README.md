# 🔬 AI Research Paper Summarizer

A modern, full-stack application that extracts insights and generates summaries from research papers using AI-powered text processing. Built with FastAPI, MongoDB, and Groq AI.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)

## ✨ Features

### 🤖 **AI-Powered Analysis**
- **Smart Summarization**: Uses Groq Llama-3.3-70b for intelligent paper summaries
- **Key Insights Extraction**: Automatically identifies important findings and contributions
- **Citation Analysis**: Extracts and organizes research citations
- **Q&A with Papers**: Chat with your uploaded papers using AI

### 📄 **Document Processing**
- **Multi-format Support**: PDF and DOCX file uploads
- **Text Input**: Direct text pasting for quick analysis
- **Drag & Drop Interface**: Intuitive file upload experience
- **Large File Handling**: Supports papers up to 10MB

### 🔍 **Advanced Features**
- **Paper Comparison**: Side-by-side analysis of two research papers
- **Research History**: Track and organize all your analyzed papers
- **Export Options**: Download results as PDF or TXT files
- **Email Sharing**: Send summaries directly via email
- **Reading Analytics**: Track reading time and paper engagement

### 🎨 **Modern Interface**
- **Dark Theme**: Eye-friendly dark mode interface
- **Mobile Responsive**: Optimized for all device sizes
- **Progressive Web App**: Install as a native app
- **Real-time Updates**: Live progress tracking and notifications

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based login system
- **User Accounts**: Personal dashboards and data isolation
- **Password Encryption**: Bcrypt hashing for security
- **Environment Variables**: Secure configuration management

## 🚀 Live Demo

**Frontend**: [https://your-app.vercel.app](https://your-app.vercel.app)
**API Docs**: [https://your-app.vercel.app/api/docs](https://your-app.vercel.app/api/docs)

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Groq Llama-3.3-70b** - Advanced AI for summarization
- **MongoDB Atlas** - Cloud database for user data
- **PyMuPDF** - PDF text extraction
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **FAISS** - Vector similarity search
- **JWT** - Secure authentication
- **Passlib** - Password hashing

### Frontend
- **HTML5/CSS3** - Modern web standards
- **Vanilla JavaScript** - No frameworks, pure performance
- **Progressive Web App** - Native app experience
- **Responsive Design** - Mobile-first approach

### Infrastructure
- **Vercel** - Serverless deployment platform
- **MongoDB Atlas** - Cloud database hosting
- **Groq Cloud** - AI model hosting

## 📁 Project Structure

```
ai-research-summarizer/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── database.py         # MongoDB operations
│   ├── auth.py            # Authentication logic
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── index.html         # Entry point
│   ├── login.html         # Authentication page
│   ├── main.html          # Main application
│   ├── style.css          # Styling
│   ├── script.js          # Main JavaScript
│   ├── auth.js            # Authentication JS
│   └── compare.js         # Compare functionality
├── vercel.json            # Vercel configuration
├── requirements.txt       # Root requirements
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB Atlas account
- Groq API key
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-research-summarizer.git
   cd ai-research-summarizer
   ```

2. **Set up environment**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_secret_key_here
   MONGO_URL=your_mongodb_connection_string
   ENVIRONMENT=development
   ```

5. **Run the application**
   ```bash
   # Start backend
   cd backend
   uvicorn app:app --reload
   
   # Open frontend
   # Open frontend/login.html in your browser
   ```

### 🌐 Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Add environment variables:
     - `GROQ_API_KEY`
     - `SECRET_KEY`
     - `MONGO_URL`
     - `ENVIRONMENT=production`
     - `FRONTEND_URL=https://your-app.vercel.app`

3. **Access your app**
   - Your app will be live at `https://your-app.vercel.app`

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

## 📖 Usage Guide

### 1. **Account Setup**
- Visit the application URL
- Click "Sign up" to create an account
- Login with your credentials

### 2. **Analyze Papers**
- **Upload PDF**: Drag & drop or click to select PDF files
- **Paste Text**: Copy and paste paper content directly
- **Generate Summary**: Click "Generate Summary" to process

### 3. **Compare Papers**
- Navigate to "Compare" tab
- Upload or paste content for two papers
- Click "Compare Papers" for side-by-side analysis

### 4. **Manage History**
- View all analyzed papers in "History" tab
- Rate papers, add notes, and organize your research
- Export or delete analyses as needed

### 5. **Advanced Features**
- **Chat with Papers**: Ask questions about uploaded papers
- **Export Results**: Download as PDF or TXT
- **Email Sharing**: Send summaries to colleagues

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq AI API key for summarization | Yes |
| `SECRET_KEY` | JWT secret key for authentication | Yes |
| `MONGO_URL` | MongoDB connection string | Yes |
| `ENVIRONMENT` | Environment (development/production) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Production |
| `SMTP_USER` | Email username for notifications | Optional |
| `SMTP_PASS` | Email password for notifications | Optional |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signup` | POST | Create new user account |
| `/api/login` | POST | User authentication |
| `/api/upload` | POST | Upload and analyze PDF |
| `/api/summarize` | POST | Analyze text content |
| `/api/compare` | POST | Compare two papers |
| `/api/history` | GET | Get user's analysis history |
| `/api/chat` | POST | Chat with paper content |
| `/api/export/{id}` | GET | Export analysis as PDF |

## 🎯 Performance

- **Processing Speed**: 2-5 seconds for typical papers
- **File Size Limit**: 10MB per upload
- **Concurrent Users**: Scales automatically with Vercel
- **Database**: MongoDB Atlas with automatic scaling

## 🔒 Security

- **Authentication**: JWT-based secure authentication
- **Password Security**: Bcrypt hashing with salt
- **Data Isolation**: User-specific data access
- **HTTPS**: All communications encrypted
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API abuse prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing advanced AI models
- **MongoDB Atlas** for reliable database hosting
- **Vercel** for seamless deployment platform
- **FastAPI** for the excellent web framework
- **Sentence Transformers** for text embedding models

## 📞 Support

- **Documentation**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-research-summarizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-research-summarizer/discussions)

## 🗺️ Roadmap

- [ ] **Multi-language Support** - Analyze papers in different languages
- [ ] **Research Recommendations** - AI-powered paper suggestions
- [ ] **Collaboration Features** - Share and collaborate on analyses
- [ ] **Advanced Visualizations** - Citation networks and research maps
- [ ] **API Integration** - Connect with academic databases
- [ ] **Mobile App** - Native iOS and Android applications

---

**Built with ❤️ by [Your Name]**

*Transform your research workflow with AI-powered paper analysis*