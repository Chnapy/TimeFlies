import { Box, Card } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { denormalize } from '@timeflies/shared';
import React from 'react';
import { useGameStep } from '../../hooks/useGameStep';
import { SpellButton } from './spell-button/spell-button';

const useStyles = makeStyles(() => ({
    root: {
        pointerEvents: 'all',
        display: 'inline-flex'
    }
}));

export const SpellPanel: React.FC = () => {

    const classes = useStyles();

    const { spellIdList } = useGameStep('battle',
        ({ cycleState, snapshotState }) => {

            const { currentCharacterId } = cycleState;

            const spellIdList = denormalize(snapshotState.battleDataCurrent.spells)
                .filter(s => s.characterId === currentCharacterId)
                .map(s => s.id);

            return {
                characterId: currentCharacterId,
                spellIdList
            };
        },
        (a, b) => a.characterId === b.characterId
    );

    return <Card className={classes.root}>
        <Box display='flex' flexWrap='nowrap' p={2}>

            {spellIdList.map((spellId, i) => <Box key={spellId} ml={i && 1}>
                <SpellButton spellId={spellId} />
            </Box>)}

        </Box>
    </Card>;
};
