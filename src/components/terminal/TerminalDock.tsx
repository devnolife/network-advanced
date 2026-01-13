'use client';

import { useSimulationStore, useTerminals, useIsTerminalMinimized } from '@/store/simulationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Layers, Maximize2 } from 'lucide-react';
import { DeviceTerminal } from './DeviceTerminal';

export function TerminalDock() {
    const terminals = useTerminals();
    const isMinimized = useIsTerminalMinimized();
    const activeTerminalId = useSimulationStore((state) => state.activeTerminalId);
    const setActiveTerminal = useSimulationStore((state) => state.setActiveTerminal);
    const closeTerminal = useSimulationStore((state) => state.closeTerminal);
    const closeAllTerminals = useSimulationStore((state) => state.closeAllTerminals);
    const toggleMinimized = useSimulationStore((state) => state.toggleTerminalMinimized);

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
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700 shadow-xl">
                            <Terminal className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-gray-300">
                                {terminals.length} terminal{terminals.length > 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={toggleMinimized}
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
                        className="fixed bottom-0 left-0 right-0 z-50"
                    >
                        <div className="mx-4 mb-4 bg-[#0d1117] rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                            {/* Tabs */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
                                <div className="flex items-center overflow-x-auto scrollbar-hide">
                                    {terminals.map((term) => (
                                        <button
                                            key={term.id}
                                            onClick={() => setActiveTerminal(term.id)}
                                            className={`
                        flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-700/50
                        transition-all group relative
                        ${activeTerminalId === term.id
                                                    ? 'bg-[#0d1117] text-white'
                                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                                                }
                      `}
                                        >
                                            {activeTerminalId === term.id && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-500"
                                                />
                                            )}
                                            <Terminal className="w-4 h-4" />
                                            <span className="max-w-[120px] truncate">{term.deviceName}</span>
                                            <span className="text-xs text-gray-500">({term.deviceType})</span>
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

                                <div className="flex items-center gap-1 px-3">
                                    <button
                                        onClick={toggleMinimized}
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
                            <div className="h-[350px] relative">
                                {terminals.map((term) => (
                                    <div
                                        key={term.id}
                                        className={`absolute inset-0 ${activeTerminalId === term.id ? 'block' : 'hidden'}`}
                                    >
                                        <DeviceTerminal
                                            deviceId={term.deviceId}
                                            deviceName={term.deviceName}
                                            deviceType={term.deviceType}
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

export default TerminalDock;
