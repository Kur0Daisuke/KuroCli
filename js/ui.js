import { terminalState } from "./state.js";
import { formatPath } from "./filesystem.js";

export function addNewLine() {
    document.querySelector(".commandArea.active")?.classList.remove("active");
    document.querySelector(".pointer")?.remove();

    const newLine = document.createElement("div");
    newLine.classList.add("line");
    newLine.innerHTML = `
        <div class="directory">${formatPath()} &gt;&gt;</div>
        <div class="commandArea active"></div>
    `;

    document.querySelector(".interface").appendChild(newLine);
    terminalState.activeCommandArea = document.querySelector(".commandArea.active");
}

export function outputMessage(message, color="white") {
    const messageLine = document.createElement("div");
    messageLine.classList.add("line");
    messageLine.style.color = color;
    messageLine.innerHTML = message;
    document.querySelector(".interface").appendChild(messageLine);
}

export function render() {
    if (!terminalState.activeCommandArea) return;

    const start = Math.min(terminalState.pointer, terminalState.selectionPointer);
    const end = Math.max(terminalState.pointer, terminalState.selectionPointer);
    const before = terminalState.keyboardBuffer.slice(0, start);
    const selection = terminalState.keyboardBuffer.slice(start, end);
    const after = terminalState.keyboardBuffer.slice(end);

    if (terminalState.pointer <= terminalState.selectionPointer) {
        terminalState.activeCommandArea.innerHTML =
            `${before}<span class="pointer"></span><b class="selected">${selection}</b>${after}`;
    } else {
        terminalState.activeCommandArea.innerHTML =
            `${before}<b class="selected">${selection}</b><span class="pointer"></span>${after}`;
    }
}
