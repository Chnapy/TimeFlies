import { battleStateEntityToSnapshot, ConfirmSAction, NotifySAction, SpellActionCAction } from '@timeflies/shared';
import { BattleStateManager } from '../battleStateManager/BattleStateManager';
import { Cycle } from '../cycle/Cycle';
import { Character } from '../entities/character/Character';
import { Player } from '../entities/player/Player';
import { MapManager } from '../mapManager/MapManager';
import { SpellActionChecker } from '../spellActionChecker/SpellActionChecker';

export interface SpellActionReceiver {
    getOnReceive(player: Player): (action: SpellActionCAction) => void;
}

interface Props {
    stateManager: BattleStateManager;
    cycle: Cycle;
    mapManager: MapManager;
    checkDeathsAndDisconnects: () => void;
}

interface Dependencies {
    spellActionCheckerCreator: typeof SpellActionChecker;
}

export const SpellActionReceiver = (
    { stateManager, cycle, mapManager, checkDeathsAndDisconnects }: Props,
    { spellActionCheckerCreator }: Dependencies = {
        spellActionCheckerCreator: SpellActionChecker
    }
): SpellActionReceiver => {

    const { playerList, get } = stateManager;

    const getLastHash = () => get('battleHashList')[get('battleHashList').length - 1];

    const spellActionChecker = spellActionCheckerCreator(cycle, mapManager);

    const notifyDeaths = (deaths: Character[]): void => {
        if (!deaths.length) {
            return;
        }

        cycle.globalTurn.notifyDeaths();

        checkDeathsAndDisconnects();
    };

    const getOnReceive = (player: Player) => (action: SpellActionCAction): void => {
        const { spellAction } = action;

        const isCheckSuccess = spellActionChecker.check(action, player, get).success;

        const sendConfirmAction = (isOk: boolean, lastCorrectHash: string): void => {

            const partial = isOk
                ? {
                    isOk: true
                } as const
                : {
                    isOk: false,
                    correctBattleSnapshot: {
                        battleHash: getLastHash(),
                        ...battleStateEntityToSnapshot({
                            characters: get('characters'),
                            spells: get('spells')
                        })
                    },
                    debug: {
                        sendHash: spellAction.battleHash,
                    }
                } as const;

            player.socket.send<ConfirmSAction>({
                type: 'confirm',
                lastCorrectHash,
                ...partial
            });
        };

        console.log('isCheckSuccess', isCheckSuccess);

        if (isCheckSuccess) {

            const applySucceed = stateManager.useSpellAction(spellAction, cycle.globalTurn.currentTurn.startTime)
                .onClone()
                .ifCorrectHash((hash, applyOnCurrentState) => {

                    const { deaths } = applyOnCurrentState();

                    sendConfirmAction(true, hash);

                    playerList
                        .filter(p => p.id !== player.id)
                        .forEach(p => p.socket.send<NotifySAction>({
                            type: 'notify',
                            spellActionSnapshot: spellAction,
                        }));

                    const startTimeDelta = Math.max(Date.now() - spellAction.startTime, 0);
                    const notifyDeathsTimeout = spellAction.duration - startTimeDelta;

                    // console.log('Notify deaths in (ms)', notifyDeathsTimeout);

                    // eslint-disable-next-line no-restricted-globals
                    setTimeout(() => notifyDeaths(deaths), notifyDeathsTimeout)
                });

            if (applySucceed) {
                return;
            }
        }

        const lastCorrectHash = getLastHash();

        sendConfirmAction(false, lastCorrectHash);
    };

    return {
        getOnReceive
    };
};
