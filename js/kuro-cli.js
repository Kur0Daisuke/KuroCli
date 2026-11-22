const fontUrl = new URL("../fonts/Consolas.ttf", import.meta.url).href;

const terminalStyles = `
    @font-face {
        font-family: "kuro-console";
        src: url("${fontUrl}") format("truetype");
        font-display: swap;
    }

    :host {
        display: block;
        color: #fff;
        background: #000;
        font: 16px "kuro-console", Consolas, monospace;
        outline: none;
        user-select: text;
    }

    :host(:focus-visible) {
        outline-offset: 3px;
    }

    .terminal {
        min-height: 100%;
        padding: 20px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .line {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-height: 1.25em;
    }

    .directory {
        flex: none;
    }

    .command-area {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .selected {
        background: rgb(83, 140, 255);
    }

    .pointer {
        display: inline-block;
        width: 5px;
        height: 1em;
        background: #fff;
        vertical-align: text-bottom;
        animation: blink 0.9s infinite cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes blink {
        0%, 100% { background: #000; }
        50% { background: #fff; }
    }

    @media (prefers-reduced-motion: reduce) {
        .pointer { animation: none; }
    }
`;

function createFilesystem() {
    return {
        name: "root",
        type: "directory",
        children: [
            {
                name: "home",
                type: "directory",
                children: [
                    {
                        name: "dog",
                        type: "directory",
                        children: [
                            { name: "test.txt", type: "file", data: "HELLO WORLD" }
                        ]
                    }
                ]
            }
        ]
    };
}

function getDirectory(root, path) {
    let node = root;
    for (const segment of path.slice(1)) {
        node = node.children?.find(
            child => child.name === segment && child.type === "directory"
        );
        if (!node) return null;
    }
    return node;
}

function findChild(directory, name) {
    return directory?.children?.find(child => child.name === name) ?? null;
}

