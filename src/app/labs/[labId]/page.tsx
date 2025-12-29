'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Monitor,
    Router,
    Server,
    Shield,
    Activity,
    CheckCircle2,
    Circle,
    Lock,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Settings,
    Save,
    Download,
    HelpCircle,
    X,
    Maximize2,
    Minimize2
} from 'lucide-react';

// Mock lab data for demonstration
const mockLab = {
    id: 3,
    title: 'IPSec VPN Configuration',
    description: 'Configure a site-to-site IPSec VPN between two routers with IKE phases and ESP encryption.',
    objectives: [
        'Understand IKE Phase 1 and Phase 2 negotiation',
        'Configure ISAKMP policies and pre-shared keys',
        'Create and apply crypto maps to interfaces',
        'Verify IPSec tunnel establishment',
        'Test encrypted traffic flow'
    ],
    tasks: [
        { id: 't1', title: 'Configure IKE Phase 1 Policy', description: 'Set up ISAKMP policy with encryption, hash, and DH group', points: 10, status: 'completed' },
        { id: 't2', title: 'Set Pre-Shared Key', description: 'Configure the PSK for peer authentication', points: 10, status: 'completed' },
        { id: 't3', title: 'Create Transform Set', description: 'Define IPSec transform set with ESP parameters', points: 15, status: 'completed' },
        { id: 't4', title: 'Create Crypto Map', description: 'Build crypto map with peer and ACL settings', points: 15, status: 'current' },
        { id: 't5', title: 'Apply Crypto Map', description: 'Apply the crypto map to the WAN interface', points: 10, status: 'locked' },
        { id: 't6', title: 'Configure Peer Router', description: 'Set up matching configuration on Router2', points: 15, status: 'locked' },
        { id: 't7', title: 'Verify Tunnel', description: 'Check IKE and IPSec SA status', points: 10, status: 'locked' },
        { id: 't8', title: 'Test Connectivity', description: 'Ping through the VPN tunnel', points: 5, status: 'locked' },
        { id: 't9', title: 'Analyze Traffic', description: 'Capture and examine ESP packets', points: 10, status: 'locked' }
    ],
    hints: [
        { id: 'h1', taskId: 't4', content: 'Use "crypto map MYMAP 10 ipsec-isakmp" to create the map entry', cost: 2 },
        { id: 'h2', taskId: 't4', content: 'Set peer address with "set peer <IP>"', cost: 2 },
        { id: 'h3', taskId: 't4', content: 'Link transform set with "set transform-set MYSET"', cost: 2 }
    ],
    topology: {
        devices: [
            { id: 'pc1', type: 'pc', name: 'PC1', hostname: 'PC1', x: 80, y: 200, ip: '10.1.1.2/24' },
            { id: 'r1', type: 'router', name: 'Router1', hostname: 'R1', x: 250, y: 200, interfaces: ['Gi0/0: 10.1.1.1', 'Gi0/1: 192.168.1.1'] },
            { id: 'isp', type: 'router', name: 'ISP', hostname: 'ISP', x: 450, y: 200, interfaces: ['Gi0/0: 192.168.1.2', 'Gi0/1: 192.168.2.2'] },
            { id: 'r2', type: 'router', name: 'Router2', hostname: 'R2', x: 650, y: 200, interfaces: ['Gi0/0: 10.2.1.1', 'Gi0/1: 192.168.2.1'] },
            { id: 'pc2', type: 'pc', name: 'PC2', hostname: 'PC2', x: 820, y: 200, ip: '10.2.1.2/24' }
        ],
        links: [
            { from: 'pc1', to: 'r1', status: 'up' },
            { from: 'r1', to: 'isp', status: 'up' },
            { from: 'isp', to: 'r2', status: 'up' },
            { from: 'r2', to: 'pc2', status: 'up' }
        ]
    }
};

