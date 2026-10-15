---
name: actualizar-personal-pwa
description: >-
  Actualiza y cifra automáticamente la base de datos de Personal_PWA a partir de
  nuevos archivos Excel (.xlsx de plantilla, centros y categorías). Úsalo cuando el
  usuario proporcione nuevos archivos Excel o pida actualizar los datos de Personal_PWA.
---

# Skill: Actualización de Datos para Personal_PWA

Esta skill automatiza el procesamiento de los archivos Excel y su cifrado seguro para la app Personal_PWA sin regenerar código ni consumir tokens innecesarios.

## Procedimiento de Ejecución

1. **Ubicación del Proyecto:**
   El repositorio está ubicado en `C:\Users\HTPC\Documents\GitHub\Personal_PWA`.

2. **Ejecutar el script de actualización:**
   Ejecuta el script local (lee automáticamente la clave desde `config.local.json` de forma confidencial):
   ```powershell
   python .\actualizar_datos.py
   ```

3. **Registrar el cambio en Git:**
   En la carpeta `C:\Users\HTPC\Documents\GitHub\Personal_PWA`:
   ```powershell
   git add data.js
   git commit -m "Actualizar datos de plantilla"
   ```

4. **Instrucción al Usuario:**
   Informa al usuario de forma muy breve y directa (estilo vibe-coder):
   - Confirmar el total de empleados procesados.
   - Indicar que solo debe abrir **GitHub Desktop** y pulsar el botón azul **"Push origin"**.
