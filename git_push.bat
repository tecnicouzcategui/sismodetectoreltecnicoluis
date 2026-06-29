@echo off
SET GIT="C:\Program Files\Git\bin\git.exe"
%GIT% add -A
%GIT% commit -m "fix: sidebar fija PC, hover popup info regional, mapa azul, ciudades completas"
%GIT% push origin main
echo.
echo Listo! Cambios subidos a GitHub.
pause
