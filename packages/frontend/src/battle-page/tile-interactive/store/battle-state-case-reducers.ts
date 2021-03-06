import { GameCaseReducers } from '../../../store/game-case-reducers';
import { BattleCommitAction, BattleRollbackAction, BattleTimeUpdateAction } from './battle-state-actions';

export const battleStateCaseReducers: GameCaseReducers<'battle'> = {
    [ BattleTimeUpdateAction.type ]: (state, { payload }: BattleTimeUpdateAction) => {
        if (!state) {
            return;
        }

        // handle case when a prepare-turn-start action is dispatched between commit & time-update action
        if (payload.currentTime > state.currentTime) {
            state.currentTime = payload.currentTime;
        }
    },
    [ BattleCommitAction.type ]: (state, { payload }: BattleCommitAction) => {
        if (!state) {
            return;
        }

        const { spellAction, futureState, spellEffect } = payload;

        state.spellActionEffects[ spellAction.launchTime ] = {
            spellAction,
            spellEffect
        };
        state.spellActionEffectList.push(spellAction.launchTime);

        state.serializableStates[ futureState.time ] = futureState;
        state.serializableStateList.push(futureState.time);
    },
    [ BattleRollbackAction.type ]: (state, { payload }: BattleRollbackAction) => {
        if (!state) {
            return;
        }

        const { lastState } = payload;

        state.spellActionEffectList = state.spellActionEffectList.filter(time => time <= lastState.time);
        state.serializableStateList = state.serializableStateList.filter(time => time <= lastState.time);
    }
};
