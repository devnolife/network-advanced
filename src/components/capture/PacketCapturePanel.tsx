'use client';

// PacketCapturePanel - Main container component for packet capture UI
// Combines all capture components with resizable split panes (like Wireshark layout)

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePacketCaptureStore, type CapturedPacketDetail } from '@/store/packetCaptureStore';
import { CaptureToolbar } from './CaptureToolbar';
import { PacketTable } from './PacketTable';
import { PacketDetail } from './PacketDetail';
import { PacketHexView } from './PacketHexView';

interface PanelDimensions {
    topHeight: number;      // Packet table height (percentage)
    bottomLeftWidth: number; // Detail pane width (percentage)
}

interface HighlightRange {
    offset: number;
    length: number;
}

interface PacketCapturePanelProps {
    className?: string;
    onPacketSelect?: (packet: CapturedPacketDetail) => void;
    onCaptureStart?: () => void;
    onCaptureStop?: () => void;
}

export function PacketCapturePanel({
    className,
    onPacketSelect,
    onCaptureStart,
    onCaptureStop,
}: PacketCapturePanelProps) {
    // Store
    const selectedPacketId = usePacketCaptureStore((state) => state.selectedPacketId);
    const getSelectedPacket = usePacketCaptureStore((state) => state.getSelectedPacket);
    
    // Panel dimensions state
    const [dimensions, setDimensions] = useState<PanelDimensions>({
        topHeight: 50,          // 50% for packet table
        bottomLeftWidth: 50,    // 50% for detail pane
    });
    
    // Highlight state for hex view (synced with detail field hover)
    const [highlightRange, setHighlightRange] = useState<HighlightRange | undefined>(undefined);
    
    // Maximized pane state
    const [maximizedPane, setMaximizedPane] = useState<'table' | 'detail' | 'hex' | null>(null);
    
    // Refs for resize handling
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingHorizontal = useRef(false);
    const isDraggingVertical = useRef(false);
    
    // Handle horizontal resize (between top and bottom)
    const handleHorizontalDragStart = useCallback(() => {
        isDraggingHorizontal.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, []);
    
    // Handle vertical resize (between detail and hex)
    const handleVerticalDragStart = useCallback(() => {
        isDraggingVertical.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);
    
    // Mouse move handler for resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            
            const rect = containerRef.current.getBoundingClientRect();
            
            if (isDraggingHorizontal.current) {
                // Calculate new height percentage
                const relativeY = e.clientY - rect.top;
                const percentage = (relativeY / rect.height) * 100;
                
                // Clamp between 20% and 80%
                const clampedPercentage = Math.max(20, Math.min(80, percentage));
                
                setDimensions((prev) => ({
                    ...prev,
                    topHeight: clampedPercentage,
                }));
            }
            
            if (isDraggingVertical.current) {
                // Calculate new width percentage (relative to bottom pane)
                const bottomPaneTop = rect.top + (rect.height * dimensions.topHeight / 100);
                const bottomPaneHeight = rect.height - (rect.height * dimensions.topHeight / 100);
                const bottomPaneLeft = rect.left;
                const bottomPaneWidth = rect.width;
                
                const relativeX = e.clientX - bottomPaneLeft;
                const percentage = (relativeX / bottomPaneWidth) * 100;
                
                // Clamp between 20% and 80%
                const clampedPercentage = Math.max(20, Math.min(80, percentage));
                
                setDimensions((prev) => ({
                    ...prev,
                    bottomLeftWidth: clampedPercentage,
                }));
            }
        };
        
        const handleMouseUp = () => {
            isDraggingHorizontal.current = false;
            isDraggingVertical.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dimensions.topHeight]);
    
    // Handle field hover in detail pane -> highlight in hex view
    const handleFieldHover = useCallback((offset?: number, length?: number) => {
        if (offset !== undefined && length !== undefined) {
            setHighlightRange({ offset, length });
        } else {
            setHighlightRange(undefined);
        }
    }, []);
    
    // Handle packet selection
    const handlePacketSelect = useCallback((packet: CapturedPacketDetail) => {
        onPacketSelect?.(packet);
    }, [onPacketSelect]);
    
    // Handle packet double click (maximize detail)
    const handlePacketDoubleClick = useCallback((packet: CapturedPacketDetail) => {
        setMaximizedPane((prev) => prev === 'detail' ? null : 'detail');
    }, []);
    
    // Toggle pane maximization
    const toggleMaximize = useCallback((pane: 'table' | 'detail' | 'hex') => {
        setMaximizedPane((prev) => prev === pane ? null : pane);
    }, []);
    
    // Get selected packet
    const selectedPacket = getSelectedPacket();
    
    // Render content based on maximized state
    const renderContent = () => {
        // If a pane is maximized, show only that pane
        if (maximizedPane) {
            return (
                <div className="flex-1 relative">
                    {maximizedPane === 'table' && (
                        <div className="absolute inset-0">
                            <div className="h-full flex flex-col">
                                <MaximizeButton 
                                    isMaximized={true}
                                    onClick={() => toggleMaximize('table')} 
                                />
                                <PacketTable
                                    className="flex-1"
                                    onPacketSelect={handlePacketSelect}
                                    onPacketDoubleClick={handlePacketDoubleClick}
                                />
                            </div>
                        </div>
                    )}
                    {maximizedPane === 'detail' && (
                        <div className="absolute inset-0">
                            <div className="h-full flex flex-col">
                                <MaximizeButton 
                                    isMaximized={true}
                                    onClick={() => toggleMaximize('detail')} 
                                />
                                <PacketDetail
                                    packet={selectedPacket}
                                    className="flex-1"
                                    onFieldHover={handleFieldHover}
                                />
                            </div>
                        </div>
                    )}
                    {maximizedPane === 'hex' && (
                        <div className="absolute inset-0">
                            <div className="h-full flex flex-col">
                                <MaximizeButton 
                                    isMaximized={true}
                                    onClick={() => toggleMaximize('hex')} 
                                />
                                <PacketHexView
                                    packet={selectedPacket}
                                    className="flex-1"
                                    highlightRange={highlightRange}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        
        // Normal three-pane layout
        return (
            <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
                {/* Top pane - Packet Table */}
                <div 
                    className="relative overflow-hidden"
                    style={{ height: `${dimensions.topHeight}%` }}
                >
                    <div className="absolute inset-0 flex flex-col">
                        <div className="absolute top-1 right-1 z-10">
                            <MaximizeButton onClick={() => toggleMaximize('table')} />
                        </div>
                        <PacketTable
                            className="flex-1"
                            onPacketSelect={handlePacketSelect}
                            onPacketDoubleClick={handlePacketDoubleClick}
                        />
                    </div>
                </div>
                
                {/* Horizontal resize handle */}
                <ResizeHandle 
                    direction="horizontal" 
                    onDragStart={handleHorizontalDragStart} 
                />
                
                {/* Bottom panes - Detail and Hex */}
                <div 
                    className="flex overflow-hidden"
                    style={{ height: `${100 - dimensions.topHeight}%` }}
                >
                    {/* Detail pane */}
                    <div 
                        className="relative overflow-hidden"
                        style={{ width: `${dimensions.bottomLeftWidth}%` }}
                    >
                        <div className="absolute inset-0 flex flex-col">
                            <div className="absolute top-1 right-1 z-10">
                                <MaximizeButton onClick={() => toggleMaximize('detail')} />
                            </div>
                            <PacketDetail
                                packet={selectedPacket}
                                className="flex-1"
                                onFieldHover={handleFieldHover}
                            />
                        </div>
                    </div>
                    
                    {/* Vertical resize handle */}
                    <ResizeHandle 
                        direction="vertical" 
                        onDragStart={handleVerticalDragStart} 
                    />
                    
                    {/* Hex view pane */}
                    <div 
                        className="relative flex-1 overflow-hidden"
                    >
                        <div className="absolute inset-0 flex flex-col">
                            <div className="absolute top-1 right-1 z-10">
                                <MaximizeButton onClick={() => toggleMaximize('hex')} />
                            </div>
                            <PacketHexView
                                packet={selectedPacket}
                                className="flex-1"
                                highlightRange={highlightRange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={cn('flex flex-col h-full bg-zinc-950', className)}>
            {/* Toolbar */}
            <CaptureToolbar 
                onStartCapture={onCaptureStart}
                onStopCapture={onCaptureStop}
            />
            
            {/* Main content */}
            {renderContent()}
        </div>
    );
}

// Resize handle component
interface ResizeHandleProps {
    direction: 'horizontal' | 'vertical';
    onDragStart: () => void;
}

function ResizeHandle({ direction, onDragStart }: ResizeHandleProps) {
    const isHorizontal = direction === 'horizontal';
    
    return (
        <div
            onMouseDown={onDragStart}
            className={cn(
                'flex items-center justify-center',
                'bg-zinc-800 hover:bg-zinc-700 transition-colors',
                'group cursor-row-resize',
                isHorizontal 
                    ? 'h-1.5 cursor-row-resize w-full' 
                    : 'w-1.5 cursor-col-resize h-full'
            )}
        >
            <motion.div
                className={cn(
                    'rounded-full bg-zinc-600 group-hover:bg-cyan-500',
                    'transition-colors',
                    isHorizontal ? 'w-8 h-1' : 'w-1 h-8'
                )}
                whileHover={{ scale: 1.2 }}
            />
        </div>
    );
}

// Maximize button component
interface MaximizeButtonProps {
    isMaximized?: boolean;
    onClick: () => void;
}

function MaximizeButton({ isMaximized, onClick }: MaximizeButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'p-1 rounded bg-zinc-800/80 hover:bg-zinc-700',
                'text-zinc-400 hover:text-zinc-200',
                'transition-colors opacity-0 group-hover:opacity-100',
                'focus:opacity-100'
            )}
            title={isMaximized ? 'Restore' : 'Maximize'}
        >
            {isMaximized ? (
                <Minimize2 className="w-3 h-3" />
            ) : (
                <Maximize2 className="w-3 h-3" />
            )}
        </button>
    );
}

export default PacketCapturePanel;
