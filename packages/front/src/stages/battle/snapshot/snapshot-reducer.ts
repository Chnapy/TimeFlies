import { createReducer } from '@reduxjs/toolkit';
import { assertIsDefined, BattleSnapshot, getBattleSnapshotWithHash } from '@timeflies/shared';
import { BattleStartAction } from '../battle-actions';
import { BattleStateTurnEndAction, BattleStateTurnStartAction } from '../battleState/battle-state-actions';
import { Character, characterToSnapshot } from '../entities/character/Character';
import { Player, playerToSnapshot } from '../entities/player/Player';
import { Spell, spellToSnapshot } from '../entities/spell/Spell';
import { Team, teamToSnapshot } from '../entities/team/Team';
import { SpellActionTimerEndAction } from '../spellAction/spell-action-actions';
import { BattleDataPeriod, periodList } from './battle-data';
import { BattleCommitAction } from './snapshot-manager-actions';

type BattleData<P extends BattleDataPeriod> = {
    battleHash: string;
    teams: Team<P>[];
    players: Player<P>[];
    characters: Character<P>[];
    spells: Spell<P>[];
};

export type SnapshotState = {
    snapshotList: BattleSnapshot[];
    launchTime: number;
    battleDataCurrent: BattleData<'current'>;
    battleDataFuture: BattleData<'future'>;
};

export const getBattleData = <P extends BattleDataPeriod>(state: SnapshotState, period: P): BattleData<P> => period === 'current'
    ? state.battleDataCurrent as BattleData<P>
    : state.battleDataFuture as BattleData<P>;

// export const assertEntitySnapshotConsistency = <S extends { id: string; }>(
//     entityList: PeriodicEntity<any, S>[],
//     snapshotList: S[]
// ): void | never => {
//     const serialize = (list: { id: string; }[]) => list.map(i => i.id).sort().join('.');

//     if (serialize(entityList) !== serialize(snapshotList)) {
//         throw new Error(`Ids of entities differs from these snapshots [${serialize(entityList)}]<->[${serialize(snapshotList)}].
//         There is an inconsistence front<->back.`);
//     }
// }

const assertHashIsInSnapshotList = (
    hash: string,
    snapshotList: { battleHash: string }[]
): void | never => {
    if (!snapshotList.some(snap => snap.battleHash === hash)) {
        throw new Error(`Hash <${hash}> not found in snapshot list.
        There is an inconsistence front<->back.`);
    }
};

const getInitialBattleData = (): BattleData<any> => ({
    battleHash: '',
    spells: [],
    characters: [],
    players: [],
    teams: []
});

const initialState: SnapshotState = {
    snapshotList: [],
    launchTime: -1,
    battleDataCurrent: getInitialBattleData(),
    battleDataFuture: getInitialBattleData(),
};

const getLastSnapshot = (snapshotList: BattleSnapshot[]): BattleSnapshot | undefined => snapshotList[ snapshotList.length - 1 ];

const commit = (state: SnapshotState, time: number): void => {

    const { launchTime, snapshotList } = state;
    const { teams, players, characters, spells } = state.battleDataFuture;

    const isFirstSnapshot = !snapshotList.length;

    const partialSnap: Omit<BattleSnapshot, 'battleHash'> = {
        time,
        launchTime,
        teamsSnapshots: teams.map(teamToSnapshot),
        playersSnapshots: players.map(playerToSnapshot),
        charactersSnapshots: characters.map(characterToSnapshot),
        spellsSnapshots: spells.map(spellToSnapshot)
    };

    const snap: BattleSnapshot = getBattleSnapshotWithHash(partialSnap);

    snapshotList.push(snap);

    state.battleDataFuture.battleHash = snap.battleHash;

    if (isFirstSnapshot) {
        state.battleDataCurrent.battleHash = snap.battleHash;
    }
};

const updateBattleDataFromSnapshot = (data: BattleData<any>, period: BattleDataPeriod, {
    battleHash, teamsSnapshots, playersSnapshots, charactersSnapshots, spellsSnapshots
}: BattleSnapshot) => {

    data.battleHash = battleHash;
    data.spells = spellsSnapshots.map(snap => Spell(period, snap));
    data.characters = charactersSnapshots.map(snap => Character(period, snap));
    data.players = playersSnapshots.map(snap => Player(period, snap));
    data.teams = teamsSnapshots.map(snap => Team(period, snap));
};

export const snapshotReducer = createReducer(initialState, {
    [ BattleStartAction.type ]: (state, { payload }: BattleStartAction) => {
        const { battleHash, spellsSnapshots, charactersSnapshots, playersSnapshots, teamsSnapshots } = payload.entitiesSnapshot;

        periodList.forEach(period => {

            const data = getBattleData(state, period);

            data.battleHash = battleHash;
            data.spells = spellsSnapshots.map(snap => Spell(period, snap));
            data.characters = charactersSnapshots.map(snap => Character(period, snap));
            data.players = playersSnapshots.map(snap => Player(period, snap));
            data.teams = teamsSnapshots.map(snap => Team(period, snap));
        });
    },
    [ BattleCommitAction.type ]: (state, { payload: { time } }: BattleCommitAction) => {
        commit(state, time);
    },
    [ BattleStateTurnStartAction.type ]: (state, action: BattleStateTurnStartAction) => {
        commit(state, Date.now());
    },
    [ BattleStateTurnEndAction.type ]: (state, action: BattleStateTurnEndAction) => {

        const now = Date.now();

        while (getLastSnapshot(state.snapshotList)!.time >= now) {
            state.snapshotList.pop();
        }

        const currentSnapshot = getLastSnapshot(state.snapshotList);
        assertIsDefined(currentSnapshot);

        updateBattleDataFromSnapshot(state.battleDataFuture, 'future', currentSnapshot);
        updateBattleDataFromSnapshot(state.battleDataCurrent, 'current', currentSnapshot);
    },
    [ SpellActionTimerEndAction.type ]: (state, { payload: { removed, correctHash } }: SpellActionTimerEndAction) => {

        if (removed) {
            assertHashIsInSnapshotList(correctHash, state.snapshotList);

            while (getLastSnapshot(state.snapshotList)!.battleHash !== correctHash) {
                state.snapshotList.pop();
            }

            const currentSnapshot = getLastSnapshot(state.snapshotList)!;
            updateBattleDataFromSnapshot(state.battleDataFuture, 'future', currentSnapshot);

            if (currentSnapshot.time < Date.now()) {
                updateBattleDataFromSnapshot(state.battleDataCurrent, 'current', currentSnapshot);
            }
        } else {

            const snapshot = state.snapshotList.find(s => s.battleHash === correctHash);

            assertIsDefined(snapshot);

            updateBattleDataFromSnapshot(state.battleDataCurrent, 'current', snapshot);
        }
    }
});


