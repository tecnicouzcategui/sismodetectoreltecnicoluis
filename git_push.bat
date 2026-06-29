@echo off
SET GIT="C:\Program Files\Git\bin\git.exe"
%GIT% add -A
%GIT% commit -m "update: remove map overlay box"
%GIT% push origin main
echo.
echo Listo! Cambios subidos a GitHub.
