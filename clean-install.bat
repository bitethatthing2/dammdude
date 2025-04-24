@echo off
echo ===== CLEANING NEXT.JS APPLICATION =====
echo.

echo Step 1: Removing .next directory...
if exist ".next" rmdir /s /q .next

echo Step 2: Removing node_modules directory completely...
if exist "node_modules" rmdir /s /q node_modules

echo Step 3: Cleaning npm cache...
call npm cache clean --force

echo Step 4: Clearing package-lock.json...
if exist "package-lock.json" del package-lock.json

echo Step 5: Reinstalling dependencies...
call npm install

echo Step 6: Installing specific SWC version...
call npm install --save-dev @next/swc-win32-x64-msvc@14.1.0

echo Step 7: Verifying React installation...
call npm install react@18.2.0 react-dom@18.2.0 --save --exact

echo.
echo ===== CLEAN INSTALL COMPLETED =====
echo.
echo To start the dev server, run: npm run dev