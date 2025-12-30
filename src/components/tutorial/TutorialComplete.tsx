'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Lightbulb,
  Star,
  RotateCcw,
  X,
  Share2,
  CheckCircle
} from 'lucide-react';
import { Button, Badge, Card } from '../ui';
import { TutorialCompleteProps, DIFFICULTY_LABELS } from './types';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

function TutorialCompleteComponent({
  tutorial,
  progress,
  onRestart,
  onClose
}: TutorialCompleteProps) {
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#8b5cf6', '#22c55e']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#8b5cf6', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Calculate completion time
  const completionTime = Math.round((progress.lastActivityAt - progress.startedAt) / 1000 / 60);

  // Calculate score (based on hints used, time, etc.)
  const calculateScore = () => {
    const baseScore = 100;
    const hintPenalty = progress.hintsUsed * 5;
    const timeBonusThreshold = tutorial.estimatedTime;
    const timeBonus = completionTime <= timeBonusThreshold ? 20 : 0;
    return Math.max(0, baseScore - hintPenalty + timeBonus);
  };

  const score = calculateScore();
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header with celebration */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy size={64} className="mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Selamat! 🎉</h2>
          <p className="text-white/80">
            Anda telah menyelesaikan tutorial &quot;{tutorial.title}&quot;
          </p>
        </div>

        {/* Stars Rating */}
        <div className="flex justify-center -mt-4">
          <div className="bg-white dark:bg-gray-900 rounded-full px-6 py-2 shadow-lg flex gap-1">
            {[1, 2, 3].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4 + star * 0.1, type: 'spring' }}
              >
                <Star
                  size={32}
                  className={star <= stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score */}
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-5xl font-bold text-gray-800 dark:text-gray-100"
            >
              {score}
              <span className="text-2xl text-gray-500">/100</span>
            </motion.div>
            <p className="text-sm text-gray-500 mt-1">Skor Anda</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="bordered" className="p-3 text-center">
              <Clock size={20} className="mx-auto text-blue-500 mb-1" />
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {completionTime}
              </div>
              <div className="text-xs text-gray-500">menit</div>
            </Card>
            <Card variant="bordered" className="p-3 text-center">
              <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {progress.completedSteps.length}
              </div>
              <div className="text-xs text-gray-500">langkah</div>
            </Card>
            <Card variant="bordered" className="p-3 text-center">
              <Lightbulb size={20} className="mx-auto text-yellow-500 mb-1" />
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {progress.hintsUsed}
              </div>
              <div className="text-xs text-gray-500">petunjuk</div>
            </Card>
          </div>

          {/* Completed Objectives */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Yang Telah Anda Pelajari
            </h3>
            <ul className="space-y-2">
              {tutorial.objectives.map((objective, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Rewards earned */}
          {tutorial.rewards && tutorial.rewards.length > 0 && (
            <Card variant="gradient" className="p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                Hadiah yang Diperoleh
              </h3>
              <div className="flex flex-wrap gap-2">
                {tutorial.rewards.map((reward, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + index * 0.1, type: 'spring' }}
                  >
                    <Badge
                      variant="default"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    >
                      {reward.type === 'badge' && '🏆'}
                      {reward.type === 'points' && '⭐'}
                      {reward.type === 'unlock' && '🔓'}
                      {' '}{reward.description}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <Button variant="ghost" onClick={onRestart}>
            <RotateCcw size={14} className="mr-1" />
            Ulangi
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 size={14} className="mr-1" />
              Bagikan
            </Button>
            <Button onClick={onClose}>
              Selesai
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const TutorialComplete = memo(TutorialCompleteComponent);
