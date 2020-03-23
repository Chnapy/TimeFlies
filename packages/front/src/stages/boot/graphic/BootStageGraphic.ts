import { StageGraphic } from '../../../canvas/StageGraphic';
import * as PIXI from 'pixi.js';

export const BootStageGraphic = (): StageGraphic => {

    const container = new PIXI.Container();

    const textStyle = new PIXI.TextStyle({
        fill: 'white'
    });
    const text = new PIXI.Text('Boot stage', textStyle);
    container.addChild(text);

    return {
        getContainer() {
            return container;
        }
    };
};
