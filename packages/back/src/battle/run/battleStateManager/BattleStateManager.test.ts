import { PlayerRoom, seedSpellActionSnapshot, SpellActionSnapshot, TeamRoom, BattleSnapshot, createPosition } from '@timeflies/shared';
import util from 'util';
import { WSSocket } from '../../../transport/ws/WSSocket';
import { seedWebSocket } from '../../../transport/ws/WSSocket.seed';
import { IPlayerRoomData } from '../../room/room';
import { BattleState, BattleStateManager } from './BattleStateManager';
import { Team } from '../entities/team/Team';
import { Player } from '../entities/player/Player';
import { normalize } from '@timeflies/shared';

describe('# BattleStateManager', () => {

    const getInitData = () => {
        const playerDataList: IPlayerRoomData<WSSocket>[] = [
            {
                id: 'p1',
                name: 'p1',
                socket: new WSSocket(seedWebSocket().ws)
            }
        ];
        const teamRoomList: TeamRoom[] = [ {
            id: 't1',
            letter: 'A',
            playersIds: [ 'p1' ]
        } ];
        const playerRoomList: PlayerRoom[] = [ {
            id: 'p1',
            name: 'p1',
            characters: [
                {
                    id: 'c1',
                    type: 'sampleChar1',
                    position: { x: 0, y: 0 }
                }
            ]
        } as PlayerRoom ];

        return { playerDataList, playerRoomList, teamRoomList };
    };

    const extractState = (manager: BattleStateManager): BattleState => ({
        battleHashList: manager.get('battleHashList'),
        characters: manager.get('characters'),
        spells: manager.get('spells')
    });

    const expectStateIs = (manager: BattleStateManager, expectedState: BattleState) => {
        for (const key of Object.keys(expectedState)) {
            expect(manager.get(key as any)).toEqual((expectedState as any)[ key ]);
        }
    };

    it('should correctly init battle state', () => {
        const { playerDataList, teamRoomList, playerRoomList } = getInitData();

        const manager = BattleStateManager(playerDataList, teamRoomList, playerRoomList);

        const expected: BattleState = {
            characters: [ expect.objectContaining({
                id: 'c1'
            }) ],
            spells: expect.any(Array),
            battleHashList: []
        };

        const expectedTeamList: Team[] = [ {
            id: 't1',
            letter: 'A'
        } ];

        const expectedPlayerList: Player[] = [ {
            id: 'p1',
            name: 'p1',
            teamId: 't1',
            socket: expect.anything()
        } ];

        expect(manager.teamList).toEqual(expectedTeamList);
        expect(manager.playerList).toEqual(expectedPlayerList);
        expectStateIs(manager, expected);
    });

    it('should return correct first snapshot', () => {
        const { playerDataList, teamRoomList, playerRoomList } = getInitData();

        const manager = BattleStateManager(playerDataList, teamRoomList, playerRoomList, {
            getBattleSnapshotWithHash: (): BattleSnapshot => ({
                launchTime: -1,
                time: -1,
                battleHash: 'hash',
                charactersSnapshots: [],
                spellsSnapshots: []
            })
        });

        const snap = manager.generateFirstSnapshot(100);

        expect(snap).toEqual<BattleSnapshot>({
            launchTime: -1,
            time: -1,
            charactersSnapshots: [],
            spellsSnapshots: [],
            battleHash: 'hash'
        });
        expect(manager.get('battleHashList')).toEqual([ 'hash' ]);
    });

    describe('on spell action', () => {

        it('should not call callback on bad hash', () => {
            const { playerDataList, teamRoomList, playerRoomList } = getInitData();

            const manager = BattleStateManager(playerDataList, teamRoomList, playerRoomList, {
                getBattleSnapshotWithHash: (): BattleSnapshot => ({
                    launchTime: -1,
                    time: -1,
                    charactersSnapshots: [],
                    spellsSnapshots: [],
                    battleHash: 'hash'
                })
            });

            const firstState = util.inspect(extractState(manager));

            const spell = manager.get('spells')[ 0 ];

            const spellAction: SpellActionSnapshot = seedSpellActionSnapshot(spell.id, {
                characterId: spell.characterId,
                battleHash: 'bad-hash',
                duration: 200,
            });

            const callback = jest.fn();

            const succeed = manager.useSpellAction(spellAction)
                .onClone()
                .ifCorrectHash(callback);

            expect(callback).not.toHaveBeenCalled();
            expect(succeed).toBe(false);
            expect(util.inspect(extractState(manager))).toEqual(firstState);
        });

        it('should call callback on correct hash', () => {
            const { playerDataList, teamRoomList, playerRoomList } = getInitData();

            const manager = BattleStateManager(playerDataList, teamRoomList, playerRoomList, {
                getBattleSnapshotWithHash: (): BattleSnapshot => ({
                    launchTime: -1,
                    time: -1,
                    charactersSnapshots: [],
                    spellsSnapshots: [],
                    battleHash: 'hash'
                })
            });

            const firstState = util.inspect(extractState(manager));

            const spell = manager.get('spells')[ 0 ];

            const spellAction: SpellActionSnapshot = seedSpellActionSnapshot(spell.id, {
                characterId: spell.characterId,
                battleHash: 'hash',
                actionArea: normalize([ createPosition(-1, -1) ]),
                duration: 200,
            });

            const callback = jest.fn();

            const succeed = manager.useSpellAction(spellAction)
                .onClone()
                .ifCorrectHash(callback);

            expect(callback).toHaveBeenNthCalledWith(1, 'hash', expect.any(Function));
            expect(succeed).toBe(true);
            expect(util.inspect(extractState(manager))).toBe(firstState);
        });

        it('should change battle state on callback function called', () => {
            const { playerDataList, teamRoomList, playerRoomList } = getInitData();

            const manager = BattleStateManager(playerDataList, teamRoomList, playerRoomList, {
                getBattleSnapshotWithHash: (): BattleSnapshot => ({
                    launchTime: -1,
                    time: -1,
                    charactersSnapshots: [],
                    spellsSnapshots: [],
                    battleHash: 'hash'
                })
            });

            const firstState = util.inspect(extractState(manager));

            const spell = manager.get('spells')[ 0 ];

            const spellAction: SpellActionSnapshot = seedSpellActionSnapshot(spell.id, {
                characterId: spell.characterId,
                battleHash: 'hash',
                actionArea: normalize([ createPosition(-1, -1) ]),
                duration: 200,
            });

            let applyReturn = undefined;

            manager.useSpellAction(spellAction)
                .onClone()
                .ifCorrectHash((hash, applyOnCurrentState) => {

                    applyReturn = applyOnCurrentState();

                });

            expect(applyReturn).toEqual({ deaths: expect.any(Array) });
            expect(util.inspect(extractState(manager))).not.toBe(firstState);
        });

    });

});
