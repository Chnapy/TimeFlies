import { createAction } from '@reduxjs/toolkit';
import { SpellType, TurnSnapshot, Position } from '@timeflies/shared';
import { SpellAction } from '../spellAction/spell-action-reducer';
import { BattleActionState } from './battle-action-reducer';
import { Character } from '../entities/character/Character';

export type BattleStateTurnStartAction = ReturnType<typeof BattleStateTurnStartAction>;
export const BattleStateTurnStartAction = createAction<{
    turnSnapshot: TurnSnapshot;
    currentCharacter: Character<'current'>;
}>('battle/state/turn-start');

export type BattleStateTurnEndAction = ReturnType<typeof BattleStateTurnEndAction>;
export const BattleStateTurnEndAction = createAction('battle/state/turn-end');

export type BattleStateSpellPrepareAction = ReturnType<typeof BattleStateSpellPrepareAction>;
export const BattleStateSpellPrepareAction = createAction<{
    spellType: SpellType;
}>('battle/state/spell-prepare');

export type BattleStateSpellLaunchAction = ReturnType<typeof BattleStateSpellLaunchAction>;
export const BattleStateSpellLaunchAction = createAction<{
    spellActions: SpellAction[];
}>('battle/state/spell-launch');

export type BattleStateAction = ReturnType<(typeof battleStateActionList)[ number ]>;
export const battleStateActionList = [
    BattleStateTurnStartAction,
    BattleStateTurnEndAction,
    BattleStateSpellPrepareAction,
    BattleStateSpellLaunchAction
] as const;

export type TileHoverAction = ReturnType<typeof TileHoverAction>;
export const TileHoverAction = createAction<{
    position: Position;
}>('battle/tile/hover');

export type TileClickAction = ReturnType<typeof TileClickAction>;
export const TileClickAction = createAction<{
    position: Position;
}>('battle/tile/click');

export type BattleMapPathAction = ReturnType<typeof BattleMapPathAction>;
export const BattleMapPathAction = createAction<
    Partial<Pick<BattleActionState, 'path' | 'rangeArea' | 'actionArea'>>
>('battle/map/path');
