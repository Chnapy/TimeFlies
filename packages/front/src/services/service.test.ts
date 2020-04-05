import { StoreTest } from '../StoreTest';
import { serviceBattleData } from './serviceBattleData';
import { serviceCurrentPlayer } from './serviceCurrentPlayer';
import { serviceDispatch } from './serviceDispatch';
import { NotifyDeathsAction } from '../stages/battle/cycle/CycleManager';
import { SpellActionTimerEndAction } from '../stages/battle/spellAction/SpellActionTimer';
import { serviceEvent } from './serviceEvent';
import { ReceiveMessageAction, SendMessageAction } from '../socket/WSClient';
import { ConfirmSAction, NotifySAction, SpellActionCAction, SetIDCAction } from '@timeflies/shared';
import { serviceNetwork } from './serviceNetwork';
import { serviceSelector } from './serviceSelector';

describe('services', () => {

    beforeEach(() => {
        StoreTest.beforeTest();
    });

    afterEach(() => {
        StoreTest.afterTest();
    });

    it('serviceSelector should return the correct data', () => {

        const data = {
            state: 'battle',
            battleData: {
                cycle: null as any,
                current: null as any,
                future: null as any
            }
        };

        StoreTest.initStore({ data: data as any });

        expect(serviceSelector(state => state.data)).toEqual(data);
    });

    it('serviceBattleData should work only on battle context', () => {

        StoreTest.initStore({
            data: {
                state: 'boot',
                battleData: {
                    cycle: {}
                }
            }
        });

        expect(() => serviceBattleData('cycle')).toThrowError();
    });

    it('serviceBattleData should return the correct battle data', () => {

        const cycle = {
            launchTime: -1
        };
        const current = {
            sample: 2
        };
        const future = {
            other: ''
        };

        StoreTest.initStore({
            data: {
                state: 'battle',
                battleData: {
                    cycle: cycle as any,
                    current: current as any,
                    future: future as any
                }
            }
        });

        expect(serviceBattleData('cycle')).toEqual(cycle);
        expect(serviceBattleData('current')).toEqual(current);
        expect(serviceBattleData('future')).toEqual(future);
    });

    it('serviceCurrentPlayer should return current player data if exist', () => {

        StoreTest.initStore({
            currentPlayer: null,
            data: {} as any
        });

        expect(serviceCurrentPlayer()).toBeNull();

        const currentPlayer = {
            id: 'id',
            name: 'name'
        };

        StoreTest.initStore({
            currentPlayer,
            data: {} as any
        });

        expect(serviceCurrentPlayer()).toEqual(currentPlayer);
    });

    it('serviceDispatch should dispatch any given action', () => {

        StoreTest.initStore({
            data: {} as any
        });

        const { dispatchNotifyDeaths, dispatchSpellActionEnd } = serviceDispatch({
            dispatchNotifyDeaths: (): NotifyDeathsAction => ({
                type: 'battle/notify-deaths'
            }),
            dispatchSpellActionEnd: (): SpellActionTimerEndAction => ({
                type: 'battle/spell-action/end',
                removed: false,
                correctHash: ''
            })
        });

        expect(StoreTest.getActions()).toHaveLength(0);

        dispatchNotifyDeaths();

        expect(StoreTest.getActions()).toEqual<[ NotifyDeathsAction ]>([ {
            type: 'battle/notify-deaths'
        } ]);

        StoreTest.clearActions();

        dispatchSpellActionEnd();

        expect(StoreTest.getActions()).toEqual<[ SpellActionTimerEndAction ]>([ {
            type: 'battle/spell-action/end',
            removed: false,
            correctHash: ''
        } ]);
    });

    it('serviceEvent should add correct action listener', () => {

        const { onAction } = serviceEvent();

        const notifyDeathsFn = jest.fn();
        const spellActionEndFn = jest.fn();

        onAction<NotifyDeathsAction>('battle/notify-deaths', notifyDeathsFn);
        onAction<SpellActionTimerEndAction>('battle/spell-action/end', spellActionEndFn);

        const { dispatchNotifyDeaths, dispatchSpellActionEnd } = serviceDispatch({
            dispatchNotifyDeaths: (): NotifyDeathsAction => ({
                type: 'battle/notify-deaths'
            }),
            dispatchSpellActionEnd: (): SpellActionTimerEndAction => ({
                type: 'battle/spell-action/end',
                removed: false,
                correctHash: ''
            })
        });

        dispatchNotifyDeaths();

        expect(notifyDeathsFn).toHaveBeenNthCalledWith<[ NotifyDeathsAction ]>(1, {
            type: 'battle/notify-deaths'
        });

        dispatchSpellActionEnd();

        expect(spellActionEndFn).toHaveBeenNthCalledWith<[ SpellActionTimerEndAction ]>(1, {
            type: 'battle/spell-action/end',
            removed: false,
            correctHash: ''
        });
    });

    it('serviceEvent should add correct message listener', () => {

        const { onMessageAction } = serviceEvent();

        const confirmFn = jest.fn();
        const notifyFn = jest.fn();

        onMessageAction<ConfirmSAction>('confirm', confirmFn);
        onMessageAction<NotifySAction>('notify', notifyFn);

        const { dispatchNotifyDeaths, dispatchSpellActionEnd } = serviceDispatch({
            dispatchNotifyDeaths: (): ReceiveMessageAction<ConfirmSAction> => ({
                type: 'message/receive',
                message: {
                    type: 'confirm',
                    sendTime: -1,
                    isOk: true,
                    lastCorrectHash: ''
                }
            }),
            dispatchSpellActionEnd: (): ReceiveMessageAction<NotifySAction> => ({
                type: 'message/receive',
                message: {
                    type: 'notify',
                    sendTime: -1,
                    spellActionSnapshot: null as any
                }
            })
        });

        dispatchNotifyDeaths();

        expect(confirmFn).toHaveBeenNthCalledWith<[ ConfirmSAction ]>(1, {
            type: 'confirm',
            sendTime: -1,
            isOk: true,
            lastCorrectHash: ''
        });

        dispatchSpellActionEnd();

        expect(notifyFn).toHaveBeenNthCalledWith<[ NotifySAction ]>(1, {
            type: 'notify',
            sendTime: -1,
            spellActionSnapshot: null as any
        });
    });

    it('serviceNetwork should send correct message action', async () => {

        const { sendSpellAction, sendSetID } = await serviceNetwork({
            sendSpellAction: (): SpellActionCAction => ({
                type: 'battle/spellAction',
                sendTime: -1,
                spellAction: {} as any
            }),
            sendSetID: (): SetIDCAction => ({
                type: 'set-id',
                sendTime: -1,
                id: ''
            })
        });

        expect(StoreTest.getActions()).toHaveLength(0);

        sendSpellAction();

        expect(StoreTest.getActions()).toEqual<[ SendMessageAction<SpellActionCAction> ]>([ {
            type: 'message/send',
            message: {
                type: 'battle/spellAction',
                [ 'sendTime' as any ]: -1,
                spellAction: {} as any
            }
        } ]);

        StoreTest.clearActions();

        sendSetID();

        expect(StoreTest.getActions()).toEqual<[ SendMessageAction<SetIDCAction> ]>([ {
            type: 'message/send',
            message: {
                type: 'set-id',
                [ 'sendTime' as any ]: -1,
                id: ''
            }
        } ]);
    });

    it.todo('serviceEvent should remove listener on returned function call');
});