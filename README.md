# 📱 Personal XT+ (Versión PWA para iOS / Safari)

Aplicación Web Progresiva (PWA) de consulta rápida de personal, categorías y centros de coste, optimizada para funcionar como **app nativa a pantalla completa y 100% offline** en iPhone (iOS) y cualquier dispositivo moderno.

---

## 🔒 Privacidad y Seguridad

* **Datos Cifrados de Extremo a Extremo:** Los datos están integrados y cifrados con **AES-256-GCM** y derivación de clave **PBKDF2** (100.000 iteraciones).
* **PIN de Acceso Privado:** La clave de acceso está configurada de forma local en tu equipo (en `config.local.json`, ignorado por Git). La primera vez que accedes en tu iPhone introduces tu PIN y marcas "Recordar en este dispositivo" para no tener que volver a teclearlo.
* **Seguridad contra Fuerza Bruta:** La app cuenta con protección activa: tras 3 intentos erróneos consecutivos se bloquea temporalmente con temporizador de seguridad.
* **Seguridad en GitHub:** Si el repositorio o la web de GitHub Pages es pública, nadie ajeno puede leer los datos ni conocer la clave, ya que el archivo local de configuración y los `.xlsx` nunca se suben a Git. En internet solo existe código cifrado matemáticamente indescifrable.

---

## 🚀 Despliegue en GitHub Pages (3 Pasos)

1. Sube este repositorio a tu cuenta de GitHub (mediante **GitHub Desktop** pulsando *Publish repository*).
2. En GitHub.com, entra en tu repositorio y ve a **Settings** > **Pages**.
3. En **Build and deployment > Branch**, selecciona `main` y la carpeta `/ (root)`. Haz clic en **Save**.
4. En ~30 segundos tendrás tu enlace HTTPS listo: `https://<tu-usuario>.github.io/Personal_PWA/`.

---

## 📲 Instalación en iPhone

1. Abre tu enlace de GitHub Pages en **Safari** en el iPhone.
2. Introduce tu PIN secreto y deja marcada la casilla *"Recordar en este dispositivo"*.
3. Pulsa el botón **Compartir** de Safari (icono cuadrado con flecha hacia arriba).
4. Selecciona **"Añadir a la pantalla de inicio"** (Add to Home Screen).
5. ¡Listo! Se abrirá como app independiente a pantalla completa y funcionará sin internet.

---

## 🔄 Cómo actualizar los datos (Nuevos Excel)

Cuando recibas nuevas plantillas de Excel:
1. Coloca los archivos actualizados (`Plantilla*.xlsx`, `Categorias*.xlsx`, `*Centros*.xlsx`) en la carpeta o déjalos en `Personal_XT`.
2. Ejecuta en la consola:
   ```bash
   python actualizar_datos.py
   ```
3. Haz commit y push en GitHub Desktop.
4. La próxima vez que abras la app en el iPhone conectada a internet, se actualizará sola en segundo plano.
