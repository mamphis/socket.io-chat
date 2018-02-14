"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socketIo = require("socket.io");
var http = require("http");
var https = require("https");
var userhandler_1 = require("./model/userhandler");
var user_1 = require("./model/user");
var commandhandler_1 = require("./model/commandhandler");
var message_1 = require("./model/message");
var Main = /** @class */ (function () {
    function Main(port) {
        this.port = port;
        this.server = express();
        this.httpServer = http.createServer(this.server);
        this.io = socketIo(this.httpServer);
        this.userHandler = new userhandler_1.UserHandler();
        this.cmdHandler = new commandhandler_1.CommandHandler(this.userHandler, this.io);
        this.registerCommands();
        this.configure();
        this.ioEnable();
    }
    Main.prototype.registerCommands = function () {
        var _this = this;
        this.cmdHandler.register('ping', function (from, text, socket) {
            if (text != '') {
                text = 'pong ' + text;
            }
            else {
                text = 'pong';
            }
            socket.emit('newClientMessage', from, new message_1.Message(text, { class: 'private' }));
        });
        this.cmdHandler.register(['tenor', 'gif'], function (from, text, socket) {
            if (text == '') {
                return;
            }
            var url = 'https://api.tenor.com/v1/search?q=' + encodeURI(text);
            https.get(url, function (res) {
                var data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    var obj = JSON.parse(data);
                    var gifResult = obj.results[0];
                    if (gifResult) {
                        _this.io.emit('newClientMessage', from, new message_1.Message('tenor: ' + text, { img: gifResult.media[0].gif.url }));
                    }
                });
            });
        });
        this.cmdHandler.register('tts', function (from, text, socket) {
            _this.io.emit('newClientMessage', from, new message_1.Message(text, { tts: text }));
        });
        this.cmdHandler.register(['private', 'to', 'msg'], function (from, text, socket) {
            var u = text.split(' ')[0];
            var user = _this.userHandler.findUserByName(u);
            var msg = text.substring(u.length + 1);
            if (user) {
                _this.io.sockets.sockets[user.clientId].emit('newClientMessage', from, new message_1.Message(msg, { class: 'private' }));
                socket.emit('newClientMessage', from, new message_1.Message('[' + user.name + '] ' + msg, { class: 'private' }));
            }
        });
        this.cmdHandler.register(['tableflip', 'tf'], function (from, text, socket) {
            _this.io.emit('newClientMessage', from, new message_1.Message(text + '(╯°□°）╯︵ ┻━┻'));
        });
        this.cmdHandler.register(['shrug', 'hmm'], function (from, text, socket) {
            _this.io.emit('newClientMessage', from, new message_1.Message(text + '¯\\_(ツ)_/¯'));
        });
        this.cmdHandler.register('ip', function (from, text, socket) {
            var info = '';
            if (text == '') {
                info = from.name + ': ' + _this.userHandler.findUserByName(from.name).remoteAddr;
            }
            else {
                info = text + ': ' + _this.userHandler.findUserByName(text).remoteAddr;
            }
            socket.emit('newClientMessage', from, new message_1.Message(info, { class: 'private' }));
        });
        this.cmdHandler.register('changeUserName', function (from, text, socket) {
            if (text == '') {
                socket.emit('logon', _this.userHandler.findUserById(from.clientId));
            }
            else {
                _this.userHandler.update(from.clientId, text);
                _this.io.emit('expectUserRefresh', undefined);
            }
        });
    };
    Main.prototype.configure = function () {
        this.server.use(express.static('./out/html'));
    };
    Main.prototype.listen = function () {
        var _this = this;
        this.server.get('/', function (req, res) {
            res.sendFile('index.html');
        });
        this.httpServer.listen(this.port, function () {
            console.log("Server is listening on port: " + _this.port);
        });
    };
    Main.prototype.ioEnable = function () {
        var _this = this;
        this.io.on('connection', function (socket) {
            console.log('New client connected: ' + socket.client.id);
            var user = new user_1.User(socket.client.id, socket);
            _this.userHandler.add(user);
            socket.emit('logon', _this.userHandler.findUserById(user.clientId));
            socket.on('disconnect', function () {
                console.log("Client disconnected: " + socket.client.id);
                _this.userHandler.remove(socket.client.id);
                _this.userHandler.typingUsers = _this.userHandler.typingUsers.filter(function (val) { return val.id != socket.client.id; });
                _this.io.emit('expectUserRefresh', undefined);
            });
            socket.on('requestUsers', function () {
                socket.emit('responseUsers', _this.userHandler.all());
            });
            socket.on('requestCommands', function () {
                socket.emit('responseCommands', _this.cmdHandler.availableCommands());
            });
            socket.on('requestSetClientName', function (name) {
                var response;
                if (_this.userHandler.all().some(function (val) { return val.name == name && val.clientId != socket.client.id; })) {
                    response = undefined;
                }
                else {
                    response = name;
                    _this.userHandler.update(socket.client.id, name);
                }
                _this.io.emit('expectUserRefresh', undefined);
                socket.emit('responseSetClientName', response);
            });
            socket.on('clientMessage', function (from, message) {
                from = _this.userHandler.findUserById(from);
                var msg = new message_1.Message('');
                if (typeof message == 'string') {
                    msg = { text: message };
                }
                else {
                    if (Object.keys(message).some(function (key) { return key == 'text'; })) {
                        msg = message;
                    }
                }
                if (msg.text.indexOf(_this.cmdHandler.COMMAND_PREFIX) == 0) {
                    _this.cmdHandler.handle(from, msg, socket);
                }
                else {
                    _this.io.emit('newClientMessage', from, msg);
                }
            });
            socket.on('typing', function (fromId, status) {
                switch (status) {
                    case 'started':
                        if (!_this.userHandler.typingUsers.some(function (val) { return val.id == fromId; })) {
                            var fromUser = _this.userHandler.findUserById(fromId);
                            if (fromUser) {
                                _this.userHandler.typingUsers.push({ id: fromId, name: fromUser.name });
                            }
                        }
                        break;
                    case 'ended':
                        _this.userHandler.typingUsers = _this.userHandler.typingUsers.filter(function (val) { return val.id != fromId; });
                        break;
                    default:
                        break;
                }
                _this.io.emit('typing', _this.userHandler.typingUsers.map(function (val) { return val.name; }));
            });
        });
    };
    return Main;
}());
exports.Main = Main;
