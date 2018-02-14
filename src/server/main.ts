import * as express from 'express';
import * as socketIo from 'socket.io';
import * as http from 'http';
import * as https from 'https';

import { Request, Response } from 'express';
import { UserHandler } from './model/userhandler';
import { User } from './model/user';
import { CommandHandler } from './model/commandhandler';
import { Message } from './model/message';
import { json } from 'body-parser';

export class Main {
    private cmdHandler: CommandHandler;
    private userHandler: UserHandler;
    private port: number;
    private server: express.Application;
    private httpServer: http.Server;
    private io: SocketIO.Server;

    constructor(port: number) {
        this.port = port;
        this.server = express();
        this.httpServer = http.createServer(this.server);
        this.io = socketIo(this.httpServer);
        this.userHandler = new UserHandler();
        this.cmdHandler = new CommandHandler(this.userHandler, this.io);

        this.registerCommands();
        this.configure();
        this.ioEnable();
    }

    registerCommands() {
        this.cmdHandler.register('ping', (from, text, socket) => {
            if (text != '') {
                text = 'pong ' + text;
            } else {
                text = 'pong';
            }

            socket.emit('newClientMessage', from, new Message(text, { class: 'private' }));
        });

        this.cmdHandler.register(['tenor', 'gif'], (from, text, socket) => {
            if (text == '') {
                return;
            }

            let url: string = 'https://api.tenor.com/v1/search?q=' + encodeURI(text);
            https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    let obj = JSON.parse(data);
                    let gifResult = obj.results[0];
                    if (gifResult) {
                        this.io.emit('newClientMessage', from, new Message('tenor: ' + text, { img: gifResult.media[0].gif.url }));
                    }
                });
            });
        });

        this.cmdHandler.register('tts', (from, text, socket) => {
            this.io.emit('newClientMessage', from, new Message(text, { tts: text }));
        });

        this.cmdHandler.register(['private', 'to', 'msg'], (from, text, socket) => {
            let u = text.split(' ')[0];
            let user = this.userHandler.findUserByName(u);
            let msg = text.substring(u.length + 1);

            if (user) {
                this.io.sockets.sockets[user.clientId].emit('newClientMessage', from, new Message(msg, { class: 'private' }));
                socket.emit('newClientMessage', from, new Message('[' + user.name + '] ' + msg, { class: 'private' }));
            }
        });

        this.cmdHandler.register(['tableflip', 'tf'], (from, text, socket) => {
            this.io.emit('newClientMessage', from, new Message(text + '(╯°□°）╯︵ ┻━┻'));
        });

        this.cmdHandler.register(['shrug', 'hmm'], (from, text, socket) => {
            this.io.emit('newClientMessage', from, new Message(text + '¯\\_(ツ)_/¯'));
        });

        this.cmdHandler.register('ip', (from, text, socket) => {
            let info = '';
            if (text == '') {
                info = from.name + ': ' + this.userHandler.findUserByName(from.name).remoteAddr;
            } else {
                info = text + ': ' + this.userHandler.findUserByName(text).remoteAddr;
            }

            socket.emit('newClientMessage', from, new Message(info, { class: 'private' }));
        });

        this.cmdHandler.register('changeUserName', (from, text, socket) => {
            if (text == '') {
                socket.emit('logon', this.userHandler.findUserById(from.clientId));
            } else {
                this.userHandler.update(from.clientId, text);
                this.io.emit('expectUserRefresh', undefined);
            }
        });
    }

    configure(): void {
        this.server.use(express.static('./out/html'));
    }

    listen(): void {

        this.server.get('/', (req: Request, res: Response) => {
            res.sendFile('index.html');
        });

        this.httpServer.listen(this.port, () => {
            console.log("Server is listening on port: " + this.port);
        });
    }

    ioEnable(): any {
        this.io.on('connection', (socket: SocketIO.Socket) => {
            console.log('New client connected: ' + socket.client.id);

            let user = new User(socket.client.id, socket);
            this.userHandler.add(user);
            socket.emit('logon', this.userHandler.findUserById(user.clientId));

            socket.on('disconnect', () => {
                console.log("Client disconnected: " + socket.client.id);
                this.userHandler.remove(socket.client.id);
                this.userHandler.typingUsers = this.userHandler.typingUsers.filter(val => val.id != socket.client.id);
                this.io.emit('expectUserRefresh', undefined);
            });

            socket.on('requestUsers', () => {
                socket.emit('responseUsers', this.userHandler.all());
            });

            socket.on('requestCommands', () => {
                socket.emit('responseCommands', this.cmdHandler.availableCommands());
            });

            socket.on('requestSetClientName', (name: string) => {
                let response: string | undefined;
                if (this.userHandler.all().some(val => val.name == name && val.clientId != socket.client.id)) {
                    response = undefined;
                } else {
                    response = name;
                    this.userHandler.update(socket.client.id, name);
                }

                this.io.emit('expectUserRefresh', undefined);
                socket.emit('responseSetClientName', response);
            });

            socket.on('clientMessage', (from, message) => {
                from = this.userHandler.findUserById(from);
                let msg: Message = new Message('');

                if (typeof message == 'string') {
                    msg = { text: message };
                } else {
                    if (Object.keys(message).some(key => key == 'text')) {
                        msg = message;
                    }
                }

                if (msg.text.indexOf(this.cmdHandler.COMMAND_PREFIX) == 0) {
                    this.cmdHandler.handle(from, msg, socket);
                } else {
                    this.io.emit('newClientMessage', from, msg);
                }
            });

            socket.on('typing', (fromId: string, status: string) => {
                switch (status) {
                    case 'started':
                        if (!this.userHandler.typingUsers.some(val => val.id == fromId)) {
                            let fromUser = this.userHandler.findUserById(fromId);
                            if (fromUser) {
                                this.userHandler.typingUsers.push({ id: fromId, name: fromUser.name });
                            }
                        }
                        break;
                    case 'ended':
                        this.userHandler.typingUsers = this.userHandler.typingUsers.filter(val => val.id != fromId);
                        break;
                    default:
                        break;
                }
                this.io.emit('typing', this.userHandler.typingUsers.map(val => val.name));
            });
        });
    }
}