const Programs = {
    "echo": (param, flags) => {
        document.querySelector(".commandArea.active").classList.remove("active")
        let messageLine = document.createElement("div");
        messageLine.classList.add("line");
        
        messageLine.innerHTML = param.join(" ");
        document.querySelector(".interface").appendChild(messageLine);

        let newLine = document.createElement("div");
        newLine.classList.add("line");
        document.querySelector(".pointer").remove();
        newLine.innerHTML = `
            <div class="directory">Home/ >></div> 
            <div class="commandArea active"></div>
        `
        document.querySelector(".interface").appendChild(newLine);
        activeCommandArea = document.querySelector(".commandArea.active");
        keyboardBuffer = "";
        render();
    },
    "error": (param) => {
        Programs.echo([`No program named '${param}' is found.`]);
    }
}

var script1 = `echo "hi" daw`;
var keyboardBuffer = "";
var pointer = 0;
var activeCommandArea = document.querySelector(".commandArea.active");
var selectionPointer = 0;
var selected = false;

function run(script) {
    const tokens = script.split(" ");
    let command = tokens[0];
    let parameters = [];
    let flags = [];
    tokens.slice(1).forEach(e => {
        if(!e.includes("-")) parameters.push(e);
        else flags.push(e.replace(/-/g, ''))
    })

    try {
        Programs[command](parameters, flags);
    } catch (error) {
        Programs.error(command);
    }
    
}

function render() {
    const start = Math.min(pointer, selectionPointer);
    const end = Math.max(pointer, selectionPointer);

    const before = keyboardBuffer.slice(0, start);
    const selection = keyboardBuffer.slice(start, end);
    const after = keyboardBuffer.slice(end);

    if (pointer <= selectionPointer) {
        activeCommandArea.innerHTML = `${before}<span class="pointer"></span><b class="selected">${selection}</b>${after}`;
    } else {
        activeCommandArea.innerHTML = `${before}<b class="selected">${selection}</b><span class="pointer"></span>${after}`;
    }
}

function updateScreen(key = "") {
    const start = Math.min(pointer, selectionPointer);
    const end = Math.max(pointer, selectionPointer);

    keyboardBuffer = keyboardBuffer.slice(0, start) + key + keyboardBuffer.slice(end);
    pointer = start + key.length;
    selectionPointer = pointer;
    render();
}

function deleteKey() {
    const start = Math.min(pointer, selectionPointer);
    const end = Math.max(pointer, selectionPointer);

    if (start !== end) {
        keyboardBuffer = keyboardBuffer.slice(0, start) + keyboardBuffer.slice(end);
        pointer = start;
        selectionPointer = start;
    } else if (pointer > 0) {
        keyboardBuffer = keyboardBuffer.slice(0, pointer - 1) + keyboardBuffer.slice(pointer);
        pointer--;
        selectionPointer = pointer;
    }
    render();
}

window.addEventListener("keydown", (e) => {
    // Select All (Ctrl+A or Cmd+A)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectionPointer = 0;
        pointer = keyboardBuffer.length;
        render();
        return;
    }

    // Move Left (Hold Shift to extend selection)
    if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!e.shiftKey && pointer !== selectionPointer) {
            // Collapse selection to the left edge
            pointer = Math.min(pointer, selectionPointer);
            selectionPointer = pointer;
        } else {
            if (pointer > 0) pointer--;
            if (!e.shiftKey) selectionPointer = pointer;
        }
        render();
        return;
    }

    // Move Right (Hold Shift to extend selection)
    if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!e.shiftKey && pointer !== selectionPointer) {
            // Collapse selection to the right edge
            pointer = Math.max(pointer, selectionPointer);
            selectionPointer = pointer;
        } else {
            if (pointer < keyboardBuffer.length) pointer++;
            if (!e.shiftKey) selectionPointer = pointer;
        }
        render();
        return;
    }

    // Backspace
    if (e.key === "Backspace") {
        e.preventDefault();
        deleteKey();
        return;
    }

    if (e.key === "Enter") {
        run(keyboardBuffer);
        return;
    }

    // Printable characters (includes Space, ignores Ctrl/Alt/Meta shortcuts and special keys)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === " ") e.preventDefault();
        updateScreen(e.key);
    }
});
render()