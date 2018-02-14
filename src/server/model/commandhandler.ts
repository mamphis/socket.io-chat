import { UserHandler } from "./userhandler";
import { Message } from "./message";
import { Dictionary } from "../utils/idictionary";

export class CommandHandler {

    private io: SocketIO.Server;
    private userHandler: UserHandler;

    private commands: Dictionary<(from: { clientId: string, name: string }, text: string, clientSocket: SocketIO.Socket) => void> = new Dictionary();

    constructor(userHandler: UserHandler, io: SocketIO.Server) {
        this.userHandler = userHandler;
        this.io = io;
    }

    availableCommands(): string[] {
        return Object.keys(this.commands).sort((a, b) => {return a.localeCompare(b)}).map(val => '/' + val).sort();
    }

    register(command: string | string[], handler: (from: { clientId: string, name: string }, text: string, clientSocket: SocketIO.Socket) => void): void {
        if (typeof command == 'string') {
            this.commands[command] = handler;
        } else {
            command.forEach(cmd => {
                this.commands[cmd] = handler;
            });
        }
    }

    handle(from: { clientId: string, name: string }, msgObj: Message, clientSocket: SocketIO.Socket): void {
        let cmdText = msgObj.text.substring(this.COMMAND_PREFIX.length);
        let cmd = cmdText.split(' ')[0];
        let text = cmdText.substring(cmdText.indexOf(' ') > 0 ? cmdText.indexOf(' ') + 1 : this.COMMAND_PREFIX.length + cmd.length);

        if (this.commands[cmd]) {
            this.commands[cmd](from, text, clientSocket);
        }
    }

    readonly COMMAND_PREFIX: string = '/';
}