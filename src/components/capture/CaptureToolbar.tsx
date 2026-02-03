'use client';

// CaptureToolbar - Filter bar and capture controls (like Wireshark toolbar)
// Provides filter input with autocomplete, capture controls, and quick filters

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, 
    Square, 
    Pause, 
    Trash2, 
    Filter, 
    X, 
    Search,
    Clock,
    Save,
    FileDown,
    ChevronDown,
    RotateCcw,
    Bookmark,
    Settings,
    ArrowDownToLine,
    AlertCircle,
    Check,
    HelpCircle,
    Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    usePacketCaptureStore, 
    type CaptureProtocol,
    type DisplayFilter 
} from '@/store/packetCaptureStore';
import { 
    FilterParser, 
    getFilterSuggestions,
    type FilterSuggestion 
} from '@/lib/network/capture';

// Protocol filter options
const PROTOCOL_OPTIONS: { value: CaptureProtocol; label: string; color: string }[] = [
    { value: 'tcp', label: 'TCP', color: 'bg-emerald-500' },
    { value: 'udp', label: 'UDP', color: 'bg-blue-500' },
    { value: 'icmp', label: 'ICMP', color: 'bg-pink-500' },
    { value: 'arp', label: 'ARP', color: 'bg-amber-500' },
    { value: 'dns', label: 'DNS', color: 'bg-cyan-500' },
    { value: 'http', label: 'HTTP', color: 'bg-green-500' },
    { value: 'https', label: 'HTTPS', color: 'bg-green-600' },
    { value: 'ssh', label: 'SSH', color: 'bg-purple-500' },
    { value: 'dhcp', label: 'DHCP', color: 'bg-indigo-500' },
    { value: 'esp', label: 'ESP', color: 'bg-yellow-500' },
    { value: 'ah', label: 'AH', color: 'bg-yellow-600' },
    { value: 'isakmp', label: 'ISAKMP', color: 'bg-yellow-500' },
];

// Time format options
const TIME_FORMAT_OPTIONS = [
    { value: 'absolute', label: 'Absolute Time' },
    { value: 'relative', label: 'Relative Time' },
    { value: 'delta', label: 'Delta Time' },
] as const;

interface CaptureToolbarProps {
    className?: string;
    onStartCapture?: () => void;
    onStopCapture?: () => void;
    onFollowStream?: () => void;
}