// Terminal Component
function Terminal({
    device,
    onClose
}: {
    device: { hostname: string; type: string };
    onClose: () => void;
}) {
    const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error' | 'success'; text: string }[]>([
        { type: 'output', text: `\n${device.type.toUpperCase()} Console\nType 'help' for available commands\n` }
    ]);
    const [input, setInput] = useState('');
    const [prompt, setPrompt] = useState(`${device.hostname}>`);
    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const handleCommand = useCallback((cmd: string) => {
        const trimmedCmd = cmd.trim().toLowerCase();

        setHistory(prev => [...prev, { type: 'input', text: `${prompt} ${cmd}` }]);
        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);

        // Simulate command responses
        switch (true) {
            case trimmedCmd === 'enable':
                setPrompt(`${device.hostname}#`);
                break;
            case trimmedCmd === 'disable':
                setPrompt(`${device.hostname}>`);
                break;
            case trimmedCmd === 'configure terminal' || trimmedCmd === 'conf t':
                setPrompt(`${device.hostname}(config)#`);
                setHistory(prev => [...prev, { type: 'output', text: 'Enter configuration commands, one per line.  End with CNTL/Z.' }]);
                break;
            case trimmedCmd === 'exit':
                if (prompt.includes('config-')) {
                    setPrompt(`${device.hostname}(config)#`);
                } else if (prompt.includes('config')) {
                    setPrompt(`${device.hostname}#`);
                } else if (prompt.includes('#')) {
                    setPrompt(`${device.hostname}>`);
                }
                break;
            case trimmedCmd === 'end':
                setPrompt(`${device.hostname}#`);
                break;
            case trimmedCmd.startsWith('crypto isakmp policy'):
                setPrompt(`${device.hostname}(config-isakmp)#`);
                break;
            case trimmedCmd.startsWith('crypto map'):
                if (trimmedCmd.includes('ipsec-isakmp')) {
                    setPrompt(`${device.hostname}(config-crypto-map)#`);
                }
                break;
            case trimmedCmd.startsWith('interface') || trimmedCmd.startsWith('int '):
                setPrompt(`${device.hostname}(config-if)#`);
                break;
            case trimmedCmd === 'show ip interface brief' || trimmedCmd === 'sh ip int br':
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: `Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.1.1.1        YES manual up                    up
GigabitEthernet0/1     192.168.1.1     YES manual up                    up
Tunnel0                10.10.10.1      YES manual up                    up`
                }]);
                break;
            case trimmedCmd === 'show crypto isakmp sa':
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: `IPv4 Crypto ISAKMP SA
dst             src             state          conn-id status
192.168.2.1     192.168.1.1     QM_IDLE           1001 ACTIVE`
                }]);
                break;
            case trimmedCmd === 'show crypto ipsec sa':
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: `interface: GigabitEthernet0/1
    Crypto map tag: MYMAP, local addr: 192.168.1.1

   protected vrf: (none)
   local  ident (addr/mask/prot/port): (10.1.1.0/255.255.255.0/0/0)
   remote ident (addr/mask/prot/port): (10.2.1.0/255.255.255.0/0/0)
   current_peer 192.168.2.1
    #pkts encaps: 847, #pkts encrypt: 847
    #pkts decaps: 842, #pkts decrypt: 842`
                }]);
                break;
            case trimmedCmd.startsWith('ping'):
                const dest = trimmedCmd.split(' ')[1] || '10.2.1.2';
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to ${dest}, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`
                }]);
                break;
            case trimmedCmd === 'help' || trimmedCmd === '?':
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: `Available commands:
  enable              Enter privileged mode
  configure terminal  Enter config mode
  show                Display system info
  crypto              Crypto configuration
  interface           Interface configuration
  ping                Send ICMP echo
  exit                Exit current mode
  help                Show this help`
                }]);
                break;
            case trimmedCmd.startsWith('encryption') || trimmedCmd.startsWith('hash') ||
                trimmedCmd.startsWith('group') || trimmedCmd.startsWith('lifetime') ||
                trimmedCmd.startsWith('set peer') || trimmedCmd.startsWith('set transform') ||
                trimmedCmd.startsWith('match address') || trimmedCmd === 'no shutdown' ||
                trimmedCmd.startsWith('ip address'):
                setHistory(prev => [...prev, { type: 'success', text: '✓ Configuration applied' }]);
                break;
            case trimmedCmd === '':
                break;
            default:
                setHistory(prev => [...prev, { type: 'error', text: `% Unknown command or computer name: "${cmd}"` }]);
        }
    }, [device.hostname, prompt]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCommand(input);
            setInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
            } else {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="terminal-container h-full flex flex-col">
            <div className="terminal-header">
                <div className="terminal-title">
                    <span>{device.hostname} - Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-icon text-xs p-1.5" title="Clear">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn btn-ghost btn-icon text-xs p-1.5" onClick={onClose} title="Close">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div
                ref={terminalRef}
                className="terminal-body flex-1 overflow-y-auto"
                onClick={() => inputRef.current?.focus()}
            >
                {history.map((line, i) => (
                    <div key={i} className={`terminal-line ${line.type === 'input' ? 'terminal-prompt' : line.type === 'error' ? 'terminal-error' : line.type === 'success' ? 'terminal-success' : 'terminal-output'}`}>
                        {line.text}
                    </div>
                ))}
                <div className="terminal-input-line flex items-center">
                    <span className="terminal-prompt">{prompt}&nbsp;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none flex-1 text-[var(--terminal-text)] font-mono"
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
            </div>
        </div>
    );
}

// Packet Capture Component
function PacketCapture() {
    const packets = [
        { id: 1, time: '0.000', src: '10.1.1.2', dst: '10.2.1.2', protocol: 'ICMP', info: 'Echo Request' },
        { id: 2, time: '0.001', src: '192.168.1.1', dst: '192.168.2.1', protocol: 'ESP', info: 'SPI=0x12345678, Seq=1' },
        { id: 3, time: '0.015', src: '192.168.2.1', dst: '192.168.1.1', protocol: 'ESP', info: 'SPI=0x87654321, Seq=1' },
        { id: 4, time: '0.016', src: '10.2.1.2', dst: '10.1.1.2', protocol: 'ICMP', info: 'Echo Reply' },
        { id: 5, time: '1.000', src: '10.1.1.2', dst: '10.2.1.2', protocol: 'ICMP', info: 'Echo Request' },
        { id: 6, time: '1.001', src: '192.168.1.1', dst: '192.168.2.1', protocol: 'ESP', info: 'SPI=0x12345678, Seq=2' },
    ];

    const [selectedPacket, setSelectedPacket] = useState<number | null>(null);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                    <button className="btn btn-success btn-icon text-xs">
                        <Play className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn btn-secondary btn-icon text-xs">
                        <Pause className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">Capturing on GigabitEthernet0/1</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Filter..."
                        className="input text-xs py-1.5 w-48"
                    />
                    <button className="btn btn-secondary text-xs">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="packet-table">
                    <thead>
                        <tr>
                            <th className="w-12">#</th>
                            <th className="w-20">Time</th>
                            <th>Source</th>
                            <th>Destination</th>
                            <th className="w-24">Protocol</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packets.map((pkt) => (
                            <tr
                                key={pkt.id}
                                className={selectedPacket === pkt.id ? 'selected' : ''}
                                onClick={() => setSelectedPacket(pkt.id)}
                            >
                                <td>{pkt.id}</td>
                                <td>{pkt.time}</td>
                                <td>{pkt.src}</td>
                                <td>{pkt.dst}</td>
                                <td>
                                    <span className={`protocol-badge protocol-${pkt.protocol.toLowerCase()}`}>
                                        {pkt.protocol}
                                    </span>
                                </td>
                                <td>{pkt.info}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedPacket && (
                <div className="border-t border-[var(--border-default)] p-3 bg-[var(--bg-tertiary)]">
                    <div className="text-xs font-mono text-[var(--text-secondary)]">
                        <div>▼ Encapsulating Security Payload</div>
                        <div className="pl-4">SPI: 0x12345678</div>
                        <div className="pl-4">Sequence: 1</div>
                        <div className="pl-4">▶ Encrypted Data (96 bytes)</div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Device Icon Component
function DeviceIcon({ type }: { type: string }) {
    switch (type) {
        case 'router':
            return <Router className="w-full h-full" />;
        case 'pc':
            return <Monitor className="w-full h-full" />;
        case 'server':
            return <Server className="w-full h-full" />;
        case 'firewall':
            return <Shield className="w-full h-full" />;
        default:
            return <Server className="w-full h-full" />;
    }
}

// Main Lab Page Component
export default function LabPage() {
    const [selectedDevice, setSelectedDevice] = useState<typeof mockLab.topology.devices[0] | null>(null);
    const [showTerminal, setShowTerminal] = useState(false);
    const [showPacketCapture, setShowPacketCapture] = useState(false);
    const [isRunning, setIsRunning] = useState(true);
    const [activeTab, setActiveTab] = useState<'tasks' | 'hints' | 'objectives'>('tasks');
    const [expandedHints, setExpandedHints] = useState<string[]>([]);
    const [rightPanelWidth, setRightPanelWidth] = useState(350);

    const completedTasks = mockLab.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = mockLab.tasks.length;
    const currentScore = mockLab.tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.points, 0);
    const totalScore = mockLab.tasks.reduce((sum, t) => sum + t.points, 0);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Lab Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                <div className="flex items-center gap-4">
                    <a href="/labs" className="btn btn-ghost btn-icon">
                        <ChevronLeft className="w-5 h-5" />
                    </a>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)]">Lab {mockLab.id}</span>
                            <span className="badge badge-info text-[10px]">Intermediate</span>
                        </div>
                        <h1 className="text-lg font-semibold text-white">{mockLab.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Progress */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-sm font-medium text-white">{completedTasks}/{totalTasks} Tasks</div>
                            <div className="text-xs text-[var(--text-muted)]">{currentScore}/{totalScore} Points</div>
                        </div>
                        <div className="w-24">
                            <div className="progress">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            className={`btn ${isRunning ? 'btn-danger' : 'btn-success'} text-sm`}
                            onClick={() => setIsRunning(!isRunning)}
                        >
                            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isRunning ? 'Pause' : 'Start'}
                        </button>
                        <button className="btn btn-secondary text-sm">
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button className="btn btn-secondary text-sm">
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Topology & Tools */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Network Topology */}
                    <div className="flex-1 p-4">
                        <div className="topology-canvas cyber-grid h-full relative">
                            {/* Grid Background is in CSS */}

                            {/* SVG for connections */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {mockLab.topology.links.map((link, i) => {
                                    const fromDevice = mockLab.topology.devices.find(d => d.id === link.from);
                                    const toDevice = mockLab.topology.devices.find(d => d.id === link.to);
                                    if (!fromDevice || !toDevice) return null;

                                    return (
                                        <line
                                            key={i}
                                            x1={fromDevice.x + 40}
                                            y1={fromDevice.y + 40}
                                            x2={toDevice.x + 40}
                                            y2={toDevice.y + 40}
                                            className={`connection-line data-flow-line ${link.status === 'up' ? 'active' : 'down'}`}
                                            strokeWidth="2"
                                        />
                                    );
                                })}

                                {/* VPN Tunnel Indicator */}
                                <line
                                    x1={290}
                                    y1={180}
                                    x2={690}
                                    y2={180}
                                    stroke="var(--accent)"
                                    strokeWidth="2"
                                    strokeDasharray="8 4"
                                    opacity="0.6"
                                />
                                <text x="490" y="170" fill="var(--accent)" fontSize="12" textAnchor="middle">IPSec Tunnel</text>
                            </svg>

                            {/* Device Nodes */}
                            {mockLab.topology.devices.map((device) => (
                                <div
                                    key={device.id}
                                    className={`device-node online ${selectedDevice?.id === device.id ? 'selected' : ''}`}
                                    style={{ left: device.x, top: device.y }}
                                    onClick={() => setSelectedDevice(device)}
                                    onDoubleClick={() => {
                                        setSelectedDevice(device);
                                        setShowTerminal(true);
                                    }}
                                >
                                    <div className="device-icon">
                                        <DeviceIcon type={device.type} />
                                    </div>
                                    <div className="device-label">{device.name}</div>
                                    {device.ip && (
                                        <div className="text-[9px] text-[var(--text-muted)]">{device.ip}</div>
                                    )}
                                </div>
                            ))}

                            {/* Topology Legend */}
                            <div className="absolute bottom-4 left-4 glass-card p-3 text-xs">
                                <div className="text-[var(--text-muted)] mb-2">Legend</div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-4 h-0.5 bg-[var(--accent)]" style={{ animation: 'dash 1s linear infinite' }} />
                                    <span className="text-[var(--text-secondary)]">Active Link</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5 bg-[var(--accent)]" style={{ strokeDasharray: '8 4' }} />
                                    <span className="text-[var(--text-secondary)]">VPN Tunnel</span>
                                </div>
                            </div>

                            {/* Selection Info */}
                            {selectedDevice && (
                                <div className="absolute bottom-4 right-4 glass-card p-4 w-64">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-white">{selectedDevice.name}</h4>
                                        <button
                                            className="btn btn-primary text-xs"
                                            onClick={() => setShowTerminal(true)}
                                        >
                                            Open Terminal
                                        </button>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] space-y-1">
                                        <div>Hostname: {selectedDevice.hostname}</div>
                                        <div>Type: {selectedDevice.type}</div>
                                        {selectedDevice.ip && <div>IP: {selectedDevice.ip}</div>}
                                        {selectedDevice.interfaces && (
                                            <div>
                                                <div className="mt-2 mb-1 text-[var(--text-muted)]">Interfaces:</div>
                                                {selectedDevice.interfaces.map((intf, i) => (
                                                    <div key={i} className="text-[var(--primary)]">{intf}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tools Panel */}
                    <div className="h-80 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                        <div className="flex items-center border-b border-[var(--border-default)]">
                            <button
                                className={`px-4 py-2.5 text-sm ${showTerminal && !showPacketCapture ? 'bg-[var(--bg-tertiary)] text-white border-b-2 border-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                                onClick={() => { setShowTerminal(true); setShowPacketCapture(false); }}
                            >
                                Terminal
                            </button>
                            <button
                                className={`px-4 py-2.5 text-sm ${showPacketCapture ? 'bg-[var(--bg-tertiary)] text-white border-b-2 border-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                                onClick={() => { setShowPacketCapture(true); setShowTerminal(false); }}
                            >
                                <Activity className="w-4 h-4 inline mr-1" />
                                Packet Capture
                            </button>
                        </div>

                        <div className="h-[calc(100%-41px)]">
                            {showTerminal && selectedDevice && (
                                <Terminal
                                    device={selectedDevice}
                                    onClose={() => setShowTerminal(false)}
                                />
                            )}
                            {showPacketCapture && <PacketCapture />}
                            {!showTerminal && !showPacketCapture && (
                                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                                    <div className="text-center">
                                        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Select a device and click "Open Terminal"</p>
                                        <p className="text-sm">or double-click a device on the topology</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Tasks & Info */}
                <div
                    className="bg-[var(--bg-secondary)] border-l border-[var(--border-default)] flex flex-col"
                    style={{ width: rightPanelWidth }}
                >
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border-default)]">
                        {(['tasks', 'hints', 'objectives'] as const).map((tab) => (
                            <button
                                key={tab}
                                className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${activeTab === tab
                                    ? 'bg-[var(--bg-tertiary)] text-white border-b-2 border-[var(--primary)]'
                                    : 'text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'tasks' && (
                            <ul className="task-list">
                                {mockLab.tasks.map((task, i) => (
                                    <li
                                        key={task.id}
                                        className={`task-item ${task.status === 'completed' ? 'completed' : task.status === 'current' ? 'current' : 'locked'}`}
                                    >
                                        <div className={`task-status-icon ${task.status}`}>
                                            {task.status === 'completed' ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : task.status === 'current' ? (
                                                <Circle className="w-4 h-4" />
                                            ) : (
                                                <Lock className="w-3 h-3" />
                                            )}
                                        </div>
                                        <div className="task-content">
                                            <div className="task-title flex items-center gap-2">
                                                <span>Task {i + 1}: {task.title}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{task.points} pts</span>
                                            </div>
                                            <div className="task-description">{task.description}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {activeTab === 'hints' && (
                            <div className="space-y-3">
                                {mockLab.hints.map((hint) => (
                                    <div
                                        key={hint.id}
                                        className="bg-[var(--bg-tertiary)] rounded-lg overflow-hidden border border-[var(--border-default)]"
                                    >
                                        <button
                                            className="w-full px-4 py-3 flex items-center justify-between text-left"
                                            onClick={() => {
                                                setExpandedHints(prev =>
                                                    prev.includes(hint.id)
                                                        ? prev.filter(h => h !== hint.id)
                                                        : [...prev, hint.id]
                                                );
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4 text-[var(--accent-warning)]" />
                                                <span className="text-sm text-white">Task 4 Hint</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--accent-danger)]">-{hint.cost} pts</span>
                                                {expandedHints.includes(hint.id) ? (
                                                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                        </button>
                                        {expandedHints.includes(hint.id) && (
                                            <div className="px-4 pb-3 text-sm text-[var(--text-secondary)] border-t border-[var(--border-default)] pt-3">
                                                {hint.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'objectives' && (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--text-secondary)]">{mockLab.description}</p>
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-2">Learning Objectives:</h4>
                                    <ul className="space-y-2">
                                        {mockLab.objectives.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Task Card */}
                    {activeTab === 'tasks' && (
                        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-tertiary)]">
                            <div className="text-xs text-[var(--text-muted)] mb-2">Current Task</div>
                            <h4 className="text-sm font-medium text-white mb-1">Task 4: Create Crypto Map</h4>
                            <p className="text-xs text-[var(--text-secondary)] mb-3">
                                Build crypto map with peer and ACL settings
                            </p>
                            <button className="btn btn-primary w-full text-sm">
                                <HelpCircle className="w-4 h-4" />
                                Show Hint (-2 pts)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
