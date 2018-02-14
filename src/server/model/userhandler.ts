import { User } from "./user";
import { LiteEvent } from "../utils/liteevent";
import { ILiteEvent } from "../utils/iliteevent";

export class UserHandler {
    private _users: User[] = [];
    typingUsers: { id: string, name: string }[] = [];

    ///region Events
    private readonly onUserAdd = new LiteEvent<User>();
    private readonly onUserRemove = new LiteEvent<User>();

    get UserAdded(): ILiteEvent<User> {
        return this.onUserAdd.expose();
    }

    get UserRemoved(): ILiteEvent<User> {
        return this.onUserRemove.expose();
    }
    ///endregion

    constructor() {

    }

    add(user: User) {
        if (this._users.some((value) => value.clientId == user.clientId)) {
            return;
        }

        this._users.push(user);
        this.onUserAdd.trigger(user);
    }

    remove(clientId: string) {
        for (let i = this._users.length - 1; i >= 0; i--) {
            if (this._users[i].clientId == clientId) {
                this._users.splice(i, 1);
            }
        }
    }

    update(clientId: string, userName: string) {
        this._users.forEach(user => {
            if (user.clientId == clientId) {
                user.name = userName;
            }
        });
    }

    all(): { clientId: string, name: string, remoteAddr: string }[] {
        return this._users.map<{ clientId: string, name: string, remoteAddr: string }>((user, index, users) => {
            return {
                clientId: user.clientId,
                name: user.name,
                remoteAddr: user.remoteAddress
            }
        });
    }

    findUserById(clientId: string): { clientId: string, name: string, remoteAddr: string  } {
        return this.all().filter((val) => val.clientId == clientId)[0];
    }

    findUserByName(userName: string): {clientId: string, name: string, remoteAddr: string } {
        return  this.all().filter(val => val.name == userName)[0];
    }
}