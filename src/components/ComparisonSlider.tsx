import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { MoveHorizontal, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { BackdropMode, ViewMode } from '../types/backgroundRemoval';

interface ComparisonSliderProps {
  originalUrl: string;
  resultUrl: string | null;
  fileName: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  backdropMode: BackdropMode;
  onBackdropModeChange: (backdrop: BackdropMode) => void;
}

const MIN_ZOOM = 100;
const MAX_ZOOM = 400;
const ZOOM_STEP = 50;

export function ComparisonSlider({
  originalUrl,
  resultUrl,
  fileName,
  viewMode,
  onViewModeChange,
  backdropMode,
  onBackdropModeChange,
}: ComparisonSliderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null,
  );

  useEffect(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setSliderPosition(50);
  }, [originalUrl]);

  const hasResult = Boolean(resultUrl);
  const effectiveViewMode: ViewMode = hasResult ? viewMode : 'original';

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rawPct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, rawPct));
    setSliderPosition(clamped);
  }, []);

  const handleHandlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    updateSliderFromClientX(e.clientX);
  };

  const handleHandlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    updateSliderFromClientX(e.clientX);
  };

  const handleHandlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDraggingSlider(false);
  };

  const handleStagePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (zoom > 100) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originX: pan.x,
        originY: pan.y,
      };
      return;
    }

    if (effectiveViewMode === 'compare' && hasResult) {
      updateSliderFromClientX(e.clientX);
    }
  };

  const handleStagePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.originX + dx,
      y: panStartRef.current.originY + dy,
    });
  };

  const handleStagePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsPanning(false);
    panStartRef.current = null;
  };

  const handleSliderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, prev - ZOOM_STEP);
      if (next === 100) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const backdropClass =
    backdropMode === 'checkerboard'
      ? 'checkerboard-bg'
      : backdropMode === 'light'
        ? 'bg-white'
        : 'bg-slate-900';

  const transformStyle = {
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
  };

  return (
    <div className="space-y-3">
      {/* Toolbar: View Mode + Backdrop + Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Switcher */}
        <div
          role="group"
          aria-label="Preview view mode"
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            disabled={!hasResult}
            onClick={() => onViewModeChange('compare')}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
              effectiveViewMode === 'compare'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Compare
          </button>
          <button
            type="button"
            disabled={!hasResult}
            onClick={() => onViewModeChange('result')}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
              effectiveViewMode === 'result'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Result Only
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('original')}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              effectiveViewMode === 'original'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Backdrop Toggles */}
          <div
            role="group"
            aria-label="Preview backdrop"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => onBackdropModeChange('checkerboard')}
              className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                backdropMode === 'checkerboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                aria-hidden="true"
                className="checkerboard-bg h-3.5 w-3.5 rounded border border-slate-300"
              />
              Transparent
            </button>
            <button
              type="button"
              onClick={() => onBackdropModeChange('light')}
              className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                backdropMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded border border-slate-300 bg-white"
              />
              Light
            </button>
            <button
              type="button"
              onClick={() => onBackdropModeChange('dark')}
              className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                backdropMode === 'dark'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded border border-slate-600 bg-slate-900"
              />
              Dark
            </button>
          </div>

          {/* Zoom Controls */}
          <div
            role="group"
            aria-label="Zoom controls"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[3.25rem] text-center font-mono text-xs font-medium tabular-nums text-slate-700">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoom > 100 && (
              <button
                type="button"
                onClick={handleZoomReset}
                aria-label="Reset zoom to 100%"
                className="ml-0.5 inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-50"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stage Viewport */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        className={`relative h-[340px] w-full select-none overflow-hidden rounded-xl border border-slate-200 sm:h-[440px] ${
          effectiveViewMode === 'original' ? 'bg-slate-100' : backdropClass
        } ${zoom > 100 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      >
        {/* Result / Single Layer */}
        {effectiveViewMode === 'original' && (
          <div className="flex h-full w-full items-center justify-center p-4">
            <img
              src={originalUrl}
              alt={`Original ${fileName}`}
              draggable={false}
              referrerPolicy="no-referrer"
              style={transformStyle}
              className="h-full w-full object-contain transition-transform duration-75 will-change-transform"
            />
          </div>
        )}

        {effectiveViewMode === 'result' && resultUrl && (
          <div className="flex h-full w-full items-center justify-center p-4">
            <img
              src={resultUrl}
              alt={`Background removed result for ${fileName}`}
              draggable={false}
              referrerPolicy="no-referrer"
              style={transformStyle}
              className="h-full w-full object-contain transition-transform duration-75 will-change-transform"
            />
          </div>
        )}

        {effectiveViewMode === 'compare' && resultUrl && (
          <>
            {/* Base Layer: Transparent Cutout */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img
                src={resultUrl}
                alt={`Background removed result for ${fileName}`}
                draggable={false}
                referrerPolicy="no-referrer"
                style={transformStyle}
                className="h-full w-full object-contain transition-transform duration-75 will-change-transform"
              />
            </div>

            {/* Clipped Layer: Original Image on Left Side of Slider */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100 p-4"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <img
                src={originalUrl}
                alt={`Original ${fileName}`}
                draggable={false}
                referrerPolicy="no-referrer"
                style={transformStyle}
                className="h-full w-full object-contain transition-transform duration-75 will-change-transform"
              />
            </div>

            {/* Corner Stage Labels */}
            <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
              Original
            </span>
            <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-violet-700/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
              Transparent PNG
            </span>

            {/* Draggable Comparison Divider */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Before and after comparison slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPosition)}
              onPointerDown={handleHandlePointerDown}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
              onKeyDown={handleSliderKeyDown}
              style={{ left: `${sliderPosition}%` }}
              className="group absolute inset-y-0 z-20 -ml-5 flex w-10 cursor-ew-resize touch-none items-center justify-center focus-visible:outline-none"
            >
              <div className="h-full w-0.5 bg-white shadow-[0_0_8px_rgba(15,23,42,0.45)]" />
              <div className="absolute flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-violet-700 text-white shadow-md transition-transform duration-150 group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-blue-500/40">
                <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
