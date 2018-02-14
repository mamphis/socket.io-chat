export class Message {
    text: string;
    options?: any;

    constructor(text: string, options?: any) {
        this.text = text;
        this.options = options;
    }
}