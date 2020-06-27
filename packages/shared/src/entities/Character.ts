import { Orientation, Position } from '../geo';
import { StaticSpell } from "./Spell";

export type CharacterType =
    | 'sampleChar1'
    | 'sampleChar2'
    | 'sampleChar3';

export type CharacterFeatures = {
    life: number;
    actionTime: number;
};

export type StaticCharacter = {
    id: string;
    name: string;
    type: CharacterType;
    initialFeatures: CharacterFeatures;
    staticSpells: StaticSpell[];
    defaultSpellId: string;
};

export type CharacterSnapshot = {
    id: string;
    playerId: string;
    staticData: Readonly<StaticCharacter>;
    position: Position;
    orientation: Orientation;
    features: CharacterFeatures;
};

export type CharacterRoom = {
    readonly id: string;
    readonly type: CharacterType;
    position: Position;
};
