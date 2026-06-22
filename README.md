# Rog2048

Roguelike puzzle-combat en español: fusionas fichas estilo 2048 para cumplir objetivos numéricos, crear combos, activar habilidades y construir sinergias con talismanes.

## Controles

- Teclado: flechas o WASD para mover fichas.
- Móvil: desliza sobre el tablero.
- Habilidades: pulsa una habilidad. Si pide objetivo, toca una ficha.
- Esc o clic derecho: cancela selección.

## Versión 0.2

- HUD de combate más compacto y retro.
- Retratos enemigos procedurales.
- Iconos SVG internos para talismanes, habilidades, estados y mapa.
- Nuevas reliquias de build: Puerta del Ocho, Primera Chispa, Mandato de Brasa.
- Estados visuales: quemado, potenciado, maldito, bloqueado.
- Ajustes de volumen maestro, SFX, música, animación, temblor y movimiento reducido.

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

El proyecto usa `base: './'` en `vite.config.ts`, válido para GitHub Pages en `/Rog2048/`.

Este repositorio está desplegado desde la rama `gh-pages`, carpeta `/`.

Para redesplegar:

```bash
npm run build
# publica el contenido de dist en la rama gh-pages
```

URL: `https://marcmunta.github.io/Rog2048/`

## Extender contenido

- Enemigos: `src/game/data/enemies.ts` y `src/game/data/bosses.ts`.
- Talismanes: `src/game/data/relics.ts`, efectos en `src/game/systems/RelicSystem.ts`.
- Habilidades: `src/game/data/skills.ts`, efectos en `src/game/systems/SkillSystem.ts`.
- Eventos: `src/game/data/events.ts`.
- Tienda: `src/game/data/shops.ts`.
- Iconos y retratos: `src/game/assets/`.
- Balance global: `src/game/data/balancing.ts`.

La lógica de tablero vive en `BoardSystem`; Phaser renderiza, anima y captura input.
