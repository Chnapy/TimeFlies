import bresenham from 'bresenham';
import { TiledLayerTilelayer, TiledMap, TiledMapOrthogonal, TiledMapType, TiledTileset } from 'tiled-types';
import { Position, createPosition } from '../geo';
import { assertIsDefined, Normalized } from '../util';

export interface TilePositioned<T extends TileTypeWithPlacement> {
    type: T;
    position: Position;
}

export type GridTile = Position & {
    tileType: TileType;
};

export interface TiledManager {
    readonly orientation: TiledMapType;
    readonly width: number;
    readonly height: number;

    getRenderableLayerList(): TiledLayerTilelayer[];

    getTileType(position: Position): TileType;
    getTileTypeWithPlacement(position: Position): TileTypeWithPlacement;
    getAllTilesOfType<T extends TileTypeWithPlacement>(...types: T[]): TilePositioned<T>[];

    getPlacementTilesPositions(): Position[][];

    getTilePositionFromIndex(index: number): Position;
    getTilesetFromId(id: number): TiledTileset | undefined;

    getGrid(): Normalized<GridTile>;

    getArea(center: Position, r: number): Position[];
    getBresenhamLine(start: Position, end: Position): BresenhamPoint[];
}

export type TileType = 'default' | 'obstacle' | null;

export type TileTypeWithPlacement = TileType | 'placement';

export type TiledMapAssets = {
    schema: TiledMap;
    images: Record<string, string>;
};

export interface BresenhamPoint {
    position: Position;
    tileType: TileType;
}

function assertMapIsAllowed(map: TiledMap): asserts map is TiledMapOrthogonal {
    if (map.orientation !== 'orthogonal') {
        throw new Error(`The given map should be orthogonal, but is [${map.orientation}]`);
    }
};

const tileLayerNames = Object.freeze({
    placement: 'init',
    default: 'view',
    obstacles: 'obstacles'
});

const notRenderableNames = [
    tileLayerNames.obstacles,
    tileLayerNames.placement
];

export const TiledManager = (schema: TiledMap): TiledManager => {

    const getTilelayer = (name: string): TiledLayerTilelayer => {
        const layer = schema.layers.find((layer): layer is TiledLayerTilelayer =>
            layer.type === 'tilelayer' && layer.name === name
        );
        assertIsDefined(layer);

        return layer;
    };

    assertMapIsAllowed(schema);

    const { orientation, width, height } = schema;

    const placementTilelayer = getTilelayer(tileLayerNames.placement);
    const defaultTilelayer = getTilelayer(tileLayerNames.default);
    const obstacleTilelayer = getTilelayer(tileLayerNames.obstacles);

    const getRenderableLayerList = () => schema.layers.filter((layer): layer is TiledLayerTilelayer =>
        layer.type === 'tilelayer' && !notRenderableNames.includes(layer.name)
    );

    const getTilePositionFromIndex = (index: number): Position => {
        const y = Number.parseInt(index / width + '');
        const x = (index % width);
        return createPosition(x, y);
    };

    const getTileIdFromPosition = ({ data, width }: TiledLayerTilelayer, { x, y }: Position): number => {
        const index = x + y * width;
        return data[ index ];
    };

    const hasTileFromLayer = (layer: TiledLayerTilelayer, position: Position): boolean => {
        return getTileIdFromPosition(layer, position) !== 0;
    };

    const getTileType = (position: Position): TileType => {

        if (hasTileFromLayer(obstacleTilelayer, position)) return 'obstacle';

        if (hasTileFromLayer(defaultTilelayer, position)) return 'default';

        return null;
    };

    const getTileTypeWithPlacement = (position: Position): TileTypeWithPlacement => {

        if (hasTileFromLayer(placementTilelayer, position)) return 'placement';

        return getTileType(position);
    };

    const getAllTilesOfType = <T extends TileTypeWithPlacement>(...types: T[]): TilePositioned<T>[] => {
        const tileList: TilePositioned<T>[] = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const position = createPosition(x, y);
                const type = getTileTypeWithPlacement(position);

                if (types.includes(type as T)) {
                    tileList.push({
                        type: type as T,
                        position
                    });
                }
            }
        }

        return tileList;
    };

    const getPlacementTilesPositions = (): Position[][] => {
        const buffer = new Map<number, Position[]>();

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const position = createPosition(x, y);
                const id = getTileIdFromPosition(placementTilelayer, position);

                if (id) {

                    if (!buffer.has(id)) {
                        buffer.set(id, []);
                    }

                    buffer.get(id)!.push(position);
                }
            }
        }

        return [ ...buffer.values() ];
    };

    const getTilesetFromId = (id: number): TiledTileset | undefined =>
        schema.tilesets.find(t => t.firstgid <= id && t.firstgid + t.tilecount - 1 >= id);

    const getGrid = (): Normalized<GridTile> => {

        const grid: Normalized<GridTile> = {};

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const p = createPosition(x, y);
                const tileType = getTileType(p);

                grid[ p.id ] = {
                    ...p,
                    tileType
                };
            }
        }

        return grid;
    };

    const getArea = (center: Position, r: number): Position[] => {

        const area: Position[] = [];
        let sum = 0;
        for (let i = 0; i <= r * 2; i++) {
            for (let k = 0; k <= (i - sum) * 2; k++) {

                const pos: Position = createPosition(
                    center.x - i + sum + k,
                    center.y - r + i
                );

                if (getTileType(pos) === 'default') {
                    area.push(pos);
                }
            }

            if (i >= r) {
                sum += 2;
            }
        }
        return area;
    };

    const getBresenhamLine = (start: Position, end: Position): BresenhamPoint[] => {

        const path = bresenham(start.x, start.y, end.x, end.y);

        return path
            .map(({ x, y }) => createPosition(x, y))
            .map((position): BresenhamPoint => ({
                position,
                tileType: getTileType(position)
            }));
    };

    return {
        orientation,
        width,
        height,

        getRenderableLayerList,

        getTileType,
        getTileTypeWithPlacement,
        getAllTilesOfType,

        getPlacementTilesPositions,

        getTilePositionFromIndex,
        getTilesetFromId,

        getGrid,

        getArea,
        getBresenhamLine
    };
}
