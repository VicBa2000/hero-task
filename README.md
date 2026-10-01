# Hero Task: Dynamic Page Renderer

> 🇲🇽 Español · [🇺🇸 English version](#english-version)

Una página en Next.js que se arma a partir de datos y no de markup fijo. `data.json` imita la
respuesta de un Headless CMS: un array de bloques `{ id, type, props }`. El `PageBuilder` lo
recorre y renderiza el componente que le toca a cada `type`. Si el CMS manda un bloque que el
frontend no conoce (por ejemplo un `slider`) o un bloque conocido con props rotas, ese bloque
se omite y **el resto de la página se renderiza igual**.

```
src/data/data.json   [{ id, type: "hero", props }, { type: "slider", ... }, ...]
        │
        ▼
 PageBuilder ── ¿es un array?            no → no pinta nada + console.warn
        │
        ├─ ¿el type está en el registro?  no → bloque omitido (aviso en dev) + console.warn
        ├─ ¿las props son válidas?        no → bloque omitido (aviso en dev) + console.warn
        ▼
 Hero · Features · Pricing · Cta   (en el mismo orden del array)
```

## Demo

Video del proyecto corriendo en local: [demo/hero-task-demo.mp4](demo/hero-task-demo.mp4)

## Cómo levantarlo

Necesitas Docker:

```bash
docker compose up --build
```

Abre **http://localhost:3000**. La imagen se construye en modo producción y **corre la suite
de tests antes del build**: si un test falla, la imagen no se construye.

El `data.json` incluido trae a propósito un bloque `slider`, que no tiene componente. En
Docker (producción) el visitante no ve nada raro: aparecen hero, features, pricing y cta, y
la palabra "slider" ni siquiera está en el HTML. El aviso queda en el log del build:

```
[PageBuilder] Unknown block type "slider" (key: slider-1), skipped.
```

## Correrlo sin Docker y ejecutar las pruebas

Necesitas Node 22.

```bash
npm ci
npm test        # 37 pruebas (Vitest + React Testing Library)
npm run dev     # http://localhost:3000
```

En `npm run dev` el bloque desconocido sí se ve: en su lugar aparece un aviso
`"slider" is not a known block type.`, para que el equipo note que el CMS manda algo que el
frontend no sabe pintar.

**Para jugar con los datos**, edita `src/data/data.json` con `npm run dev` corriendo:
reordena bloques, borra uno, cambia un `type` a algo inventado o quítale los `plans` al
bloque `pricing`. La página sigue en pie y el bloque problemático muestra su aviso.

> La página se genera de forma estática en el build. En Docker, un cambio a `data.json` se ve
> después de `docker compose up --build`.

### Qué cubren las pruebas

Todas usan el `PageBuilder` y los componentes reales, sin mocks. Cada grupo prueba **los dos
extremos**: lo que debe fallar (la entrada mala se omite sin tumbar la página) y lo que debe
pasar (una entrada válida, mínima o con campos de más, se renderiza sin avisos).

| Grupo | Qué verifica |
|---|---|
| Bloques conocidos (4) | Cada `type` se renderiza con su componente y en el orden del array; el `data.json` real; props mínimas; campos extra que el CMS pueda agregar |
| Unknown Component Type (5) | Un `slider` se omite y los bloques de alrededor se renderizan; aviso en dev y un solo `console.warn`; nada visible en producción; página hecha solo de desconocidos; `"Hero"` no es `"hero"` |
| Bloques mal formados (13) | Bloque `null`, número, string o array; `type` ausente, numérico, objeto o `null`; tipos heredados de `Object.prototype` (`toString`, `constructor`, `__proto__`...) |
| Props inválidas (10) | `pricing` sin `plans`, un objeto donde va texto, un `cta` sin `href`, props `null`, ausentes o string...; en producción el bloque no pinta nada |
| Entrada que no es array (5) | `null`, `undefined`, un objeto o un string no rompen; un array vacío renderiza un `<main>` vacío sin avisos |

**¿Las pruebas detectan algo?** Para comprobarlo se rompió el código a propósito (cambios
temporales, revertidos después) y se contó cuántas fallaban:

| Mutación | Pruebas que fallan |
|---|---|
| M1 · quitar la revisión de tipo desconocido | 19 |
| M2 · quitar la validación de props | 10 |
| M3 · registro como objeto literal en lugar de `Map` | 5 |
| M4 · mostrar el aviso también en producción | 3 |
| M5 · validador demasiado estricto: el hero exige `cta` | 29 |
| M6 · validador demasiado estricto: el plan exige `period` | 2 |

M5 y M6 son las que justifican probar "lo que debe pasar": un validador demasiado estricto
no rompe nada, solo **esconde en silencio** bloques legítimos.

## Decisiones de diseño

- **Validar las props antes de renderizar, en lugar de un error boundary.** El plan original
  era un error boundary por bloque. Al verificarlo con un build de producción, la página
  entera seguía cayendo: los bloques son Server Components y se renderizan en el servidor,
  donde un error boundary (que vive en el cliente) no atrapa nada. Lo peligroso es que en
  Vitest (jsdom, render de cliente) el boundary **sí** atrapaba el error: los tests habrían
  pasado mientras producción fallaba. Por eso cada tipo de bloque tiene un validador
  (`validators.ts`) que revisa todo lo que su componente usa, incluido el tipo de cada campo.
  - Antes de eso se descartó `catchError` (nuevo en Next 16): leyendo su código fuente, con un
    user-agent de bot no muestra el fallback y deja que el error tumbe la página. En una
    página de CMS, eso es justo lo que ve Google.
- **El registro es un `Map`, no un objeto literal.** Con `registry[type]`, un CMS que mande
  `"toString"` o `"constructor"` encontraría funciones heredadas de `Object.prototype` y React
  intentaría renderizarlas como componente. Hay pruebas para eso (mutación M3).
- **Tipo desconocido: aviso en desarrollo, nada en producción.** El equipo se entera (aviso
  visible en dev y `console.warn` siempre); el visitante nunca ve errores internos del CMS.
  Las props inválidas reciben el mismo trato.
- **`id` en cada bloque.** Da una `key` estable a React e identifica el bloque en los logs.
- **El `PageBuilder` no confía en los datos.** Recibe `unknown`: revisa que sea un array, que
  cada bloque sea un objeto y que `type` sea un string antes de buscarlo en el registro.
- **Agregar un bloque nuevo no toca el `PageBuilder`:** basta con el componente, su
  validador y una entrada en `registry.ts`. TypeScript rechaza un validador que garantice
  menos de lo que el componente necesita.
- **Docker:** build en 3 etapas con `output: "standalone"` (basado en el ejemplo oficial
  `with-docker` de Next.js); la imagen final solo lleva el servidor y los assets estáticos,
  corre con el usuario `node` (sin privilegios) y tiene healthcheck. Los tests corren dentro
  del build como compuerta. Se quitaron las fuentes de `next/font/google` para que el build
  no dependa de descargarlas.

El razonamiento detrás de cada decisión, y los errores que fuimos encontrando, están
documentados en [`cambios.txt`](cambios.txt).

## Limitaciones conocidas

- **Los datos son estáticos.** `data.json` se importa en el build y la página se prerenderiza;
  con un CMS real habría que pedir los datos en cada request o revalidarlos (ISR).
- **Los validadores están escritos a mano.** Con cuatro bloques es manejable y no agrega
  dependencias; con muchos más convendría una librería de esquemas que genere a la vez el
  tipo y el validador.
- **El `console.warn` es el único registro.** En producción un bloque omitido solo deja una
  línea en el log del build; no hay monitoreo que avise al equipo.

## Estructura

```
src/
  app/page.tsx                  pasa data.json al PageBuilder
  data/data.json                la respuesta simulada del CMS (incluye un "slider" a propósito)
  types/blocks.ts               props de cada bloque y la forma de un bloque del CMS
  components/blocks/            Hero, Features, Pricing, Cta
  components/PageBuilder/
    PageBuilder.tsx             recorre el array y decide qué renderizar
    registry.ts                 type → componente + validador (Map)
    validators.ts               un validador de props por tipo de bloque
    UnknownBlock.tsx            el aviso de desarrollo (nada en producción)
    PageBuilder.test.tsx        37 pruebas
Dockerfile, docker-compose.yml
cambios.txt                     bitácora de cambios y decisiones del desarrollo
```

---

## English version

A Next.js page assembled from data instead of hardcoded markup. `data.json` mimics a Headless
CMS response: an array of `{ id, type, props }` blocks. The `PageBuilder` iterates over it and
renders the matching component for each `type`. If the CMS sends a block the frontend does not
know (e.g. a `slider`) or a known block with broken props, that block is skipped and **the
rest of the page still renders**.

```
src/data/data.json   [{ id, type: "hero", props }, { type: "slider", ... }, ...]
        │
        ▼
 PageBuilder ── is it an array?           no → renders nothing + console.warn
        │
        ├─ is the type registered?        no → block skipped (dev notice) + console.warn
        ├─ are the props valid?           no → block skipped (dev notice) + console.warn
        ▼
 Hero · Features · Pricing · Cta   (in array order)
```

### Demo

Local run walkthrough: [demo/hero-task-demo.mp4](demo/hero-task-demo.mp4)

### Quick start (Docker)

```bash
docker compose up --build
```

Open **http://localhost:3000**. The image is built in production mode and **runs the test
suite before the build**: if a test fails, the image is not built.

The bundled `data.json` deliberately includes a `slider` block with no component. In Docker
(production) the visitor sees nothing unusual: hero, features, pricing and cta render, and the
word "slider" is not even in the HTML. The warning goes to the build log:

```
[PageBuilder] Unknown block type "slider" (key: slider-1), skipped.
```

### Running locally & tests

Requires Node 22.

```bash
npm ci
npm test        # 37 tests (Vitest + React Testing Library)
npm run dev     # http://localhost:3000
```

In `npm run dev` the unknown block is visible: a `"slider" is not a known block type.` notice
takes its place, so the team notices the CMS is sending something the frontend cannot render.

**To play with the data**, edit `src/data/data.json` while `npm run dev` is running: reorder
blocks, delete one, change a `type` to something made up, or remove `plans` from the `pricing`
block. The page stays up and the offending block shows its notice.

> The page is statically generated at build time. In Docker, a change to `data.json` shows up
> after `docker compose up --build`.

#### What the tests prove

All of them use the real `PageBuilder` and components, no mocks. Every group tests **both
ends**: what must fail (bad input is skipped without taking the page down) and what must pass
(valid input, minimal or with extra fields, renders without warnings).

| Group | What it proves |
|---|---|
| Known blocks (4) | Each `type` renders its component, in array order; the real `data.json`; minimal props; extra fields the CMS may add |
| Unknown Component Type (5) | A `slider` is skipped and the blocks around it render; dev notice and a single `console.warn`; nothing visible in production; a page made only of unknown types; `"Hero"` is not `"hero"` |
| Malformed blocks (13) | `null`, number, string or array blocks; `type` missing, numeric, object or `null`; types inherited from `Object.prototype` (`toString`, `constructor`, `__proto__`...) |
| Invalid props (10) | `pricing` without `plans`, an object where text goes, a `cta` without `href`, `null`/missing/string props...; in production the block renders nothing |
| Non-array input (5) | `null`, `undefined`, an object or a string do not crash; an empty array renders an empty `<main>` without warnings |

**Do the tests catch anything?** The code was broken on purpose (temporary changes, reverted
afterwards) and the failing tests were counted:

| Mutation | Failing tests |
|---|---|
| M1 · remove the unknown-type check | 19 |
| M2 · remove props validation | 10 |
| M3 · registry as an object literal instead of a `Map` | 5 |
| M4 · show the notice in production too | 3 |
| M5 · over-strict validator: hero requires `cta` | 29 |
| M6 · over-strict validator: plan requires `period` | 2 |

M5 and M6 are why the "must pass" side is tested: an over-strict validator breaks nothing, it
just **silently hides** legitimate blocks.

### Design decisions

- **Validate props before rendering instead of using an error boundary.** The original plan
  was a per-block error boundary. Checked against a production build, the whole page still
  crashed: the blocks are Server Components rendered on the server, where an error boundary
  (a client-side mechanism) catches nothing. The dangerous part is that in Vitest (jsdom,
  client render) the boundary **did** catch the error: the tests would have passed while
  production failed. So each block type has a validator (`validators.ts`) that checks
  everything its component uses, including each field's type.
  - Before that, `catchError` (new in Next 16) was ruled out: its source shows that for bot
    user agents it skips the fallback and lets the error take down the page. On a CMS page,
    that is exactly what Google would see.
- **The registry is a `Map`, not an object literal.** With `registry[type]`, a CMS sending
  `"toString"` or `"constructor"` would hit functions inherited from `Object.prototype` and
  React would try to render them as a component. Covered by tests (mutation M3).
- **Unknown type: notice in development, nothing in production.** The team finds out
  (visible notice in dev, `console.warn` always); visitors never see internal CMS errors.
  Invalid props get the same treatment.
- **An `id` on every block.** It gives React a stable `key` and identifies the block in logs.
- **The `PageBuilder` does not trust the data.** It takes `unknown`: it checks for an array,
  that each block is an object and that `type` is a string before looking it up.
- **Adding a new block does not touch the `PageBuilder`:** a component, its validator and an
  entry in `registry.ts`. TypeScript rejects a validator that guarantees less than the
  component needs.
- **Docker:** 3-stage build with `output: "standalone"` (based on Next.js's official
  `with-docker` example); the final image only holds the server and static assets, runs as
  the unprivileged `node` user and has a healthcheck. Tests run inside the build as a gate.
  `next/font/google` fonts were removed so the build does not depend on downloading them.

The full decision log, including the reasoning behind each choice and the issues found along
the way, is in [`cambios.txt`](cambios.txt).

### Known limitations

- **The data is static.** `data.json` is imported at build time and the page is prerendered;
  a real CMS would need per-request fetching or revalidation (ISR).
- **Validators are hand-written.** Fine for four blocks and no extra dependencies; with many
  more, a schema library that derives both the type and the validator would pay off.
- **`console.warn` is the only record.** In production a skipped block only leaves a line in
  the build log; there is no monitoring to alert the team.

### Project structure

```
src/
  app/page.tsx                  passes data.json to the PageBuilder
  data/data.json                the mock CMS response (includes a "slider" on purpose)
  types/blocks.ts               props for each block and the shape of a CMS block
  components/blocks/            Hero, Features, Pricing, Cta
  components/PageBuilder/
    PageBuilder.tsx             walks the array and decides what to render
    registry.ts                 type → component + validator (Map)
    validators.ts               one props validator per block type
    UnknownBlock.tsx            the development notice (nothing in production)
    PageBuilder.test.tsx        37 tests
Dockerfile, docker-compose.yml
cambios.txt                     decision & change log
```