export function CaptureToolbar({ className, onStartCapture, onStopCapture, onFollowStream }: CaptureToolbarProps) {
    const {
        isCapturing,
        isPaused,
        startCapture,
        stopCapture,
        pauseCapture,
        resumeCapture,
        clearCapture,
        displayFilter,
        setDisplayFilter,
        savedFilters,
        saveFilter,
        autoScroll,
        setAutoScroll,
        timeFormat,
        setTimeFormat,
        statistics,
        exportPackets,
        packets,
        filteredPackets,
    } = usePacketCaptureStore();
    
    // Local state
    const [filterText, setFilterText] = useState('');
    const [showProtocolDropdown, setShowProtocolDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [showSavedFilters, setShowSavedFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [filterValidation, setFilterValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    
    const filterInputRef = useRef<HTMLInputElement>(null);
    const protocolDropdownRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    
    // Get filter suggestions
    const suggestions = useMemo(() => {
        if (!filterText) return [];
        return getFilterSuggestions(filterText);
    }, [filterText]);
    
    // Validate filter on change
    useEffect(() => {
        if (!filterText.trim()) {
            setFilterValidation({ valid: true });
            return;
        }
        
        const validation = FilterParser.validate(filterText);
        setFilterValidation(validation);
    }, [filterText]);
    
    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (protocolDropdownRef.current && !protocolDropdownRef.current.contains(e.target as Node)) {
                setShowProtocolDropdown(false);
            }
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
                filterInputRef.current && !filterInputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Handle capture start
    const handleStart = useCallback(() => {
        startCapture();
        onStartCapture?.();
    }, [startCapture, onStartCapture]);
    
    // Handle capture stop
    const handleStop = useCallback(() => {
        stopCapture();
        onStopCapture?.();
    }, [stopCapture, onStopCapture]);
    
    // Handle filter apply using FilterParser
    const handleApplyFilter = useCallback(() => {
        if (!filterText.trim()) {
            // Clear all filters
            setDisplayFilter({});
            return;
        }
        
        // Validate the filter
        const validation = FilterParser.validate(filterText);
        if (!validation.valid) {
            setFilterValidation(validation);
            return;
        }
        
        try {
            // Compile and apply the filter
            const compiled = FilterParser.compile(filterText);
            
            // Create a custom filter function
            const newFilter: DisplayFilter = {
                searchText: filterText, // Store the expression for display
            };
            
            setDisplayFilter(newFilter);
            
            // Apply filter to packets using the compiled filter
            const store = usePacketCaptureStore.getState();
            const filtered = store.packets.filter(packet => compiled.matches(packet));
            
            // Update filtered packets directly
            usePacketCaptureStore.setState({ filteredPackets: filtered });
            
            setFilterValidation({ valid: true });
            setShowSuggestions(false);
        } catch (e) {
            setFilterValidation({ valid: false, error: String(e) });
        }
    }, [filterText, setDisplayFilter]);
    
    // Handle filter key press
    const handleFilterKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestion(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Tab' || (e.key === 'Enter' && selectedSuggestion >= 0)) {
                e.preventDefault();
                const suggestion = suggestions[selectedSuggestion];
                if (suggestion) {
                    // Replace last word with suggestion
                    const words = filterText.split(/(\s+)/);
                    words[words.length - 1] = suggestion.text;
                    setFilterText(words.join(''));
                    setShowSuggestions(false);
                }
                return;
            }
        }
        
        if (e.key === 'Enter' && !showSuggestions) {
            handleApplyFilter();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }, [filterText, handleApplyFilter, selectedSuggestion, showSuggestions, suggestions]);
    
    // Handle suggestion click
    const handleSuggestionClick = useCallback((suggestion: FilterSuggestion) => {
        const words = filterText.split(/(\s+)/);
        words[words.length - 1] = suggestion.text;
        setFilterText(words.join(''));
        setShowSuggestions(false);
        filterInputRef.current?.focus();
    }, [filterText]);
    
    // Handle protocol toggle
    const handleProtocolToggle = useCallback((protocol: CaptureProtocol) => {
        const currentProtocols = displayFilter.protocol || [];
        const newProtocols = currentProtocols.includes(protocol)
            ? currentProtocols.filter((p) => p !== protocol)
            : [...currentProtocols, protocol];
        
        setDisplayFilter({
            ...displayFilter,
            protocol: newProtocols.length > 0 ? newProtocols : undefined,
        });
    }, [displayFilter, setDisplayFilter]);
    
    // Handle clear filter
    const handleClearFilter = useCallback(() => {
        setFilterText('');
        setDisplayFilter({});
        setFilterValidation({ valid: true });
    }, [setDisplayFilter]);
    
    // Handle export
    const handleExport = useCallback((format: 'json' | 'csv' | 'pcap') => {
        const data = exportPackets(format);
        const mimeTypes = {
            json: 'application/json',
            csv: 'text/csv',
            pcap: 'application/octet-stream',
        };
        const blob = new Blob([data], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capture-${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportPackets]);
    
    // Quick filter examples
    const quickFilters = [
        { label: 'TCP', expression: 'tcp' },
        { label: 'UDP', expression: 'udp' },
        { label: 'DNS', expression: 'dns' },
        { label: 'HTTP', expression: 'http' },
        { label: 'ICMP', expression: 'icmp' },
        { label: 'Port 80', expression: 'tcp.port == 80' },
        { label: 'Port 443', expression: 'tcp.port == 443' },
    ];
    
    // Active filter count
    const activeFilterCount = [
        displayFilter.protocol?.length,
        displayFilter.sourceAddress,
        displayFilter.destinationAddress,
        displayFilter.port,
        displayFilter.searchText,
        displayFilter.marked,
    ].filter(Boolean).length;

    return (
        <div className={cn('bg-zinc-900 border-b border-zinc-700', className)}>
            {/* Main toolbar */}
            <div className="flex items-center gap-2 px-3 py-2">
                {/* Capture controls */}
                <div className="flex items-center gap-1 pr-3 border-r border-zinc-700">
                    {/* Start/Resume button */}
                    <button
                        onClick={isCapturing && isPaused ? resumeCapture : handleStart}
                        disabled={isCapturing && !isPaused}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            isCapturing && !isPaused
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        )}
                        title={isPaused ? 'Resume capture' : 'Start capture'}
                    >
                        <Play className="w-4 h-4" />
                    </button>
                    
                    {/* Pause button */}
                    <button
                        onClick={pauseCapture}
                        disabled={!isCapturing || isPaused}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            !isCapturing || isPaused
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                        )}
                        title="Pause capture"
                    >
                        <Pause className="w-4 h-4" />
                    </button>
                    
                    {/* Stop button */}
                    <button
                        onClick={handleStop}
                        disabled={!isCapturing}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            !isCapturing
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                        )}
                        title="Stop capture"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                    
                    {/* Restart button */}
                    <button
                        onClick={() => { clearCapture(); handleStart(); }}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        )}
                        title="Restart capture"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Filter input */}
                <div className="flex-1 flex items-center gap-2">
                    <div className="relative flex-1 max-w-2xl">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            ref={filterInputRef}
                            type="text"
                            value={filterText}
                            onChange={(e) => {
                                setFilterText(e.target.value);
                                setShowSuggestions(true);
                                setSelectedSuggestion(0);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={handleFilterKeyPress}
                            placeholder="Filter: tcp.port == 80, ip.src == 192.168.1.1 && tcp, dns || http"
                            className={cn(
                                'w-full pl-10 pr-28 py-2 bg-zinc-800 border rounded-lg',
                                'text-sm text-zinc-200 placeholder-zinc-500 font-mono',
                                'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                filterValidation.valid ? 'border-zinc-700' : 'border-red-500'
                            )}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {/* Validation indicator */}
                            {filterText && (
                                filterValidation.valid ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <span title={filterValidation.error}>
                                        <AlertCircle 
                                            className="w-4 h-4 text-red-500 cursor-help" 
                                        />
                                    </span>
                                )
                            )}
                            {filterText && (
                                <button
                                    onClick={handleClearFilter}
                                    className="p-1 hover:bg-zinc-700 rounded"
                                >
                                    <X className="w-3 h-3 text-zinc-500" />
                                </button>
                            )}
                            <button
                                onClick={handleApplyFilter}
                                disabled={!filterValidation.valid}
                                className={cn(
                                    'px-2 py-1 text-xs text-white rounded',
                                    filterValidation.valid 
                                        ? 'bg-cyan-600 hover:bg-cyan-500'
                                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                )}
                            >
                                Apply
                            </button>
                        </div>
                        
                        {/* Autocomplete suggestions */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    ref={suggestionsRef}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={cn(
                                        'absolute top-full left-0 right-0 mt-1 z-50',
                                        'bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl',
                                        'max-h-60 overflow-y-auto'
                                    )}
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={`${suggestion.type}-${suggestion.text}`}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2 text-left',
                                                'text-sm transition-colors',
                                                index === selectedSuggestion
                                                    ? 'bg-cyan-900/50 text-cyan-300'
                                                    : 'hover:bg-zinc-700 text-zinc-300'
                                            )}
                                        >
                                            <span className={cn(
                                                'px-1.5 py-0.5 text-xs rounded font-mono',
                                                suggestion.type === 'protocol' && 'bg-emerald-900 text-emerald-300',
                                                suggestion.type === 'field' && 'bg-blue-900 text-blue-300',
                                                suggestion.type === 'operator' && 'bg-amber-900 text-amber-300',
                                                suggestion.type === 'keyword' && 'bg-purple-900 text-purple-300',
                                            )}>
                                                {suggestion.type}
                                            </span>
                                            <span className="font-mono">{suggestion.text}</span>
                                            {suggestion.description && (
                                                <span className="text-zinc-500 text-xs ml-auto">
                                                    {suggestion.description}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Quick filters */}
                    <div className="hidden lg:flex items-center gap-1">
                        {quickFilters.slice(0, 4).map(qf => (
                            <button
                                key={qf.label}
                                onClick={() => {
                                    setFilterText(qf.expression);
                                    handleApplyFilter();
                                }}
                                className={cn(
                                    'px-2 py-1 text-xs rounded-lg',
                                    'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200',
                                    filterText === qf.expression && 'bg-cyan-900/50 text-cyan-300'
                                )}
                            >
                                {qf.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Protocol dropdown */}
                    <div className="relative" ref={protocolDropdownRef}>
                        <button
                            onClick={() => setShowProtocolDropdown(!showProtocolDropdown)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg',
                                'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700',
                                'text-sm text-zinc-300',
                                activeFilterCount > 0 && 'border-cyan-500/50'
                            )}
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden sm:inline">Protocol</span>
                            {displayFilter.protocol && displayFilter.protocol.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-cyan-600 text-white text-xs rounded">
                                    {displayFilter.protocol.length}
                                </span>
                            )}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        <AnimatePresence>
                            {showProtocolDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={cn(
                                        'absolute top-full left-0 mt-1 z-50',
                                        'bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl',
                                        'min-w-[200px] max-h-80 overflow-y-auto p-2'
                                    )}
                                >
                                    {PROTOCOL_OPTIONS.map((option) => {
                                        const isSelected = displayFilter.protocol?.includes(option.value);
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleProtocolToggle(option.value)}
                                                className={cn(
                                                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
                                                    'text-sm text-left transition-colors',
                                                    isSelected
                                                        ? 'bg-cyan-900/50 text-cyan-300'
                                                        : 'hover:bg-zinc-700 text-zinc-300'
                                                )}
                                            >
                                                <span className={cn('w-2 h-2 rounded-full', option.color)} />
                                                {option.label}
                                                {isSelected && (
                                                    <span className="ml-auto text-cyan-500">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Filter help */}
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                        )}
                        title="Filter syntax help"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Right side controls */}
                <div className="flex items-center gap-1 pl-3 border-l border-zinc-700">
                    {/* Follow stream */}
                    {onFollowStream && (
                        <button
                            onClick={onFollowStream}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            )}
                            title="Follow TCP Stream"
                        >
                            <Link2 className="w-4 h-4" />
                        </button>
                    )}
                    
                    {/* Time format dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg',
                                'bg-zinc-800 hover:bg-zinc-700',
                                'text-sm text-zinc-300'
                            )}
                            title="Time format"
                        >
                            <Clock className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        
                        <AnimatePresence>
                            {showTimeDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={cn(
                                        'absolute top-full right-0 mt-1 z-50',
                                        'bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl',
                                        'min-w-[150px] p-1'
                                    )}
                                >
                                    {TIME_FORMAT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setTimeFormat(option.value);
                                                setShowTimeDropdown(false);
                                            }}
                                            className={cn(
                                                'w-full px-3 py-2 text-left text-sm rounded',
                                                timeFormat === option.value
                                                    ? 'bg-cyan-900/50 text-cyan-300'
                                                    : 'hover:bg-zinc-700 text-zinc-300'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Auto scroll toggle */}
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            autoScroll
                                ? 'bg-cyan-600 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                        )}
                        title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                    </button>
                    
                    {/* Clear capture */}
                    <button
                        onClick={clearCapture}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        title="Clear capture"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Export dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => handleExport('json')}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                            title="Export packets"
                        >
                            <FileDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Filter syntax help panel */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-700 overflow-hidden"
                    >
                        <div className="px-4 py-3 bg-zinc-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-zinc-300">Filter Syntax Help</h4>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="p-1 hover:bg-zinc-700 rounded"
                                >
                                    <X className="w-4 h-4 text-zinc-500" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <h5 className="text-zinc-400 mb-1">Protocols</h5>
                                    <div className="space-y-0.5 text-zinc-500">
                                        <div><code className="text-cyan-400">tcp</code> - TCP packets</div>
                                        <div><code className="text-cyan-400">udp</code> - UDP packets</div>
                                        <div><code className="text-cyan-400">icmp</code> - ICMP packets</div>
                                        <div><code className="text-cyan-400">dns</code> - DNS packets</div>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-zinc-400 mb-1">Field Comparisons</h5>
                                    <div className="space-y-0.5 text-zinc-500">
                                        <div><code className="text-cyan-400">ip.src == 192.168.1.1</code></div>
                                        <div><code className="text-cyan-400">tcp.port == 80</code></div>
                                        <div><code className="text-cyan-400">frame.len {">"} 100</code></div>
                                        <div><code className="text-cyan-400">tcp.flags.syn</code></div>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-zinc-400 mb-1">Logical Operators</h5>
                                    <div className="space-y-0.5 text-zinc-500">
                                        <div><code className="text-cyan-400">tcp && http</code> - AND</div>
                                        <div><code className="text-cyan-400">dns || dhcp</code> - OR</div>
                                        <div><code className="text-cyan-400">!arp</code> - NOT</div>
                                        <div><code className="text-cyan-400">(tcp || udp) && !dns</code></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-800/50 border-t border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-4">
                    <span>
                        Packets: <span className="text-zinc-300">{statistics.totalPackets}</span>
                    </span>
                    <span>
                        Displayed: <span className="text-zinc-300">{filteredPackets.length}</span>
                    </span>
                    {statistics.duration > 0 && (
                        <span>
                            Rate: <span className="text-zinc-300">{statistics.packetsPerSecond.toFixed(1)}</span> pps
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isCapturing && (
                        <span className={cn(
                            'flex items-center gap-1',
                            isPaused ? 'text-amber-500' : 'text-emerald-500'
                        )}>
                            <span className={cn(
                                'w-2 h-2 rounded-full',
                                isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                            )} />
                            {isPaused ? 'Paused' : 'Capturing'}
                        </span>
                    )}
                    {activeFilterCount > 0 && (
                        <span className="text-cyan-500">
                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CaptureToolbar;
