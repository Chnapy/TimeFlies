import { Meta } from '@storybook/react/types-6-0';
import React from 'react';
import { useAssetMap, useAssetSpritesheet } from '.';
import { AssetsLoader } from './assets-loader';

export default {
    title: 'assets'
} as Meta;

const RenderUpdateTest = () => {
    const countRef = React.useRef<HTMLSpanElement | null>(null);
    const entitiesSpritesheet = useAssetSpritesheet('entities');
    const dungeonMap = useAssetMap('dungeon');

    React.useEffect(() => {
        const count = +countRef.current!.innerHTML;
        countRef.current!.innerHTML = (count + 1) + '';
    });

    console.log('spritesheet entities', entitiesSpritesheet);
    console.log('map dungeon', dungeonMap);

    return (
        <span>
            renders: <span ref={countRef}>0</span>
            <br />entities: {entitiesSpritesheet ? 'defined' : '-'}
            <br />map dungeon: {dungeonMap ? 'defined' : '-'}
        </span>
    );
}

export const Default = () => {
    const [ maps, setMaps ] = React.useState({});

    return (
        <AssetsLoader
            spritesheets={{
                entities: '/fake/spritesheets/spritesheet-entities.json'
            }}
            maps={maps}
        >
            <RenderUpdateTest />
            <br />
            <button onClick={() => setMaps({
                dungeon: '/fake/maps/map_dungeon.json'
            })}>load map dungeon</button>
        </AssetsLoader>
    )
};
