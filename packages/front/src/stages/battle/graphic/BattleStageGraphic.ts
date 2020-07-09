import { Viewport } from 'pixi-viewport';
import { CanvasContext } from '../../../canvas/CanvasContext';
import { StageGraphicCreator } from '../../../canvas/StageGraphic';
import { CharactersBoard } from './charactersBoard/CharactersBoard';
import { TiledMapGraphic } from './tiledMap/TiledMapGraphic';
import { assertIsDefined } from '@timeflies/shared';

export const BattleStageGraphic: StageGraphicCreator = (renderer) => {

    const viewport = new Viewport({
        screenWidth: renderer.screen.width,
        screenHeight: renderer.screen.height,
        disableOnContextMenu: false,

        interaction: renderer.plugins.interaction
    });

    const initViewport = (worldWidth: number, worldHeight: number) => {
        viewport.worldWidth = worldWidth;
        viewport.worldHeight = worldHeight;
        viewport
            .clamp({ direction: 'all' })
            .clampZoom({
                minScale: 0.25,
                maxScale: 1,

            })
            .wheel()
            .drag({
                mouseButtons: 'middle',
            });
    };

    const tiledMapGraphic = TiledMapGraphic();

    const { storeEmitter, assetLoader } = CanvasContext.consumer('storeEmitter', 'assetLoader');

    storeEmitter.onStateChange(
        state => state.battle.battleActionState.tiledSchema,
        schema => {
            if (!schema) {
                return;
            }

            const { width, height } = tiledMapGraphic.getMapsize(schema);
            const { tilewidth, tileheight } = tiledMapGraphic.getTilesize(schema);

            initViewport(
                tilewidth * width,
                tileheight * height
            );
        }
    );

    const charactersSpritesheet = assetLoader.get('characters')!;
    assertIsDefined(charactersSpritesheet);

    CanvasContext.provider({
        tiledMapGraphic,
        spritesheets: { characters: charactersSpritesheet.spritesheet }
    }, () => {

        const charactersBoardCurrent = CharactersBoard('current');
        const charactersBoardFuture = CharactersBoard('future');

        viewport.addChild(
            tiledMapGraphic.container,
            charactersBoardCurrent.container,
            charactersBoardFuture.container,
            tiledMapGraphic.containerOver
        );
    });

    return {
        container: viewport,

        onResize(width, height) {
            viewport.resize(width, height);
        },
    };
};
