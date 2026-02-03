'use client';

// Packet Capture Demo Page
// Wireshark-like packet capture and analysis interface

import React, { useCallback, useEffect } from 'react';
import { ArrowLeft, Network, RefreshCw, Database, Play, FileDown } from 'lucide-react';
import { PacketCapturePanel } from '@/components/capture';
import { usePacketCapture } from '@/hooks';
import { usePacketCaptureStore } from '@/store/packetCaptureStore';

export default function CapturePage() {
    const { loadSamplePackets, clearCapture, isCapturing, packetCount } = usePacketCapture();
    const statistics = usePacketCaptureStore((state) => state.statistics);
    const exportPackets = usePacketCaptureStore((state) => state.exportPackets);

    // Load sample packets on initial mount for demo
    useEffect(() => {
        if (packetCount === 0) {
            loadSamplePackets(20);
        }
    }, []);

    // Handle export
    const handleExport = useCallback((format: 'json' | 'csv') => {
        const data = exportPackets(format);
        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capture-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportPackets]);

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Left: Navigation */}
                        <div className="flex items-center gap-3">
                            <a 
                                href="/" 
                                className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all duration-200 hover:scale-105"
                                title="Back to Home"
                            >
                                <ArrowLeft className="w-4 h-4 text-zinc-300" />
                            </a>
                            <div className="flex items-center gap-2">
                                <Network className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <h1 className="text-sm font-bold text-white">Packet Capture</h1>
                                    <p className="text-[10px] text-zinc-500">Network Traffic Analysis</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Stats */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                <Database className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-400">
                                    Packets: <span className="text-zinc-200 font-medium">{statistics.totalPackets}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                <span className="text-xs text-zinc-400">
                                    Bytes: <span className="text-zinc-200 font-medium">{formatBytes(statistics.totalBytes)}</span>
                                </span>
                            </div>
                            {isCapturing && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs text-emerald-400 font-medium">Capturing</span>
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadSamplePackets(10)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700"
                                title="Generate sample packets"
                            >
                                <Play className="w-3 h-3" />
                                <span className="hidden sm:inline">Add Sample</span>
                            </button>
                            <button
                                onClick={clearCapture}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700"
                                title="Clear captured packets"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span className="hidden sm:inline">Clear</span>
                            </button>
                            <button
                                onClick={() => handleExport('json')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                                title="Export as JSON"
                            >
                                <FileDown className="w-3 h-3" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                <PacketCapturePanel className="h-full" />
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800/50 bg-zinc-900/50">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <div className="flex items-center gap-4">
                            <span>Network Security Virtual Lab</span>
                            <span className="text-zinc-700">|</span>
                            <span>Packet Capture Module</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>
                                Duration: {formatDuration(statistics.duration)}
                            </span>
                            {statistics.packetsPerSecond > 0 && (
                                <span>
                                    Rate: {statistics.packetsPerSecond.toFixed(1)} pps
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Utility functions
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
}
