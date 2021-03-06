import { ArrayUtils } from '@timeflies/common';
import { BattleEndMessage } from '@timeflies/socket-messages';
import { createFakeGlobalEntitiesNoService, createFakeSocketCell } from '../../service-test-utils';
import { createFakeBattle } from '../battle-service-test-utils';
import { EndBattleService } from './end-battle-service';

describe('end battle service', () => {

    describe('is battle ended function', () => {
        it('does not consider battle as ended if remaining at least 2 teams alive', () => {
            const battle = createFakeBattle();
            const globalEntitiesNoServices = createFakeGlobalEntitiesNoService(undefined, battle);
            const service = new EndBattleService(globalEntitiesNoServices);

            expect(service.isBattleEnded({
                characters: {
                    health: { c1: 0, c2: 100, c3: 100 },
                } as any
            }, battle.staticState)).toEqual(null);
        });

        it('consider battle as ended if remaining only 1 team alive', () => {
            const battle = createFakeBattle();
            const globalEntitiesNoServices = createFakeGlobalEntitiesNoService(undefined, battle);
            const service = new EndBattleService(globalEntitiesNoServices);

            expect(service.isBattleEnded({
                characters: {
                    health: { c1: 0, c2: 100, c3: 0 },
                } as any
            }, battle.staticState)).toEqual('#00FF00');
        });
    });

    describe('on battle end', () => {
        it('send end-battle message to every players', () => {
            const battle = createFakeBattle();
            const globalEntitiesNoServices = createFakeGlobalEntitiesNoService(undefined, battle);
            const service = new EndBattleService(globalEntitiesNoServices);

            const playerList = ArrayUtils.range(3).map(i => {
                const socketCell = createFakeSocketCell();
                const playerId = 'p' + i;
                service.onSocketConnect(socketCell, playerId);
                return { socketCell, playerId };
            });

            service.onBattleEnd('#00FF00', 12, new Set(playerList.map(p => p.playerId)));

            for (const { socketCell } of playerList) {
                expect(socketCell.send).toHaveBeenCalledWith(BattleEndMessage({
                    winnerTeamColor: '#00FF00',
                    endTime: 12
                }));
            }
        });

        it('remove players from global battle map', () => {
            const battle = createFakeBattle();
            const globalEntitiesNoServices = createFakeGlobalEntitiesNoService(undefined, battle);
            const service = new EndBattleService(globalEntitiesNoServices);

            const playerList = ArrayUtils.range(3).map(i => {
                const socketCell = createFakeSocketCell();
                const playerId = 'p' + i;
                service.onSocketConnect(socketCell, playerId);
                return { socketCell, playerId };
            });

            service.onBattleEnd('#00FF00', 12, new Set(playerList.map(p => p.playerId)));

            for (const { playerId } of playerList) {
                expect(globalEntitiesNoServices.currentBattleMap.mapByPlayerId[ playerId ]).toBeUndefined();
            }
        });
    });
});
