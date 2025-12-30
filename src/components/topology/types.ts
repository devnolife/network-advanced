// Topology Types for Interactive Visualization

export interface TopologyNode {
  id: string;
  type: 'router' | 'pc' | 'switch' | 'server' | 'cloud';
  label: string;
  x: number;
  y: number;
  status: 'up' | 'down' | 'booting' | 'warning';
  interfaces?: TopologyInterface[];
  config?: DeviceConfig;
}

export interface TopologyInterface {
  id: string;
  name: string;
  ipAddress?: string;
  subnetMask?: string;
  status: 'up' | 'down' | 'disabled';
  connectedTo?: string;
  speed?: string;
  duplex?: 'full' | 'half' | 'auto';
}

export interface TopologyConnection {
  id: string;
  source: string;
  sourceInterface?: string;
  target: string;
  targetInterface?: string;
  status: 'up' | 'down' | 'packet-flow';
  bandwidth?: string;
  latency?: number;
}

export interface DeviceConfig {
  hostname?: string;
  interfaces?: InterfaceConfig[];
  routing?: RoutingConfig;
  dhcp?: DHCPConfig;
  nat?: NATConfig;
}

export interface InterfaceConfig {
  name: string;
  ipAddress?: string;
  subnetMask?: string;
  enabled: boolean;
  description?: string;
}

export interface RoutingConfig {
  staticRoutes?: StaticRoute[];
  defaultGateway?: string;
  protocol?: 'static' | 'rip' | 'ospf' | 'bgp';
}

export interface StaticRoute {
  network: string;
  mask: string;
  nextHop: string;
  metric?: number;
}

export interface DHCPConfig {
  enabled: boolean;
  pools?: DHCPPool[];
  excludedAddresses?: string[];
}

export interface DHCPPool {
  name: string;
  network: string;
  startAddress: string;
  endAddress: string;
  defaultGateway?: string;
  dnsServers?: string[];
  leaseTime?: number;
}

export interface NATConfig {
  enabled: boolean;
  type?: 'static' | 'dynamic' | 'pat';
  insideInterface?: string;
  outsideInterface?: string;
  accessList?: string;
  poolName?: string;
}

export interface TopologyData {
  nodes: TopologyNode[];
  connections: TopologyConnection[];
}

export interface TopologyViewerProps {
  data: TopologyData;
  width?: number;
  height?: number;
  onNodeClick?: (node: TopologyNode) => void;
  onNodeDoubleClick?: (node: TopologyNode) => void;
  onConnectionClick?: (connection: TopologyConnection) => void;
  selectedNodeId?: string | null;
  showLabels?: boolean;
  showStatus?: boolean;
  interactive?: boolean;
  className?: string;
}

export interface DeviceNodeProps {
  node: TopologyNode;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  showLabel?: boolean;
  showStatus?: boolean;
}

export interface ConnectionLineProps {
  connection: TopologyConnection;
  sourceNode: TopologyNode;
  targetNode: TopologyNode;
  isSelected?: boolean;
  onClick?: () => void;
  animated?: boolean;
}

// Device icon paths for SVG rendering
export const DEVICE_ICONS: Record<TopologyNode['type'], {
  path: string;
  viewBox: string;
  color: string;
}> = {
  router: {
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    viewBox: '0 0 24 24',
    color: '#3b82f6'
  },
  pc: {
    path: 'M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
    viewBox: '0 0 24 24',
    color: '#10b981'
  },
  switch: {
    path: 'M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z',
    viewBox: '0 0 24 24',
    color: '#8b5cf6'
  },
  server: {
    path: 'M2 2h20v6H2V2zm0 8h20v6H2v-6zm0 8h20v4H2v-4zm3-12v2h2V6H5zm0 8v2h2v-2H5zm0 8v2h2v-2H5z',
    viewBox: '0 0 24 24',
    color: '#f59e0b'
  },
  cloud: {
    path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    viewBox: '0 0 24 24',
    color: '#6366f1'
  }
};

// Status colors
export const STATUS_COLORS: Record<TopologyNode['status'], string> = {
  up: '#22c55e',
  down: '#ef4444',
  booting: '#eab308',
  warning: '#f97316'
};

export const CONNECTION_STATUS_COLORS: Record<TopologyConnection['status'], string> = {
  up: '#22c55e',
  down: '#ef4444',
  'packet-flow': '#3b82f6'
};
