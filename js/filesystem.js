import { terminalState } from "./state.js";

export function getDirectory(path = terminalState.currentPath) {
    let node = terminalState.directory;

    for (const segment of path.slice(1)) {
        node = node.children?.find(
            child => child.name === segment && child.type === "directory"
        );
        if (!node) return null;
    }

    return node;
}

export function findChild(directory, name) {
    return directory?.children?.find(child => child.name === name) ?? null;
}

export function formatPath(path = terminalState.currentPath) {
    const folders = path.filter(segment => segment !== "root");
    return folders.length === 0 ? "~/" : `~/${folders.join("/")}/`;
}
