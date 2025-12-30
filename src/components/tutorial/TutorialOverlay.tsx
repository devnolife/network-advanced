'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  Target
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { TutorialOverlayProps } from './types';

function TutorialOverlayComponent({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onExit,
  onShowHint,
  canGoBack,
  canGoForward,
  hintsAvailable
}: TutorialOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find and highlight target element
  useEffect(() => {
    if (step.targetElement) {
      const target = document.querySelector(step.targetElement);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step.targetElement]);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 300;

    switch (step.position) {
      case 'top':
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
          transform: 'none'
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
          transform: 'none'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Backdrop with cutout for target */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-auto"
          onClick={onExit}
        >
          <svg className="w-full h-full">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - 8}
                    y={targetRect.top - 8}
                    width={targetRect.width + 16}
                    height={targetRect.height + 16}
                    rx={8}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#tutorial-mask)"
            />
          </svg>
        </motion.div>

        {/* Target highlight ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16
            }}
          >
            <div className="w-full h-full rounded-lg border-2 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.3)]">
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-blue-400"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Tutorial Tooltip */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute pointer-events-auto w-[400px] max-w-[90vw]"
          style={getTooltipPosition()}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-white" />
                  <span className="text-white font-medium">
                    Langkah {stepNumber} dari {totalSteps}
                  </span>
                </div>
                <button
                  onClick={onExit}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Keluar dari tutorial"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>

              {step.content && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  {step.content}
                </div>
              )}

              {/* Action indicator */}
              {step.action && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle size={14} />
                  <span>
                    {step.action.type === 'click' && 'Klik pada elemen yang ditandai'}
                    {step.action.type === 'input' && 'Masukkan nilai yang diminta'}
                    {step.action.type === 'command' && 'Jalankan perintah yang ditunjukkan'}
                    {step.action.type === 'wait' && 'Tunggu proses selesai'}
                    {step.action.type === 'navigate' && 'Navigasi ke halaman yang dituju'}
                    {step.action.type === 'configure' && 'Konfigurasikan sesuai instruksi'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                {/* Hint Button */}
                {hintsAvailable > 0 && step.hints && step.hints.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onShowHint}
                  >
                    <Lightbulb size={14} className="mr-1" />
                    Petunjuk ({hintsAvailable})
                  </Button>
                )}

                {/* Navigation */}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onPrevious}
                    disabled={!canGoBack}
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Kembali
                  </Button>
                  <Button
                    size="sm"
                    onClick={onNext}
                    disabled={!canGoForward}
                  >
                    {stepNumber === totalSteps ? (
                      <>
                        Selesai
                        <CheckCircle size={14} className="ml-1" />
                      </>
                    ) : (
                      <>
                        Lanjut
                        <ChevronRight size={14} className="ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

export const TutorialOverlay = memo(TutorialOverlayComponent);
