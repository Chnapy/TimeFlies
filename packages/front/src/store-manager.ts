import { Action, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { ReceiveMessageAction, SendMessageAction } from './socket/wsclient-actions';
import { wsClientMiddleware } from './socket/wsclient-middleware';
import { getBattleMiddlewareList } from './ui/reducers/battle-reducers/battle-middleware-list';
import { roomMiddleware } from './ui/reducers/room-reducers/room-middleware';
import { rootReducer } from './ui/reducers/root-reducer';
import { GameState } from './game-state';

export type StoreManager = ReturnType<typeof createStoreManager>;

export type StoreEmitter = Pick<StoreManager, 'onStateChange' | 'getState' | 'dispatch'>;

export const createStoreManager = () => {

    const middlewareList = [
        wsClientMiddleware({}),
        roomMiddleware,
        ...getBattleMiddlewareList()
    ];

    if (process.env.NODE_ENV === 'development') {
        const logger = createLogger({
            collapsed: true,
            actionTransformer: (action: Action) => {
                if (ReceiveMessageAction.match(action)) {
                    action.type += ' > ' + action.payload.type;

                } else if (SendMessageAction.match(action)) {
                    action.type += ' > ' + action.payload.type;

                }

                return action;
            }
        });

        middlewareList.push(logger);
    }

    const store = configureStore({
        reducer: rootReducer,
        middleware: [
            ...getDefaultMiddleware(),
            ...middlewareList
        ],
        // preloadedState: initialState
    });

    const onStateChange = <R>(
        selector: (state: GameState) => R,
        onChange: (value: R) => void,
        equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
    ) => {
        let currentState;

        function handleChange() {
            const nextState = selector(store.getState());
            if (!equalityFn(nextState, currentState)) {
                currentState = nextState;
                onChange(currentState);
            }
        }

        const unsubscribe = store.subscribe(handleChange);
        handleChange();
        return unsubscribe;
    };

    return {
        store,
        getState: store.getState,
        dispatch: store.dispatch,
        onStateChange
    };
};
