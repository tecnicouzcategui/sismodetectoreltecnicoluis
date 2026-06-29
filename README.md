# 🌋 Sismo Detector El Técnico Luis

> Monitor sísmico en tiempo real para Venezuela y el mundo

[![Deploy](https://github.com/tecnicouzcategui/sismodetectoreltecnicoluis/actions/workflows/deploy.yml/badge.svg)](https://github.com/tecnicouzcategui/sismodetectoreltecnicoluis/actions/workflows/deploy.yml)

## 🔴 Ver en vivo

**👉 [https://tecnicouzcategui.github.io/sismodetectoreltecnicoluis/](https://tecnicouzcategui.github.io/sismodetectoreltecnicoluis/)**

## ¿Qué es?

Aplicación web de monitoreo sísmico en **tiempo real** que:

- 🗺️ Muestra sismos en un mapa interactivo (vista Normal, Satélite y Relieve)
- 📡 Se conecta en **vivo** vía WebSocket a la red EMSC para recibir sismos al instante que ocurren
- 🔔 Genera **alertas visuales y de sonido** cuando se detecta un sismo mayor a 4.0 en Venezuela
- 📍 Filtra sismos desde el **24 de junio de 2025** (terremoto de referencia)
- 📊 Panel de estadísticas con el conteo de sismos mayores a 4.0
- 🛰️ Capas de mapa: Normal, Satélite, Relieve topográfico
- 🔍 Zoom de precisión con slider vertical

## Tecnologías

- **React** + Vite
- **Leaflet** - Mapa interactivo
- **EMSC WebSocket** - Datos sísmicos en tiempo real
- **Capacitor** - App Android nativa

## 📱 App Android

Descarga la APK para Android en la sección de [Releases](https://github.com/tecnicouzcategui/sismodetectoreltecnicoluis/releases).

La app incluye:
- ✅ Acceso a ubicación GPS
- ✅ Alertas de sonido y vibración
- ✅ Notificaciones nativas de Android
- ✅ Datos sísmicos 100% en tiempo real (WebSocket)

---

Desarrollado por **El Técnico Luis** 🇻🇪
