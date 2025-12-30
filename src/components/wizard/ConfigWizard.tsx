'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { Button, Card } from '../ui';
import { WizardProgress } from './WizardProgress';
import {
  ConfigWizardProps,
  WizardData,
  WizardValidationResult
} from './types';

export function ConfigWizard({
  config,
  initialData = {},
  onComplete,
  onCancel,
  isOpen
}: ConfigWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<WizardData>(initialData as WizardData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = config.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === config.steps.length - 1;

  // Update data
  const handleDataChange = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedKeys = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedKeys.forEach(key => delete newErrors[key]);
      return newErrors;
    });
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep.validation) return true;

    const result: WizardValidationResult = currentStep.validation(data);
    if (!result.isValid) {
      setErrors(result.errors);
      return false;
    }

    setErrors({});
    return true;
  }, [currentStep, data]);

  // Go to next step
  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) return;

    // Mark current step as completed
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }

    if (isLastStep) {
      // Submit wizard
      setIsSubmitting(true);
      try {
        await config.onComplete(data);
        onComplete(data);
      } catch (error) {
        console.error('Wizard submission failed:', error);
        setErrors({ submit: 'Gagal menyimpan konfigurasi. Silakan coba lagi.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [validateCurrentStep, completedSteps, currentStep.id, isLastStep, config, data, onComplete]);

  // Go to previous step
  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  // Reset wizard
  const handleCancel = useCallback(() => {
    setCurrentStepIndex(0);
    setData(initialData as WizardData);
    setErrors({});
    setCompletedSteps([]);
    onCancel();
  }, [initialData, onCancel]);

  // Get step component
  const StepComponent = currentStep.component;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {config.icon}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {config.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Tutup wizard"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Progress */}
            <WizardProgress
              steps={config.steps}
              currentStepIndex={currentStepIndex}
              completedSteps={completedSteps}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {currentStep.icon}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {currentStep.title}
                </h3>
                {currentStep.isOptional && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    Opsional
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStep.description}
              </p>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {StepComponent ? (
                  <StepComponent
                    data={data}
                    onChange={handleDataChange}
                    errors={errors}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Langkah ini belum memiliki konten
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Submit Error */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
              >
                {errors.submit}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Langkah {currentStepIndex + 1} dari {config.steps.length}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isFirstStep || isSubmitting}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Kembali
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isLastStep ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Selesai
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ChevronRight size={16} className="ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
