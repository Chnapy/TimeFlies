import { Assets } from '@timeflies/static-assets';
import { createAudioContext } from '../utils/create-audio-context';

const {
    AudioContextProvider: MusicContextProvider,
    contextList: musicContextList,
    useAudioContext: useMusicContext,
    useAudioVolumeContext: useMusicVolumeContext,
    useAudioVolumeDispatch: useMusicVolumeDispatch,
    useAudioCurrentContext: useMusicCurrentContext,
    useAudioCurrentDispatch: useMusicCurrentDispatch,
    getNextAudio: getNextMusic
} = createAudioContext({
    contextsNamePrefix: 'Music',
    storageAudioVolumeKeyPrefix: 'music',
    defaultAudioVolume: 0.2,
    assets: Assets.musics,
    loop: true
});

export {
    MusicContextProvider,
    musicContextList,
    useMusicContext,
    useMusicVolumeContext,
    useMusicVolumeDispatch,
    useMusicCurrentContext,
    useMusicCurrentDispatch,
    getNextMusic
};

