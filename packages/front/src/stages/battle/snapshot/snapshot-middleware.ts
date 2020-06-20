import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { NotifyDeathsAction } from '../cycle/cycle-manager-actions';
import { characterIsAlive } from '../entities/character/Character';
import { SpellActionTimerEndAction } from '../spellAction/spell-action-actions';
import { SnapshotState } from './snapshot-reducer';
import { denormalize } from '../entities/normalize';

type Dependencies<S> = {
    extractState: (getState: () => S) => SnapshotState;
};

export const snapshotMiddleware: <S>(deps: Dependencies<S>) => Middleware = ({
    extractState
}) => api => next => {

    return (action: AnyAction) => {

        if (SpellActionTimerEndAction.match(action)) {

            const serializeDeaths = () => denormalize(extractState(api.getState).battleDataCurrent.characters)
                .filter(c => !characterIsAlive(c))
                .map(c => c.id).join('.');

            const serializedDeathsBefore = serializeDeaths();

            const ret = next(action);

            const serializedDeathsAfter = serializeDeaths();

            if (serializedDeathsBefore !== serializedDeathsAfter) {
                api.dispatch(NotifyDeathsAction());
            }

            return ret;
        }

        return next(action);
    };
};
