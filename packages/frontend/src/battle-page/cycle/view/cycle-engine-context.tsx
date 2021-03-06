import { createCycleEngine, CycleEngine } from '@timeflies/cycle-engine';
import React from 'react';
import { useCurrentEntities } from '../../hooks/use-entities';
import { useBattleSelector } from '../../store/hooks/use-battle-selector';
import { useCycleEngineListeners, useCycleMessageListeners } from '../hooks/use-cycle-listeners';
import { useCycleLogic } from '../hooks/use-cycle-logic';

export const CycleEngineContext = React.createContext<CycleEngine | null>(null);
CycleEngineContext.displayName = 'CycleEngineContext';

const CycleEngineLogic: React.FC = () => {
    useCycleLogic();
    useCycleMessageListeners();

    return null;
};

export const CycleEngineProvider: React.FC = ({ children }) => {
    const turnsOrder = useBattleSelector(battle => battle.turnsOrder);
    const charactersDurations = useCurrentEntities(({ characters }) => characters.actionTime);
    const getCycleEngineListeners = useCycleEngineListeners();

    const createEngine = () => createCycleEngine({
        charactersList: turnsOrder,
        charactersDurations,
        listeners: getCycleEngineListeners()
    });

    const [ cycleEngine ] = React.useState<CycleEngine>(createEngine);

    React.useEffect(() => {
        return () => { void cycleEngine.stop() };
    }, [ cycleEngine ]);

    return <CycleEngineContext.Provider value={cycleEngine}>
        <CycleEngineLogic />
        {children}
    </CycleEngineContext.Provider>;
};

export const useCycleEngine = () => {
    const cycleEngine = React.useContext(CycleEngineContext);

    if (!cycleEngine) {
        throw new Error('cycleEngine context is null');
    }

    return cycleEngine;
};
