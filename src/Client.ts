import * as net from "node:net";
import * as Doc from "./document";
import { State } from "./State";

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
    private constructor(public appState: State, public socket: net.Socket) {}

    static newConnection(appState: State, socket: net.Socket): void {
        const result = new Client(appState, socket);
        socket.on("end", result.onSocketEnd.bind(result));
        socket.on("data", result.onSocketData.bind(result));
        appState.addClient(result);
    }

    onSocketEnd() {
        this.appState.removeClient(this);
    }

    onSocketData(data: Buffer) {
        console.log("received:", data);
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