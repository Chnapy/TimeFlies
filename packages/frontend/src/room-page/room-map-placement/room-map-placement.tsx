import { Box, Dialog, Grid, IconButton, makeStyles, ThemeProvider } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { appTheme, UIText } from '@timeflies/app-ui';
import { AssetsLoader, AssetsLoaderMap, useAssetMap } from '@timeflies/assets-loader';
import { CharacterId, Position } from '@timeflies/common';
import { RoomCharacterPlacementMessage } from '@timeflies/socket-messages';
import { Assets } from '@timeflies/static-assets';
import { TilemapComponent } from '@timeflies/tilemap-component';
import React from 'react';
import { Stage } from 'react-pixi-fiber';
import { imagesLinksToTextures } from '../../battle-page/canvas/tilemap/battle-tilemap';
import { useMyPlayerId } from '../../login-page/hooks/use-my-player-id';
import { useRoomSelector } from '../hooks/use-room-selector';
import { useSendRoomUpdate } from '../hooks/use-send-room-update';
import { RoomCharacterButton } from '../room-team/room-character-button';
import { RoomMapPlacementTile } from './room-map-placement-tile';

type RoomMapPlacementProps = {
    open: boolean;
    onClose: () => void;
};

const useStyles = makeStyles(({ spacing }) => ({
    root: {
        overflow: 'hidden'
    },
    content: {
        height: '100%',
        padding: spacing(2)
    },
    list: {
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
    }
}));

const InnerRoomMapPlacement: React.FC<RoomMapPlacementProps> = ({ open, onClose }) => {
    const classes = useStyles();
    const sendRoomUpdate = useSendRoomUpdate();
    const mapInfos = useRoomSelector(state => state.mapInfos!);
    const mapPlacementTiles = useRoomSelector(state => state.mapPlacementTiles);
    const teamColorList = useRoomSelector(state => state.teamColorList);
    const myPlayerId = useMyPlayerId();
    const myTeamColor = useRoomSelector(state => state.staticPlayerList[ myPlayerId ].teamColor);
    const characterList = useRoomSelector(state => Object.values(state.staticCharacterList));
    const [ selectedCharacterId, setSelectedCharacterId ] = React.useState<CharacterId | null>(null);

    const mapAssets = useAssetMap(mapInfos.name);
    if (!mapAssets) {
        return null;
    }

    const { schema } = mapAssets;

    const charactersToPlace = characterList.filter(character =>
        character.playerId === myPlayerId && !character.placement
    );

    const getPlacementSelect = (characterId: CharacterId, position: Position | null) => async () => {
        await sendRoomUpdate(RoomCharacterPlacementMessage({
            characterId,
            position
        }));
        setSelectedCharacterId(null);
    };

    const stageScale = 2;
    const tileRealSize = schema.tilewidth * stageScale;
    const stageSize = {
        width: schema.width * tileRealSize,
        height: schema.height * tileRealSize
    };

    const tileList = teamColorList.flatMap(teamColor => {
        const tiles = mapPlacementTiles[ teamColor ];
        const isMyTeam = teamColor === myTeamColor;

        return tiles.map(position => {
            const x = position.x * tileRealSize;
            const y = position.y * tileRealSize;

            const presentCharacter = characterList.find(character => character.placement?.id === position.id);
            const canRemove = presentCharacter?.playerId === myPlayerId;
            const canAdd = !!selectedCharacterId
                && isMyTeam
                && !presentCharacter;

            const onClick = selectedCharacterId
                ? getPlacementSelect(selectedCharacterId, position)
                : (presentCharacter
                    ? getPlacementSelect(presentCharacter.characterId, null)
                    : undefined);

            return (
                <RoomMapPlacementTile
                    key={position.id}
                    x={x}
                    y={y}
                    size={tileRealSize}
                    showIcon={isMyTeam}
                    teamColor={teamColor}
                    characterId={presentCharacter?.characterId}
                    onClick={onClick}
                    disabledAdd={!canAdd}
                    disabledRemove={!canRemove}
                />
            );
        });
    });

    return (
        <Dialog classes={{ paper: classes.root }} fullScreen open={open} onClose={onClose}>
            <Grid className={classes.content} container direction='column' wrap='nowrap' spacing={2}>

                <Grid item>
                    <Grid container justify='space-between' spacing={1}>
                        <Grid item>
                            <UIText variant='h3'>Character placement</UIText>
                        </Grid>

                        <Grid item>
                            <Grid container spacing={1}>
                                <Grid container spacing={1}>
                                    {charactersToPlace.map(({ characterId }) => (
                                        <Grid key={characterId} item>
                                            <RoomCharacterButton
                                                characterId={characterId}
                                                showOutline={characterId === selectedCharacterId}
                                                onClick={() => setSelectedCharacterId(characterId)}
                                                size={44}
                                            />
                                        </Grid>
                                    ))}
                                    <Grid item>
                                        <IconButton onClick={onClose}>
                                            <CloseIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid className={classes.list} item>

                    <Box position='relative'>
                        <Stage options={stageSize} scale={stageScale}>
                            <ThemeProvider theme={appTheme}>

                                <TilemapComponent
                                    mapSheet={schema}
                                    mapTexture={imagesLinksToTextures(mapAssets.images)}
                                    tilesRange={{}}
                                    tilesAction={{}}
                                    tilesCurrentAction={{}}
                                    onTileMouseHover={() => { }}
                                >
                                    {{}}
                                </TilemapComponent>

                            </ThemeProvider>
                        </Stage>

                        {tileList}
                    </Box>

                </Grid>
            </Grid>
        </Dialog>
    );
};

export const RoomMapPlacement: React.FC<RoomMapPlacementProps> = props => {
    const mapInfos = useRoomSelector(state => state.mapInfos);
    const assetsLoaderProps = React.useMemo<AssetsLoaderMap | null>(() => (mapInfos && {
        spritesheets: Assets.spritesheets,
        maps: { [ mapInfos.name ]: mapInfos.schemaLink }
    }), [ mapInfos ]);

    if (!assetsLoaderProps) {
        return null;
    }

    return <AssetsLoader {...assetsLoaderProps}>
        <InnerRoomMapPlacement {...props} />
    </AssetsLoader>;
};
