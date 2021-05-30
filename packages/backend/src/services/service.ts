import { PlayerId } from '@timeflies/common';
import { Message, RoomStateMessage } from '@timeflies/socket-messages';
import { SocketCell, SocketError } from '@timeflies/socket-server';
import { GlobalEntitiesNoServices } from '../main/global-entities';
import { BattleId } from './battle/battle';
import { Room, RoomId } from './room/room';

export type PlayerSocketMap = { [ playerId in PlayerId ]: SocketCell };

export abstract class Service {

    protected globalEntitiesNoServices: GlobalEntitiesNoServices;
    protected playerSocketMap: PlayerSocketMap = {};

    constructor(globalEntitiesNoServices: GlobalEntitiesNoServices) {
        this.globalEntitiesNoServices = globalEntitiesNoServices;
    }

    protected abstract afterSocketConnect(socketCell: SocketCell, currentPlayerId: PlayerId): void;

    protected getRoomById = (roomId: RoomId) => {
        const room = this.globalEntitiesNoServices.currentRoomMap.mapById[ roomId ];
        if (!room) {
            throw new SocketError(400, 'room id does not exist: ' + roomId);
        }

        return room;
    };

    protected getRoomByPlayerId = (playerId: PlayerId) => {
        const room = this.globalEntitiesNoServices.currentRoomMap.mapByPlayerId[ playerId ];
        if (!room) {
            throw new SocketError(400, 'player is not in room: ' + playerId);
        }

        return room;
    };

    protected getBattleById = (battleId: BattleId) => {
        const battle = this.globalEntitiesNoServices.currentBattleMap.mapById[ battleId ];
        if (!battle) {
            throw new SocketError(400, 'battle id does not exist: ' + battleId);
        }

        return battle;
    };

    protected getBattleByPlayerId = (playerId: PlayerId) => {
        const battle = this.globalEntitiesNoServices.currentBattleMap.mapByPlayerId[ playerId ];
        if (!battle) {
            throw new SocketError(400, 'player is not in battle: ' + playerId);
        }

        return battle;
    };

    protected sendRoomStateToEveryPlayersExcept = (currentPlayerId: PlayerId) => {
        const room = this.getRoomByPlayerId(currentPlayerId);

        this.sendToEveryPlayersExcept(
            RoomStateMessage(room.getRoomStateData()),
            room,
            currentPlayerId
        );
    };

    protected sendToEveryPlayersExcept = <M extends Message<any>>(message: M, room: Room, currentPlayerId?: PlayerId) => {
        room.getRoomStateData().staticPlayerList
            .filter(player => player.playerId !== currentPlayerId)
            .forEach(player => {
                const cell = this.playerSocketMap[ player.playerId ];
                cell.send(message);
            });
    };

    onSocketConnect = (socketCell: SocketCell, currentPlayerId: PlayerId) => {
        this.playerSocketMap[ currentPlayerId ] = socketCell;
        socketCell.addDisconnectListener(() => {
            delete this.playerSocketMap[ currentPlayerId ];
        });

        this.afterSocketConnect(socketCell, currentPlayerId);
    };
};
