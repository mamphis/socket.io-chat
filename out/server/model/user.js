"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User = /** @class */ (function () {
    function User(clientId, socket) {
        this._clientId = clientId;
        this._name = '';
        this._socket = socket;
        this._remoteAddress = socket.conn.remoteAddress;
    }
    Object.defineProperty(User.prototype, "name", {
        get: function () {
            return this._name;
        },
        set: function (value) {
            this._name = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "clientId", {
        get: function () {
            return this._clientId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(User.prototype, "remoteAddress", {
        get: function () {
            return this._remoteAddress;
        },
        enumerable: true,
        configurable: true
    });
    return User;
}());
exports.User = User;
