import ora, { Ora } from 'ora';
import chalk from 'chalk';
import highlight from 'cli-highlight';
import { Theme } from './index.js';

export class StreamRenderer {
    private spinner: Ora;
    private buffer: string = '';
    private inCodeBlock: boolean = false;
    private codeBuffer: string = '';

    constructor() {
        this.spinner = ora({
            color: 'blue',
            spinner: 'dots'
        });
    }

    /**
     * Consumes the Vercel AI SDK full stream to handle text, code blocks, and live tool spinners.
     */
    async render(stream: AsyncIterable<any>) {
        for await (const part of stream) {
            switch (part.type) {
                case 'text-delta':
                    this.processText(part.textDelta);
                    break;
                case 'tool-call':
                    // Clear any pending text newline before showing spinner
                    if (this.buffer) console.log();
                    this.spinner.start(Theme.secondary(`⚙ Nova Code is using tool: ${Theme.primary(part.toolName)}...`));
                    break;
                case 'tool-result':
                    this.spinner.succeed(Theme.border(`✓ Completed ${part.toolName}`));
                    console.log(); // Spacing after tool completes
                    break;
            }
        }
        
        // Flush any remaining code buffer if stream ends abruptly
        if (this.inCodeBlock && this.codeBuffer.length > 0) {
            this.flushCodeBlock();
        }
    }

    private processText(text: string) {
        // Simple streaming code block detector
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            this.buffer += char;

            // Check for markdown code blocks ```
            if (this.buffer.endsWith('```')) {
                if (!this.inCodeBlock) {
                    // Entering code block
                    this.inCodeBlock = true;
                    // Print the ``` and start buffering the code
                    process.stdout.write(Theme.secondary('```\n'));
                    this.buffer = ''; 
                } else {
                    // Exiting code block
                    this.inCodeBlock = false;
                    // Remove the ``` from the end of the code buffer
                    this.codeBuffer = this.codeBuffer.slice(0, -3);
                    this.flushCodeBlock();
                    process.stdout.write(Theme.secondary('```'));
                    this.buffer = '';
                }
                continue;
            }

            if (this.inCodeBlock) {
                this.codeBuffer += char;
            } else {
                // If not in code block, just print normally
                if (char === '\n') {
                    process.stdout.write('\n');
                    this.buffer = '';
                } else {
                    process.stdout.write(Theme.text(char));
                }
            }
        }
    }

    private flushCodeBlock() {
        if (!this.codeBuffer.trim()) return;
        
        try {
            // Apply VS Code style syntax highlighting to the complete block!
            const highlighted = highlight.highlight(this.codeBuffer, { ignoreIllegals: true });
            process.stdout.write(highlighted);
        } catch (e) {
            // Fallback to plain text if highlighting fails
            process.stdout.write(Theme.primary(this.codeBuffer));
        }
        this.codeBuffer = '';
    }
}
