'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { useD3Zoom } from '@/hooks/useD3Zoom';
import { DeviceNode } from './DeviceNode';
import { ConnectionLine } from './ConnectionLine';
import { TopologyControls } from './TopologyControls';
import { TopologyLegend } from './TopologyLegend';
import {
  TopologyViewerProps,
  TopologyNode,
  TopologyConnection
} from './types';

export function TopologyViewer({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeDoubleClick,
  onConnectionClick,
  selectedNodeId = null,
  showLabels = true,
  showStatus = true,
  interactive = true,
  className = ''
}: TopologyViewerProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [internalShowLabels, setInternalShowLabels] = useState(showLabels);
  const [showGrid, setShowGrid] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width, height });

  // D3 zoom hook
  const {
    svgRef,
    gRef,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent
  } = useD3Zoom({
    minZoom: 0.1,
    maxZoom: 4,
    initialZoom: 1,
    onZoomChange: (transform) => {
      setZoomLevel(transform.k * 100);
    }
  });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Find node by id
  const getNodeById = useCallback((id: string): TopologyNode | undefined => {
    return data.nodes.find(node => node.id === id);
  }, [data.nodes]);

  // Handle node click
  const handleNodeClick = useCallback((node: TopologyNode) => {
    if (!interactive) return;
    onNodeClick?.(node);
  }, [interactive, onNodeClick]);

  // Handle node double click
  const handleNodeDoubleClick = useCallback((node: TopologyNode) => {
    if (!interactive) return;
    onNodeDoubleClick?.(node);
  }, [interactive, onNodeDoubleClick]);

  // Handle connection click
  const handleConnectionClick = useCallback((connection: TopologyConnection) => {
    if (!interactive) return;
    onConnectionClick?.(connection);
  }, [interactive, onConnectionClick]);

  // Generate grid pattern
  const gridSize = 50;
  const gridPattern = `
    M ${gridSize} 0 L 0 0 0 ${gridSize}
  `;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
      style={{ width: '100%', height: height }}
    >
      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        width={containerSize.width}
        height={containerSize.height}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* SVG Definitions */}
        <defs>
          {/* Drop Shadow Filter */}
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>

          {/* Grid Pattern */}
          <pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={gridPattern}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-300 dark:text-gray-600"
            />
          </pattern>

          {/* Animated gradient for packet flow */}
          <linearGradient id="packetFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6">
              <animate
                attributeName="offset"
                values="0;1"
                dur="1s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#60a5fa">
              <animate
                attributeName="offset"
                values="0.5;1.5"
                dur="1s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#3b82f6">
              <animate
                attributeName="offset"
                values="1;2"
                dur="1s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {/* Grid Background */}
        {showGrid && (
          <rect
            width="100%"
            height="100%"
            fill="url(#grid)"
          />
        )}

        {/* Zoomable/Pannable Group */}
        <g ref={gRef}>
          {/* Connections Layer (rendered first, behind nodes) */}
          <g className="connections-layer">
            {data.connections.map(connection => {
              const sourceNode = getNodeById(connection.source);
              const targetNode = getNodeById(connection.target);

              if (!sourceNode || !targetNode) return null;

              return (
                <ConnectionLine
                  key={connection.id}
                  connection={connection}
                  sourceNode={sourceNode}
                  targetNode={targetNode}
                  isSelected={hoveredConnectionId === connection.id}
                  onClick={() => handleConnectionClick(connection)}
                  animated={true}
                />
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g className="nodes-layer">
            {data.nodes.map(node => (
              <DeviceNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isHovered={hoveredNodeId === node.id}
                onClick={() => handleNodeClick(node)}
                onDoubleClick={() => handleNodeDoubleClick(node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                showLabel={internalShowLabels}
                showStatus={showStatus}
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Controls Overlay */}
      {interactive && (
        <TopologyControls
          className="absolute top-4 right-4"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
          onFitToContent={fitToContent}
          onToggleLabels={() => setInternalShowLabels(!internalShowLabels)}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showLabels={internalShowLabels}
          showGrid={showGrid}
          zoomLevel={zoomLevel}
        />
      )}

      {/* Legend Toggle Button */}
      {interactive && (
        <motion.button
          className="absolute bottom-4 left-4 px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setShowLegend(!showLegend)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showLegend ? 'Sembunyikan Legenda' : 'Tampilkan Legenda'}
        </motion.button>
      )}

      {/* Legend Overlay */}
      <TopologyLegend
        isOpen={showLegend}
        onClose={() => setShowLegend(false)}
        position="bottom-left"
      />

      {/* Device Info Tooltip */}
      <AnimatePresence>
        {hoveredNodeId && interactive && (
          <motion.div
            className="absolute pointer-events-none z-30"
            style={{
              left: (getNodeById(hoveredNodeId)?.x || 0) + 60,
              top: (getNodeById(hoveredNodeId)?.y || 0) - 20
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
              {(() => {
                const node = getNodeById(hoveredNodeId);
                if (!node) return null;
                return (
                  <div>
                    <div className="font-semibold">{node.label}</div>
                    <div className="text-gray-400 capitalize">{node.type}</div>
                    {node.interfaces && node.interfaces.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-700">
                        {node.interfaces.slice(0, 3).map(iface => (
                          <div key={iface.id} className="text-gray-300">
                            {iface.name}: {iface.ipAddress || 'Tidak dikonfigurasi'}
                          </div>
                        ))}
                        {node.interfaces.length > 3 && (
                          <div className="text-gray-500">
                            +{node.interfaces.length - 3} interface lainnya
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <p className="text-lg font-medium">Tidak ada topologi</p>
            <p className="text-sm">Mulai lab untuk melihat topologi jaringan</p>
          </div>
        </div>
      )}
    </div>
  );
}
