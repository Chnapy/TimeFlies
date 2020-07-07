import { CharacterRole, getOrientationFromTo, Orientation } from '@timeflies/shared';
import * as PIXI from 'pixi.js';
import { shallowEqual } from 'react-redux';
import { CanvasContext } from '../../../../../canvas/CanvasContext';
import { requestRender } from '../../../../../canvas/GameCanvas';
import { BattleDataPeriod } from '../../../snapshot/battle-data';
import { getBattleData } from '../../../snapshot/snapshot-reducer';

export interface CharacterSpriteProps {
    characterRole: CharacterRole;
    characterState: CharacterSpriteState;
    orientation: Orientation;
}

export type CharacterSpriteMutableProps = Pick<CharacterSpriteProps,
    | 'characterState'
    | 'orientation'
>;

export type CharacterSpriteState = 'idle' | 'walk';

export const getAnimPath = (
    type: CharacterRole,
    state: CharacterSpriteState,
    orientation: Orientation
) => `${type}/${state}/${orientation}/${type}_${state}_${orientation}`;

const getTextures = (
    spritesheet: PIXI.Spritesheet,
    { characterRole, characterState, orientation }: CharacterSpriteProps
): PIXI.Texture[] => {

    const path = getAnimPath(characterRole, characterState, orientation);
    const textures = spritesheet.animations[ path ];

    // If texture not found, get sampleChar1 as default
    if (!textures) {
        return getTextures(spritesheet, { characterRole: 'sampleChar1', characterState, orientation });
    }

    return textures;
};

export const CharacterSprite = class extends PIXI.AnimatedSprite {

    constructor(characterId: string, period: BattleDataPeriod) {
        super([ PIXI.Texture.EMPTY ]);

        const { storeEmitter, spritesheets } = CanvasContext.consumer('storeEmitter', 'spritesheets');

        storeEmitter.onStateChange(
            ({ battle }) => {
                const { snapshotState, } = battle;
                const character = getBattleData(snapshotState, period).characters[ characterId ];

                const { currentSpellAction, battleDataFuture } = snapshotState;

                if (currentSpellAction && currentSpellAction.characterId === characterId) {
                    const spell = battleDataFuture.spells[ currentSpellAction.spellId ];

                    const spriteState: CharacterSpriteState = spell.staticData.role === 'move' ? 'walk' : 'idle'

                    return {
                        type: character.staticData.role,
                        orientation: getOrientationFromTo(character.position, currentSpellAction.position),
                        spriteState
                    };
                }

                return {
                    type: character.staticData.role,
                    orientation: character.orientation,
                    spriteState: 'idle' as CharacterSpriteState
                };
            },
            ({ type, orientation, spriteState }) => {
                this.textures = getTextures(spritesheets.characters, {
                    characterRole: type,
                    characterState: spriteState,
                    orientation
                });
                this.width = this.textures[0].frame.width;
                this.height = this.textures[0].frame.height;
                this.play();
                requestRender();
            },
            shallowEqual
        );
    }
};
