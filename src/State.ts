import { TAbstractFile, TFile, Vault } from "obsidian";
import { IdAllocator, parseDocument } from "./markdown";
import * as Doc from "./document";
import Client from "./Client";

function isMarkdownFile(maybeFile: TAbstractFile): TFile | null {
    if (!(maybeFile instanceof TFile) || maybeFile.extension != "md") {
        return null;
    }
    return maybeFile;
}

export class State {
    documentByPath: Map<string, Doc.Root> = new Map();
    listeningClients: Client[] = [];
    /**
     * all section objects are given unique incrementing IDs.
     * Even if the contents stayed the same, every update to a file leads to entirely new IDs.
     */
    idAllocator: IdAllocator = new IdAllocator();

    constructor(public vault: Vault) {}


    // Core index functions: get a path to a markdown file, and set or delete the contents
    indexSetByPathAndContents(path: string, contents: string): void {
        const parsed = parseDocument(path, contents, this.idAllocator);
        console.log("contents:", contents.slice(0, 50), "...");
        console.log("parsed:", parsed);
        if (parsed !== null) {
            this.documentByPath.set(path, parsed);
            for (const c of this.listeningClients)
                c.sendDocument(parsed);
        }
    }

    indexDeleteByPath(path: string): void {
        this.documentByPath.delete(path);
        for (const c of this.listeningClients)
            c.removeDocument(path);
    }


    addClient(c: Client) {
        // tell the client about all of the current documents
        for (const document of this.documentByPath.values()) {
            c.sendDocument(document);
        }
        // this client listens to new changes
        this.listeningClients.push(c);
    }

    removeClient(c: Client) {
        this.listeningClients.remove(c);
    }


    // Vault event handlers
    vaultOnCreateOrModify(maybeFile: TAbstractFile): void {
        // Only care about .md files
        const file = isMarkdownFile(maybeFile);
        if (file === null) {
            return;
        }

        this.vault.cachedRead(file).then(contents => {
            this.indexSetByPathAndContents(file.path, contents);
        });
    }

    vaultOnDelete(maybeFile: TAbstractFile): void {
        // Only care about .md files
        const file = isMarkdownFile(maybeFile);
        if (file === null) {
            return;
        }

        this.indexDeleteByPath(maybeFile.path);
    }

    vaultOnRename(maybeFile: TAbstractFile, oldPath: string): void {
        // Trivial solution: delete the old file's state, create a new file
        this.indexDeleteByPath(oldPath);
        this.vaultOnCreateOrModify(maybeFile);
    }
}
