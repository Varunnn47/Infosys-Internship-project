#!/bin/bash

# Build script for AI Research Paper Summarizer
echo "🚀 Preparing for Render deployment..."

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo "Please create backend/.env with your API keys before deployment"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ backend/requirements.txt not found!"
    exit 1
fi

# Validate Python dependencies
echo "📦 Checking Python dependencies..."
cd backend
python -m pip check
if [ $? -ne 0 ]; then
    echo "❌ Dependency issues found. Please fix before deployment."
    exit 1
fi
cd ..

# Check if all required files exist
required_files=(
    "backend/app.py"
    "backend/database.py" 
    "backend/auth.py"
    "frontend/login.html"
    "frontend/main.html"
    "frontend/auth.js"
    "frontend/script.js"
    "frontend/style.css"
    "render.yaml"
    "Dockerfile"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files present"

# Check for sensitive data in files
echo "🔍 Checking for exposed secrets..."
if grep -r "your_groq_api_key_here\|your_secret_key_here\|your_mongodb_url_here" backend/ frontend/ --exclude-dir=.git; then
    echo "❌ Found placeholder secrets! Please replace with actual values in .env file"
    exit 1
fi

echo "✅ No exposed secrets found"

# Create deployment checklist
echo "
📋 DEPLOYMENT CHECKLIST:
✅ All files present
✅ No exposed secrets
⬜ MongoDB Atlas cluster created
⬜ Groq API key obtained
⬜ GitHub repository created and pushed
⬜ Render account created
⬜ Backend service deployed on Render
⬜ Frontend static site deployed on Render
⬜ Environment variables configured
⬜ CORS settings updated
⬜ Application tested

🎯 Next steps:
1. Push code to GitHub
2. Follow DEPLOYMENT.md guide
3. Deploy on Render

Your project is ready for deployment! 🚀
"