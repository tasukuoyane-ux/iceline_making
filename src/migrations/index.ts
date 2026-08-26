import * as migration_20260820_061026_initial from './20260820_061026_initial';
import * as migration_20260826_092841_recruit_link_block from './20260826_092841_recruit_link_block';

export const migrations = [
  {
    up: migration_20260820_061026_initial.up,
    down: migration_20260820_061026_initial.down,
    name: '20260820_061026_initial',
  },
  {
    up: migration_20260826_092841_recruit_link_block.up,
    down: migration_20260826_092841_recruit_link_block.down,
    name: '20260826_092841_recruit_link_block'
  },
];
