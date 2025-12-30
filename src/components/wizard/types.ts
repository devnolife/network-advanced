// Configuration Wizard Types

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  component?: React.ComponentType<WizardStepProps>;
  validation?: (data: WizardData) => WizardValidationResult;
  isOptional?: boolean;
}

export interface WizardStepProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  errors: Record<string, string>;
}

export interface WizardData {
  // IP Configuration
  ipAddress?: string;
  subnetMask?: string;
  defaultGateway?: string;

  // Interface Configuration
  selectedInterface?: string;
  interfaceStatus?: 'up' | 'down';
  interfaceDescription?: string;

  // DHCP Configuration
  dhcpEnabled?: boolean;
  dhcpPoolName?: string;
  dhcpNetwork?: string;
  dhcpStartAddress?: string;
  dhcpEndAddress?: string;
  dhcpDnsServer?: string;

  // Static Route Configuration
  routeNetwork?: string;
  routeMask?: string;
  routeNextHop?: string;
  routeMetric?: number;

  // NAT Configuration
  natEnabled?: boolean;
  natType?: 'pat' | 'static' | 'dynamic';
  natInsideInterface?: string;
  natOutsideInterface?: string;

  // General
  hostname?: string;
  description?: string;

  // Custom data
  [key: string]: unknown;
}

export interface WizardValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface WizardConfig {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  steps: WizardStep[];
  onComplete: (data: WizardData) => Promise<void> | void;
  onCancel?: () => void;
}

export interface ConfigWizardProps {
  config: WizardConfig;
  initialData?: Partial<WizardData>;
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export interface WizardProgressProps {
  steps: WizardStep[];
  currentStepIndex: number;
  completedSteps: string[];
}

export interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

// Predefined wizard configurations
export type WizardType =
  | 'ip-config'
  | 'dhcp-server'
  | 'static-route'
  | 'nat-config'
  | 'interface-config'
  | 'quick-setup';

// Wizard type labels (Indonesian)
export const WIZARD_TYPE_LABELS: Record<WizardType, string> = {
  'ip-config': 'Konfigurasi IP Address',
  'dhcp-server': 'Setup DHCP Server',
  'static-route': 'Tambah Static Route',
  'nat-config': 'Konfigurasi NAT',
  'interface-config': 'Konfigurasi Interface',
  'quick-setup': 'Quick Setup'
};

// Wizard type descriptions (Indonesian)
export const WIZARD_TYPE_DESCRIPTIONS: Record<WizardType, string> = {
  'ip-config': 'Atur IP address, subnet mask, dan gateway untuk interface',
  'dhcp-server': 'Buat DHCP pool untuk memberikan IP otomatis ke client',
  'static-route': 'Tambahkan static route ke tabel routing',
  'nat-config': 'Konfigurasi Network Address Translation',
  'interface-config': 'Konfigurasi lengkap untuk sebuah interface',
  'quick-setup': 'Setup cepat untuk perangkat baru'
};
