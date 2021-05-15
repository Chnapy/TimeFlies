import { SerializableState, SpellAction, spellActionSchema } from '@timeflies/common';
import * as joi from 'joi';
import { createMessage } from '../../message';

export type BattleSpellActionData = {
    spellAction: SpellAction;
};

export type BattleSpellActionResponseData =
    | { success: true }
    | {
        success: false;
        lastState: SerializableState;
    };

export const BattleSpellActionMessage = createMessage<BattleSpellActionData>('battle/spell-action', joi.object({
    spellAction: spellActionSchema
}))
    .withResponse<BattleSpellActionResponseData>();
