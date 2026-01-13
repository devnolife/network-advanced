'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { X, Maximize2, Minimize2, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceTerminalProps {
    deviceId: string;
    deviceName: string;
    deviceType: 'router' | 'pc' | 'firewall' | 'ids';
    sessionId?: string;
    onClose?: () => void;
    className?: string;
}

export function DeviceTerminal({
    deviceId,
    deviceName,
    deviceType,
    sessionId,
    onClose,
    className = '',
}: DeviceTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState(`${deviceName}>`);
    const [commandBuffer, setCommandBuffer] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize terminal
    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const term = new XTerm({
            theme: {
                background: '#0d1117',
                foreground: '#c9d1d9',
                cursor: '#58a6ff',
                cursorAccent: '#0d1117',
                selectionBackground: '#264f78',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#ffffff',
            },
            fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            cursorBlink: true,
            cursorStyle: 'block',
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome message
        const welcomeMsg = deviceType === 'router'
            ? `\r\n\x1b[1;36m╔══════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mNetwork Security Virtual Lab\x1b[0m                 \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Device: \x1b[1;32m${deviceName.padEnd(36)}\x1b[0m\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Type 'help' or '?' for available commands    \x1b[1;36m║\x1b[0m
\x1b[1;36m╚══════════════════════════════════════════════╝\x1b[0m\r\n`
            : `\r\n\x1b[1;36m╔══════════════════════════════════════════════╗\x1b[0m
\x1b[1;36m║\x1b[0m  \x1b[1;33mVirtual PC Console\x1b[0m                          \x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Host: \x1b[1;32m${deviceName.padEnd(38)}\x1b[0m\x1b[1;36m║\x1b[0m
\x1b[1;36m║\x1b[0m  Type 'help' for available commands           \x1b[1;36m║\x1b[0m
\x1b[1;36m╚══════════════════════════════════════════════╝\x1b[0m\r\n`;

        term.write(welcomeMsg);
        term.write(`\r\n${currentPrompt} `);
        setIsConnected(true);

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            xtermRef.current = null;
        };
    }, [deviceName, deviceType, currentPrompt]);

    // Execute command via API
    const executeCommand = useCallback(async (command: string): Promise<{
        success: boolean;
        output: string;
        error?: string;
        prompt: string;
    }> => {
        try {
            const response = await fetch('/api/device/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    command,
                    sessionId,
                }),
            });

            const result = await response.json();
            return {
                success: result.success,
                output: result.output || '',
                error: result.error,
                prompt: result.prompt || currentPrompt,
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: `Connection error: ${error}`,
                prompt: currentPrompt,
            };
        }
    }, [deviceId, sessionId, currentPrompt]);

    // Handle terminal input
    useEffect(() => {
        const term = xtermRef.current;
        if (!term) return;

        let buffer = '';
        let history: string[] = [];
        let hIndex = -1;

        const handleData = async (data: string) => {
            const code = data.charCodeAt(0);

            // Enter key
            if (code === 13) {
                term.write('\r\n');

                if (buffer.trim()) {
                    // Add to history
                    history = [buffer, ...history.slice(0, 49)];
                    hIndex = -1;
                    setCommandHistory(history);

                    // Execute command
                    const result = await executeCommand(buffer);

                    if (result.error) {
                        term.write(`\x1b[1;31m${result.error}\x1b[0m\r\n`);
                    } else if (result.output) {
                        term.write(`${result.output}\r\n`);
                    }

                    setCurrentPrompt(result.prompt);
                    term.write(`${result.prompt} `);
                } else {
                    term.write(`${currentPrompt} `);
                }

                buffer = '';
                setCommandBuffer('');
                return;
            }

            // Backspace
            if (code === 127) {
                if (buffer.length > 0) {
                    buffer = buffer.slice(0, -1);
                    setCommandBuffer(buffer);
                    term.write('\b \b');
                }
                return;
            }

            // Tab (autocomplete placeholder)
            if (code === 9) {
                // Could implement autocomplete here
                return;
            }

            // Arrow keys (escape sequences)
            if (data === '\x1b[A') {
                // Up arrow - previous history
                if (history.length > 0 && hIndex < history.length - 1) {
                    hIndex++;
                    setHistoryIndex(hIndex);

                    // Clear current line
                    term.write('\x1b[2K\r');
                    term.write(`${currentPrompt} `);

                    buffer = history[hIndex];
                    setCommandBuffer(buffer);
                    term.write(buffer);
                }
                return;
            }

            if (data === '\x1b[B') {
                // Down arrow - next history
                if (hIndex > 0) {
                    hIndex--;
                    setHistoryIndex(hIndex);

                    term.write('\x1b[2K\r');
                    term.write(`${currentPrompt} `);

                    buffer = history[hIndex];
                    setCommandBuffer(buffer);
                    term.write(buffer);
                } else if (hIndex === 0) {
                    hIndex = -1;
                    setHistoryIndex(-1);

                    term.write('\x1b[2K\r');
                    term.write(`${currentPrompt} `);

                    buffer = '';
                    setCommandBuffer('');
                }
                return;
            }

            // Regular character
            if (code >= 32 && code < 127) {
                buffer += data;
                setCommandBuffer(buffer);
                term.write(data);
            }
        };

        const disposable = term.onData(handleData);

        return () => {
            disposable.dispose();
        };
    }, [executeCommand, currentPrompt]);

    // Fit terminal on maximize toggle
    useEffect(() => {
        if (fitAddonRef.current) {
            setTimeout(() => fitAddonRef.current?.fit(), 100);
        }
    }, [isMaximized]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`
          ${isMaximized ? 'fixed inset-4 z-50' : 'relative'}
          flex flex-col bg-[#0d1117] rounded-lg border border-gray-700 shadow-2xl overflow-hidden
          ${className}
        `}
            >
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Terminal className="w-4 h-4" />
                            <span className="font-medium">{deviceName}</span>
                            <span className="text-xs text-gray-500">({deviceType})</span>
                            {isConnected && (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Connected
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                            title={isMaximized ? 'Minimize' : 'Maximize'}
                        >
                            {isMaximized ? (
                                <Minimize2 className="w-4 h-4 text-gray-400" />
                            ) : (
                                <Maximize2 className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                title="Close"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Terminal Content */}
                <div
                    ref={terminalRef}
                    className="flex-1 p-2"
                    style={{ minHeight: isMaximized ? 'calc(100vh - 120px)' : '400px' }}
                />

                {/* Status Bar */}
                <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-t border-gray-700 text-xs text-gray-500">
                    <span>Mode: {currentPrompt.includes('(config') ? 'Configuration' : currentPrompt.includes('#') ? 'Privileged' : 'User'}</span>
                    <span>History: {commandHistory.length} commands</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DeviceTerminal;
