import * as migration_20260820_061026_initial from './20260820_061026_initial';
import * as migration_20260826_092841_recruit_link_block from './20260826_092841_recruit_link_block';
import * as migration_20260826_103039_interviews_collection from './20260826_103039_interviews_collection';
import * as migration_20260901_040403_interview_eyecatch_video from './20260901_040403_interview_eyecatch_video';

export const migrations = [
  {
    up: migration_20260820_061026_initial.up,
    down: migration_20260820_061026_initial.down,
    name: '20260820_061026_initial',
  },
  {
    up: migration_20260826_092841_recruit_link_block.up,
    down: migration_20260826_092841_recruit_link_block.down,
    name: '20260826_092841_recruit_link_block',
  },
  {
    up: migration_20260826_103039_interviews_collection.up,
    down: migration_20260826_103039_interviews_collection.down,
    name: '20260826_103039_interviews_collection',
  },
  {
    up: migration_20260901_040403_interview_eyecatch_video.up,
    down: migration_20260901_040403_interview_eyecatch_video.down,
    name: '20260901_040403_interview_eyecatch_video'
  },
];
