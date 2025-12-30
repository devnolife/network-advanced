'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { WizardProgressProps } from './types';

function WizardProgressComponent({
  steps,
  currentStepIndex,
  completedSteps
}: WizardProgressProps) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Step Circle */}
              <motion.div
                className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                  transition-colors duration-300
                  ${isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                    : isCompleted || isPast
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted || isPast ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Check size={16} />
                  </motion.div>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}

                {/* Current step pulse */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-500"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                )}
              </motion.div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-medium truncate max-w-[80px] ${isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted || isPast
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  title={step.title}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const WizardProgress = memo(WizardProgressComponent);
