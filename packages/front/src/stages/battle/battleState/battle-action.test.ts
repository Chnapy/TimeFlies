import { applyMiddleware, createStore, Store } from '@reduxjs/toolkit';
import { seedTiledMapAssets } from '@timeflies/shared';
import { Reducer } from 'react';
import { BattleStartAction } from '../battle-actions';
import { seedCharacter } from '../entities/character/Character.seed';
import { seedSpell } from '../entities/spell/Spell.seed';
import { battleActionMiddleware } from './battle-action-middleware';
import { battleActionReducer, BattleActionState, GridTile } from './battle-action-reducer';
import { BattleMapPathAction, BattleStateTurnEndAction, BattleStateTurnStartAction } from './battle-state-actions';

describe('# battle-action', () => {

    const getStore = (initialState: BattleActionState, deps: Partial<Parameters<typeof battleActionMiddleware>[ 0 ]> = {}): Store<BattleActionState> => {

        const futureCharacter = seedCharacter({
            id: '1', period: 'future'
        });

        const futureSpell = seedSpell({
            id: 's1', period: 'future', type: 'move'
        });

        const reducer: Reducer<BattleActionState, any> = (...args) => {
            initialState = battleActionReducer(...args);
            return initialState;
        };

        const middleware = battleActionMiddleware({
            extractState: () => initialState,
            extractFutureCharacterPositionList: () => [ futureCharacter.position ],
            extractFutureCharacter: () => futureCharacter,
            extractFutureSpell: () => futureSpell,
            getSpellEngineFromType: () => async () => { },
            ...deps
        });

        return createStore(reducer as any, initialState, applyMiddleware(middleware));
    };

    describe('on battle start', () => {

        it('should define new state', () => {

            const initialState: BattleActionState = {
                tiledSchema: null,
                tiledImagesUrls: {},
                currentAction: 'watch',
                grid: [],
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null,
            };

            const store = getStore(initialState);

            const action = BattleStartAction({
                myPlayerId: 'p1',
                tiledMapAssets: {
                    schema: seedTiledMapAssets('map_1').schema,
                    imagesUrls: { toto: 'url' },
                },
                globalTurnSnapshot: {} as any,
                entitiesSnapshot: {
                    charactersSnapshots: [
                        {
                            id: '',
                            position: { x: 2, y: 8 }
                        }
                    ]
                } as any
            });

            store.dispatch(action);

            expect(store.getState()).toEqual<BattleActionState>({
                tiledSchema: action.payload.tiledMapAssets.schema,
                tiledImagesUrls: { toto: 'url' },
                currentAction: 'watch',
                grid: expect.arrayContaining<GridTile>([ {
                    tileType: expect.any(String),
                    position: expect.any(Object)
                } ]),
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null
            });
        });
    });

    describe('on turn start', () => {

        it.todo('should not set action to spellPrepare, if character not mine');

        it.todo('should set action to spellPrepare, if character mine');

        it('should get spell engine and pass it action, if character mine', () => {

            const initialState: BattleActionState = {
                tiledSchema: null,
                tiledImagesUrls: {},
                currentAction: 'watch',
                grid: [],
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null
            };

            const spellEngine = jest.fn(async () => {});

            const getSpellEngineFromType = jest.fn(() => spellEngine);

            const store = getStore(initialState, {
                extractFutureSpell: () => seedSpell({
                    id: 's1', period: 'future', type: 'move'
                }),
                getSpellEngineFromType
            });

            const action = BattleStateTurnStartAction({
                turnSnapshot: {
                    id: 1,
                    characterId: '1',
                    duration: 1000,
                    startTime: Date.now()
                },
                currentCharacter: seedCharacter({ id: 'c1', period: 'current', isMine: true })
            });

            store.dispatch(action);

            expect(getSpellEngineFromType).toHaveBeenNthCalledWith(1, 'move', expect.anything(), expect.anything());
            expect(spellEngine).toHaveBeenNthCalledWith(1, action);
        });
    });

    describe('on turn end', () => {

        it('should set action to watch and clear areas', () => {

            const initialState: BattleActionState = {
                tiledSchema: null,
                tiledImagesUrls: {},
                currentAction: 'watch',
                grid: [],
                path: [ { x: 2, y: 2 } ],
                rangeArea: [ { x: 3, y: 3 } ],
                actionArea: [ { x: 1, y: 1 } ],
                futureCharacterPosition: null
            };

            const store = getStore(initialState);

            const action = BattleStateTurnEndAction();

            store.dispatch(action);

            expect(store.getState()).toEqual<BattleActionState>({
                ...initialState,
                path: [],
                rangeArea: [],
                actionArea: []
            });
        });

        it('should not get spell engine', () => {

            const initialState: BattleActionState = {
                tiledSchema: null,
                tiledImagesUrls: {},
                currentAction: 'watch',
                grid: [],
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null
            };

            const getSpellEngineFromType = jest.fn(() => jest.fn());

            const store = getStore(initialState, {
                getSpellEngineFromType
            });

            const action = BattleStateTurnEndAction();

            store.dispatch(action);

            expect(getSpellEngineFromType).not.toHaveBeenCalled();
        });
    });

    describe('on map area', () => {

        it('should set given areas', () => {

            const initialState: BattleActionState = {
                tiledSchema: null,
                tiledImagesUrls: {},
                currentAction: 'watch',
                grid: [],
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null
            };

            const store = getStore(initialState);

            const action = BattleMapPathAction({
                path: [ { x: 2, y: 3 } ],
                rangeArea: [ { x: 8, y: 7 } ],
                actionArea: [ { x: 1, y: 1 } ]
            });

            store.dispatch(action);

            expect(store.getState()).toEqual<BattleActionState>({
                ...initialState,
                path: [ { x: 2, y: 3 } ],
                rangeArea: [ { x: 8, y: 7 } ],
                actionArea: [ { x: 1, y: 1 } ]
            });
        });
    });

    describe.skip('on commit', () => {

        it('should redefine grid', () => {

            const initialState: BattleActionState = {
                tiledSchema: seedTiledMapAssets('map_1').schema,
                tiledImagesUrls: { toto: 'url' },
                currentAction: 'watch',
                grid: [],
                path: [],
                rangeArea: [],
                actionArea: [],
                futureCharacterPosition: null
            };

            const store = getStore(initialState);

            // const action = BattleCommitAction({
            //     time: Date.now(),
            //     charactersPositionList: [ { x: 2, y: 3 }, { x: 8, y: 6 } ]
            // });

            // store.dispatch(action);

            expect(store.getState()).toEqual<BattleActionState>({
                ...initialState,
                grid: expect.arrayContaining<GridTile>([ {
                    tileType: expect.any(String),
                    position: expect.any(Object)
                } ])
            })
        });
    });
});
