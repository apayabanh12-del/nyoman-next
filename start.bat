@echo off
title POS KASIR SMK - NEXT.JS
color 0E
echo ========================================================
echo   POS KASIR SMK (Next.js) - Frontend + API 1 server
echo ========================================================
if not exist node_modules (
  echo Menginstall dependency pertama kali...
  call npm install
)
echo Membuka http://localhost:3000 ...
start http://localhost:3000/
npm run dev
