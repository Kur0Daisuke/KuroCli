import { terminalState } from "./state.js";
import { findChild, getDirectory } from "./filesystem.js";
import { addNewLine, outputMessage, render } from "./ui.js";

export const programs = {
    echo(param, flags = []) {
        const newLineFlagged = flags.includes("e");

        if (!newLineFlagged) {
            outputMessage(param.join(" "));
        } else {
            outputMessage(param.map(item => item === "\\n" ? "<br>" : item).join(" "));
        }

        finishCommand();
    },

    ls() {
        const currentDirectory = getDirectory();
        const childNodes = currentDirectory?.children?.map(child => child.name) ?? [];
        outputMessage(childNodes.join("/"));
        finishCommand();
    },

    cd(param) {
        const destination = param[0];
        if (!destination) {
            outputMessage("no such directory : ");
            finishCommand();
            return;
        }

        const segments = destination.split("/").filter(Boolean);
        const destinationPath = destination.startsWith("/")
            ? ["root"]
            : [...terminalState.currentPath];
        let destinationDirectory = getDirectory(destinationPath);

        for (const segment of segments) {
            const destinationNode = findChild(destinationDirectory, segment);
            if (destinationNode?.type !== "directory") {
                outputMessage(`no such directory : ${destination}`);
                finishCommand();
                return;
            }

            destinationPath.push(destinationNode.name);
            destinationDirectory = destinationNode;
        }

        terminalState.currentPath = destinationPath;
        finishCommand();
    },

    cat(param) {
        const fileName = param[0];
        const file = findChild(getDirectory(), fileName);

        if (file?.type === "file") {
            outputMessage(file.data);
        } else if (file?.type === "directory") {
            outputMessage(`cat: ${fileName}: is a directory`);
        } else {
            outputMessage(`cat: ${fileName || "missing file operand"}: no such file`);
        }

        finishCommand();
    },

    error(param) {
        programs.echo([`No program named '${param}' is found.`]);
    },

    clear() {
        document.querySelector(".interface").innerHTML = "";
        finishCommand()
    }
};

function finishCommand() {
    addNewLine();
    if (terminalState.previousCommands.length < terminalState.historyLimit) {
        terminalState.previousCommands.push(terminalState.keyboardBuffer);
    } else {
        terminalState.previousCommands.shift();
        terminalState.previousCommands.push(terminalState.keyboardBuffer);
    }
    terminalState.historyPointer = terminalState.previousCommands.length;
    terminalState.keyboardBuffer = "";
    terminalState.pointer = 0;
    terminalState.selectionPointer = 0;

    
    render();
}

export function run(script) {
    const tokens = script.split(" ");
    const command = tokens[0];
    const parameters = [];
    const flags = [];

    tokens.slice(1).forEach(token => {
        if (!token.includes("-")) parameters.push(token);
        else flags.push(token.replace(/-/g, ""));
    });

    if (Object.hasOwn(programs, command)) {
        programs[command](parameters, flags);
    } else {
        programs.error(command);
    }
}
