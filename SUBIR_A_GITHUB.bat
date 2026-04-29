@echo off
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"
cd /d "c:\Users\Eduar Music\Desktop\Antigravity"
echo Iniciando subida a GitHub...
%GIT_PATH% add .
%GIT_PATH% commit -m "Carga completa TIENDA PRIMERA"
%GIT_PATH% push origin main --force
echo.
echo ¡Listo! Si se abrió una ventana de GitHub, por favor inicia sesión allí.
pause
