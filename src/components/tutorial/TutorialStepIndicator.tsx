'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Lock } from 'lucide-react';
import { Tooltip } from '../ui';
import { TutorialStepIndicatorProps } from './types';

function TutorialStepIndicatorComponent({
  steps,
  currentStepIndex,
  completedSteps,
  onStepClick
}: TutorialStepIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = index === currentStepIndex;
        const isLocked = index > currentStepIndex && !isCompleted;

        return (
          <Tooltip key={step.id} content={step.title}>
            <motion.button
              onClick={() => !isLocked && onStepClick?.(index)}
              className={`
                relative w-8 h-8 rounded-full flex items-center justify-center
                transition-colors
                ${isCurrent
                  ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                  : isCompleted
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : isLocked
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }
              `}
              whileHover={!isLocked ? { scale: 1.1 } : {}}
              whileTap={!isLocked ? { scale: 0.9 } : {}}
              disabled={isLocked}
            >
              {isCompleted ? (
                <Check size={14} />
              ) : isLocked ? (
                <Lock size={12} />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}

              {/* Current step indicator */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </motion.button>
          </Tooltip>
        );
      })}

      {/* Progress line between steps */}
      {steps.length > 1 && (
        <div className="absolute left-4 right-4 top-1/2 -z-10 h-0.5 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps.length / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
}

export const TutorialStepIndicator = memo(TutorialStepIndicatorComponent);
