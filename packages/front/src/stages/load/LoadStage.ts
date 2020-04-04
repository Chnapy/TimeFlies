import { BattleLoadPayload, BattleSnapshot, BRunLaunchSAction, GlobalTurnSnapshot } from "@timeflies/shared";
import { Controller } from '../../Controller';
import { BattleLaunchAction } from "../../phaser/battleReducers/BattleReducerManager";
import { serviceDispatch } from "../../services/serviceDispatch";
import { serviceEvent } from "../../services/serviceEvent";
import { serviceNetwork } from "../../services/serviceNetwork";
import { BattleSceneData } from "../battle/BattleScene";
import { StageChangeAction, StageCreator, StageParam } from '../StageManager';

export type LoadStageParam = StageParam<'load', BattleLoadPayload>;

const spritesheetsUrls = {
    // TODO use import (find a way for json)
    characters: 'http://localhost:8887/sokoban.json'
} as const;

export const LoadStage: StageCreator<'load', 'map' | 'characters'> = (payload) => {
    const { mapInfos, characterTypes } = payload;

    return {
        preload: () => {
            const { schemaUrl } = mapInfos;

            return Controller.loader.newInstance()
                .add('map', schemaUrl)
                .addSpritesheet('characters', spritesheetsUrls.characters)
                .load();
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

            return {};
        }
    };
};
