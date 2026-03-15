# 🏆 EasyTourney - Frontend

¡Bienvenido al frontend de **EasyTourney**! Esta es una aplicación web moderna diseñada para la gestión y visualización de torneos de videojuegos (1v1, Equipos y Battle Royale).

La aplicación funciona como una **PWA (Progressive Web App)**, lo que permite instalarla en dispositivos móviles y de escritorio, además de ofrecer soporte básico para funcionamiento offline.

---

## 🚀 Puesta en Marcha

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

### 1. Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior recomendada).
- Tener el **Backend de EasyTourney** en ejecución (habitualmente en el puerto 5000).

### 2. Instalación
Clona el repositorio y entra en la carpeta del frontend:
```bash
cd EasyTourney/frontend
npm install
```

### 3. Ejecución
Para lanzar el servidor de desarrollo:
```bash
npm start
```
La aplicación se abrirá automáticamente en `http://localhost:3000`.

---

## ⚙️ Configuración (Local vs Producción)

El proyecto está preparado para trabajar tanto en un entorno de desarrollo local como en producción (Render).

Para cambiar entre entornos, abre el archivo `src/config.js` y modifica la variable `IS_PRODUCTION`:

```javascript
/* src/config.js */

// Cambiar a true para usar la API en la nube (Render)
// Cambiar a false para usar la API local (localhost:5000)
const IS_PRODUCTION = false; 
```

- **Modo Local (`IS_PRODUCTION = false`)**: La aplicación intentará conectar con `http://localhost:5000`. Ideal para desarrollo y pruebas rápidas.
- **Modo Producción (`IS_PRODUCTION = true`)**: La aplicación conectará con la API desplegada en `https://easytourney.onrender.com`.

---

## 🛠️ Tecnologías Principales

- **React**: Biblioteca principal para la interfaz de usuario.
- **Bootstrap**: Framework de CSS para el diseño responsive y componentes.
- **Axios**: Cliente HTTP para las peticiones a la API.
- **Socket.io-client**: Comunicación en tiempo real para actualizaciones de brackets.
- **React Router Dom**: Gestión de navegación y rutas.
- **jspdf / jspdf-autotable**: Generación de reportes de torneos en PDF.

---

## 📱 Características PWA

- **Instalable**: Puedes añadir EasyTourney a tu pantalla de inicio desde el navegador.
- **Offline Mode**: Gracias al Service Worker y al almacenamiento local (`localStorage`), puedes consultar torneos cacheados incluso sin conexión.
- **Responsive**: Diseño adaptado a móviles, tablets y PCs.

---

## ✒️ Autores

José Antonio Valenzuela Núñez, 2ºDAM
