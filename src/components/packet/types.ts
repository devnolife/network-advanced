// Packet Flow Visualization Types

export interface PacketInfo {
  id: string;
  type: 'icmp' | 'tcp' | 'udp' | 'arp' | 'dhcp' | 'dns' | 'http' | 'unknown';
  sourceDevice: string;
  targetDevice: string;
  sourceIP?: string;
  targetIP?: string;
  sourceMAC?: string;
  targetMAC?: string;
  protocol?: string;
  port?: number;
  size?: number;
  ttl?: number;
  data?: string;
  timestamp: number;
  status: 'sending' | 'in-transit' | 'received' | 'dropped' | 'timeout';
}

export interface PacketFlowStep {
  id: string;
  deviceId: string;
  deviceName: string;
  action: 'receive' | 'process' | 'forward' | 'drop' | 'respond';
  description: string;
  details?: string[];
  timestamp: number;
  duration: number;
}

export interface PacketFlowVisualizationProps {
  packets: PacketInfo[];
  isPlaying: boolean;
  speed: number;
  onPacketClick?: (packet: PacketInfo) => void;
  selectedPacketId?: string | null;
}

export interface PacketAnimationProps {
  packet: PacketInfo;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export interface PacketDetailsProps {
  packet: PacketInfo;
  steps?: PacketFlowStep[];
  onClose: () => void;
}

export interface PacketControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onClear: () => void;
  onSpeedChange: (speed: number) => void;
  speed: number;
  packetCount: number;
}

// Packet type colors
export const PACKET_TYPE_COLORS: Record<PacketInfo['type'], string> = {
  icmp: '#22c55e',  // Green
  tcp: '#3b82f6',   // Blue
  udp: '#8b5cf6',   // Purple
  arp: '#f59e0b',   // Amber
  dhcp: '#06b6d4',  // Cyan
  dns: '#ec4899',   // Pink
  http: '#10b981',  // Emerald
  unknown: '#6b7280' // Gray
};

// Packet type labels (Indonesian)
export const PACKET_TYPE_LABELS: Record<PacketInfo['type'], string> = {
  icmp: 'ICMP (Ping)',
  tcp: 'TCP',
  udp: 'UDP',
  arp: 'ARP',
  dhcp: 'DHCP',
  dns: 'DNS',
  http: 'HTTP',
  unknown: 'Tidak Dikenal'
};

// Packet status labels (Indonesian)
export const PACKET_STATUS_LABELS: Record<PacketInfo['status'], string> = {
  sending: 'Mengirim...',
  'in-transit': 'Dalam Perjalanan',
  received: 'Diterima',
  dropped: 'Dijatuhkan',
  timeout: 'Timeout'
};

// Packet status colors
export const PACKET_STATUS_COLORS: Record<PacketInfo['status'], string> = {
  sending: '#3b82f6',
  'in-transit': '#f59e0b',
  received: '#22c55e',
  dropped: '#ef4444',
  timeout: '#6b7280'
};
