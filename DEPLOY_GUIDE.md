# Guía Técnica de Deployment y Seguridad (MyProp Admin)

Esta guía documenta los pasos recomendados para la configuración de seguridad y la infraestructura de despliegue en las plataformas web definitivas (GitHub y Railway), asegurando el control total por parte del administrador final sobre la rama `main` y las variables de Staging/Producción.

---

## 🔒 1. Protección de Ramas (GitHub Branch Protection Rules)

Para garantizar la integridad del código fuente, proteger el flujo de control hacia producción e impedir commits destructivos en la rama principal, se debe configurar una regla de protección bajo lo siguiente:

### Pasos a realizar en GitHub:
1. Ir al repositorio en GitHub: `Settings` → `Branches`.
2. En la sección **Branch protection rules**, hacer clic en `Add branch rule`.
3. Escribir **`main`** en el campo `Branch name pattern`.

### Configuraciones Obligatorias (`main`):
- [x] **Require a pull request before merging:** Asegura que nada se integre sin un PR formal.
- [x] **Require approvals (1 mínimo):** Un desarrollador o CTO debe aprobar los cambios antes del merge.
- [x] **Require status checks to pass before merging:** Integración obligatoria con CI/CD (Vite Build y TypeScript Type Checking) antes de permitir un merge.

> **PRECAUCIÓN**: **Commits directos en `main` están estrictamente PROHIBIDOS**. Todo el desarrollo activo y despliegues temporales ocurren primero en `dev` (Staging Environment).

---

## 🚀 2. Configuración en Railway (Staging y Producción)

Railway alojará la versión en vivo del "Panel Administrativo MyProp". Para mantener consistencia con los entornos del backend ("El Búnker"), se recomiendan los siguientes pasos:

### 2.1 Enlazar Repositorio
1. En Railway, ir a: `New Project` → `Deploy from GitHub repo`.
2. Seleccionar el repositorio `Lucascontu17/mypropinmobiliaria`.

### 2.2 Configurar Variables de Entorno (Staging & Producción)
Ir a `Variables` dentro del entorno seleccionado en Railway y agregar:

```env
VITE_API_URL=https://bunker-production-url.up.railway.app/api/v1  # Reemplazar con URL real del Búnker
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx     # Producción será pk_live_xxxxx
```

> **IMPORTANTE**: Se requiere configurar entornos separados dentro del mismo proyecto de Railway, definiendo la URL del API del Búnker correspondiente para Staging vs. Producción.

### 2.3 Reglas del Comando de Build e Inicio
En Railway, bajo el apartado `Settings` del artefacto (o a nivel de `package.json`), asegúrate que la plataforma use el comando oficial de start de tu servidor temporal de estáticos, o mediante un Dockerfile si sirves desde estáticos. (Alternativamente, Railway detecta `vite build` automáticamente para Node.js y React). Sin embargo, verifica que `npm run build` sea llamado correctamente durante la fase de despliegue.

---

*Documento generado por el ecosistema de agentes Antigravity.*
