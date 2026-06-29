@echo off
SET PATH=C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%
echo Habilitando soporte para rutas largas...
git config --global core.longpaths true
echo Limpiando cache de gh-pages...
rmdir /s /q "node_modules\.cache\gh-pages" 2>nul
echo Publicando en GitHub Pages...
call npx gh-pages -d dist --dotfiles
echo.
echo Despliegue completado!
