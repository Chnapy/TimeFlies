import { createReducer } from '@reduxjs/toolkit';
import { ObjectTyped } from '@timeflies/common';
import { GameState } from '../../store/game-state';
import { cycleCaseReducers } from '../cycle/store/cycle-case-reducers';
import { spellSelectCaseReducers } from '../spell-select/store/spell-select-case-reducers';
import { BattleLoadAction } from './battle-actions';
import { BattleState, CharacterVariablesMap, SpellVariablesMap } from './battle-state';

export const battleReducer = createReducer<GameState[ 'battle' ]>(null, {
    ...cycleCaseReducers,
    ...spellSelectCaseReducers,
    [ BattleLoadAction.type ]: (state, { payload }: BattleLoadAction): BattleState => {
        const { myPlayerId, tiledMapInfos: mapInfos, players, characters, spells, cycleInfos } = payload;

        const getTiledMap = () => {
            const { name, schemaLink } = mapInfos;
            const tiledMapInfos: BattleState[ 'tiledMapInfos' ] = {
                name,
                schemaLink
            };

            return { tiledMapInfos };
        };

        const getPlayers = () => {
            const staticPlayers = players.reduce<BattleState[ 'staticPlayers' ]>((acc, { playerId, playerName, teamColor }) => {
                acc[ playerId ] = {
                    playerId,
                    playerName,
                    teamColor
                };

                return acc;
            }, {});
            const playerList = players.map(p => p.playerId);

            return { staticPlayers, playerList };
        };

        const createCharactersVariables = () => {
            const charactersVariables: CharacterVariablesMap = {
                actionTime: {},
                health: {},
                orientation: {},
                position: {}
            };
            ObjectTyped.entries(charactersVariables).forEach(([ variableName, variableValue ]) => {
                characters.forEach(({ characterId, initialVariables }) => {
                    variableValue[ characterId ] = initialVariables[ variableName ];
                });
            });
            return charactersVariables;
        };

        const getCharacters = () => {
            const staticCharacters = characters.reduce<BattleState[ 'staticCharacters' ]>((acc, {
                characterId, characterRole, playerId, defaultSpellId
            }) => {
                acc[ characterId ] = {
                    characterId,
                    characterRole,
                    defaultSpellId,
                    playerId
                };

                return acc;
            }, {});

            const currentCharacters = createCharactersVariables();
            const futureCharacters = createCharactersVariables();

            const characterList = characters.map(c => c.characterId);

            return { staticCharacters, currentCharacters, futureCharacters, characterList };
        };

        const createSpellsVariables = () => {
            const spellsVariables: SpellVariablesMap = {
                actionArea: {},
                attack: {},
                duration: {},
                lineOfSight: {},
                rangeArea: {}
            };
            ObjectTyped.entries(spellsVariables).forEach(([ variableName, variableValue ]) => {
                spells.forEach(({ spellId, initialVariables }) => {
                    variableValue[ spellId ] = initialVariables[ variableName ];
                });
            });
            return spellsVariables;
        };

        const getSpells = () => {
            const staticSpells = spells.reduce<BattleState[ 'staticSpells' ]>((acc, {
                spellId, spellRole, characterId
            }) => {
                acc[ spellId ] = {
                    spellId,
                    spellRole,
                    characterId
                };

                return acc;
            }, {});

            const currentSpells = createSpellsVariables();
            const futureSpells = createSpellsVariables();

            const spellLists = characters.reduce<BattleState[ 'spellLists' ]>((acc, { characterId }) => {
                acc[ characterId ] = spells
                    .filter(s => s.characterId === characterId)
                    .map(s => s.spellId);

                return acc;
            }, {});

            return { staticSpells, currentSpells, futureSpells, spellLists };
        };

        const getCycleInfos = () => {
            const { turnsOrder } = cycleInfos;

            return {
                turnStartTime: -1,
                turnsOrder,
                playingCharacterId: null,
                roundIndex: 0,
                turnIndex: 0
            };
        };

        return {
            myPlayerId,

            ...getTiledMap(),

            ...getPlayers(),

            ...getCharacters(),

            ...getSpells(),

            spellActions: {},
            spellActionList: [],

            selectedSpellId: null,

            ...getCycleInfos()
        };
    }
});
