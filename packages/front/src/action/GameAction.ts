import { Action } from 'redux';
import { BattleSceneAction } from '../phaser/battleReducers/BattleReducerManager';
import { MessageAction } from '../socket/WSClient';
import { BStateAction } from '../stages/battle/battleState/BattleStateSchema';
import { SpellEngineBindAction } from '../stages/battle/engine/Engine';
import { BattleCommitAction } from '../stages/battle/snapshot/SnapshotManager';
import { LoadAction } from '../stages/load/LoadScene';
import { LoginSuccess } from '../ui/reducers/CurrentPlayerReducer';

export type IGameAction<T extends string, G extends boolean = false> = Action<T>
    & (G extends true ? {
        onlyGame: true;
    } : {
        onlyGame?: never;
    });

export type GameAction =
    | MessageAction
    | LoadAction
    | BattleSceneAction
    | LoginSuccess
    | SpellEngineBindAction
    | BStateAction
    | BattleCommitAction;
