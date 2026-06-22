# Núcleo 2048

Roguelike puzzle-combat en español: fusionas fichas estilo 2048 para cumplir objetivos numéricos, hacer daño, ganar energía y sobrevivir a enemigos con reglas distintas.

## Controles

- Teclado: flechas o WASD para mover fichas.
- Móvil: desliza sobre el tablero.
- Habilidades: pulsa una habilidad. Si pide ficha, toca/clica una casilla.
- Esc o clic derecho: cancela selección de habilidad.

## Ejecutar local

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

Smoke test de sistemas:

```bash
npm run test
```

## GitHub Pages

El proyecto usa `base: './'` en `vite.config.ts`, válido para GitHub Pages en repositorio o subruta.

Este repositorio está desplegado desde la rama `gh-pages`, carpeta `/`.

Para redesplegar:

```bash
npm run build
# publica el contenido de dist en la rama gh-pages
```

## Extender contenido

- Enemigos: `src/game/data/enemies.ts` y `src/game/data/bosses.ts`.
- Talismanes: `src/game/data/relics.ts`, efecto implementado en `src/game/systems/RelicSystem.ts`.
- Habilidades: `src/game/data/skills.ts`, efecto implementado en `src/game/systems/SkillSystem.ts`.
- Eventos: `src/game/data/events.ts`.
- Tienda: `src/game/data/shops.ts`.
- Balance global: `src/game/data/balancing.ts`.

La lógica de tablero vive en `BoardSystem`; Phaser solo renderiza y anima.
