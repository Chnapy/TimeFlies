import { createAction } from '@reduxjs/toolkit';
import { BattleSnapshot, GlobalTurnSnapshot } from '@timeflies/shared';
import TiledMap from 'tiled-types/types';

export type BattleStartAction = ReturnType<typeof BattleStartAction>;
export const BattleStartAction = createAction<{
    tiledMapAssets: {
        schema: TiledMap;
        imagesUrls: Record<string, string>;
    };
    entitiesSnapshot: BattleSnapshot;
    globalTurnSnapshot: GlobalTurnSnapshot;
}>('battle/start');
