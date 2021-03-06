import { BRunEndSAction, BRunLaunchSAction, characterIsAlive, denormalize, PromisePayload, playerEntityToSnapshot, SpellActionCAction, teamEntityToSnapshot } from '@timeflies/shared';
import { WSSocket } from '../../transport/ws/WSSocket';
import { IPlayerRoomData } from '../room/room';
import { RoomState } from '../room/room-state-manager';
import { BattleStateManager } from './battleStateManager/BattleStateManager';
import { Cycle } from "./cycle/Cycle";
import { Team } from "./entities/team/Team";
import { MapManager } from "./mapManager/MapManager";
import { SpellActionReceiver } from './spellActionReceiver/SpellActionReceiver';

const LAUNCH_DELAY = 5000; // TODO use config system

type RoomKeys = keyof Pick<RoomState, 'id' | 'playerList' | 'teamList' | 'mapSelected'>;

export type RoomStateReady = {
    [ K in RoomKeys ]: Exclude<RoomState[ K ], null>;
} & {
    playerDataList: IPlayerRoomData<WSSocket>[];
};

export type BattleRunRoom = PromisePayload<ReturnType<typeof BattleRunRoom>>;

type Dependencies = {
    createMapManager: typeof MapManager;
};

export const BattleRunRoom = async (
    { mapSelected, teamList: teamRoomList, playerDataList, playerList: playerRoomList }: RoomStateReady,
    onBattleEnd: () => void,
    { createMapManager }: Dependencies = { createMapManager: MapManager }
) => {

    const mapManager = await createMapManager(mapSelected.config);

    const stateManager = BattleStateManager(
        mapManager,
        playerDataList,
        teamRoomList,
        playerRoomList
    );

    const { playerList, teamList, get } = stateManager;

    const start = (): void => {
        const launchTime = Date.now() + LAUNCH_DELAY;

        const battleSnapshot = stateManager.generateFirstSnapshot(launchTime);

        cycle.start(launchTime);

        const launchAction: Omit<BRunLaunchSAction, 'sendTime'> = {
            type: 'battle-run/launch',
            teamSnapshotList: teamList.map(teamEntityToSnapshot),
            playerSnapshotList: playerList.map(playerEntityToSnapshot),
            battleSnapshot,
            globalTurnState: cycle.globalTurn.toSnapshot()
        };

        playerList.forEach(p => p.socket.send<BRunLaunchSAction>(launchAction));

        playerList.forEach(p => {
            p.socket.on<SpellActionCAction>('battle/spellAction', spellActionReceiver.getOnReceive(p));
        });
    };

    const checkDeathsAndDisconnects = () => {
        const charactersAlivePlayerIds = denormalize(get('characters'))
            .filter(characterIsAlive)
            .map(c => c.playerId);

        const connectedPlayerTeamIds = playerList
            .filter(p => p.socket.isConnected())
            .filter(p => charactersAlivePlayerIds.includes(p.id))
            .map(p => p.teamId);

        const remainingTeams = new Set(connectedPlayerTeamIds);

        if (remainingTeams.size === 1) {
            const { value } = remainingTeams.values().next();
            const teamWinner = teamList.find(t => t.id === value)!;

            endBattle(teamWinner);
        }
    };

    const endBattle = (team: Team): void => {
        cycle.stop();
        playerList.forEach(p => p.socket.send<BRunEndSAction>({
            type: 'battle-run/end',
            winnerTeamId: team.id
        }));
        playerList.forEach(p => p.socket.close());

        onBattleEnd();

        console.log('\n---');
        console.log(`Battle ended. Team ${team.letter} wins !`);
        console.log('---\n');
    };

    const cycle = Cycle(playerList, get);

    const spellActionReceiver = SpellActionReceiver({
        stateManager,
        cycle,
        mapManager,
        checkDeathsAndDisconnects
    });

    playerList.forEach(p => p.socket.onDisconnect(() => {
        console.log('Player disconnect:', p.id, p.socket.isConnected());
        checkDeathsAndDisconnects();
    }));

    return {
        start
    };
};
