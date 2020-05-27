import { TiledManager } from '@timeflies/shared';
import * as PIXI from 'pixi.js';
import React from 'react';
import { AssetLoader } from '../../../../assetManager/AssetLoader';
import { CanvasContext } from '../../../../canvas/CanvasContext';
import { serviceDispatch } from '../../../../services/serviceDispatch';
import { SpellEngineBindAction } from '../../engine/engine-actions';
import { Spell } from '../../entities/spell/Spell';
import { seedSpell } from '../../entities/spell/Spell.seed';
import { TiledMapGraphic } from './TiledMapGraphic';
import { StoryProps } from '../../../../../.storybook/preview';
import { AssetManager } from '../../../../assetManager/AssetManager';

export default {
    title: 'graphic/TiledMapGraphic'
};

export const Default = ({ fakeBattleApi: fakeApi }: StoryProps) => {

    fakeApi.init({});

    const onMount = async (parent: HTMLElement) => {
        const view = parent.firstElementChild as HTMLCanvasElement;
        const app = new PIXI.Application({ view, resizeTo: parent });

        const loader = AssetLoader();

        const { map } = await loader.newInstance()
            .add('map', AssetManager.fake.mapSchema)
            .load();

        const tiledManager = TiledManager(map);

        CanvasContext.provider({
            mapManager: {
                tiledManager
            } as any
        }, TiledMapGraphic);

        const tiledMap = CanvasContext.provider({
            mapManager: {
                tiledManager
            } as any
        }, TiledMapGraphic);
        app.stage.addChild(tiledMap.container);

        const { dispatchBindAction } = serviceDispatch({
            dispatchBindAction: (spell: Spell<'future'>) => SpellEngineBindAction({
                spell,
                onTileHover: async () => {
                    return undefined;
                },
                onTileClick: async () => true,
                rangeArea: []
            })
        });

        dispatchBindAction(seedSpell('fake', {
            period: 'future', id: '', type: 'move', character: null as any
        }));
    };

    return <div ref={el => el && onMount(el)} style={{
        overflow: 'hidden',
        position: 'absolute',
        top: 8,
        bottom: 8,
        left: 0,
        right: 0
    }}>
        <canvas />
    </div>;
};
