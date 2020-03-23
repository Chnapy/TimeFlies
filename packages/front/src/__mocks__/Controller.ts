import { GameAction } from "../action/GameAction";
import { IController } from "../IController";
import { StoreTest } from '../StoreTest';

export const Controller: IController = {

    start() { },

    getStore() {
        return StoreTest.getStore();
    },

    waitConnect() {
        return Promise.resolve();
    },

    actionManager: {
        dispatch(action: GameAction): void {
            StoreTest.getStore().dispatch(action);
        },
        addActionListener(type, fn) {
            let removed = false;
            StoreTest.getStore().subscribe(() => {
                if (removed) return;
                const actions = StoreTest.getStore().getActions();
                const lastAction: GameAction | undefined = actions[ actions.length - 1 ];
                if (lastAction?.type === type) {
                    fn(lastAction);
                }
            });
            return {
                removeActionListener() {
                    removed = true;
                }
            };
        },
    },

    loader: {
        newInstance() {
            const this_ = {
                _keys: [] as string[],
                add(key, path) { this_._keys.push(key); return this_ as any },
                addMultiple(o) { this_._keys.push(...Object.keys(o)); return this_ as any },
                load() {
                    return Promise.resolve(
                        this_._keys.reduce<{}>((o, k) => {
                            o[ k ] = k;
                            return o;
                        }, {})
                    );
                }
            };
            return this_;
        }
    }
};
