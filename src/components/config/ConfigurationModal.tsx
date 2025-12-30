'use client';

import { Modal } from '../ui';
import { ConfigurationPanel } from './ConfigurationPanel';
import { TopologyNode } from '../topology/types';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: TopologyNode | null;
  onSave: (deviceId: string, config: TopologyNode['config']) => void;
  onExecuteCommand?: (deviceId: string, command: string) => Promise<string>;
}

export function ConfigurationModal({
  isOpen,
  onClose,
  device,
  onSave,
  onExecuteCommand
}: ConfigurationModalProps) {
  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
    >
      <div className="h-[600px] -m-6">
        <ConfigurationPanel
          device={device}
          onSave={(config) => onSave(device.id, config)}
          onClose={onClose}
          onExecuteCommand={
            onExecuteCommand
              ? (command) => onExecuteCommand(device.id, command)
              : undefined
          }
        />
      </div>
    </Modal>
  );
}
