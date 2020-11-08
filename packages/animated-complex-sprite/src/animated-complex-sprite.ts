import { Sprite, Spritesheet, Texture, Ticker } from 'pixi.js';
import { Cache, createCache } from './cache';
import { createTickerManager, TickerManager } from './ticker-manager';


export type FlipInfos<C> = {
    direction: 'horizontal' | 'vertical';
    baseConfig: C;
};

type FramesInfosGetter<C> = (config: C) => {
    animationPath: string;
    pingPong?: boolean;
    framesOrder?: number[];
    flip?: FlipInfos<C>;
    framesDurations: number[];
};

type Animations = {
    [ path: string ]: Texture[];
};

type TimedTexture = {
    texture: Texture;
    duration: number;
    textureIndex: number;
};

type TexturesInfos = {
    timedTextures: TimedTexture[];
    tickerInterval: number;
    previousFrame: number;
};

const shallowEqual = (objA: any, objB: any): boolean => {
    if (objA === objB) {
        return true;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    return keysA.length === keysB.length
        && keysA.every(key => objA[ key ] === objB[ key ]);
};

export class AnimatedComplexSprite<C> extends Sprite {

    static durationToInterval = (duration: number) => duration / 3;

    private getFramesInfos: FramesInfosGetter<C>;

    private config: C;

    private animations: Animations;
    private timedTextures: TimedTexture[];

    onLoop?: (currentConfig: C) => void;
    onFrameChange?: (config: C, currentFrame: number, textureIndex: number) => void;

    private previousFrame: number;
    private currentTime: number;

    private readonly tickerManager: TickerManager;
    private tickerInterval: number;

    private readonly cache?: Cache<C, TexturesInfos>;

    constructor(
        spritesheet: Spritesheet,
        getFramesInfos: FramesInfosGetter<C>,
        config: C,
        ticker?: Ticker,
        cache: Cache<C, TexturesInfos> = createCache()
    ) {
        super();

        this.config = config;

        this.animations = spritesheet.animations;
        this.getFramesInfos = getFramesInfos;

        this.currentTime = 0;

        this.tickerManager = createTickerManager(
            this.update.bind(this),
            () => this.tickerInterval,
            ticker
        );

        this.cache = cache;

        const { timedTextures, tickerInterval, previousFrame } = this.getTexturesInfos();
        this.timedTextures = timedTextures;
        this.tickerInterval = tickerInterval;
        this.previousFrame = previousFrame;

        this.updateTexture(true);
    }

    private getTimedTextures(rawTextures: Texture[], framesOrder: number[], framesDurations: number[], pingPong: boolean) {

        const framedTextures = framesOrder.map(index => rawTextures[ index - 1 ])
            .map((texture, frame) => ({
                texture,
                frame,
                textureIndex: framesOrder[frame]
            }));

        if (pingPong && framedTextures.length > 2) {
            framedTextures.push(
                ...framedTextures.slice(1, framedTextures.length - 1).reverse()
            );
        }

        return framedTextures.map(({ texture, frame, textureIndex }): TimedTexture => ({
            texture,
            duration: framesDurations[ frame % framesDurations.length ],
            textureIndex
        }));
    }

    private getCurrentFrame(): number {
        let currentFrame = Math.floor(this.currentTime) % this.timedTextures.length;

        if (currentFrame < 0) {
            currentFrame += this.timedTextures.length;
        }

        return currentFrame;
    }

    private getFinalFramesInfos() {
        const {
            flip,
            ...restInfos
        } = this.getFramesInfos(this.config);

        if (flip) {
            const { flip: innerFlip, ...flipFramesInfos } = this.getFramesInfos(flip.baseConfig);

            if (innerFlip) {
                throw new Error('Cannot use flip baseConfig also flipped');
            }

            return {
                ...flipFramesInfos,
                textureFlipFn: (texture: Texture) => {
                    const flippedTexture = texture.clone();
                    flippedTexture.rotate = flip.direction === 'horizontal' ? 12 : 8;
                    return flippedTexture;
                },
            };
        }

        return {
            ...restInfos,
            textureFlipFn: (texture: Texture) => texture,
        };
    }

    private getTexturesInfos(): TexturesInfos {

        const cachedInfos = this.cache?.getIfExist(this.config);
        if (cachedInfos) {
            return cachedInfos;
        }

        const {
            animationPath,
            pingPong = false,
            framesOrder: rawFramesOrder,
            framesDurations,
            textureFlipFn
        } = this.getFinalFramesInfos();

        const rawTextures = this.animations[ animationPath ];

        if (!rawTextures || !rawTextures.length) {
            throw new Error(`Textures not found with animation path [${animationPath}]`);
        }

        const textures = rawTextures.map(textureFlipFn);

        const framesOrder = rawFramesOrder ?? textures.map((t, i) => i + 1);

        const timedTextures = this.getTimedTextures(textures, framesOrder, framesDurations, pingPong);
        const tickerInterval = AnimatedComplexSprite.durationToInterval(Math.min(...timedTextures.map(t => t.duration)));

        const infos = {
            timedTextures,
            tickerInterval,
            previousFrame: 0
        };
        this.cache?.set(this.config, infos);

        return infos;
    }

    setConfig(config: Partial<C>, options: {
        forceUpdate?: boolean;
        keepTimeState?: boolean;
    } = {}) {
        const newConfig = {
            ...this.config,
            ...config
        };

        const {
            forceUpdate = false,
            keepTimeState = false,
        } = options;

        if (!forceUpdate && shallowEqual(this.config, newConfig)) {
            return;
        }

        this.config = newConfig;

        const { timedTextures, tickerInterval, previousFrame } = this.getTexturesInfos();

        this.timedTextures = timedTextures;
        this.tickerInterval = tickerInterval;
        this.previousFrame = previousFrame;
        if (!keepTimeState) {
            this.currentTime = 0;
        }

        this.tickerManager.resetDeltaMsSum();

        this.updateTexture(true);
    }

    play() {
        this.tickerManager.start();
    }

    private getCurrentDuration(): number {
        return this.timedTextures[ this.getCurrentFrame() ].duration;
    }

    private update(deltaMs: number): void {
        const previousFrame = this.getCurrentFrame();

        let lag = this.currentTime % 1 * this.getCurrentDuration();

        lag += deltaMs;

        while (lag < 0) {
            this.currentTime--;
            lag += this.getCurrentDuration();
        }

        const sign = Math.sign(deltaMs);

        this.currentTime = Math.floor(this.currentTime);

        while (lag >= this.getCurrentDuration()) {
            lag -= this.getCurrentDuration() * sign;
            this.currentTime += sign;
        }

        this.currentTime += lag / this.getCurrentDuration();

        if (previousFrame !== this.getCurrentFrame()) {

            if (this.onLoop && previousFrame === this.timedTextures.length - 1) {
                this.onLoop(this.config);
            }

            this.updateTexture();
        }
    }

    private updateTexture(force?: boolean) {
        const currentFrame = this.getCurrentFrame();

        if (!force && this.previousFrame === currentFrame) {
            return;
        }

        this.previousFrame = currentFrame;

        this.texture = this.timedTextures[ currentFrame ].texture;
        this._cachedTint = 0xFFFFFF;

        if(this.onFrameChange) {
            this.onFrameChange(this.config, currentFrame, this.timedTextures[ currentFrame ].textureIndex);
        }
    }

    stop() {
        this.tickerManager.stop();
    }

    clearCache() {
        this.cache?.clear();
    }

    destroy(...args: Parameters<Sprite[ 'destroy' ]>) {
        this.stop();
        this.clearCache();
        super.destroy(...args);

        delete this.onLoop;
        delete this.onFrameChange;
    }
}
