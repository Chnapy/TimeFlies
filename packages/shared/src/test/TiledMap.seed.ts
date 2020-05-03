import { TiledMapAssets, TiledManager } from '..';
import { TiledMap } from 'tiled-types';

// Note: properties not in "" were not present in the generated JSON
const tiledMap_2: TiledMap = {
    infinite: false,
    nextlayerid: 1,
    tiledversion: '',
    type: 'map',
    backgroundcolor: '',
    "height": 20,
    "layers": [
        {
            id: 1,
            "data": [ 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 163, 195, 165, 195, 165, 195, 165, 195, 195, 195, 164, 93, 93, 93, 93, 93, 93, 93, 93, 93, 168, 11, 115, 11, 115, 11, 115, 11, 11, 11, 143, 195, 195, 164, 93, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 167, 93, 93, 93, 93, 93, 93, 190, 117, 11, 11, 11, 11, 11, 11, 11, 11, 11, 141, 11, 167, 93, 93, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 11, 11, 11, 11, 115, 11, 167, 93, 93, 93, 93, 93, 93, 93, 168, 11, 142, 112, 114, 11, 11, 142, 114, 11, 11, 11, 167, 93, 93, 93, 93, 93, 93, 163, 144, 11, 11, 115, 11, 11, 11, 11, 11, 11, 11, 11, 167, 93, 93, 93, 93, 93, 163, 144, 11, 11, 11, 11, 141, 11, 11, 11, 11, 11, 141, 11, 167, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 139, 111, 114, 11, 11, 11, 115, 11, 167, 93, 93, 93, 93, 93, 168, 11, 142, 114, 11, 11, 115, 11, 11, 11, 196, 11, 11, 11, 167, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 116, 191, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 142, 248, 164, 93, 93, 93, 93, 93, 168, 11, 11, 11, 11, 11, 196, 11, 11, 11, 11, 11, 11, 11, 143, 195, 195, 164, 93, 93, 190, 117, 11, 11, 11, 11, 11, 11, 11, 11, 196, 11, 11, 11, 11, 11, 11, 167, 93, 93, 93, 168, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 167, 93, 93, 93, 190, 194, 194, 194, 194, 117, 11, 11, 11, 11, 11, 116, 194, 194, 194, 194, 191, 93, 93, 93, 93, 93, 93, 93, 93, 190, 194, 194, 194, 194, 194, 191, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93, 93 ],
            "height": 20,
            "name": "decors",
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "width": 20,
            "x": 0,
            "y": 0
        },
        {
            id: 2,
            "data": [ 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 19, 0, 19, 0, 19, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 19, 19, 19, 0, 0, 19, 19, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 19, 0, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 19, 0, 19, 19, 19, 19, 19, 19, 19, 0, 19, 19, 0, 0, 19, 0, 0, 0, 19, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 0, 0, 0, 0, 0, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19 ],
            "height": 20,
            "name": "obstacles",
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "width": 20,
            "x": 0,
            "y": 0
        } ],
    "nextobjectid": 1,
    "orientation": "orthogonal",
    "renderorder": "left-up",
    "tileheight": 64,
    "tilesets": [
        {
            "columns": 27,
            "firstgid": 1,
            "image": "map_2.png",
            "imageheight": 1280,
            "imagewidth": 1728,
            "margin": 0,
            "name": "map_main",
            "spacing": 0,
            "tilecount": 540,
            "tileheight": 64,
            "tilewidth": 64
        } ],
    "tilewidth": 64,
    "version": 1,
    "width": 20
};

const tiledMap_1: TiledMap = {
    infinite: false,
    nextlayerid: 1,
    tiledversion: '',
    type: 'map',
    backgroundcolor: '',
    "height": 20,
    "layers": [
        {
            id: 1,
            "data": [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 0, 2, 0, 2, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 0, 2, 0, 2, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ],
            "height": 20,
            "name": "obstacles",
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "width": 20,
            "x": 0,
            "y": 0
        },
        {
            id: 2,
            "data": [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ],
            "height": 20,
            "name": "view",
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "width": 20,
            "x": 0,
            "y": 0
        },
        {
            id: 3,
            "data": [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            "height": 20,
            "name": "init",
            "opacity": 1,
            "type": "tilelayer",
            "visible": true,
            "width": 20,
            "x": 0,
            "y": 0
        } ],
    "nextobjectid": 1,
    "orientation": "orthogonal",
    "renderorder": "left-up",
    "tileheight": 70,
    "tilesets": [
        {
            "columns": 1,
            "firstgid": 1,
            "image": "map.png",
            "imageheight": 140,
            "imagewidth": 70,
            "margin": 0,
            "name": "map",
            "spacing": 0,
            "tilecount": 2,
            "tileheight": 70,
            "tilewidth": 70
        } ],
    "tilewidth": 70,
    "version": 1,
    "width": 20
};

const maps = {
    map_1: tiledMap_1,
    map_2: tiledMap_2,
} as const;

export type TiledMapSeedKey = keyof typeof maps;

export const seedTiledMap = (mapKey: TiledMapSeedKey): TiledMap => {

    return JSON.parse(
        JSON.stringify(maps[ mapKey ])
    );
};

export const seedTiledMapAssets = (mapKey: TiledMapSeedKey): TiledMapAssets => {

    const schema = seedTiledMap(mapKey);

    const images = {};

    return {
        schema,
        images
    };
};

export const seedTiledManager = (mapKey: TiledMapSeedKey): TiledManager => {

    const assets = seedTiledMapAssets(mapKey);

    return TiledManager(assets);
};
