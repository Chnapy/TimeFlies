import { Typography, TypographyProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Variant } from '@material-ui/core/styles/createTypography';
import clsx from 'clsx';
import React from 'react';

type UITypographyVariant = Extract<Variant, 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2'>
    | 'bodyMini'
    | 'labelMini'
    | 'numeric';

export type UITypographyProps = Omit<TypographyProps, 'variant'> & {
    variant: UITypographyVariant;
    component?: React.ReactType;
};

const useStyles = makeStyles(() => ({
    bodyMini: {
        fontSize: '0.8rem'
    },
    labelMini: {
        fontSize: '0.8rem',
        textTransform: 'uppercase'
    },
    numeric: {
        fontFamily: '"monogram"',
        fontSize: '1.6rem'
    }
}));

export const UITypography: React.FC<UITypographyProps> = ({ variant, ...rest }) => {

    const classes = useStyles();

    if (variant === 'bodyMini') {
        return <Typography {...rest} className={clsx(classes.bodyMini, rest.className)} variant='body2' />;
    }

    if (variant === 'labelMini') {
        return <Typography {...rest} className={clsx(classes.labelMini, rest.className)} variant='body2' />;
    }

    if (variant === 'numeric') {
        return <Typography {...rest} className={clsx(classes.numeric, rest.className)} variant='body2' />;
    }

    return <Typography variant={variant} {...rest} />;
};
