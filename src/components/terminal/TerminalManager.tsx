'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Layers } from 'lucide-react';
import { DeviceTerminal } from './DeviceTerminal';

interface TerminalSession {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceType: 'router' | 'pc' | 'firewall' | 'ids';
}

interface TerminalManagerProps {
    sessionId?: string;
    className?: string;
}

export function TerminalManager({ sessionId, className = '' }: TerminalManagerProps) {
    const [terminals, setTerminals] = useState<TerminalSession[]>([]);
    const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const openTerminal = (
        deviceId: string,
        deviceName: string,
        deviceType: 'router' | 'pc' | 'firewall' | 'ids'
    ) => {
        // Check if terminal already exists
        const existing = terminals.find((t) => t.deviceId === deviceId);
        if (existing) {
            setActiveTerminal(existing.id);
            setIsMinimized(false);
            return;
        }

        const newTerminal: TerminalSession = {
            id: `term-${Date.now()}`,
            deviceId,
            deviceName,
            deviceType,
        };

        setTerminals([...terminals, newTerminal]);
        setActiveTerminal(newTerminal.id);
        setIsMinimized(false);
    };

    const closeTerminal = (terminalId: string) => {
        setTerminals(terminals.filter((t) => t.id !== terminalId));
        if (activeTerminal === terminalId) {
            const remaining = terminals.filter((t) => t.id !== terminalId);
            setActiveTerminal(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const closeAllTerminals = () => {
        setTerminals([]);
        setActiveTerminal(null);
    };

    if (terminals.length === 0) {
        return null;
    }

    return (
        <>
            {/* Minimized Bar */}
            <AnimatePresence>
                {isMinimized && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 ${className}`}
                    >
                        <div className="flex items-center gap-2 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 shadow-xl">
                            <Terminal className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-gray-300">
                                {terminals.length} terminal{terminals.length > 1 ? 's' : ''} open
                            </span>
                            <button
                                onClick={() => setIsMinimized(false)}
                                className="ml-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-full text-xs text-white transition-colors"
                            >
                                Show
                            </button>
                            <button
                                onClick={closeAllTerminals}
                                className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Terminal Window */}
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className={`fixed bottom-0 left-0 right-0 z-40 ${className}`}
                    >
                        <div className="mx-4 mb-4 bg-[#0d1117] rounded-t-lg border border-gray-700 shadow-2xl overflow-hidden">
                            {/* Tabs */}
                            <div className="flex items-center justify-between bg-gray-900 border-b border-gray-700">
                                <div className="flex items-center overflow-x-auto">
                                    {terminals.map((term) => (
                                        <button
                                            key={term.id}
                                            onClick={() => setActiveTerminal(term.id)}
                                            className={`
                        flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-700
                        transition-colors group
                        ${activeTerminal === term.id
                                                    ? 'bg-[#0d1117] text-white'
                                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                                }
                      `}
                                        >
                                            <Terminal className="w-4 h-4" />
                                            <span>{term.deviceName}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    closeTerminal(term.id);
                                                }}
                                                className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 px-3">
                                    <button
                                        onClick={() => setIsMinimized(true)}
                                        className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                                        title="Minimize"
                                    >
                                        <Layers className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={closeAllTerminals}
                                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                        title="Close All"
                                    >
                                        <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Terminal Content */}
                            <div className="h-[400px]">
                                {terminals.map((term) => (
                                    <div
                                        key={term.id}
                                        className={activeTerminal === term.id ? 'block h-full' : 'hidden'}
                                    >
                                        <DeviceTerminal
                                            deviceId={term.deviceId}
                                            deviceName={term.deviceName}
                                            deviceType={term.deviceType}
                                            sessionId={sessionId}
                                            className="h-full rounded-none border-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Hook to manage terminals from anywhere in the app
export function useTerminalManager() {
    return {
        openTerminal: (
            deviceId: string,
            deviceName: string,
            deviceType: 'router' | 'pc' | 'firewall' | 'ids'
        ) => {
            // This would typically use a global state manager like Zustand
            // For now, dispatch a custom event
            window.dispatchEvent(
                new CustomEvent('open-terminal', {
                    detail: { deviceId, deviceName, deviceType },
                })
            );
        },
    };
}

export default TerminalManager;
