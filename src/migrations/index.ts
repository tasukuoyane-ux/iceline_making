import * as migration_20260820_061026_initial from './20260820_061026_initial';

export const migrations = [
  {
    up: migration_20260820_061026_initial.up,
    down: migration_20260820_061026_initial.down,
    name: '20260820_061026_initial'
  },
];
