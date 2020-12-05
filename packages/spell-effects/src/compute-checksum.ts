import { SerializableState } from '@timeflies/common';
import crypto from 'crypto-js/sha1';

const DELIM = '|';

const stringify = (obj: unknown): string => {
    if (Array.isArray(obj)) {
        const stringifiedArr: string[] = [];
        for (let i = 0; i < obj.length; i++) {
            stringifiedArr[ i ] = stringify(obj[ i ]);
        }

        return JSON.stringify(stringifiedArr)
    } else if (typeof obj === 'object' && obj !== null) {
        const acc: string[] = [];
        const sortedKeys = Object.keys(obj).sort() as (keyof typeof obj)[];

        for (let i = 0; i < sortedKeys.length; i++) {
            const k = sortedKeys[ i ];
            acc[ i ] = `${k}:${stringify(obj[ k ])}`;
        }

        return acc.join(DELIM);
    }

    return obj as string;
};

const digest = (obj: unknown) => crypto(stringify(obj)).toString();

export const computeChecksum = ({ characters, spells }: Pick<SerializableState, 'characters' | 'spells'>): string => {
    return digest({ characters, spells });
};
