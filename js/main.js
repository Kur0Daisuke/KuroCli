import { terminalState } from "./state.js";
import { initializeInput } from "./input.js";
import { addNewLine, render } from "./ui.js";

terminalState.keyboardBuffer = "";
terminalState.pointer = 0;
terminalState.selectionPointer = 0;

addNewLine();
render();
initializeInput();
