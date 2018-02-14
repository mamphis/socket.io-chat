"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var liteevent_1 = require("../utils/liteevent");
var UserHandler = /** @class */ (function () {
    ///endregion
    function UserHandler() {
        this._users = [];
        this.typingUsers = [];
        ///region Events
        this.onUserAdd = new liteevent_1.LiteEvent();
        this.onUserRemove = new liteevent_1.LiteEvent();
    }
    Object.defineProperty(UserHandler.prototype, "UserAdded", {
        get: function () {
            return this.onUserAdd.expose();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserHandler.prototype, "UserRemoved", {
        get: function () {
            return this.onUserRemove.expose();
        },
        enumerable: true,
        configurable: true
    });
    UserHandler.prototype.add = function (user) {
        if (this._users.some(function (value) { return value.clientId == user.clientId; })) {
            return;
        }
        this._users.push(user);
        this.onUserAdd.trigger(user);
    };
    UserHandler.prototype.remove = function (clientId) {
        for (var i = this._users.length - 1; i >= 0; i--) {
            if (this._users[i].clientId == clientId) {
                this._users.splice(i, 1);
            }
        }
    };
    UserHandler.prototype.update = function (clientId, userName) {
        this._users.forEach(function (user) {
            if (user.clientId == clientId) {
                user.name = userName;
            }
        });
    };
    UserHandler.prototype.all = function () {
        return this._users.map(function (user, index, users) {
            return {
                clientId: user.clientId,
                name: user.name,
                remoteAddr: user.remoteAddress
            };
        });
    };
    UserHandler.prototype.findUserById = function (clientId) {
        return this.all().filter(function (val) { return val.clientId == clientId; })[0];
    };
    UserHandler.prototype.findUserByName = function (userName) {
        return this.all().filter(function (val) { return val.name == userName; })[0];
    };
    return UserHandler;
}());
exports.UserHandler = UserHandler;
