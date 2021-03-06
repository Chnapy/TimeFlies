import { render } from '@testing-library/react';
import { createPosition, normalize, seedTiledMap } from '@timeflies/shared';
import Benchmark from 'benchmark';
import b from 'benny';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createAssetLoader } from '../src/assetManager/AssetLoader';
import { seedGameState } from '../src/game-state.seed';
import { battleActionReducer } from '../src/stages/battle/battleState/battle-action-reducer';
import { TileClickAction, TileHoverAction } from '../src/stages/battle/battleState/battle-state-actions';
import { seedCharacter } from '../src/stages/battle/entities/character/Character.seed';
import { seedSpell } from '../src/stages/battle/entities/spell/Spell.seed';
import { BattleDataPeriod } from '../src/stages/battle/snapshot/battle-data';
import { getInitialSnapshotState } from '../src/stages/battle/snapshot/snapshot-reducer';
import { createStoreManager } from '../src/store/store-manager';
import { battleReducer } from '../src/ui/reducers/battle-reducers/battle-reducer';
import { createView } from '../src/view';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

Benchmark.support.browser = false;

const initStore = () => {

    const getSpell = <P extends BattleDataPeriod>(period: P) => seedSpell<P>({
        id: 's1',
        period,
        characterId: 'c1',
        type: 'move',
        feature: {
            rangeArea: 999,
            duration: 1500
        }
    });

    const getCharacter = <P extends BattleDataPeriod>(period: P) => seedCharacter<P>({
        id: 'c1',
        period,
        position: createPosition(8, 6),
        isMine: true,
        playerId: 'p1',
        features: {
            actionTime: 9000
        }
    });

    const initialState = seedGameState('p1', {
        step: 'battle',
        battle: {
            ...battleReducer(undefined, { type: '' }),
            battleActionState: {
                ...battleActionReducer(undefined, { type: '' }),
                tiledSchema: seedTiledMap('map_1'),
                futureCharacterPosition: createPosition(8, 6),
                currentAction: 'spellPrepare',
                selectedSpellId: 's1',
                rangeArea: normalize([createPosition(9, 6)])
            },
            cycleState: {
                currentCharacterId: 'c1',
                globalTurnId: 1,
                globalTurnOrder: ['c1'],
                globalTurnStartTime: Date.now(),
                turnId: 1,
                turnDuration: 9000,
                turnStartTime: Date.now()
            },
            snapshotState: getInitialSnapshotState({
                myPlayerId: 'p1',
                grid: {
                    '8:6': {
                        ...createPosition(8, 6),
                        tileType: 'default'
                    },
                    '9:6': {
                        ...createPosition(9, 6),
                        tileType: 'default'
                    }
                },
                teamList: {
                    t1: {
                        id: 't1',
                        letter: 'A'
                    }
                },
                playerList: {
                    p1: {
                        id: 'p1',
                        name: '',
                        teamId: 't1'
                    }
                },
                battleDataCurrent: {
                    battleHash: '',
                    characters: { c1: getCharacter('current') },
                    spells: { s1: getSpell('current') }
                },
                battleDataFuture: {
                    battleHash: '',
                    characters: { c1: getCharacter('future') },
                    spells: { s1: getSpell('future') }
                },
            })
        }
    });

    const assetLoader = createAssetLoader();

    const storeManager = createStoreManager({
        assetLoader,
        initialState,
    });

    const view = createView({
        storeManager,
        assetLoader,
        createPixi: async () => { }
    });

    render(view);

    // store.replaceReducer((state, action) => {
    //     console.log('action', action.type)
    //     return rootReducer(state, action);
    // });

    return {
        initialState,
        storeManager,
        assetLoader
    };
};

export const runBenchmark = () => {
    const { log, warn, error } = console;
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    return b.suite(
        'Name',

        // 520ms
        b.add('unallowed tile hover action (move)', () => {
            const { storeManager } = initStore();

            return async () => {
                await storeManager.dispatch(TileHoverAction({
                    position: createPosition(8, 6)
                }));
            };
        }),

        // 910ms
        b.add('allowed tile hover action (move)', () => {
            const { storeManager } = initStore();

            return async () => {
                await storeManager.dispatch(TileHoverAction({
                    position: createPosition(9, 6)
                }));
            };
        }),

        // 1250ms
        b.add('allowed tile click action (move)', () => {
            const { storeManager } = initStore();

            return async () => {
                await storeManager.dispatch(TileClickAction({
                    position: createPosition(9, 6)
                }));
            };
        }),

        b.cycle(),
        b.complete(summary => {
            console.log = log;
            console.warn = warn;
            console.error = error;

            return summary;
        })
    ).then(async summary => {

        let fileContent = '';

        for (const r of summary.results)
            fileContent += `${r.name} x ${r.ops} ops/sec ±${r.margin}% (${r.samples} runs sampled)
`;

        const folder = path.join('benchmark', 'temp');
        const fileName = 'results.txt';

        const fullPath = path.join(folder, fileName);

        try {
            await mkdir(folder);
        } catch (e) { }

        await writeFile(fullPath, fileContent);

        console.log('Benchmark results wrote to ' + fullPath + ':');
        console.log(fileContent);

        return summary;
    });
};
