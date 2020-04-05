import { ClientAction, DistributiveOmit } from "@timeflies/shared";
import { Controller } from "../Controller";
import { SendMessageAction } from "../socket/WSClient";

type ClientActionWOSendTime<A extends ClientAction> = DistributiveOmit<A, 'sendTime'>;

type Params<A extends ClientAction> = {
    [ K in string ]: (...args) => ClientActionWOSendTime<A>;
};

type Return<P extends Params<A>, A extends ClientAction> = {
    [ K in keyof P ]: P[ K ] extends (...args) => ClientActionWOSendTime<infer A>
    ? (...args: Parameters<P[ K ]>) => SendMessageAction<A>
    : never;
};

export const serviceNetwork = async <P extends Params<A>, A extends ClientAction>(map: P): Promise<Return<P, A>> => {

    const { actionManager } = Controller;

    await Controller.waitConnect();

    return Object.entries(map)
        .reduce((arr, [ key, value ]) => {

            arr[ key ] = (...args) => actionManager.dispatch({
                type: 'message/send',
                message: value(...args)
            });

            return arr;
        }, {}) as Return<P, A>;
};