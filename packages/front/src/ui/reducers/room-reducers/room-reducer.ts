import { Reducer } from 'redux';
import { stageChangeActionPayloadMatch } from '../../../stages/stage-actions';
import { EntityTreeData, entityTreeReducer } from './entity-tree-reducer/entity-tree-reducer';
import { MapSelectData, mapSelectReducer } from './map-select-reducer/map-select-reducer';


export interface RoomData {
    roomId: string;
    map: MapSelectData;
    teamsTree: EntityTreeData;
    launchTime: number | null;
}

export const RoomReducer: Reducer<RoomData | null> = (state = null, action) => {

    switch (action.type) {

        case 'stage/change':
            const { payload } = action;
            if (stageChangeActionPayloadMatch('room', payload)) {
                const { roomState } = payload.data;

                return {
                    roomId: roomState.roomId,
                    map: mapSelectReducer(undefined, action),
                    teamsTree: entityTreeReducer(undefined, action),
                    launchTime: null
                };
            }

            break;

        case 'message/receive':
            const message = action.payload;

            if (message.type === 'room/battle-launch') {
                const launchTime = message.action === 'launch'
                    ? message.launchTime
                    : null;

                return state && {
                    ...state,
                    launchTime
                };
            }

            break;
    }

    return state && {
        ...state,
        map: mapSelectReducer(state.map, action),
        teamsTree: entityTreeReducer(state.teamsTree, action)
    };
};
