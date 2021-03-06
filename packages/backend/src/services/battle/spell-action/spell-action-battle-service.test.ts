import { createPosition, SpellAction } from '@timeflies/common';
import { BattleNotifyMessage, BattleSpellActionMessage } from '@timeflies/socket-messages';
import { SpellEffect } from '@timeflies/spell-effects';
import { createFakeGlobalEntitiesNoService, createFakeSocketCell } from '../../service-test-utils';
import { createFakeBattle } from '../battle-service-test-utils';
import { SpellActionBattleService } from './spell-action-battle-service';

describe('spell action battle service', () => {

    describe('on spell-action message', () => {
        it('throw error if player not in battle', async () => {

            const socketCell = createFakeSocketCell();
            const battle = createFakeBattle();
            const service = new SpellActionBattleService(createFakeGlobalEntitiesNoService(undefined, battle));

            service.onSocketConnect(socketCell, 'p10');

            const listener = socketCell.getFirstListener(BattleSpellActionMessage);

            await expect(listener(BattleSpellActionMessage({
                spellAction: {
                    checksum: battle.getCurrentState().checksum,
                    spellId: 's1',
                    duration: 1,
                    launchTime: 1,
                    targetPos: createPosition(0, 0)
                }
            }).get(), socketCell.send)).rejects.toBeDefined();
        });

        const getDefaultEntities = () => {
            const socketCell = createFakeSocketCell();
            const battle = createFakeBattle();
            const service = new SpellActionBattleService(createFakeGlobalEntitiesNoService(undefined, battle));

            service.onSocketConnect(socketCell, 'p1');

            const spellActionListener = socketCell.getFirstListener(BattleSpellActionMessage);

            const socketCellP2 = createFakeSocketCell();
            const socketCellP3 = createFakeSocketCell();

            service.onSocketConnect(socketCellP2, 'p2');
            service.onSocketConnect(socketCellP3, 'p3');

            return { socketCell, battle, service, spellActionListener, socketCellP2, socketCellP3 };
        };

        describe('on wrong spell-action', () => {

            it('do not change battle state stack', async () => {

                const { spellActionListener, battle, socketCell } = getDefaultEntities();

                await spellActionListener(BattleSpellActionMessage({
                    spellAction: {
                        checksum: 'wrong-checksum',
                        spellId: 's1',
                        duration: 1,
                        launchTime: 1,
                        targetPos: createPosition(1, 0)
                    }
                }).get(), socketCell.send);

                expect(battle.addNewState).not.toHaveBeenCalled();
            });

            it('response with fail & last state', async () => {

                const { spellActionListener, battle, socketCell } = getDefaultEntities();

                await spellActionListener(BattleSpellActionMessage({
                    spellAction: {
                        checksum: 'wrong-checksum',
                        spellId: 's1',
                        duration: 1,
                        launchTime: 1,
                        targetPos: createPosition(1, 0)
                    }
                }).get(), socketCell.send);

                expect(socketCell.send).toHaveBeenCalledWith(BattleSpellActionMessage.createResponse(expect.any(String), {
                    success: false,
                    lastState: battle.getCurrentState()
                }));
            });

        });

        describe('on correct spell-action', () => {

            it('add new state to battle state stack', async () => {

                const { spellActionListener, battle, socketCell } = getDefaultEntities();

                const previousChecksum = battle.getCurrentState().checksum;

                await spellActionListener(BattleSpellActionMessage({
                    spellAction: {
                        checksum: previousChecksum,
                        spellId: 's1',
                        duration: 1,
                        launchTime: 1,
                        targetPos: createPosition(0, 0)
                    }
                }).get(), socketCell.send);

                expect(battle.addNewState).toHaveBeenCalled();
            });

            it('response with success', async () => {

                const { spellActionListener, battle, socketCell } = getDefaultEntities();

                await spellActionListener(BattleSpellActionMessage({
                    spellAction: {
                        checksum: battle.getCurrentState().checksum,
                        spellId: 's1',
                        duration: 1,
                        launchTime: 1,
                        targetPos: createPosition(0, 0)
                    }
                }).get(), socketCell.send);

                expect(socketCell.send).toHaveBeenCalledWith(BattleSpellActionMessage.createResponse(expect.any(String), {
                    success: true
                }));
            });

            it('send notify message to others players', async () => {

                const { spellActionListener, battle, socketCell: socketCellP1, socketCellP2, socketCellP3 } = getDefaultEntities();

                const spellAction: SpellAction = {
                    checksum: battle.getCurrentState().checksum,
                    spellId: 's1',
                    duration: 1,
                    launchTime: 1,
                    targetPos: createPosition(0, 0)
                };

                await spellActionListener(BattleSpellActionMessage({
                    spellAction
                }).get(), socketCellP1.send);

                for (const socketCell of [ socketCellP2, socketCellP3 ]) {
                    expect(socketCell.send).toHaveBeenCalledWith(BattleNotifyMessage({
                        spellAction,
                        spellEffect: expect.objectContaining<SpellEffect>({
                            actionArea: expect.any(Array),
                            duration: expect.any(Number)
                        })
                    }));
                }

                expect(socketCellP1.send).not.toHaveBeenCalledWith(BattleNotifyMessage(expect.anything()));
            });

            it('send messages in correct order: notify, response, then the rest', async () => {

                const { spellActionListener, battle, socketCell, socketCellP2 } = getDefaultEntities();

                const callOrder: string[] = [];

                socketCell.send = jest.fn(message => callOrder.push(message.action));
                socketCellP2.send = jest.fn(message => callOrder.push(message.action));
                battle.addNewState = jest.fn((): any => callOrder.push('new-state'));

                const spellAction: SpellAction = {
                    checksum: battle.getCurrentState().checksum,
                    spellId: 's1',
                    duration: 1,
                    launchTime: 1,
                    targetPos: createPosition(0, 0)
                };

                await spellActionListener(BattleSpellActionMessage({
                    spellAction
                }).get(), socketCell.send);

                expect(callOrder).toEqual([
                    BattleNotifyMessage.action,
                    BattleSpellActionMessage.action,
                    'new-state'
                ]);
            });
        });
    });

});
