import Phaser from 'phaser';
import '@fontsource/vt323';
import './styles.css';
import { BootScene } from './game/scenes/BootScene';
import { PreloadScene } from './game/scenes/PreloadScene';
import { MainMenuScene } from './game/scenes/MainMenuScene';
import { ClassSelectScene } from './game/scenes/ClassSelectScene';
import { MapScene } from './game/scenes/MapScene';
import { CombatScene } from './game/scenes/CombatScene';
import { RewardScene } from './game/scenes/RewardScene';
import { ShopScene } from './game/scenes/ShopScene';
import { EventScene } from './game/scenes/EventScene';
import { RestScene } from './game/scenes/RestScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { VictoryScene } from './game/scenes/VictoryScene';
import { CollectionScene } from './game/scenes/CollectionScene';
import { SettingsScene } from './game/scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'game-root',
  backgroundColor: '#080816',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  input: {
    activePointers: 3
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    ClassSelectScene,
    MapScene,
    CombatScene,
    RewardScene,
    ShopScene,
    EventScene,
    RestScene,
    GameOverScene,
    VictoryScene,
    CollectionScene,
    SettingsScene
  ]
};

new Phaser.Game(config);