export class KuroCli extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.filesystem = createFilesystem();
        this.currentPath = ["root"];
        this.history = [];
        this.historyLimit = 10;
        this.historyPointer = 0;
        this.keyboardBuffer = "";
        this.pointer = 0;
        this.selectionPointer = 0;
        this.commands = new Map();
        this._connected = false;
        this._onKeyDown = event => this.handleKeyDown(event);
        this._onClick = () => this.focus();

        this.registerBuiltInCommands();
    }

    connectedCallback() {
        if (!this.shadowRoot.querySelector(".terminal")) {
            this.shadowRoot.innerHTML = `
                <style>${terminalStyles}</style>
                <div class="terminal" role="log" aria-live="polite"></div>
            `;
            this.terminalElement = this.shadowRoot.querySelector(".terminal");
            this.addPrompt();
        }

        this.tabIndex = 0;
        this.setAttribute("aria-label", "Kuro terminal. Focus to enter commands.");
        if (!this._connected) {
            this.addEventListener("keydown", this._onKeyDown);
            this.addEventListener("click", this._onClick);
            this._connected = true;
        }
    }

    disconnectedCallback() {
        this.removeEventListener("keydown", this._onKeyDown);
        this.removeEventListener("click", this._onClick);
        this._connected = false;
    }

    addCommand(name, { description, execute } = {}) {
        if (typeof name !== "string" || !/^[a-z][a-z0-9_-]*$/i.test(name)) {
            throw new TypeError("Command names must contain only letters, numbers, _ or -.");
        }
        if (typeof description !== "string" || !description.trim()) {
            throw new TypeError(`Command "${name}" must have a description.`);
        }
        if (typeof execute !== "function") {
            throw new TypeError(`Command "${name}" must have an execute function.`);
        }
        if (this.commands.has(name)) {
            throw new Error(`Command "${name}" is already registered.`);
        }

        this.commands.set(name, { description: description.trim(), execute });
    }

    write(message) {
        const line = this.ownerDocument.createElement("div");
        line.className = "line output";
        line.textContent = String(message);
        this.terminalElement.appendChild(line);
    }

    clear() {
        this.terminalElement.replaceChildren();
    }

    registerBuiltInCommands() {
        this.addCommand("echo", {
            description: "Print text to the terminal.",
            execute: ({ args, flags, terminal }) => {
                const text = flags.includes("e")
                    ? args.map(arg => arg === "\\n" ? "\n" : arg).join(" ")
                    : args.join(" ");
                terminal.write(text);
            }
        });

        this.addCommand("ls", {
            description: "List entries in the current directory.",
            execute: ({ terminal }) => {
                const directory = getDirectory(terminal.filesystem, terminal.currentPath);
                terminal.write(directory?.children?.map(child => child.name).join("          ") ?? "");
            }
        });

        this.addCommand("cd", {
            description: "Change the current directory.",
            execute: ({ args, terminal }) => {
                const destination = args[0];
                if (!destination) {
                    terminal.write("no such directory : ");
                    return;
                }

                const segments = destination.split("/").filter(Boolean);
                const path = destination.startsWith("/")
                    ? ["root"]
                    : [...terminal.currentPath];
                let directory = getDirectory(terminal.filesystem, path);

                for (const segment of segments) {
                    const child = findChild(directory, segment);
                    if (child?.type !== "directory") {
                        terminal.write(`no such directory : ${destination}`);
                        return;
                    }
                    path.push(child.name);
                    directory = child;
                }

                terminal.currentPath = path;
            }
        });

        this.addCommand("cat", {
            description: "Print the contents of a file.",
            execute: ({ args, terminal }) => {
                const fileName = args[0];
                const file = findChild(
                    getDirectory(terminal.filesystem, terminal.currentPath),
                    fileName
                );

                if (file?.type === "file") {
                    terminal.write(file.data);
                } else if (file?.type === "directory") {
                    terminal.write(`cat: ${fileName}: is a directory`);
                } else {
                    terminal.write(`cat: ${fileName || "missing file operand"}: no such file`);
                }
            }
        });

        this.addCommand("mkdir", {
            description: "Create a directory in the current directory.",
            execute: ({ args, terminal }) => {
                const name = args[0];
                if (!name || name === "." || name === ".." || name.includes("/")) {
                    terminal.write("Enter appropriate folder name.");
                    return;
                }

                const directory = getDirectory(terminal.filesystem, terminal.currentPath);
                if (findChild(directory, name)) {
                    terminal.write(`mkdir: ${name}: already exists`);
                    return;
                }
                directory.children.push({ name, type: "directory", children: [] });
            }
        });

        this.addCommand("help", {
            description: "Show available commands and their descriptions.",
            execute: ({ terminal }) => {
                const commandList = Array.from(terminal.commands, ([name, command]) =>
                    `${name} - ${command.description}`
                );
                terminal.write(`Available commands:\n${commandList.join("\n")}`);
            }
        });

        this.addCommand("clear", {
            description: "Clear the terminal output.",
            execute: ({ terminal }) => terminal.clear()
        });
    }

    formatPath() {
        const folders = this.currentPath.slice(1);
        return folders.length === 0 ? "~/" : `~/${folders.join("/")}/`;
    }

    addPrompt() {
        const line = this.ownerDocument.createElement("div");
        line.className = "line";

        const directory = this.ownerDocument.createElement("span");
        directory.className = "directory";
        directory.textContent = `${this.formatPath()} >>`;

        const commandArea = this.ownerDocument.createElement("span");
        commandArea.className = "command-area";
        line.append(directory, commandArea);
        this.terminalElement.appendChild(line);
        this.activeCommandArea = commandArea;
        this.render();
    }

    render() {
        if (!this.activeCommandArea) return;

        const start = Math.min(this.pointer, this.selectionPointer);
        const end = Math.max(this.pointer, this.selectionPointer);
        const before = this.keyboardBuffer.slice(0, start);
        const selection = this.keyboardBuffer.slice(start, end);
        const after = this.keyboardBuffer.slice(end);
        const cursor = this.ownerDocument.createElement("span");
        cursor.className = "pointer";
        cursor.setAttribute("aria-hidden", "true");
        this.activeCommandArea.replaceChildren();

        const appendText = value => {
            if (value) this.activeCommandArea.append(this.ownerDocument.createTextNode(value));
        };
        const appendSelection = () => {
            const selected = this.ownerDocument.createElement("b");
            selected.className = "selected";
            selected.textContent = selection;
            this.activeCommandArea.appendChild(selected);
        };

        appendText(before);
        if (this.pointer <= this.selectionPointer) {
            this.activeCommandArea.append(cursor);
            appendSelection();
        } else {
            appendSelection();
            this.activeCommandArea.append(cursor);
        }
        appendText(after);
    }

    updateScreen(key) {
        const start = Math.min(this.pointer, this.selectionPointer);
        const end = Math.max(this.pointer, this.selectionPointer);
        this.keyboardBuffer =
            this.keyboardBuffer.slice(0, start) + key + this.keyboardBuffer.slice(end);
        this.pointer = start + key.length;
        this.selectionPointer = this.pointer;
        this.render();
    }

    deleteKey() {
        const start = Math.min(this.pointer, this.selectionPointer);
        const end = Math.max(this.pointer, this.selectionPointer);

        if (start !== end) {
            this.keyboardBuffer =
                this.keyboardBuffer.slice(0, start) + this.keyboardBuffer.slice(end);
            this.pointer = start;
        } else if (this.pointer > 0) {
            this.keyboardBuffer =
                this.keyboardBuffer.slice(0, this.pointer - 1) +
                this.keyboardBuffer.slice(this.pointer);
            this.pointer--;
        }
        this.selectionPointer = this.pointer;
        this.render();
    }

    handleKeyDown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
            event.preventDefault();
            this.selectionPointer = 0;
            this.pointer = this.keyboardBuffer.length;
            this.render();
            return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const direction = event.key === "ArrowLeft" ? -1 : 1;
            if (!event.shiftKey && this.pointer !== this.selectionPointer) {
                this.pointer = direction < 0
                    ? Math.min(this.pointer, this.selectionPointer)
                    : Math.max(this.pointer, this.selectionPointer);
                this.selectionPointer = this.pointer;
            } else {
                this.pointer = Math.max(
                    0,
                    Math.min(this.keyboardBuffer.length, this.pointer + direction)
                );
                if (!event.shiftKey) this.selectionPointer = this.pointer;
            }
            this.render();
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (this.history.length === 0) return;
            this.historyPointer = Math.max(0, this.historyPointer - 1);
            this.keyboardBuffer = this.history[this.historyPointer];
            this.pointer = this.keyboardBuffer.length;
            this.selectionPointer = this.pointer;
            this.render();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (this.historyPointer < this.history.length) {
                this.historyPointer++;
                this.keyboardBuffer = this.history[this.historyPointer] ?? "";
                this.pointer = this.keyboardBuffer.length;
                this.selectionPointer = this.pointer;
            }
            this.render();
            return;
        }

        if (event.key === "Backspace") {
            event.preventDefault();
            this.deleteKey();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            this.runCommand(this.keyboardBuffer);
            return;
        }

        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            this.updateScreen(event.key);
        }
    }

    runCommand(script) {
        const tokens = script.trim().split(/\s+/).filter(Boolean);
        const commandName = tokens.shift() ?? "";
        const args = [];
        const flags = [];

        for (const token of tokens) {
            if (token.startsWith("-") && token.length > 1) {
                flags.push(token.slice(1));
            } else {
                args.push(token);
            }
        }

        const command = this.commands.get(commandName);
        if (command) {
            command.execute({ args, flags, terminal: this });
        } else if (commandName) {
            this.write(`No program named '${commandName}' is found.`);
        }

        if (script.trim()) {
            this.history.push(script);
            if (this.history.length > this.historyLimit) this.history.shift();
        }
        this.historyPointer = this.history.length;
        this.keyboardBuffer = "";
        this.pointer = 0;
        this.selectionPointer = 0;
        this.addPrompt();
    }
}

if (typeof customElements !== "undefined" && !customElements.get("kuro-cli")) {
    customElements.define("kuro-cli", KuroCli);
}
