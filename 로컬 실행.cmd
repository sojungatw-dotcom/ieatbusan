@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 이상을 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)
echo 무보소 로컬 앱을 실행합니다.
echo 브라우저에서 http://127.0.0.1:8779/ 를 열어 주세요.
echo 종료하려면 이 창에서 Ctrl+C를 누르세요.
node --preserve-symlinks --preserve-symlinks-main tools/dev-server.cjs
pause
