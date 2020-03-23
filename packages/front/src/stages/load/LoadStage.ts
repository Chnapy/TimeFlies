import { BattleLoadPayload, BattleSnapshot, BRunLaunchSAction, GlobalTurnSnapshot } from "@timeflies/shared";
import { BattleLaunchAction } from "../../phaser/battleReducers/BattleReducerManager";
import { serviceDispatch } from "../../services/serviceDispatch";
import { serviceEvent } from "../../services/serviceEvent";
import { serviceNetwork } from "../../services/serviceNetwork";
import { BattleSceneData } from "../battle/BattleScene";
import { StageChangeAction, StageCreator, StageParam } from '../StageManager';
import { LoadStageGraphic } from './graphic/LoadStageGraphic';

export type LoadStageParam = StageParam<'load', BattleLoadPayload>;

export const LoadStage: StageCreator<'load', 'mapImage' | 'mapSchema'> = (payload) => {
    const { mapInfos } = payload;

    const graphic = LoadStageGraphic();

    return {
        graphic,
        preload: () => {
            const { urls } = mapInfos;

            // map tiles
            // load.image('tiles', urls.sheet);

            // // map in json format
            // load.tilemapTiledJSON('map', urls.schema);

            // characterTypes.forEach(type => {
            //     const { image, schema } = AssetManager.characters[ type ];

            //     load.atlasXML(CharacterGraphic.getSheetKey(type), image, schema);
            // });

            // load.atlasXML(SpellGraphic.getSheetKey(), AssetManager.spells.image, AssetManager.spells.schema);

            return {
                mapImage: urls.sheet,
                mapSchema: urls.schema
            };
        },
        async create(assets) {

            const { onAction, onMessageAction } = serviceEvent();

            const { dispatchStageChangeToBattle, dispatchBattleLaunch } = serviceDispatch({
                dispatchStageChangeToBattle: (payload: BattleSceneData): StageChangeAction<'battle'> => ({
                    type: 'stage/change',
                    stageKey: 'battle',
                    payload
                }),
                dispatchBattleLaunch: (battleSnapshot: BattleSnapshot, globalTurnState: GlobalTurnSnapshot): BattleLaunchAction => ({
                    type: 'battle/launch',
                    battleSceneData: {
                        ...payload,
                        battleSnapshot,
                        battleData: {
                            cycle: {
                                launchTime: battleSnapshot.launchTime
                            },
                            current: {
                                battleHash: '',
                                teams: [],
                                players: [],
                                characters: []
                            },
                            future: {
                                battleHash: '',
                                teams: [],
                                players: [],
                                characters: [],
                                spellActionSnapshotList: []
                            }
                        },
                        globalTurnState
                    }
                })
            });

            onAction<BattleLaunchAction>('battle/launch', ({
                battleSceneData
            }) => {
                dispatchStageChangeToBattle(battleSceneData);
            });

            const { sendBattleLoadEnded } = await serviceNetwork({
                sendBattleLoadEnded: () => ({
                    type: 'battle-load-end'
                })
            });

            sendBattleLoadEnded();

            onMessageAction<BRunLaunchSAction>('battle-run/launch', ({
                battleSnapshot, globalTurnState
            }) => {
                dispatchBattleLaunch(battleSnapshot, globalTurnState);
            });
        }
    };
};
