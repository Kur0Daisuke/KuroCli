import { terminalState } from "./state.js";
import { render } from "./ui.js";
import { run } from "./commands.js";

export function updateScreen(key = "") {
    const start = Math.min(terminalState.pointer, terminalState.selectionPointer);
    const end = Math.max(terminalState.pointer, terminalState.selectionPointer);

    terminalState.keyboardBuffer =
        terminalState.keyboardBuffer.slice(0, start) +
        key +
        terminalState.keyboardBuffer.slice(end);
    terminalState.pointer = start + key.length;
    terminalState.selectionPointer = terminalState.pointer;
    render();
}

export function deleteKey() {
    const start = Math.min(terminalState.pointer, terminalState.selectionPointer);
    const end = Math.max(terminalState.pointer, terminalState.selectionPointer);

    console.log(terminalState.pointer, terminalState.selectionPointer)
    if (start !== end) {
        terminalState.keyboardBuffer =
            terminalState.keyboardBuffer.slice(0, start) +
            terminalState.keyboardBuffer.slice(end);
        terminalState.pointer = start;
        terminalState.selectionPointer = start;
    } else if (terminalState.pointer > 0) {
        terminalState.keyboardBuffer =
            terminalState.keyboardBuffer.slice(0, terminalState.pointer - 1) +
            terminalState.keyboardBuffer.slice(terminalState.pointer);
        terminalState.pointer--;
        terminalState.selectionPointer = terminalState.pointer;
    }

    render();
}

export function initializeInput() {
    window.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
            event.preventDefault();
            terminalState.selectionPointer = 0;
            terminalState.pointer = terminalState.keyboardBuffer.length;
            render();
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (!event.shiftKey && terminalState.pointer !== terminalState.selectionPointer) {
                terminalState.pointer = Math.min(
                    terminalState.pointer,
                    terminalState.selectionPointer
                );
                terminalState.selectionPointer = terminalState.pointer;
            } else {
                if (terminalState.pointer > 0) terminalState.pointer--;
                if (!event.shiftKey) terminalState.selectionPointer = terminalState.pointer;
            }
            render();
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            if (!event.shiftKey && terminalState.pointer !== terminalState.selectionPointer) {
                terminalState.pointer = Math.max(
                    terminalState.pointer,
                    terminalState.selectionPointer
                );
                terminalState.selectionPointer = terminalState.pointer;
            } else {
                if (terminalState.pointer < terminalState.keyboardBuffer.length) {
                    terminalState.pointer++;
                }
                if (!event.shiftKey) terminalState.selectionPointer = terminalState.pointer;
            }
            render();
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (terminalState.previousCommands.length === 0) return;

            terminalState.historyPointer = Math.max(0, terminalState.historyPointer - 1);
            terminalState.keyboardBuffer =
                terminalState.previousCommands[terminalState.historyPointer];
            terminalState.pointer = terminalState.keyboardBuffer.length;
            terminalState.selectionPointer = terminalState.pointer;
            render();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (terminalState.historyPointer < terminalState.previousCommands.length) {
                terminalState.historyPointer++;
                terminalState.keyboardBuffer =
                    terminalState.previousCommands[terminalState.historyPointer] ?? "";
                terminalState.pointer = terminalState.keyboardBuffer.length;
                terminalState.selectionPointer = terminalState.pointer;
            }
            render();
            return;
        }

        if (event.key === "Backspace") {
            event.preventDefault();
            deleteKey();
            return;
        }

        if (event.key === "Enter") {
            run(terminalState.keyboardBuffer);
            return;
        }

        if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
        ) {
            if (event.key === " ") event.preventDefault();
            updateScreen(event.key);
        }
    });
}
