import * as PIXI from 'pixi.js';
import { createAssetLoader } from '../../../../assetManager/AssetLoader';
import { AssetManager } from '../../../../assetManager/AssetManager';
import { seedGameState } from '../../../../game-state.seed';
import { createStoreManager } from '../../../../store/store-manager';
import { CreatePixiFn, createView } from '../../../../view';
import { BattleStartAction } from '../../battle-actions';
import { TiledMapGraphic } from './TiledMapGraphic';

export default {
    title: 'graphic/TiledMapGraphic'
};

export const Default = () => {

    const initialState = seedGameState('p1', {
        step: 'battle',
    });

    const assetLoader = createAssetLoader();

    const storeManager = createStoreManager({
        assetLoader,
        initialState,
        middlewareList: []
    });

    const createPixi: CreatePixiFn = async ({ canvas, parent }) => {
        const app = new PIXI.Application({
            view: canvas,
            resizeTo: parent
        });

        const { map } = await assetLoader.newInstance()
            .add('map', AssetManager.fake.mapSchema)
            .load();

        const tiledMap = TiledMapGraphic();

        await storeManager.dispatch(BattleStartAction({
            myPlayerId: 'p1',
            tiledMapAssets: {
                schema: map.schema,
                imagesUrls: map.images
            },
            globalTurnSnapshot: {
                id: 1,
                order: [],
                startTime: Date.now(),
                currentTurn: {
                    id: 1,
                    characterId: '1',
                    duration: 0,
                    startTime: Date.now()
                }
            },
            teamSnapshotList: [],
            playerSnapshotList: [],
            entitiesSnapshot: {
                battleHash: '',
                charactersSnapshots: [],
                launchTime: Date.now(),
                spellsSnapshots: [],
                time: Date.now()
            }
        }));

        app.stage.addChild(tiledMap.container);
    };

    const view = createView({
        storeManager,
        assetLoader,
        createPixi,
        gameUIChildren: null
    });

    return view;
};
