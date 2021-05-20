import { PlayerId } from '@timeflies/common';
import { BattleLoadMessage } from '@timeflies/socket-messages';
import { SocketCell } from '@timeflies/socket-server';
import { Service } from '../../service';

export class JoinBattleService extends Service {
    afterSocketConnect = (socketCell: SocketCell, currentPlayerId: PlayerId) => {
        this.addBattleLoadMessageListener(socketCell, currentPlayerId);
    };

    private addBattleLoadMessageListener = (socketCell: SocketCell, currentPlayerId: PlayerId) => socketCell.addMessageListener<typeof BattleLoadMessage>(BattleLoadMessage, ({ payload, requestId }) => {
        const battle = this.getBattleById(payload.battleId);

        const { staticPlayers, staticCharacters, staticSpells, getCurrentState, getMapInfos, getCycleInfos } = battle;

        battle.playerJoin(currentPlayerId);

        return BattleLoadMessage.createResponse(requestId, {
            tiledMapInfos: getMapInfos('toFrontend'),
            staticPlayers,
            staticCharacters,
            staticSpells,
            initialSerializableState: getCurrentState(),
            cycleInfos: getCycleInfos(),

            myPlayerId: currentPlayerId
        });
    });
}