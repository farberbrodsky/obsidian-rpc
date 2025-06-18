import { TAbstractFile, TFile, Vault } from "obsidian";
import { parseDocument } from "./markdown";
import * as Doc from "./document";

function isMarkdownFile(maybeFile: TAbstractFile): TFile | null {
	if (!(maybeFile instanceof TFile) || maybeFile.extension != "md") {
		return null;
	}
	return maybeFile;
}

export class State {
	documentByPath: Map<string, Doc.Root> = new Map();

	constructor(public vault: Vault) {}


	// Core index functions: get a path to a markdown file, and set or delete the contents
	indexSetByPathAndContents(path: string, contents: string): void {
		const parsed = parseDocument(path, contents);
		console.log("contents:", contents.slice(0, 50), "...");
		console.log("parsed:", parsed);
		if (parsed !== null) {
			this.documentByPath.set(path, parsed);
		}
	}

	indexDeleteByPath(path: string): void {
		this.documentByPath.delete(path);
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
