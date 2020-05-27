import { RoomServerAction, seedTiledMap } from '@timeflies/shared';
import { TiledLayerTilelayer } from 'tiled-types';
import { Controller } from '../../../../Controller';
import { ReceiveMessageAction } from '../../../../socket/wsclient-actions';
import { seedMapConfig } from '../../../../stages/battle/map/MapManager.seed';
import { StageChangeAction } from '../../../../stages/stage-actions';
import { StoreTest } from '../../../../StoreTest';
import { MapBoardTileInfos } from '../../../room-ui/map-board/map-board-tile/map-board-tile';
import { MapLoadedAction } from './map-select-actions';
import { MapSelectData, mapSelectReducer } from './map-select-reducer';

describe('# map-select-reducer', () => {

    const getAction = (roomMessage: RoomServerAction) => ReceiveMessageAction(roomMessage);

    beforeEach(() => {
        StoreTest.beforeTest();
    });

    afterEach(() => {
        StoreTest.afterTest();
    });

    it('should return the good initial state', () => {

        expect(
            mapSelectReducer(undefined, { type: 'not-matter' } as any)
        )
            .toEqual<MapSelectData>({
                mapList: [],
                mapSelected: null
            });
    });

    it('should ignore not handled actions', () => {

        const action = { type: 'not-handled' };

        expect(
            mapSelectReducer({
                mapList: [],
                mapSelected: null
            }, action as any)
        ).toEqual<MapSelectData>({
            mapList: [],
            mapSelected: null
        });

        const messageAction = ReceiveMessageAction({
            type: 'not-handled'
        } as any);

        expect(
            mapSelectReducer({
                mapList: [],
                mapSelected: null
            }, messageAction)
        ).toEqual<MapSelectData>({
            mapList: [],
            mapSelected: null
        });
    });

    it('should init state on stage change action', async () => {

        const mapConfig = seedMapConfig('map_1');

        const action = StageChangeAction({
            stageKey: 'room',
            data: {
                roomState: {
                    type: 'room/state',
                    sendTime: -1,
                    roomId: '',
                    mapSelected: {
                        config: mapConfig,
                        placementTileList: [ {
                            teamId: 't1',
                            position: { x: 0, y: 0 }
                        } ]
                    },
                    playerList: [],
                    teamList: []
                }
            }
        });

        expect(
            mapSelectReducer(undefined, action)
        ).toMatchObject<MapSelectData>({
            mapList: [ mapConfig ],
            mapSelected: {
                id: mapConfig.id,
                tileListLoading: true,
                tileList: [ {
                    type: 'placement',
                    teamId: 't1',
                    position: { x: 0, y: 0 }
                } ]
            }
        });

        await Controller.loader.newInstance().load();
    });

    it('should update tile list on map list action', () => {

        const action = getAction({
            type: 'room/map/list',
            sendTime: -1,
            mapList: [ {
                id: 'm1',
                schemaUrl: '',
                name: '',
                height: 10,
                width: 10,
                nbrCharactersPerTeam: 1,
                nbrTeams: 1,
                previewUrl: ''
            } ]
        });

        const state: MapSelectData = {
            mapList: [],
            mapSelected: null
        };

        expect(
            mapSelectReducer(state, action)
        ).toEqual<MapSelectData>({
            mapList: [ {
                id: 'm1',
                schemaUrl: '',
                name: '',
                height: 10,
                width: 10,
                nbrCharactersPerTeam: 1,
                nbrTeams: 1,
                previewUrl: ''
            } ],
            mapSelected: null
        });
    });

    it('should set map selected null on map selected "null" action', () => {

        const action = getAction({
            type: 'room/map/select',
            sendTime: -1,
            mapSelected: null,
            teamList: [],
            playerList: []
        });

        const state: MapSelectData = {
            mapList: [],
            mapSelected: {
                id: '',
                tileList: [],
                tileListLoading: false
            }
        };

        expect(
            mapSelectReducer(state, action)
        ).toEqual<MapSelectData>({
            mapList: [],
            mapSelected: null
        });
    });

    it('should set map selected on map selected action', async () => {

        const action = getAction({
            type: 'room/map/select',
            sendTime: -1,
            mapSelected: {
                id: 'm1',
                placementTileList: [ {
                    teamId: 't1',
                    position: { x: 1, y: 1 }
                }, {
                    teamId: 't2',
                    position: { x: 2, y: 2 }
                } ]
            },
            teamList: [],
            playerList: []
        });

        const state: MapSelectData = {
            mapList: [ {
                id: 'm1',
                name: 'm1',
                width: 10,
                height: 10,
                schemaUrl: 'map',
                nbrTeams: 1,
                nbrCharactersPerTeam: 1,
                previewUrl: ''
            } ],
            mapSelected: null
        };

        expect(
            mapSelectReducer(state, action)
        ).toEqual<MapSelectData>({
            mapList: [ {
                id: 'm1',
                name: 'm1',
                width: 10,
                height: 10,
                schemaUrl: 'map',
                nbrTeams: 1,
                nbrCharactersPerTeam: 1,
                previewUrl: ''
            } ],
            mapSelected: {
                id: 'm1',
                tileListLoading: true,
                tileList: [
                    {
                        type: 'placement',
                        teamId: 't1',
                        position: { x: 1, y: 1 }
                    },
                    {
                        type: 'placement',
                        teamId: 't2',
                        position: { x: 2, y: 2 }
                    }
                ]
            }
        });

        // await Controller.loader.newInstance().load();

        // expect(StoreTest.getActions()).toEqual<[ MapLoadedAction ]>([ {
        //     type: 'room/map/loaded',
        //     assets: expect.anything()
        // } ]);
    });

    it('should add obstacles on map loaded action', () => {

        const schema = seedTiledMap('map_1');

        const action = MapLoadedAction({
            assets: {
                images: {},
                schema
            }
        });

        const state: MapSelectData = {
            mapList: [ {
                id: 'm1',
                name: 'm1',
                width: 10,
                height: 10,
                schemaUrl: 'map',
                nbrTeams: 1,
                nbrCharactersPerTeam: 1,
                previewUrl: ''
            } ],
            mapSelected: {
                id: 'm1',
                tileListLoading: true,
                tileList: [ {
                    type: 'placement',
                    teamId: 't1',
                    position: { x: 0, y: 0 }
                } ]
            }
        };

        const nbrObstacles: number = schema.layers
            .find((l): l is TiledLayerTilelayer => l.name === 'obstacles')!
            .data!.filter(d => !!d).length;

        const newState = mapSelectReducer(state, action);

        expect(newState).toEqual<MapSelectData>({
            mapList: [ {
                id: 'm1',
                name: 'm1',
                width: 10,
                height: 10,
                schemaUrl: 'map',
                nbrTeams: 1,
                nbrCharactersPerTeam: 1,
                previewUrl: ''
            } ],
            mapSelected: {
                id: 'm1',
                tileListLoading: false,
                tileList: expect.arrayContaining<MapBoardTileInfos>([ {
                    type: 'placement',
                    teamId: 't1',
                    position: { x: 0, y: 0 }
                }, {
                    type: 'obstacle',
                    position: expect.any(Object)
                } ])
            }
        });

        expect(newState.mapSelected!.tileList).toHaveLength(nbrObstacles + 1);
    });
});
