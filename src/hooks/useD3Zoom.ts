'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

interface UseD3ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  onZoomChange?: (transform: d3.ZoomTransform) => void;
}

interface UseD3ZoomReturn {
  svgRef: React.RefObject<SVGSVGElement | null>;
  gRef: React.RefObject<SVGGElement | null>;
  transform: d3.ZoomTransform;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToContent: () => void;
  setZoom: (scale: number) => void;
}

export function useD3Zoom(options: UseD3ZoomOptions = {}): UseD3ZoomReturn {
  const {
    minZoom = 0.1,
    maxZoom = 4,
    initialZoom = 1,
    onZoomChange
  } = options;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity.scale(initialZoom));

  // Initialize zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
        transformRef.current = event.transform;
        onZoomChange?.(event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Set initial zoom
    svg.call(zoom.transform, d3.zoomIdentity.scale(initialZoom));

    zoomRef.current = zoom;

    // Cleanup
    return () => {
      svg.on('.zoom', null);
    };
  }, [minZoom, maxZoom, initialZoom, onZoomChange]);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      zoomRef.current.scaleBy,
      1.5
    );
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      zoomRef.current.scaleBy,
      0.67
    );
  }, []);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.scale(initialZoom)
    );
  }, [initialZoom]);

  const fitToContent = useCallback(() => {
    if (!svgRef.current || !gRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = gRef.current;

    const bounds = g.getBBox();
    const svgRect = svgRef.current.getBoundingClientRect();

    const fullWidth = svgRect.width;
    const fullHeight = svgRect.height;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width === 0 || height === 0) return;

    const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));

    svg.transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(clampedScale)
    );
  }, [minZoom, maxZoom]);

  const setZoom = useCallback((scale: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));
    svg.transition().duration(300).call(
      zoomRef.current.scaleTo,
      clampedScale
    );
  }, [minZoom, maxZoom]);

  return {
    svgRef,
    gRef,
    transform: transformRef.current,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    setZoom
  };
}
