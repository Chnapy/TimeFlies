import { MiddlewareAPI } from '@reduxjs/toolkit';
import { Normalized } from '@timeflies/shared';
import { NotifyDeathsAction } from '../cycle/cycle-manager-actions';
import { Character } from '../entities/character/Character';
import { seedCharacter } from '../entities/character/Character.seed';
import { SpellActionTimerEndAction } from '../spellAction/spell-action-actions';
import { snapshotMiddleware } from './snapshot-middleware';
import { getInitialSnapshotState } from './snapshot-reducer';

describe('# snapshot-middleware', () => {

    it('should not notify for deaths on spell action end action if there is not new deaths', async () => {

        const currentCharacters: Normalized<Character<'current'>> = {
            '1': seedCharacter({
                period: 'current',
                id: '1'
            }),
            '2': seedCharacter({
                period: 'current',
                id: '2'
            })
        };

        const initialState = getInitialSnapshotState({
            myPlayerId: 'p1',
            battleDataCurrent: {
                battleHash: 'not-matter',
                characters: currentCharacters,
                spells: {}
            },
            battleDataFuture: {
                battleHash: 'not-matter',
                characters: {},
                spells: {}
            },
        });

        const api: MiddlewareAPI = {
            dispatch: jest.fn(),
            getState: jest.fn()
        };

        const next = jest.fn();

        const action = SpellActionTimerEndAction({
            removed: false,
            correctHash: '',
            spellActionSnapshot: {} as any
        });

        await snapshotMiddleware({
            extractState: () => initialState,
        })(api)(next)(action);

        expect(next).toHaveBeenNthCalledWith(1, action);
        expect(api.dispatch).not.toHaveBeenCalled();
    });

    it('should notify for deaths on spell action end action if there is new deaths', async () => {

        const currentCharacters: Normalized<Character<'current'>> = {
            '1': seedCharacter({
                period: 'current',
                id: '1'
            }),
            '2': seedCharacter({
                period: 'current',
                id: '2'
            })
        };

        const initialState = getInitialSnapshotState({
            myPlayerId: 'p1',
            battleDataCurrent: {
                battleHash: 'not-matter',
                characters: currentCharacters,
                spells: {}
            },
            battleDataFuture: {
                battleHash: 'not-matter',
                characters: {},
                spells: {}
            },
        });

        const api: MiddlewareAPI = {
            dispatch: jest.fn(),
            getState: jest.fn()
        };

        const next = jest.fn((): any => {
            initialState.battleDataCurrent.characters[ '1' ].features.life = 0;
        });

        const action = SpellActionTimerEndAction({
            removed: false,
            correctHash: '',
            spellActionSnapshot: {} as any
        });

        await snapshotMiddleware({
            extractState: () => initialState,
        })(api)(next)(action);

        expect(next).toHaveBeenNthCalledWith(1, action);
        expect(api.dispatch).toHaveBeenNthCalledWith(1, NotifyDeathsAction());
    });
});
