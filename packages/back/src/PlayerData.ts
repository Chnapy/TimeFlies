import { StaticCharacter } from "@timeflies/shared";
import { WSSocket } from "./transport/ws/WSSocket";

export interface PlayerData {
    id: string;
    name: string;
    state: 'init' | 'battle-prepare' | 'battle-loading' | 'battle-ready';
    socket: WSSocket;
    staticCharacters: StaticCharacter[];
}