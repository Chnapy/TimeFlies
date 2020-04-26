import { assertIsDefined, TiledMap, TiledMapAssets } from '@timeflies/shared';
import * as PIXI from 'pixi.js';
import { Loader as _Loader, LoaderResource } from 'pixi.js';
import { IAddOptions, ImageLoadStrategy, Resource } from 'resource-loader';
import { AbstractLoadStrategyCtor } from 'resource-loader/dist/load_strategies/AbstractLoadStrategy';
import { AppResetAction } from '../Controller';
import { serviceEvent } from '../services/serviceEvent';

export type AppLoader = Pick<_Loader,
    | 'resources'
    | 'add'
    | 'use'
    | 'load'
    | 'reset'
>;

type ResourceMap = Partial<Record<string, LoaderResource>>;

export type AssetMap = BaseAssetMap & SpritesheetMap;

interface BaseAssetMap {
    map: TiledMapAssets;

    // for tests
    sampleImage: HTMLImageElement;
    sampleJSON: object;
};

type BaseAssetMapKey = keyof BaseAssetMap;

type SpritesheetMap = {
    faces: PIXI.Spritesheet;
    characters: PIXI.Spritesheet;
};

type AssetMapKey = keyof AssetMap;

export interface AssetLoader {
    newInstance(): LoaderInstance<{}>;
}

interface Dependencies {
    getLoader: () => AppLoader;
    loadStrategy?: AbstractLoadStrategyCtor;
}

interface LoaderInstance<O extends {}> {
    use<K extends AssetMapKey>(key: K): LoaderInstance<O & Pick<AssetMap, K>>;
    add<K extends BaseAssetMapKey>(key: K, path: string): LoaderInstance<O & Pick<BaseAssetMap, K>>;
    addMultiple<K extends BaseAssetMapKey>(o: Record<K, string>): LoaderInstance<O & Pick<BaseAssetMap, K>>;
    addSpritesheet<K extends keyof SpritesheetMap>(key: K, path: string): LoaderInstance<O & Pick<SpritesheetMap, K>>;
    load: () => Promise<O>;
}

const mapKey: AssetMapKey = 'map';
const mapImageKeyPrefix = 'map:';

const mapStringUtil = {
    /**
     * 'http://localhost/a/b/c.png' => 'http://localhost/a/b/'
     */
    getBaseUrl: (url: string) => url.substr(0, url.lastIndexOf('/') + 1),

    isMap: (key: string) => key === mapKey,

    isMapImage: (key: string) => key.startsWith(mapImageKeyPrefix),

    getMapImage: (name: string) => mapImageKeyPrefix + name,
} as const;

const getResourcesErrors = (resources: ResourceMap, keys: string[]): Error[] => keys
    .map(k => resources[ k ]!.error)
    .filter(Boolean);

const getAssets = (resources: ResourceMap, keys: string[], key: string): AssetMap[ AssetMapKey ] => {
    if (mapStringUtil.isMap(key)) {
        return getTiledMapAssets(resources, keys);
    }

    const res = resources[ key ];
    assertIsDefined(res);

    if (res.spritesheet) {
        return res.spritesheet;
    }

    return res.data;
};

const getTiledMapAssets = (resources: ResourceMap, keys: string[]): TiledMapAssets => {
    const schema: TiledMap = resources[ mapKey ]!.data;

    const mapImageKeys = keys.filter(k => mapStringUtil.isMapImage(k));
    const images: Record<string, HTMLImageElement> = mapImageKeys.reduce((o, k) => {

        const img = resources[ k ]!.data;
        const imgKey = k.substr(k.indexOf(':') + 1);

        o[ imgKey ] = img;

        return o;
    }, {});

    return {
        schema,
        images
    };
};

const mapLoaderMiddleware = function (this: AppLoader, resource: Resource, next: () => void): void {
    if (!mapStringUtil.isMap(resource.name)) {
        return next();
    }

    if(resource.error) {
        return next();
    }

    const { url } = resource;
    const map: TiledMap = resource.data;

    const nbrTilesets = map.tilesets.length;

    if (!nbrTilesets) {
        return next();
    }

    let nbrTilesetsCompleted = 0;
    const onTilesetComplete = () => {
        nbrTilesetsCompleted++;
        if (nbrTilesetsCompleted === nbrTilesets) {
            next();
        }
    };

    const baseUrl = mapStringUtil.getBaseUrl(url);

    map.tilesets.forEach(({ name: _name, image }) => {
        const name = mapStringUtil.getMapImage(_name);
        if (!this.resources[ name ]) {
            const loadOptions: IAddOptions = {
                name,
                url: baseUrl + image,
                strategy: ImageLoadStrategy,
                parentResource: resource,
                onComplete: onTilesetComplete,
            };
            this.add(loadOptions);
        } else {
            onTilesetComplete();
        }
    });
};

export const AssetLoader = ({ getLoader }: Dependencies = { getLoader: () => _Loader.shared }): AssetLoader => {

    const { onAction } = serviceEvent();

    const loader = getLoader();

    loader.use(mapLoaderMiddleware);

    onAction<AppResetAction>('app/reset', () => {
        loader.reset();

        for (const textureUrl in PIXI.utils.BaseTextureCache) {
            delete PIXI.utils.BaseTextureCache[ textureUrl ];
        }
        for (const textureUrl in PIXI.utils.TextureCache) {
            delete PIXI.utils.TextureCache[ textureUrl ];
        }
    });

    const addResource = (name: string, url: string) => !loader.resources[ name ]
        ? loader.add({
            name,
            url
        })
        : undefined;

    const newInstance = (): LoaderInstance<{}> => {

        const this_: LoaderInstance<{}> = {

            use: <K extends AssetMapKey>(key: K) => {
                if (!loader.resources[ key ]) {
                    throw new Error(`'${key}' is needed but not present in loaded resources`);
                }
                return this_ as LoaderInstance<Pick<AssetMap, K>>;
            },

            add: <K extends BaseAssetMapKey>(key: K, path: string) => {
                addResource(key, path);
                return this_ as LoaderInstance<Pick<BaseAssetMap, K>>;
            },

            addMultiple: <K extends BaseAssetMapKey>(o: Record<K, string>) => {
                Object.keys(o)
                    .forEach(key => this_.add(key as BaseAssetMapKey, o[ key ]));
                return this_ as LoaderInstance<Pick<BaseAssetMap, K>>;
            },

            addSpritesheet: <K extends keyof SpritesheetMap>(key: K, path: string) => {
                addResource(key, path);
                return this_ as LoaderInstance<Pick<SpritesheetMap, K>>;
            },

            load: () => new Promise((resolve, reject) => {

                loader.load((_: AppLoader, resources: ResourceMap) => {
                    const data: Partial<AssetMap> = {};

                    const keys = Object.keys(resources);

                    const errors = getResourcesErrors(resources, keys);

                    if (errors.length) {
                        return reject(errors);
                    }

                    for (const k of keys.filter(k => !mapStringUtil.isMapImage(k))) {
                        data[ k ] = getAssets(resources, keys, k);
                    }

                    resolve(data);
                });
            })
        };

        return this_;
    };

    return {
        newInstance
    };
};
