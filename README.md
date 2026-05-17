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

PASOS PARA INSTALAR EASYTOURNEY:
1. TE DESCARGAS EL REPOSITORIO EN LA RAMA DE 'modo-local'.
2. TE VAS A LOS ARCHIVOS (ABRES LA CARPETA EN VSCODE, POR EJEMPLO), Y CAMBIAS EL NOMBRE DEL ARCHIVO DE BACKEND '.env.example' a '.env'
3. TE DESCARGAS LA APLICACION DE DOCKER DESKTOP. UNA VEZ INSTALADO, ENTRAS A CONTENEDORES, ABRES SU TERMINAL Y APUNTAS A LA CARPETA RAIZ DEL PROYECTO.
4. EJECUTAS EL COMANDO: 'docker-compose up -d --build' Y ESPERAS A QUE TERMINE TODO EL PROCESO
5. ABRES LA PAGINA 'localhost:3000'
6. A DISFRUTAR :D

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
