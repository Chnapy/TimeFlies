import { createReducer } from '@reduxjs/toolkit';
import { normalize } from '@timeflies/common';
import { CredentialsLoginAction } from '../../login-page/store/credentials-actions';
import { GameState } from '../../store/game-state';
import { cycleCaseReducers } from '../cycle/store/cycle-case-reducers';
import { playerDisconnectCaseReducers } from '../player-disconnect/store/player-disconnect-case-reducers';
import { spellSelectCaseReducers } from '../spell-select/store/spell-select-case-reducers';
import { battleStateCaseReducers } from '../tile-interactive/store/battle-state-case-reducers';
import { BattleLoadAction, BattleResetAction } from './battle-actions';
import { BattleState } from './battle-state';

export const battleReducer = createReducer<GameState[ 'battle' ]>(null, {
    ...cycleCaseReducers,
    ...spellSelectCaseReducers,
    ...battleStateCaseReducers,
    ...playerDisconnectCaseReducers,
    [ BattleLoadAction.type ]: (state, { payload }: BattleLoadAction): BattleState => {
        const {
            roomId, tiledMapInfos: mapInfos,
            staticPlayers: players, staticCharacters: characters, staticSpells: spells,
            initialSerializableState, cycleInfos
        } = payload;

        const getTiledMap = (): Pick<BattleState, 'tiledMapInfos'> => {
            const { name, schemaLink } = mapInfos;
            const tiledMapInfos: BattleState[ 'tiledMapInfos' ] = {
                name,
                schemaLink
            };

            return { tiledMapInfos };
        };

        const getPlayers = (): Pick<BattleState, 'staticPlayers' | 'playerList' | 'playerDisconnectedList'> => ({
            staticPlayers: normalize(players, 'playerId'),
            playerList: players.map(p => p.playerId),
            playerDisconnectedList: []
        });

        const getCharacters = (): Pick<BattleState, 'staticCharacters' | 'characterList'> => ({
            staticCharacters: normalize(characters, 'characterId'),
            characterList: characters.map(c => c.characterId)
        });

        const getSpells = (): Pick<BattleState, 'staticSpells' | 'spellLists'> => {
            const spellLists = characters.reduce<BattleState[ 'spellLists' ]>((acc, { characterId }) => {
                acc[ characterId ] = spells
                    .filter(s => s.characterId === characterId)
                    .map(s => s.spellId);

                return acc;
            }, {});

            return {
                staticSpells: normalize(spells, 'spellId'),
                spellLists
            };
        };

        const getCycleInfos = (): Pick<BattleState, 'turnStartTime' | 'turnsOrder' | 'playingCharacterId' | 'roundIndex' | 'turnIndex'> => {
            const { turnsOrder } = cycleInfos;

            return {
                turnStartTime: -1,
                turnsOrder,
                playingCharacterId: null,
                roundIndex: 0,
                turnIndex: 0
            };
        };

        const getSerializableInfos = (): Pick<BattleState, 'initialSerializableState' | 'serializableStates' | 'serializableStateList' | 'currentTime'> => {

            return {
                initialSerializableState,
                serializableStates: normalize([ initialSerializableState ], 'time'),
                serializableStateList: [ initialSerializableState.time ],
                currentTime: initialSerializableState.time
            };
        };

        return {
            roomId,

            ...getTiledMap(),

            ...getPlayers(),

            ...getCharacters(),

            ...getSpells(),

            ...getSerializableInfos(),

            spellActionEffects: {},
            spellActionEffectList: [],

            selectedSpellId: null,

            ...getCycleInfos()
        };
    },
    [ BattleResetAction.type ]: () => {
        return null;
    },
    [ CredentialsLoginAction.type ]: () => {
        return null;
    }
});
