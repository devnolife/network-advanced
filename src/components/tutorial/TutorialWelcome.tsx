'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';
import { Button, Badge, Card } from '../ui';
import { TutorialWelcomeProps, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from './types';

function TutorialWelcomeComponent({
  tutorial,
  onStart,
  onClose
}: TutorialWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={24} />
            <Badge
              className="text-white border-white/30"
              style={{
                backgroundColor: `${DIFFICULTY_COLORS[tutorial.difficulty]}40`,
                borderColor: DIFFICULTY_COLORS[tutorial.difficulty]
              }}
            >
              {DIFFICULTY_LABELS[tutorial.difficulty]}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold mb-2">{tutorial.title}</h2>
          <p className="text-white/80">{tutorial.description}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={16} className="text-blue-500" />
              <span>~{tutorial.estimatedTime} menit</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Target size={16} className="text-purple-500" />
              <span>{tutorial.steps.length} langkah</span>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Tujuan Pembelajaran
            </h3>
            <ul className="space-y-2">
              {tutorial.objectives.map((objective, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Prerequisites */}
          {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Prasyarat
              </h3>
              <ul className="space-y-1">
                {tutorial.prerequisites.map((prereq, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewards */}
          {tutorial.rewards && tutorial.rewards.length > 0 && (
            <Card variant="gradient" className="p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                Hadiah
              </h3>
              <div className="flex flex-wrap gap-2">
                {tutorial.rewards.map((reward, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  >
                    {reward.type === 'badge' && '🏆'}
                    {reward.type === 'points' && '⭐'}
                    {reward.type === 'unlock' && '🔓'}
                    {' '}{reward.description}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <Button variant="ghost" onClick={onClose}>
            Nanti saja
          </Button>
          <Button onClick={onStart}>
            Mulai Tutorial
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export const TutorialWelcome = memo(TutorialWelcomeComponent);
