import { ObjectTyped, PlayerId } from '@timeflies/common';
import { BattleNotifyMessage, BattleSpellActionMessage } from '@timeflies/socket-messages';
import { SocketCell } from '@timeflies/socket-server';
import { CheckSpellParams, spellActionCheck } from '@timeflies/spell-checker';
import { getSpellRangeArea } from '@timeflies/spell-effects';
import { Service } from '../../service';

export class SpellActionBattleService extends Service {
    afterSocketConnect = (socketCell: SocketCell, currentPlayerId: PlayerId) => {
        this.addBattleSpellActionMessageListener(socketCell, currentPlayerId);
    };

    private addBattleSpellActionMessageListener = (socketCell: SocketCell, currentPlayerId: PlayerId) => socketCell.addMessageListener<typeof BattleSpellActionMessage>(BattleSpellActionMessage, async ({ payload, requestId }) => {
        const battle = this.getBattleByPlayerId(currentPlayerId);

        const { tiledMap, staticState, getCurrentTurnInfos, getCurrentState } = battle;
        const { spellAction } = payload;

        const lastState = getCurrentState();
        const turnInfos = getCurrentTurnInfos()!;

        const staticSpell = staticState.spells[ spellAction.spellId ];

        const spellRangeArea = lastState.spells.rangeArea[ staticSpell.spellId ];
        const spellLineOfSight = lastState.spells.lineOfSight[ staticSpell.spellId ];
        const characterList = ObjectTyped.keys(staticState.characters);
        const charactersPositions = lastState.characters.position;

        const context: CheckSpellParams[ 'context' ] = {
            clientContext: {
                playerId: currentPlayerId
            },
            currentTurn: {
                playerId: staticState.characters[ turnInfos.characterId ].playerId,
                characterId: turnInfos.characterId,
                startTime: turnInfos.startTime
            },
            map: {
                tiledMap,
                rangeArea: getSpellRangeArea(staticSpell.spellRole, {
                    tiledMap,
                    rangeArea: spellRangeArea,
                    lineOfSight: spellLineOfSight,
                    characterList,
                    charactersPositions,
                    playingCharacterId: turnInfos.characterId
                })
            },
            state: lastState,
            staticState
        };

        const checkResult = await spellActionCheck({
            spellAction,
            context
        });

        if (!checkResult.success) {
            return BattleSpellActionMessage.createResponse(requestId, {
                success: false,
                lastState
            });
        }

        const stateEndTime = spellAction.launchTime + spellAction.duration;

        battle.staticPlayers
            .filter(player => player.playerId !== currentPlayerId)
            .map(player => this.playerSocketMap[ player.playerId ])
            .forEach(playerSocketCell => {
                playerSocketCell.send(BattleNotifyMessage({
                    spellAction,
                    spellEffect: checkResult.spellEffect
                }))
            });

        void battle.addNewState(checkResult.newState, stateEndTime);

        return BattleSpellActionMessage.createResponse(requestId, { success: true });
    });
}