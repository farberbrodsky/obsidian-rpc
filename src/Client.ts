import * as net from "node:net";
import * as Doc from "./document";
import { State } from "./State";
import JsonSocket from "./JsonSocket";

export type SendMessage = {
    op: "send";
    doc: Doc.Root;
};

export type RemoveMessage = {
    op: "remove";
    filename: string;
};

export type UpdateMessage = SendMessage | RemoveMessage;

export default class Client extends JsonSocket {
    private constructor(public appState: State, socket: net.Socket) {
        super(socket);
    }

    static newConnection(appState: State, socket: net.Socket): void {
        const result = new Client(appState, socket);
        appState.addClient(result);
    }

    onSocketEnd() {
        console.log("Socket end");
        this.appState.removeClient(this);
    }

    onJson(o: object) {
        console.log("Got a JSON object:", o);
    }

    sendDocument(doc: Doc.Root): void {
        this.sendJson({ op: "send", doc });
    }

    removeDocument(filename: string): void {
        this.sendJson({ op: "remove", filename });
    }
}