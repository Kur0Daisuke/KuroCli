# Kuro CLI Terminal Element

`kuro-cli-terminal-element` is a browser-only terminal emulator packaged as a custom element. Its UI and styles are isolated in a shadow root.

## Install

```sh
npm install kuro-cli-terminal-element
```

Register the custom element once in your app:

```js
import "kuro-cli-terminal-element";
```

Then add it anywhere in your HTML:

```html
<kuro-cli></kuro-cli>
```

## Add custom commands

Keep custom commands in a separate JavaScript module and register them on the element:

```js
export default function registerCommands(terminal) {
    terminal.addCommand("hello", {
        description: "Greet someone by name.",
        execute({ args, terminal }) {
            terminal.write(`Hello, ${args.join(" ") || "world"}!`);
        }
    });
}
```

Load that module after registering the element:

```js
import "kuro-cli-terminal-element";
import registerCommands from "./custom-commands.js";

registerCommands(document.querySelector("kuro-cli"));
```

Each command needs a name, a description, and an `execute({ args, flags, terminal })` function. Use `terminal.write(text)` to display output. The built-in `help` command automatically includes registered custom commands.

Built-in commands are `echo`, `ls`, `cd`, `cat`, `mkdir`, `help`, and `clear`.
