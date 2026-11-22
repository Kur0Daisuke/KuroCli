export const terminalState = {
    directory: {
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
                            {
                                name: "test.txt",
                                type: "file",
                                data: "HELLO WORLD"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    keyboardBuffer: "",
    pointer: 0,
    selectionPointer: 0,
    activeCommandArea: null,
    currentPath: ["root"],
    previousCommands: [],
    historyPointer: 0,
    historyLimit: 10
};
