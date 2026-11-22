import { terminalState } from "./state.js";
import { findChild, getDirectory } from "./filesystem.js";
import { addNewLine, outputMessage, render } from "./ui.js";

export const programs = {
    echo: {
        description: "Print text to the terminal.",
        execute(param, flags = []) {
            const newLineFlagged = flags.includes("e");

            if (!newLineFlagged) {
                outputMessage(param.join(" "));
            } else {
                outputMessage(param.map(item => item === "\\n" ? "<br>" : item).join(" "));
            }
        }
    },

    ls: {
        description: "List entries in the current directory.",
        execute() {
            const currentDirectory = getDirectory();
            const childNodes = currentDirectory?.children?.map(child => child.name) ?? [];
            outputMessage(childNodes.join("\u00A0".repeat(10)), "blue");
        }
    },

    cd: {
        description: "Change the current directory.",
        execute(param) {
            const destination = param[0];
            if (!destination) {
                outputMessage("no such directory : ");
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
                    return;
                }

                destinationPath.push(destinationNode.name);
                destinationDirectory = destinationNode;
            }

            terminalState.currentPath = destinationPath;
        }
    },

    cat: {
        description: "Print the contents of a file.",
        execute(param) {
            const fileName = param[0];
            const file = findChild(getDirectory(), fileName);

            if (file?.type === "file") {
                outputMessage(file.data);
            } else if (file?.type === "directory") {
                outputMessage(`cat: ${fileName}: is a directory`);
            } else {
                outputMessage(`cat: ${fileName || "missing file operand"}: no such file`);
            }
        }
    },

    mkdir: {
        description: "Create a directory in the current directory.",
        execute(param) {
            if (param[0] == "" || param[0] == " " || !param[0]) {
                outputMessage("Enter appropriate folder name.");
                return;
            }
            const currentDirectory = getDirectory();
            currentDirectory.children.push({
                name: param[0],
                type: "folder"
            });
        }
    },

    help: {
        description: "Show available commands and their descriptions.",
        execute() {
            const commandList = Object.entries(programs)
                .map(([name, program]) => `${name} - ${program.description}`)
                .join("<br>");
            outputMessage(`Available commands:<br>${commandList}`);
        }
    },

    clear: {
        description: "Clear the terminal output.",
        execute() {
            document.querySelector(".interface").innerHTML = "";
        }
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
    const program = Object.hasOwn(programs, command) ? programs[command] : null;
    const parameters = [];
    const flags = [];

    tokens.slice(1).forEach(token => {
        if (!token.includes("-")) parameters.push(token);
        else flags.push(token.replace(/-/g, ""));
    });

    if (program) {
        program.execute(parameters, flags);
    } else {
        outputMessage(`No program named '${command}' is found.`);
    }

    finishCommand();
}
