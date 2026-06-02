@echo off
REM Production Build Script for website-3 (Windows)

echo 🚀 Starting Production Build...

REM Set environment variables
if not defined NODE_ENV set NODE_ENV=production
if not defined NEXT_PUBLIC_ENV set NEXT_PUBLIC_ENV=production

echo 📝 Environment: %NEXT_PUBLIC_ENV%
echo 🔧 Node Environment: %NODE_ENV%

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
  echo 📦 Installing dependencies...
  call npm install
)

REM Clean previous build
echo 🧹 Cleaning previous builds...
if exist ".next" rmdir /s /q .next

REM Build the application
echo 🔨 Building Next.js application...
call npm run build:production

if %ERRORLEVEL% equ 0 (
  echo ✅ Build completed successfully!
  echo 📊 Build output ready in .next folder
) else (
  echo ❌ Build failed!
  exit /b 1
)

pause
