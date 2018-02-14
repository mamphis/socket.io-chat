export class User {
    private _socket: SocketIO.Socket;
    private _name: string;
    private _clientId: string;
    private _remoteAddress: string;

    constructor(clientId: string, socket: SocketIO.Socket) {
        this._clientId = clientId;
        this._name = '';
        this._socket = socket;
        this._remoteAddress = socket.conn.remoteAddress;
    }

    get name(): string {
        return this._name;
    }

    get clientId(): string {
        return this._clientId;
    }

    set name(value: string) {
        this._name = value;
    }

    get remoteAddress(): string {
        return this._remoteAddress;
    }
}
