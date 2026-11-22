export default function registerCustomCommands(terminal) {
    terminal.addCommand("hello", {
        description: "Greet someone by name.",
        execute({ args, terminal }) {
            terminal.write(`Hello, ${args.join(" ") || "world"}!`);
        }
    });
}
