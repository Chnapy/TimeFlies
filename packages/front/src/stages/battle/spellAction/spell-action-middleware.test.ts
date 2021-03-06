import { MiddlewareAPI } from '@reduxjs/toolkit';
import { createPosition, normalize, seedSpellActionSnapshot, TimerTester } from '@timeflies/shared';
import { ReceiveMessageAction } from '../../../socket/wsclient-actions';
import { BattleStateSpellLaunchAction, BattleStateTurnEndAction } from '../battleState/battle-state-actions';
import { seedCharacter } from '../entities/character/Character.seed';
import { Spell } from '../entities/spell/Spell';
import { seedSpell } from '../entities/spell/Spell.seed';
import { getInitialSnapshotState } from '../snapshot/snapshot-reducer';
import { SpellActionCancelAction, SpellActionLaunchAction } from './spell-action-actions';
import { spellActionMiddleware } from './spell-action-middleware';
import { SpellActionTimer } from './spell-action-timer';

describe('# spell-action-middleware', () => {

    const timerTester = new TimerTester();

    beforeEach(() => {
        timerTester.beforeTest();
    });

    afterEach(() => {
        timerTester.afterTest();
    });

    const init = () => {

        const futureCharacter = seedCharacter({
            period: 'future',
            id: '1'
        });

        const spell = seedSpell({
            period: 'future',
            id: 's1',
            characterId: '1',
            type: 'move',
            feature: {
                duration: 200
            }
        });

        const api: MiddlewareAPI = {
            getState: jest.fn(),
            dispatch: jest.fn()
        };

        const next = jest.fn();

        const timer: ReturnType<SpellActionTimer> = {
            onAdd: jest.fn(),
            onRemove: jest.fn(),
            getTimeout: () => undefined
        };

        const state = getInitialSnapshotState({
            myPlayerId: 'p1'
        });

        return {
            futureCharacter,
            spell,
            api,
            next,
            timer,
            state
        };
    };

    describe('on spell action', () => {

        it('should dispatch launch action with spell action list', async () => {
            const { futureCharacter, spell, api, next, timer, state } = init();

            const action = BattleStateSpellLaunchAction({
                spellActions: [
                    {
                        spell,
                        position: createPosition(-1, -1),
                        actionArea: normalize([ createPosition(-1, -1) ])
                    }
                ]
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-',
                extractCurrentHash: () => '-hash-',
                extractState: () => state
            })(api)(next)(action);

            expect(api.dispatch).toHaveBeenCalledWith(
                SpellActionLaunchAction({
                    spellActList: [ {
                        startTime: timerTester.now,
                        spellAction: {
                            spell,
                            position: createPosition(-1, -1),
                            actionArea: normalize([ createPosition(-1, -1) ])
                        }
                    } ]
                })
            );
        });

        it.skip('should dispatch commit for each spell', () => {
            // const { futureCharacter, spell, api, next, timer, state } = init();

            // const action = BattleStateSpellLaunchAction({
            //     spellActions: [
            //         {
            //             spell,
            //             position: createPosition(-1, -1),
            //             actionArea: normalize([ createPosition(-1, -1) ])
            //         },
            //         {
            //             spell,
            //             position: createPosition(-1, -1),
            //             actionArea: normalize([ createPosition(-1, -1) ])
            //         }
            //     ]
            // });

            // spellActionMiddleware({
            //     createSpellActionTimer: () => () => timer,
            //     extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
            //     extractFutureSpells: () => ({ [ spell.id ]: spell }),
            //     extractFutureHash: () => '-hash-',
            //     extractCurrentHash: () => '-hash-',
            //     extractState: () => state
            // })(api)(next)(action);

            // expect(api.dispatch).toHaveBeenNthCalledWith(2, BattleCommitAction({
            //     time: expect.any(Number),
            //     charactersPositionList: [ futureCharacter.position ]
            // }));
        });

        it('should notify timer to first spell added', async () => {
            const { futureCharacter, spell, api, next, timer, state } = init();

            const action = BattleStateSpellLaunchAction({
                spellActions: [
                    {
                        spell,
                        position: createPosition(-1, -1),
                        actionArea: normalize([ createPosition(-1, -1) ])
                    },
                    {
                        spell,
                        position: createPosition(-1, -1),
                        actionArea: normalize([ createPosition(-1, -1) ])
                    }
                ]
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-',
                extractCurrentHash: () => '-hash-',
                extractState: () => state
            })(api)(next)(action);

            expect(timer.onAdd).toHaveBeenNthCalledWith(1, timerTester.now, false);
        });
    });

    describe('on turn end action', () => {

        it('should return turn end action', async () => {

            const { futureCharacter, spell, api, next, timer, state } = init();

            state.spellActionSnapshotList.push(
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now,
                    duration: 1000,
                })
            );

            const action = BattleStateTurnEndAction();

            const p = spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-future-',
                extractCurrentHash: () => '-hash-current-',
                extractState: () => state
            })(api)(next)(action);

            expect(next).toHaveBeenNthCalledWith(1, BattleStateTurnEndAction());

            await p;
        });

        it.skip('should dispatch spell canceled action with new snapshot list', async () => {

            // const { futureCharacter, spell, api, next, timer, state } = init();

            // state.spellActionSnapshotList.push(
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now,
            //         duration: 1000,
            //     }),
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now + 1000,
            //         duration: 1000,
            //     }),
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now + 2000,
            //         duration: 1000,
            //     })
            // );

            // timerTester.advanceBy(1200);

            // const action = BattleStateTurnEndAction();

            // await spellActionMiddleware({
            //     createSpellActionTimer: () => () => timer,
            //     extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
            //     extractFutureSpells: () => ({ [ spell.id ]: spell }),
            //     extractFutureHash: () => '-hash-future-',
            //     extractCurrentHash: () => '-hash-current-',
            //     extractState: () => state
            // })(api)(next)(action);

            // expect(api.dispatch).toHaveBeenNthCalledWith(1, SpellActionCancelAction({
            //     spellActionSnapshotsValids: state.spellActionSnapshotList.slice(0, 1)
            // }));
        });

        it.skip('should notify timer of removed snapshots', () => {

            // const { futureCharacter, spell, api, next, timer, state } = init();

            // state.spellActionSnapshotList.push(
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now,
            //         duration: 1000,
            //     }),
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now + 1000,
            //         duration: 1000,
            //     }),
            //     seedSpellActionSnapshot('s1', {
            //         startTime: timerTester.now + 2000,
            //         duration: 1000,
            //     })
            // );

            // timerTester.advanceBy(1200);

            // const action = BattleStateTurnEndAction();

            // spellActionMiddleware({
            //     createSpellActionTimer: () => () => timer,
            //     extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
            //     extractFutureSpells: () => ({ [ spell.id ]: spell }),
            //     extractFutureHash: () => '-hash-future-',
            //     extractCurrentHash: () => '-hash-current-',
            //     extractState: () => state
            // })(api)(next)(action);

            // expect(timer.onRemove).toHaveBeenNthCalledWith(1,
            //     expect.arrayContaining(state.spellActionSnapshotList.slice(1)),
            //     '-hash-current-'
            // );
        });
    });

    describe('on confirm action', () => {

        it('should return confirm action', async () => {

            const { futureCharacter, spell, api, next, timer, state } = init();

            state.spellActionSnapshotList.push(
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now,
                    duration: 1000,
                })
            );

            const action = ReceiveMessageAction({
                type: 'confirm',
                isOk: true,
                lastCorrectHash: '',
                sendTime: -1
            });

            const p = spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-future-',
                extractCurrentHash: () => '-hash-current-',
                extractState: () => state
            })(api)(next)(action);

            expect(next).toHaveBeenNthCalledWith(1, action);

            await p;
        });

        it('should not dispatch on OK', async () => {

            const { futureCharacter, spell, api, next, timer, state } = init();

            state.spellActionSnapshotList.push(
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now,
                    duration: 1000,
                })
            );

            const action = ReceiveMessageAction({
                type: 'confirm',
                isOk: true,
                lastCorrectHash: '',
                sendTime: -1
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-future-',
                extractCurrentHash: () => '-hash-current-',
                extractState: () => state
            })(api)(next)(action);

            expect(api.dispatch).not.toHaveBeenCalled();
        });

        it('should dispatch spell cancel on KO', async () => {

            const { futureCharacter, spell, api, next, timer, state } = init();

            state.spellActionSnapshotList.push(
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now,
                    duration: 1000,
                }),
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now + 1000,
                    duration: 1000,
                }),
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now + 2000,
                    duration: 1000,
                })
            );

            await timerTester.advanceBy(1200);

            const action = ReceiveMessageAction({
                type: 'confirm',
                isOk: false,
                lastCorrectHash: '-correct-hash-',
                correctBattleSnapshot: {
                    battleHash: '',
                    charactersSnapshots: [],
                    spellsSnapshots: []
                },
                sendTime: -1
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-future-',
                extractCurrentHash: () => '-hash-current-',
                extractState: () => state
            })(api)(next)(action);

            expect(api.dispatch).toHaveBeenNthCalledWith(1, SpellActionCancelAction({
                spellActionSnapshotsValids: state.spellActionSnapshotList.slice(0, 1),
                correctBattleSnapshot: expect.anything()
            }));
        });

        it('should notify timer of removed snapshots and correct hash', async () => {

            const { futureCharacter, spell, api, next, timer, state } = init();

            state.spellActionSnapshotList.push(
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now,
                    duration: 1000,
                }),
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now + 1000,
                    duration: 1000,
                }),
                seedSpellActionSnapshot('s1', {
                    startTime: timerTester.now + 2000,
                    duration: 1000,
                })
            );

            await timerTester.advanceBy(1200);

            const action = ReceiveMessageAction({
                type: 'confirm',
                isOk: false,
                lastCorrectHash: '-correct-hash-',
                correctBattleSnapshot: {
                    battleHash: '',
                    charactersSnapshots: [],
                    spellsSnapshots: []
                },
                sendTime: -1
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-future-',
                extractCurrentHash: () => '-hash-current-',
                extractState: () => state
            })(api)(next)(action);

            expect(timer.onRemove).toHaveBeenNthCalledWith(1,
                expect.arrayContaining(state.spellActionSnapshotList.slice(1)),
                '-correct-hash-'
            );
        });
    });

    describe('on notify action', () => {

        it('should dispatch launch action with spell action', async () => {
            const { futureCharacter, spell, api, next, timer, state } = init();

            const snapshot = seedSpellActionSnapshot(futureCharacter.staticData.staticSpells[ 0 ].id, {
                startTime: timerTester.now,
                duration: 200,
                battleHash: '-hash-',
                characterId: futureCharacter.id,
            });

            const action = ReceiveMessageAction({
                type: 'notify',
                sendTime: -1,
                spellActionSnapshot: snapshot
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-',
                extractCurrentHash: () => '-hash-',
                extractState: () => state
            })(api)(next)(action);

            expect(api.dispatch).toHaveBeenCalledWith(
                SpellActionLaunchAction({
                    spellActList: [ {
                        startTime: snapshot.startTime,
                        spellAction: {
                            spell: expect.objectContaining<Partial<Spell<'future'>>>({
                                id: snapshot.spellId,
                            }),
                            position: snapshot.position,
                            actionArea: snapshot.actionArea
                        }
                    } ]
                })
            );
        });

        it.skip('should dispatch commit', () => {
            // const { futureCharacter, spell, api, next, timer, state } = init();

            // const snapshot = seedSpellActionSnapshot(futureCharacter.staticData.staticSpells[ 0 ].id, {
            //     startTime: timerTester.now,
            //     duration: 200,
            //     battleHash: '-hash-',
            //     characterId: futureCharacter.id,
            // });

            // const action = ReceiveMessageAction({
            //     type: 'notify',
            //     sendTime: -1,
            //     spellActionSnapshot: snapshot
            // });

            // spellActionMiddleware({
            //     createSpellActionTimer: () => () => timer,
            //     extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
            //     extractFutureSpells: () => ({ [ spell.id ]: spell }),
            //     extractFutureHash: () => '-hash-',
            //     extractCurrentHash: () => '-hash-',
            //     extractState: () => state
            // })(api)(next)(action);

            // expect(api.dispatch).toHaveBeenCalledWith(BattleCommitAction({
            //     time: expect.any(Number),
            //     charactersPositionList: [ futureCharacter.position ]
            // }));
        });

        it('should notify timer', async () => {
            const { futureCharacter, spell, api, next, timer, state } = init();

            const snapshot = seedSpellActionSnapshot(futureCharacter.staticData.staticSpells[ 0 ].id, {
                startTime: timerTester.now,
                duration: 200,
                battleHash: '-hash-',
                characterId: futureCharacter.id,
            });

            const action = ReceiveMessageAction({
                type: 'notify',
                sendTime: -1,
                spellActionSnapshot: snapshot
            });

            await spellActionMiddleware({
                createSpellActionTimer: () => () => timer,
                extractFutureCharacters: () => ({ [ futureCharacter.id ]: futureCharacter }),
                extractFutureSpells: () => ({ [ spell.id ]: spell }),
                extractFutureHash: () => '-hash-',
                extractCurrentHash: () => '-hash-',
                extractState: () => state
            })(api)(next)(action);

            expect(timer.onAdd).toHaveBeenNthCalledWith(1, snapshot.startTime, true);
        });
    });
});
