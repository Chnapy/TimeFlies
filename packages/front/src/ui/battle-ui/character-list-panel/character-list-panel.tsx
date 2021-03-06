import { Box, Paper } from '@material-ui/core';
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import { denormalize } from '@timeflies/shared';
import React from 'react';
import { shallowEqual } from 'react-redux';
import { useGameStep } from '../../hooks/useGameStep';
import { CharacterItem } from './character-item/character-item';

const useStyles = makeStyles(() => ({
    root: {
        pointerEvents: 'all',
        flexGrow: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden'
    }
}));

export const CharacterListPanel: React.FC = () => {

    const classes = useStyles();

    const { palette } = useTheme<Theme>();

    const [ current, ...charactersIds ] = useGameStep(
        'battle',
        ({ snapshotState, cycleState }) => denormalize(snapshotState.battleDataCurrent.characters)
            .map(c => c.id)
            .sort((a, b) => cycleState.currentCharacterId === a ? -1 : 1),
        shallowEqual
    );

    if (!current) {
        return null;
    }

    return <Paper className={classes.root}>

        <Box display='flex' flexDirection='column' overflow='auto'>
            {charactersIds.map((id, i) => <Box key={id} position='relative' p={1}>
                <VerticalLine top={i > 0} bottom color={palette.background.default} />
                <CharacterItem characterId={id} />
            </Box>)}
        </Box>

        <Box position='relative' p={1}>
            <VerticalLine top color={palette.background.default} />
            <CharacterItem characterId={current} />
        </Box>
    </Paper>
};

const lineWidth = 2;

const VerticalLine: React.FC<{
    top?: boolean;
    bottom?: boolean;
    color: string;
}> = ({ top, bottom, color }) => {

    const left = 12 - lineWidth / 2;

    return (
        <>
            {top && <Box position='absolute' ml={1} left={left} top={0} width={lineWidth} height='60%' bgcolor={color} />}
            {bottom && <Box position='absolute' ml={1} left={left} bottom={0} width={lineWidth} height='40%' bgcolor={color} />}
        </>
    );
};
