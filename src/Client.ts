import * as net from "node:net";
import * as Doc from "./document";

type SendMessage = {
    op: "send";
    doc: Doc.Root;
};

type RemoveMessage = {
    op: "remove";
    path: string;
};

type Message = SendMessage | RemoveMessage;

export default class Client {
    constructor(public socket: net.Socket) {
        socket.on("end", () => {
            console.log("client disconnected")
        });
    }

    sendJson(m: Message) {
        this.socket.write(JSON.stringify(m) + "\n");
    }

    sendDocument(doc: Doc.Root): void {
        this.sendJson({ op: "send", doc });
    }

    removeDocument(path: string): void {
        this.sendJson({ op: "remove", path });
    }
}