import { AuthRequestBody, AuthResponseBody, AuthServerAction, PlayerCredentials, WSQueryParams } from '@timeflies/shared';
import { RequestHandler } from 'express-serve-static-core';
import { Algorithm as JwtAlgorithm, sign as jwtSign } from 'jsonwebtoken';
import { parse as parseURL } from 'url';
import WebSocket from 'ws';
import { envManager } from '../../envManager';
import { WSError } from '../../transport/ws/WSError';
import { WSSocket } from '../../transport/ws/WSSocket';
import { Util } from '../../Util';
import { IPlayerRoomData } from '../room/room';

type JwtPayload = {
    id: string;
    playerName: string;
};

export type Auth = ReturnType<typeof Auth>;

// TODO config
const privateKey = envManager.JWT_PRIVATE_KEY;
const jwtAlgo: JwtAlgorithm = 'HS256';

// TODO check with lib like yup
export const playerNameConstraints = {
    length: { min: 3, max: 12 }
} as const;

type Dependencies = {
    initialPlayerCredList: PlayerCredentials[];
};

export const Auth = ({ initialPlayerCredList }: Dependencies = { initialPlayerCredList: [] }) => {

    const playerCredList: PlayerCredentials[] = [ ...initialPlayerCredList ];

    const playerWithNameExist = (playerName: string) => playerCredList
        .some(p => p.name.toLowerCase() === playerName.toLowerCase());

    return {

        route: (): RequestHandler<never, AuthResponseBody, AuthRequestBody> => (req, res, next) => {
            const playerName = req.body?.playerName;

            if (
                !playerName
                || playerName.length < playerNameConstraints.length.min
                || playerName.length > playerNameConstraints.length.max
            ) {
                res.sendStatus(400);
                return;
            }

            // check if player name already exist
            if (playerWithNameExist(playerName)) {
                res.status(400)
                    .json({
                        success: false,
                        error: 'player-name-exist'
                    });
                return;
            }

            // create ID
            const id = Util.getUnique();

            const tokenPayload: JwtPayload = {
                id,
                playerName
            };

            // create token
            const token = jwtSign(tokenPayload, privateKey, {
                algorithm: jwtAlgo
            });

            // add player to list
            const playerCredentials: PlayerCredentials = {
                id,
                name: playerName,
                token
            };

            playerCredList.push(playerCredentials);

            // send token
            res.status(200)
                .json({
                    success: true,
                    token
                });
        },

        onClientSocket: (rawSocket: WebSocket): IPlayerRoomData<WSSocket> | null => {

            const socketPool = new WSSocket(rawSocket).createPool();

            const sendErrorThenClose = (error: WSError) => {
                socketPool.sendError(error);
                socketPool.close();
                rawSocket.close();
                return null;
            };

            // https://toto.com?token=abc
            const { url } = rawSocket;

            // extract url params
            const authQuery: Partial<WSQueryParams> = parseURL(url, true).query;

            const { token } = authQuery;

            // check token
            if (!token) {
                return sendErrorThenClose(new WSError(401, 'token is missing'));
            }

            const playerCredentials = playerCredList.find(p => p.token === token);

            if (!playerCredentials) {
                return sendErrorThenClose(new WSError(401, 'token is invalid'));
            }

            socketPool.send<AuthServerAction>({
                type: 'auth/credentials',
                credentials: playerCredentials
            });

            const socket = socketPool.close();

            return {
                id: playerCredentials.id,
                name: playerCredentials.name,
                socket
            };
        }
    }
};
