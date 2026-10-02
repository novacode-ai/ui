import readline from 'readline';
import chalk from 'chalk';

export const Theme = {
    primary: chalk.hex('#94aeff'),
    secondary: chalk.hex('#99acfc'),
    text: chalk.hex('#e4e8fd'),
    border: chalk.hex('#5c6c9a')
};

export { StreamRenderer } from './renderer.js';

export class ChatBox {
    private rl: readline.Interface;
    
    constructor(private commands: string[] = []) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            completer: (line: string) => this.completer(line)
        });
    }

    private completer(line: string) {
        const hits = this.commands.filter((c) => c.startsWith(line.toLowerCase()));
        return [hits.length ? hits : this.commands, line];
    }

    private getWidth() {
        const cols = process.stdout.columns || 80;
        return Math.max(30, Math.min(Math.floor(cols * 0.9), 100));
    }

    public async ask(): Promise<string> {
        return new Promise((resolve) => {
            const w = this.getWidth();
            console.log(Theme.border(' ╭' + '─'.repeat(w) + '╮'));
            this.rl.setPrompt(Theme.border(' │ ') + Theme.primary('❯ '));
            this.rl.prompt();

            this.rl.once('line', (line) => {
                console.log(Theme.border(' ╰' + '─'.repeat(w) + '╯'));
                resolve(line.trim());
            });
        });
    }

    public close() {
        this.rl.close();
    }
}
