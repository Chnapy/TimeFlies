import { BattleTurnStartAction } from '../../phaser/battleReducers/BattleReducerManager';
import { Spell } from '../../phaser/entities/Spell';
import { RectStyled, RectStyleProperties } from '../generics/RectStyled';
import { HUDScene } from '../HUDScene';
import { SpellBtn } from './SpellBtn';

export class SpellPane extends RectStyled<SpellBtn> {

    constructor(scene: HUDScene) {
        super(scene);
    }

    protected updateChild(child: SpellBtn, index: number, size: number): void {

        const spellWidth = this.style.width / size;
        const spellHeight = this.style.height;

        child.resize(index * spellWidth, 0, spellWidth, spellHeight);
    }

    private setSpells(spells: Spell[]): void {
        this.clearChildren();

        this.addChildren(...spells.map(s => new SpellBtn(this.scene, s)));
    }

    private readonly onTurnStart = this.reduce<BattleTurnStartAction>('battle/turn/start', ({
        character: {isMine, spells}, time
    }) => {
        this.setSpells(isMine ? spells : []);
    });

    protected getDefaultStyle(): RectStyleProperties {
        return {
            ...super.getDefaultStyle(),

            fillColor: 0x888888,

            strokeWidth: 1,

            strokeColor: 0xFFFFFF
        };
    }
}