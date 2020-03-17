import { TurnSnapshot } from "@timeflies/shared";
import { serviceDispatch } from "../../../services/serviceDispatch";
import { BStateTurnEndAction, BStateTurnStartAction } from '../battleState/BattleStateSchema';
import { Character } from "../entities/Character";

export type TurnState = 'idle' | 'running' | 'ended';

export interface Turn {
    readonly id: number;
    readonly character: Readonly<Character>;
    readonly state: TurnState;
    readonly startTime: number;
    readonly turnDuration: number;
    readonly endTime: number;

    synchronize(snapshot: TurnSnapshot): void;
    refreshTimedActions(): void;
}

export const Turn = (id: number, startTime: number, character: Character, onTurnEnd: () => void): Turn => {

    const { dispatchStart, dispatchEnd } = serviceDispatch({
        dispatchStart: (): BStateTurnStartAction => ({
            type: 'battle/state/event',
            eventType: 'TURN-START',
            payload: {
                characterId: character.id
            }
        }),
        dispatchEnd: (): BStateTurnEndAction => ({
            type: 'battle/state/event',
            eventType: 'TURN-END',
            payload: {}
        })
    });

    let timedActionTimeout: NodeJS.Timeout | undefined;
    let lastCallback: 'start' | 'end' | undefined;

    const this_: Turn = {
        id,
        character,

        get state(): TurnState {
            const now = Date.now();
            if (now < startTime) {
                return 'idle';
            }
            if (now < this_.endTime) {
                return 'running';
            }
            return 'ended';
        },

        get startTime(): number {
            return startTime;
        },

        get turnDuration(): number {
            return character.features.actionTime;
        },

        get endTime(): number {
            return startTime + this_.turnDuration;
        },

        synchronize,

        refreshTimedActions
    };

    const start = (): void => {
        lastCallback = 'start';
        dispatchStart();
        refreshTimedActions();
    };

    const end = (): void => {
        clearTimedActions();
        lastCallback = 'end';
        onTurnEnd();
        dispatchEnd();
    };

    function clearTimedActions(): void {
        if (timedActionTimeout) {
            clearTimeout(timedActionTimeout);
            timedActionTimeout = undefined;
        }
    }

    function synchronize(snapshot: TurnSnapshot): void {
        startTime = snapshot.startTime;
        refreshTimedActions();
    }

    function refreshTimedActions(): void {
        clearTimedActions();

        const now = Date.now();

        if (this_.state === 'idle') {
            if (!lastCallback) {
                const diff = this_.startTime - now;
                timedActionTimeout = setTimeout(start, diff);
            }
        }

        else {

            if (!lastCallback) {
                start();
                return;
            }

            if (lastCallback === 'start') {
                const diff = this_.endTime - now;
                timedActionTimeout = setTimeout(end, diff);
            }

        }

        if (this_.state === 'idle') {
            const diff = startTime - now;
            timedActionTimeout = setTimeout(start, diff);
        } else if (this_.state === 'running') {
            const diff = this_.endTime - now;
            timedActionTimeout = setTimeout(end, diff);
        }
    }

    return this_;
};
