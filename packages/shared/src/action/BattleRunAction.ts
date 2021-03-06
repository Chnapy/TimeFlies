import { BattleSnapshot, DynamicBattleSnapshot } from "../battleStage/battle-snapshot";
import { GlobalTurnSnapshot } from "../cycle/GlobalTurn";
import { TurnSnapshot } from "../cycle/Turn";
import { PlayerSnapshot, TeamSnapshot } from '../entities';
import { SpellActionSnapshot } from '../entities/Spell';
import { TAction } from "./TAction";

export interface BRunLaunchSAction extends TAction<'battle-run/launch'> {
    teamSnapshotList: TeamSnapshot[];
    playerSnapshotList: PlayerSnapshot[];
    battleSnapshot: BattleSnapshot;
    globalTurnState: GlobalTurnSnapshot;
}

export interface BRunEndSAction extends TAction<'battle-run/end'> {
    winnerTeamId: string;
}

export interface BRunGlobalTurnStartSAction extends TAction<'battle-run/global-turn-start'> {
    globalTurnState: GlobalTurnSnapshot;
}

export interface BRunTurnStartSAction extends TAction<'battle-run/turn-start'> {
    turnState: TurnSnapshot;
}

export type ConfirmSAction = TAction<'confirm'>
    & {
        lastCorrectHash: string;
        debug?: {
            sendHash: string;
        };
    }
    & (
        | {
            isOk: true;
            correctBattleSnapshot?: undefined;
        }
        | {
            isOk: false;
            correctBattleSnapshot: DynamicBattleSnapshot;
        }
    );

export interface NotifySAction extends TAction<'notify'> {
    spellActionSnapshot: SpellActionSnapshot;
}

export interface SpellActionCAction extends TAction<'battle/spellAction'> {
    spellAction: SpellActionSnapshot;
}

export type BattleRunSAction =
    | BRunLaunchSAction
    | BRunEndSAction
    | BRunGlobalTurnStartSAction
    | BRunTurnStartSAction
    | ConfirmSAction
    | NotifySAction;

export type BattleRunCAction =
    | SpellActionCAction;
