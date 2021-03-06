import { MiddlewareAPI } from '@reduxjs/toolkit';
import { Normalized, TimerTester, TURN_DELAY } from '@timeflies/shared';
import { ReceiveMessageAction } from '../../../socket/wsclient-actions';
import { BattleStartAction } from '../battle-actions';
import { BattleStateTurnEndAction, BattleStateTurnStartAction } from '../battleState/battle-state-actions';
import { Character } from '../entities/character/Character';
import { seedCharacter } from '../entities/character/Character.seed';
import { NotifyDeathsAction } from './cycle-manager-actions';
import { cycleMiddleware } from './cycle-middleware';
import { CycleState } from './cycle-reducer';
import { waitTimeoutPool } from '../../../wait-timeout-pool';

describe('# cycle-middleware', () => {

    const timerTester = new TimerTester();

    beforeEach(() => {
        timerTester.beforeTest();
    });

    afterEach(() => {
        timerTester.afterTest();
    });

    const killPromises = (...promises: Promise<any>[]) => {
        waitTimeoutPool.setPoolEnable(false);

        return Promise.all([
            waitTimeoutPool.clearAll(),
            ...promises
        ]);
    };

    const triggerPromisesWorkaround = async () => {
        await timerTester.advanceBy(0);
        await timerTester.advanceBy(0);
        await timerTester.advanceBy(0);
        await timerTester.advanceBy(0);
    };

    describe('on battle start', () => {

        it('should dispatch turn start action after some times', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1'
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2'
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: -1,
                globalTurnOrder: [],
                globalTurnStartTime: -1,
                turnId: -1,
                currentCharacterId: '',
                turnStartTime: -1,
                turnDuration: -1
            };

            const startTime = timerTester.now + 1000;

            const action = BattleStartAction({
                globalTurnSnapshot: {
                    id: 1,
                    startTime,
                    order: [ '1', '2' ],
                    currentTurn: {
                        id: 1,
                        startTime,
                        characterId: '1'
                    }
                }
            } as BattleStartAction[ 'payload' ]);

            const p = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next)(action);

            expect(api.dispatch).not.toHaveBeenCalled();

            await timerTester.advanceBy(1050);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnStartAction({
                turnSnapshot: action.payload.globalTurnSnapshot.currentTurn,
                currentCharacter: expect.objectContaining<Partial<Character<'current'>>>({
                    id: '1'
                })
            }));

            await killPromises(p);
        });
    })

    describe('on turn start message', () => {

        it('should update current turn if same id', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2'
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2' ],
                globalTurnStartTime: timerTester.now,
                turnId: 1,
                currentCharacterId: '1',
                turnStartTime: timerTester.now,
                turnDuration: 1000
            };

            const action = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState: {
                    id: 1,
                    characterId: '1',
                    startTime: timerTester.now - 200,
                    duration: 1000
                }
            });

            const p = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next)(action);

            expect(api.dispatch).not.toHaveBeenCalled();

            await timerTester.advanceBy(850);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnEndAction());

            await killPromises(p);
        });

        it('should start it now if no current turn', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2'
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2' ],
                globalTurnStartTime: timerTester.now - 1100,
                turnId: 1,
                currentCharacterId: '1',
                turnStartTime: timerTester.now - 1100,
                turnDuration: 1000
            };

            const turnState = {
                id: 2,
                characterId: '2',
                startTime: timerTester.now,
                duration: 1000
            };

            const action = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState
            });

            const p = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next)(action);

            await timerTester.advanceBy(5);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnStartAction({
                turnSnapshot: turnState,
                currentCharacter: expect.anything()
            }));

            await killPromises(p);
        });

        it('should add to queue if future, then start it at good time', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2'
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2' ],
                globalTurnStartTime: -1,
                turnId: -1,
                currentCharacterId: '',
                turnStartTime: -1,
                turnDuration: -1
            };

            const middleware = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next);

            const action1 = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState: {
                    id: 1,
                    characterId: '1',
                    startTime: timerTester.now,
                    duration: 1000
                }
            });

            // required for creating timeout
            const p1 = middleware(action1);

            initialState.turnId = 1;
            initialState.currentCharacterId = '1';

            const turnState = {
                id: 2,
                characterId: '2',
                startTime: timerTester.now + 1100,
                duration: 1000
            };

            const action2 = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState
            });

            const p2 = middleware(action2);

            expect(api.dispatch).not.toHaveBeenCalled();

            await timerTester.advanceBy(1150);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnStartAction({
                turnSnapshot: turnState,
                currentCharacter: expect.anything()
            }));

            await killPromises(p1, p2);
        });

        it('should end after some time, then start a new turn', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2',
                    features: {
                        actionTime: 1000,
                    }
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2' ],
                globalTurnStartTime: timerTester.now - 1100,
                turnId: 1,
                currentCharacterId: '1',
                turnStartTime: timerTester.now - 1100,
                turnDuration: 1000
            };

            const action = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState: {
                    id: 2,
                    characterId: '2',
                    startTime: timerTester.now,
                    duration: 1000
                }
            });

            const p = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next)(action);

            initialState.turnId++;
            initialState.currentCharacterId = '2';

            await timerTester.advanceBy(1050);

            await triggerPromisesWorkaround();

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnEndAction());

            await timerTester.advanceBy(TURN_DELAY);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnStartAction({
                turnSnapshot: {
                    id: 3,
                    characterId: '1',
                    startTime: expect.any(Number),
                    duration: 1000
                },
                currentCharacter: expect.anything()
            }));

            await killPromises(p);
        });

        it('should ignore dead characters', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '3': seedCharacter({
                    period: 'current',
                    id: '3',
                    features: {
                        actionTime: 1000,
                        life: 0
                    }
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2', '3' ],
                globalTurnStartTime: timerTester.now - 1100,
                turnId: 1,
                currentCharacterId: '1',
                turnStartTime: timerTester.now - 1100,
                turnDuration: 1000
            };

            const action = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState: {
                    id: 2,
                    characterId: '2',
                    startTime: timerTester.now,
                    duration: 1000
                }
            });

            const p = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next)(action);

            initialState.turnId++;
            initialState.currentCharacterId = '2';

            await timerTester.advanceBy(1050);

            await triggerPromisesWorkaround();

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnEndAction());

            await timerTester.advanceBy(TURN_DELAY);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnStartAction({
                turnSnapshot: {
                    id: 3,
                    characterId: '1',
                    startTime: expect.any(Number),
                    duration: 1000
                },
                currentCharacter: expect.anything()
            }));

            await killPromises(p);
        });
    });

    describe('on notify deaths', () => {

        it('should end current turn if character died', async () => {

            const currentCharacters: Normalized<Character<'current'>> = {
                '1': seedCharacter({
                    period: 'current',
                    id: '1',
                    features: {
                        actionTime: 1000,
                    }
                }),
                '2': seedCharacter({
                    period: 'current',
                    id: '2',
                    features: {
                        actionTime: 1000,
                    }
                })
            };

            const api: MiddlewareAPI = {
                dispatch: jest.fn(),
                getState: jest.fn()
            };

            const next = jest.fn();

            const initialState: CycleState = {
                globalTurnId: 1,
                globalTurnOrder: [ '1', '2' ],
                globalTurnStartTime: timerTester.now - 1100,
                turnId: 1,
                currentCharacterId: '1',
                turnStartTime: timerTester.now - 1100,
                turnDuration: 1000
            };

            const action = ReceiveMessageAction({
                type: 'battle-run/turn-start',
                sendTime: -1,
                turnState: {
                    id: 2,
                    characterId: '2',
                    startTime: timerTester.now,
                    duration: 1000
                }
            });

            const middleware = cycleMiddleware({
                extractState: () => initialState,
                extractCurrentCharacters: () => currentCharacters
            })(api)(next);

            const p1 = middleware(action);

            initialState.turnId++;
            initialState.currentCharacterId = '2';

            await timerTester.advanceBy(50);

            currentCharacters[ '2' ].features.life = 0;

            const p2 = middleware(NotifyDeathsAction());

            await timerTester.advanceBy(50);

            expect(api.dispatch).toHaveBeenCalledWith(BattleStateTurnEndAction());

            await killPromises(p1, p2);
        });
    });
});
