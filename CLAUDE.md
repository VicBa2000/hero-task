@AGENTS.md

# Reglas de Desarrollo — Hero Task: Dynamic Page Renderer

## Contexto del proyecto
Proyecto de entrevista tecnica. El enunciado completo (fuente de verdad) esta
en `proyectbaseline`. Limite de tiempo: 4-6 horas. El uso de un asistente de
IA (Claude, Cursor, ChatGPT, Gemini) es obligatorio y se entrega un
**Prompt Log**: el evaluador quiere ver como se dirige y orquesta a la IA, asi
que el orden de trabajo y las decisiones deben quedar razonadas y trazables
(ver regla 3).

**Objetivo**: un renderer de paginas dinamicas:
1. **Datos**: un `data.json` hardcodeado que imita la respuesta de un
   Headless CMS: un array de objetos, ej.
   `[{ type: "hero", props: {...} }, { type: "pricing", props: {...} }]`.
2. **Logica**: un componente `PageBuilder` que recorre ese array y renderiza
   el componente correcto para cada `type`.
3. **Twist de IA**: usar IA para generar una suite de unit tests del
   `PageBuilder` que pruebe el caso "Unknown Component Type": si el JSON pide
   un tipo sin componente (ej. `slider`), la app NO debe romperse.

**Stack**: Next.js / Vue / React (App Router) — a elegir en el paso 2 del
plan; una vez elegido, registrarlo aqui y no cambiarlo (ver regla 5).
- Stack elegido: **Next.js (App Router) + TypeScript**
- Herramienta de tests: **Vitest + React Testing Library (jsdom)**

**Entregables**:
- Codigo en un repositorio de GitHub.
- `Dockerfile` y `docker-compose.yml` funcionando.
- Video del entorno local mostrando el proyecto funcionando, subido al repo.
- Prompt Log mostrando como se dirigio a la IA.

## Plan de trabajo
Se avanza un paso a la vez; ninguno empieza sin aprobacion del usuario.
1. Reglas (`CLAUDE.md`) y bitacora (`cambios.txt`).
2. Eleccion de stack y herramienta de tests.
3. Decisiones abiertas del enunciado (tipo desconocido, props invalidas,
   forma del `data.json`).
4. Esqueleto: scaffold y estructura de carpetas, sin logica.
5. `data.json` y componentes de bloque.
6. `PageBuilder` (logica central).
7. Twist de IA: lista de casos aprobada -> suite generada -> verificar que
   los tests fallan si se quita la proteccion.
8. Docker (`Dockerfile` + `docker-compose.yml`), verificado desde un clon
   limpio.
9. README, video y Prompt Log.

## Reglas obligatorias

### 1. Fuente de verdad
- Los requisitos son los de `proyectbaseline`. No inventar requisitos extra
  ni reinterpretar los existentes; si algo es ambiguo (que se muestra ante un
  tipo desconocido, que pasa con props invalidas, forma exacta del JSON),
  preguntar al usuario y registrar la decision en `cambios.txt`.
- No inventar comportamiento de librerias ni frameworks. Usar solo APIs
  documentadas de la version instalada; si hay duda, verificar en la
  documentacion oficial (o la que trae el paquete instalado) antes de
  escribir codigo.

### 2. Analizar antes de modificar
- Antes de tocar un archivo existente, entender que hace y por que existe.
- Los datos del CMS no son confiables: el `PageBuilder` nunca debe asumir que
  el array, el `type` o las `props` tienen la forma esperada. Cualquier cambio
  que toque ese flujo se revisa contra esta regla — que un bloque malo tumbe
  la pagina completa es un bug critico, no un detalle menor.
- El componente modificado debe mantener el mismo resultado funcional que el
  original, salvo que el cambio pedido sea explicitamente otra cosa.

### 3. Bitacora de cambios (cambios.txt)
- Un `cambios.txt` en la raiz del proyecto.
- Despues de cada unidad de trabajo aprobada: archivo tocado, descripcion
  breve, y a que parte afecta (datos, componentes, PageBuilder, tests,
  Docker/infra, entregables).
- Registrar tambien las decisiones de diseno tomadas (y por que), y quien las
  tomo: sirve como evidencia de la orquestacion de IA que pide la entrevista
  y como base para el Prompt Log.
- Al retomar trabajo despues de un `/clear`, leer primero este `CLAUDE.md` y
  despues `cambios.txt`.

### 4. Manejo de contexto
- Si el contexto esta cerca de llenarse, avisar al usuario y pedir `/clear`
  antes de seguir.
- Al retomar: releer este archivo, `proyectbaseline` y `cambios.txt` para
  saber donde se quedo.

### 5. Calidad de codigo
- No agregar features, refactors o abstracciones no pedidas.
- No generar codigo generico o alucinado (ver regla 1).
- No escribir codigo de un paso del plan que no ha sido aprobado.
- Mantener consistencia con el stack elegido — no cambiarlo a mitad de camino
  sin discutirlo.
- El `PageBuilder` y el manejo del tipo desconocido son la logica central
  evaluada: sus tests deben cubrir los casos borde (tipo desconocido, `type`
  ausente o que no es string, bloque `null`, entrada que no es array, que los
  bloques validos se sigan renderizando y en orden).

### 6. Checklist de "terminado"
El proyecto no se considera terminado hasta que:
- `data.json` + `PageBuilder` renderizan la pagina de punta a punta.
- La suite de tests del `PageBuilder` pasa, incluido el caso "Unknown
  Component Type".
- La app levanta con Docker (`docker compose up` o `docker build` + `run`)
  desde un clon limpio del repo.
- Hay un README con instrucciones para correrlo y probarlo.
- El video de demostracion esta grabado y subido al repo junto con el codigo.
- El Prompt Log esta listo.

### 7. Archivos de referencia
- Enunciado del proyecto: `proyectbaseline`
- Reglas de desarrollo: `CLAUDE.md` (este archivo)
- Bitacora de cambios y decisiones: `cambios.txt`
