import { ArrayUtils } from '@timeflies/common';
import { GameCaseReducers } from '../../../store/game-case-reducers';
import { isMyCharacterPlayingSelector } from '../../hooks/use-is-my-character-playing';
import { BattlePrepareTurnStartAction, BattleTurnEndAction } from './cycle-actions';

export const cycleCaseReducers: GameCaseReducers<'battle'> = {
    [ BattlePrepareTurnStartAction.type ]: (state, { payload }: BattlePrepareTurnStartAction) => {
        if (!state) {
            return;
        }

        const { roundIndex, turnIndex, characterId, startTime, myPlayerId } = payload;

        state.spellActionEffects = {};
        state.spellActionEffectList = [];

        state.serializableStateList
            .slice(0, state.serializableStateList.length - 1)
            .forEach(time => {
                delete state.serializableStates[ time ];
            });
        state.serializableStateList = [ ArrayUtils.last(state.serializableStateList)! ];
        state.currentTime = state.serializableStateList[ 0 ];

        state.roundIndex = roundIndex;
        state.turnIndex = turnIndex;
        state.playingCharacterId = characterId;
        state.turnStartTime = startTime;

        const isMyCharacterPlaying = isMyCharacterPlayingSelector(state, myPlayerId);

        const { defaultSpellId } = state.staticCharacters[ payload.characterId ];

        state.selectedSpellId = isMyCharacterPlaying ? defaultSpellId : null;
    },
    [ BattleTurnEndAction.type ]: (state, action) => {
        if (!state) {
            return;
        }

        // remove future spell actions
        state.spellActionEffectList = state.spellActionEffectList.filter(time => time <= state.currentTime);

        state.selectedSpellId = null;
    },
};
