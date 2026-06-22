import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi, showToast } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    this.render();
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }

  private render(): void {
    const settings = gameStore.profile.settings;
    const stats = gameStore.profile.stats;
    const root = setUi(`<main class="screen">
      <section class="screen-inner">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Ajustes</span>
            <h2>Preferencias</h2>
          </div>
          ${pixelButton({ id: 'back', label: 'Volver', variant: 'ghost' })}
        </div>
        <div class="settings-grid">
          <label class="setting-row"><span>Volumen</span><input id="volume" type="range" min="0" max="1" step="0.05" value="${settings.masterVolume}" /></label>
          <label class="setting-row"><span>Temblor de pantalla</span><input id="shake" type="checkbox" ${settings.screenShake ? 'checked' : ''} /></label>
          <label class="setting-row"><span>Velocidad animación</span><input id="speed" type="range" min="0.5" max="1.5" step="0.1" value="${settings.animationSpeed}" /></label>
          <label class="setting-row"><span>Movimiento reducido</span><input id="motion" type="checkbox" ${settings.reducedMotion ? 'checked' : ''} /></label>
        </div>
        <h3>Estadísticas</h3>
        <div class="stat-grid">
          <span>Runs iniciadas <strong>${stats.runsStarted}</strong></span>
          <span>Victorias <strong>${stats.runsWon}</strong></span>
          <span>Derrotas <strong>${stats.runsLost}</strong></span>
          <span>Combates ganados <strong>${stats.combatsWon}</strong></span>
          <span>Mejor ficha <strong>${stats.highestTile}</strong></span>
          <span>Daño total <strong>${stats.totalDamage}</strong></span>
        </div>
        <br />
        ${pixelButton({ id: 'reset', label: 'Borrar guardado', variant: 'danger' })}
      </section>
    </main>`);

    root.querySelector<HTMLInputElement>('#volume')?.addEventListener('input', (event) => {
      gameStore.profile.settings.masterVolume = Number((event.target as HTMLInputElement).value);
      gameStore.saveProfileOnly();
    });
    root.querySelector<HTMLInputElement>('#speed')?.addEventListener('input', (event) => {
      gameStore.profile.settings.animationSpeed = Number((event.target as HTMLInputElement).value);
      gameStore.saveProfileOnly();
    });
    root.querySelector<HTMLInputElement>('#shake')?.addEventListener('change', (event) => {
      gameStore.profile.settings.screenShake = (event.target as HTMLInputElement).checked;
      gameStore.saveProfileOnly();
    });
    root.querySelector<HTMLInputElement>('#motion')?.addEventListener('change', (event) => {
      gameStore.profile.settings.reducedMotion = (event.target as HTMLInputElement).checked;
      gameStore.saveProfileOnly();
    });
    bindClick(root, '#back', () => transitionTo(this, 'MainMenuScene'));
    bindClick(root, '#reset', () => {
      gameStore.resetAll();
      showToast('Guardado borrado.', 'bad');
      AudioSystem.play('damage');
      this.render();
    });
  }
}
