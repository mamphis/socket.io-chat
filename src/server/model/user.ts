export class User {
    private _socket: SocketIO.Socket;
    private _name: string;
    private _clientId: string;
    private _remoteAddress: string;
    private _currentRoom: string;

    constructor(clientId: string, socket: SocketIO.Socket) {
        this._clientId = clientId;
        this._name = '';
        this._socket = socket;
        this._remoteAddress = socket.conn.remoteAddress;
        this._currentRoom = 'room1';
    }

    get name(): string {
        return this._name;
    }

    get clientId(): string {
        return this._clientId;
    }

    get remoteAddress(): string {
        return this._remoteAddress;
    }

    get currentRoom(): string {
        return this._currentRoom;
    }

    set name(value: string) {
        this._name = value;
    }

    set currentRoom(value: string) {
        this._currentRoom = value;
    }
}
