import { CharacterId, createId, ObjectTyped, PlayerId, Position, WaitCancelableState, waitCanceleable } from '@timeflies/common';
import { MapInfos, MapPlacementTiles, RoomStateData, RoomStaticCharacter, RoomStaticPlayer } from '@timeflies/socket-messages';
import { Layer, Tile } from '@timeflies/tilemap-utils';
import fs from 'fs';
import type TiledMap from 'tiled-types';
import util from 'util';
import { GlobalEntities } from '../../main/global-entities';
import { assetUrl } from '../../utils/asset-url';
import { Battle, BattleId, BattlePayload, createBattle } from '../battle/battle';

export type RoomId = string;

export type Room = {
    roomId: RoomId;

    getRoomStateData: () => RoomStateData;

    playerJoin: (playerInfos: RoomStaticPlayer) => void;
    playerReady: (playerId: PlayerId, ready: boolean) => void;
    playerLeave: (playerId: PlayerId) => void;
    teamJoin: (playerId: PlayerId, teamColor: string | null) => void;
    characterSelect: (staticCharacter: RoomStaticCharacter) => void;
    characterRemove: (characterId: CharacterId) => void;
    characterPlacement: (characterId: CharacterId, position: Position | null) => void;
    mapSelect: (mapInfos: MapInfos) => Promise<void>;
    waitForBattle: () => Promise<WaitCancelableState[ 'state' ]>;
    createBattle: () => Promise<Battle>;
    removeBattle: () => void;
    getCurrentBattleId: () => BattleId | null;
};

const allTeamColorList = [ '#3BA92A', '#FFD74A', '#A93B2A', '#3BA9A9' ];

export const createRoom = (globalEntities: GlobalEntities): Room => {
    const roomId = createId('short');

    let mapInfos: MapInfos | null = null;
    let tiledMapPromise: Promise<TiledMap> | null = null;
    let placementTiles: MapPlacementTiles = {};
    let playerAdminId: PlayerId = '';
    const staticPlayerList: RoomStaticPlayer[] = [];
    let staticCharacterList: RoomStaticCharacter[] = [];

    let battle: Battle | null = null;
    let battlePromiseCancel = () => { };

    const getTeamColorList = () => mapInfos
        ? allTeamColorList.slice(0, mapInfos.nbrTeams)
        : [];

    const getMapInfosFrontend = () => {
        if (!mapInfos) {
            return null;
        }

        return globalEntities.services.mapRoomService.getMapInfosFrontend(mapInfos);
    };

    const getMapPlacementTiles = async (tiledMap: TiledMap): Promise<MapPlacementTiles> => {

        const placementLayer = Layer.getTilelayer('placement', tiledMap);
        const tilePositionsMap: MapPlacementTiles = {};

        (placementLayer.data as number[]).forEach((tileId, index) => {
            if (tileId) {
                tilePositionsMap[ tileId ] = tilePositionsMap[ tileId ] ?? [];
                tilePositionsMap[ tileId ].push(Tile.getTilePositionFromIndex(index, tiledMap));
            }
        });

        return ObjectTyped.entries(tilePositionsMap)
            .reduce<MapPlacementTiles>((acc, [ tileId, positionList ], index) => {

                acc[ allTeamColorList[ index ] ] = positionList;

                return acc;
            }, {});
    };

    const computeMapPlacementTiles = () => {
        const readFile = util.promisify(fs.readFile);

        tiledMapPromise = readFile(assetUrl.toBackend(mapInfos!.schemaLink), 'utf-8')
            .then<TiledMap>(JSON.parse)
            .then<TiledMap>(async (tiledMap) => {
                placementTiles = await getMapPlacementTiles(tiledMap);

                return tiledMap;
            });
        return tiledMapPromise;
    };

    const getRoomStateData = (): RoomStateData => ({
        roomId,
        mapInfos: getMapInfosFrontend(),
        mapPlacementTiles: placementTiles,
        playerAdminId,
        teamColorList: getTeamColorList(),
        staticPlayerList,
        staticCharacterList
    });

    const getBattlePayload = async (): Promise<BattlePayload> => ({
        roomId,
        staticPlayerList,
        staticCharacterList,
        entityListData: globalEntities.services.entityListGetRoomService.getEntityLists(),
        mapInfos: mapInfos!,
        tiledMap: await tiledMapPromise!
    });

    return {
        roomId,

        getRoomStateData,

        playerJoin: playerInfos => {
            staticPlayerList.push(playerInfos);

            if (!playerAdminId) {
                playerAdminId = playerInfos.playerId;
            }

            battlePromiseCancel();
        },
        playerReady: (playerId, ready) => {
            const player = staticPlayerList.find(p => p.playerId === playerId);
            player!.ready = ready;

            if (!ready) {
                battlePromiseCancel();
            }
        },
        playerLeave: playerId => {
            const playerIndex = staticPlayerList.findIndex(c => c.playerId === playerId);
            const player = staticPlayerList[ playerIndex ];
            staticPlayerList.splice(
                playerIndex,
                1
            );
            staticCharacterList = staticCharacterList.filter(character => character.playerId !== playerId);

            if (player.type === 'player') {
                if (playerId === playerAdminId) {
                    playerAdminId = staticPlayerList.find(player => player.type === 'player')?.playerId ?? '';
                }

                battlePromiseCancel();
            }
        },
        teamJoin: (playerId, teamColor) => {
            const player = staticPlayerList.find(p => p.playerId === playerId)!;
            player.teamColor = teamColor;

            if (teamColor) {
                player.type = 'player';
            } else {
                player.type = 'spectator';
                staticCharacterList = staticCharacterList.filter(character => character.playerId !== playerId);
            }
        },
        characterSelect: staticCharacter => {
            staticCharacterList.push(staticCharacter);
        },
        characterRemove: characterId => {
            staticCharacterList.splice(
                staticCharacterList.findIndex(c => c.characterId === characterId),
                1
            );
        },
        characterPlacement: (characterId, position) => {
            const character = staticCharacterList.find(char => char.characterId === characterId);
            character!.placement = position;
        },
        mapSelect: async (selectedMapInfos) => {
            mapInfos = selectedMapInfos;
            staticCharacterList.forEach(character => {
                character.placement = null;
            });

            await computeMapPlacementTiles();
        },
        waitForBattle: async () => {
            const { promise, cancel } = waitCanceleable(5000);

            battlePromiseCancel = cancel;

            const { state } = await promise;
            return state;
        },
        createBattle: async () => {

            const payload = await getBattlePayload();

            battle = createBattle(
                globalEntities,
                payload,
                () => globalEntities.services.playerRoomService.onBattleEnd(roomId, battle!.battleId)
            );

            return battle!;
        },
        removeBattle: () => {
            battle = null;

            staticPlayerList.forEach(player => {
                player.ready = false;
            });
        },
        getCurrentBattleId: () => battle && battle.battleId
    };
};
