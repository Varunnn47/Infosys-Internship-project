@echo off
echo 🚀 Preparing for Render deployment...

REM Check if .env exists
if not exist "backend\.env" (
    echo ❌ backend\.env file not found!
    echo Please create backend\.env with your API keys before deployment
    exit /b 1
)

REM Check if requirements.txt exists
if not exist "backend\requirements.txt" (
    echo ❌ backend\requirements.txt not found!
    exit /b 1
)

echo 📦 Checking Python dependencies...
cd backend
python -m pip check
if %errorlevel% neq 0 (
    echo ❌ Dependency issues found. Please fix before deployment.
    exit /b 1
)
cd ..

REM Check required files
set "files=backend\app.py backend\database.py backend\auth.py frontend\login.html frontend\main.html frontend\auth.js frontend\script.js frontend\style.css render.yaml Dockerfile"

for %%f in (%files%) do (
    if not exist "%%f" (
        echo ❌ Required file missing: %%f
        exit /b 1
    )
)

echo ✅ All required files present

REM Check for sensitive data
findstr /r /s "your_groq_api_key_here your_secret_key_here your_mongodb_url_here" backend\* frontend\* >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Found placeholder secrets! Please replace with actual values in .env file
    exit /b 1
)

echo ✅ No exposed secrets found

echo.
echo 📋 DEPLOYMENT CHECKLIST:
echo ✅ All files present
echo ✅ No exposed secrets
echo ⬜ MongoDB Atlas cluster created
echo ⬜ Groq API key obtained
echo ⬜ GitHub repository created and pushed
echo ⬜ Render account created
echo ⬜ Backend service deployed on Render
echo ⬜ Frontend static site deployed on Render
echo ⬜ Environment variables configured
echo ⬜ CORS settings updated
echo ⬜ Application tested
echo.
echo 🎯 Next steps:
echo 1. Push code to GitHub
echo 2. Follow DEPLOYMENT.md guide
echo 3. Deploy on Render
echo.
echo Your project is ready for deployment! 🚀