# 🏆 EasyTourney - Frontend

¡Bienvenido al frontend de **EasyTourney**! Esta es una aplicación web moderna diseñada para la gestión y visualización de torneos de videojuegos (1v1, Equipos y Battle Royale).

La aplicación funciona como una **PWA (Progressive Web App)**, lo que permite instalarla en dispositivos móviles y de escritorio, además de ofrecer soporte básico para funcionamiento offline.

## Versión Online (Live Demo)

¡No es necesario configurar el proyecto localmente para probarlo! Se han utilizado **Vercel** (para el frontend) y **Render** (para el backend) para poner en marcha la aplicación en la web.

**Enlace de la web:** [https://easytourney-eta.vercel.app/](https://easytourney-eta.vercel.app/)

> [!NOTE]  
> **Importante:** La base de datos puede tardar en cargar inicialmente debido a que la página se pone a "dormir" tras un tiempo de inactividad para ahorrar memoria. Es necesario esperar entre **30 y 60 segundos** para que se conecte la primera vez.

---

## Puesta en Marcha

Para probar el proyecto de forma rápida y sencilla, te recomendamos utilizar **Docker**. Esto configurará automáticamente tanto el frontend como el backend.

### 1. Requisitos Previos
- Tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- Tener Docker Desktop en ejecución.

### 2. Ejecución con Docker
Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:

```bash
docker compose up --build
```

La aplicación estará disponible en:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend (API):** [http://localhost:5000](http://localhost:5000)

### 3. Detener el proyecto
Para detener los contenedores y liberar recursos, pulsa `Ctrl + C` en la terminal o ejecuta:

```bash
docker compose down
```

---

### Alternativa: Ejecución Manual (Sin Docker)
Si prefieres no usar Docker, puedes ejecutarlo manualmente siguiendo estos pasos:

1. **Backend:** Entra en `backend/` y ejecuta `npm install` seguido de `npm run dev`.
2. **Frontend:** Entra en `frontend/`, ejecuta `npm install` y luego `npm start`.

---

## Configuración (Local vs Producción)

El sistema está preparado para trabajar tanto en local como en la nube. Tienes opciones de configuración tanto para el **Frontend** como para el **Backend**.

### Frontend (Conexión a la API)

Para cambiar a qué servidor se conecta la página, abre el archivo `frontend/src/config.js` y modifica la variable `IS_PRODUCTION`:

```javascript
/* frontend/src/config.js */

// Cambiar a true para usar la API en la nube (Render)
// Cambiar a false para usar la API local (localhost:5000)
const IS_PRODUCTION = false; 
```

- **Modo Local (`IS_PRODUCTION = false`)**: La aplicación intentará conectar con `http://localhost:5000`. Ideal para desarrollo y pruebas rápidas.
- **Modo Producción (`IS_PRODUCTION = true`)**: La aplicación conectará con la API desplegada en `https://easytourney.onrender.com`.

### Backend (Selección de Base de Datos)

El backend te permite elegir si quieres guardar y consultar los datos en tu ordenador (MongoDB en local) o en la nube (MongoDB Atlas). Abre el archivo `backend/.env` y modifica la variable `USE_ATLAS`:

```env
# backend/.env

# Cambia USE_ATLAS a false para usar tu base de datos local, o a true para usar la de la nube
USE_ATLAS=true
```

- **Base de Datos Nube (`USE_ATLAS=true`)**: Se conecta a MongoDB Atlas. Todos los usuarios compartirán la misma información. *(Nota: puede introducir ligera latencia de red)*.
- **Base de Datos Local (`USE_ATLAS=false`)**: Se conecta a tu `127.0.0.1:27017`. Te dará la **máxima velocidad** de desarrollo. 
*(Importante: Si cambias este valor, debes reiniciar el proceso/terminal del backend para que haga efecto)*.

> [!NOTE]  
> **Importante:** Debido a que el backend está alojado en la nube (Render) en un plan gratuito, el servidor se "duerme" si pasa **15 minutos** sin actividad. Esto puede hacer que la primera vez que se use tras un tiempo de inactividad, la base de datos tarde unos segundos extra en cargar mientras el servidor se despierta.

---

## Tecnologías Principales

- **React**: Biblioteca principal para la interfaz de usuario.
- **Bootstrap**: Framework de CSS para el diseño responsive y componentes.
- **Axios**: Cliente HTTP para las peticiones a la API.
- **Socket.io-client**: Comunicación en tiempo real para actualizaciones de brackets.
- **React Router Dom**: Gestión de navegación y rutas.
- **jspdf / jspdf-autotable**: Generación de reportes de torneos en PDF.

---

## Características PWA

- **Instalable**: Puedes añadir EasyTourney a tu pantalla de inicio desde el navegador.
- **Offline Mode**: Gracias al Service Worker y al almacenamiento local (`localStorage`), puedes consultar torneos cacheados incluso sin conexión.
- **Responsive**: Diseño adaptado a móviles, tablets y PCs.

---

## Autor

José Antonio Valenzuela Núñez, 2ºDAM
