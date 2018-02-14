"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idictionary_1 = require("../utils/idictionary");
var CommandHandler = /** @class */ (function () {
    function CommandHandler(userHandler, io) {
        this.commands = new idictionary_1.Dictionary();
        this.COMMAND_PREFIX = '/';
        this.userHandler = userHandler;
        this.io = io;
    }
    CommandHandler.prototype.availableCommands = function () {
        return Object.keys(this.commands).sort(function (a, b) { return a.localeCompare(b); }).map(function (val) { return '/' + val; }).sort();
    };
    CommandHandler.prototype.register = function (command, handler) {
        var _this = this;
        if (typeof command == 'string') {
            this.commands[command] = handler;
        }
        else {
            command.forEach(function (cmd) {
                _this.commands[cmd] = handler;
            });
        }
    };
    CommandHandler.prototype.handle = function (from, msgObj, clientSocket) {
        var cmdText = msgObj.text.substring(this.COMMAND_PREFIX.length);
        var cmd = cmdText.split(' ')[0];
        var text = cmdText.substring(cmdText.indexOf(' ') > 0 ? cmdText.indexOf(' ') + 1 : this.COMMAND_PREFIX.length + cmd.length);
        if (this.commands[cmd]) {
            this.commands[cmd](from, text, clientSocket);
        }
    };
    return CommandHandler;
}());
exports.CommandHandler = CommandHandler;
