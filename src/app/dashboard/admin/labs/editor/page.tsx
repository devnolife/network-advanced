'use client';

import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Play,
  Eye,
  Plus,
  Trash2,
  Settings,
  Monitor,
  Server,
  Router,
  Wifi,
  Database,
  Shield,
  Cloud,
  Globe,
  Cpu,
  HardDrive,
  Network,
  Loader2,
  GripVertical,
  Link,
  Unlink,
  Copy,
  Layers,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Device Types
type DeviceType = 'pc' | 'server' | 'router' | 'switch' | 'firewall' | 'cloud' | 'internet' | 'database' | 'access-point';

interface Device {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  config: DeviceConfig;
}

interface DeviceConfig {
  ip?: string;
  subnet?: string;
  gateway?: string;
  ports?: number;
  services?: string[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'ethernet' | 'wireless' | 'wan';
  label?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  hints: string[];
  validation: string;
}

interface LabConfig {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  devices: Device[];
  connections: Connection[];
  tasks: Task[];
}

const deviceIcons: Record<DeviceType, React.ReactNode> = {
  'pc': <Monitor className="w-6 h-6" />,
  'server': <Server className="w-6 h-6" />,
  'router': <Router className="w-6 h-6" />,
  'switch': <Network className="w-6 h-6" />,
  'firewall': <Shield className="w-6 h-6" />,
  'cloud': <Cloud className="w-6 h-6" />,
  'internet': <Globe className="w-6 h-6" />,
  'database': <Database className="w-6 h-6" />,
  'access-point': <Wifi className="w-6 h-6" />,
};

const deviceColors: Record<DeviceType, string> = {
  'pc': 'bg-sky-500/20 text-sky-500 border-sky-500/30',
  'server': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  'router': 'bg-[#088395]/20 text-[#088395] border-[#088395]/30',
  'switch': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  'firewall': 'bg-rose-500/20 text-rose-500 border-rose-500/30',
  'cloud': 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  'internet': 'bg-teal-500/20 text-teal-500 border-teal-500/30',
  'database': 'bg-lime-500/20 text-lime-500 border-lime-500/30',
  'access-point': 'bg-[#7AB2B2]/20 text-[#7AB2B2] border-[#7AB2B2]/30',
};

const deviceLabels: Record<DeviceType, string> = {
  'pc': 'PC / Client',
  'server': 'Server',
  'router': 'Router',
  'switch': 'Switch',
  'firewall': 'Firewall',
  'cloud': 'Cloud',
  'internet': 'Internet',
  'database': 'Database',
  'access-point': 'Access Point',
};

export default function LabEditorPage() {
  const router = useRouter();
  
  // Lab configuration state
  const [labConfig, setLabConfig] = useState<LabConfig>({
    id: '',
    title: '',
    description: '',
    difficulty: 'beginner',
    duration: 60,
    devices: [],
    connections: [],
    tasks: [],
  });
  
  // Editor state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topology' | 'tasks' | 'settings'>('topology');
  const [activePanel, setActivePanel] = useState<'devices' | 'properties' | 'tasks'>('devices');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Task editor state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        });
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add device to canvas
  const addDevice = (type: DeviceType) => {
    const newDevice: Device = {
      id: generateId(),
      type,
      name: `${deviceLabels[type]} ${labConfig.devices.filter(d => d.type === type).length + 1}`,
      x: canvasSize.width / 2 - 40,
      y: canvasSize.height / 2 - 40,
      config: {
        ip: '',
        subnet: '255.255.255.0',
        gateway: '',
        ports: type === 'switch' ? 24 : type === 'router' ? 4 : 1,
        services: [],
      },
    };
    setLabConfig(prev => ({
      ...prev,
      devices: [...prev.devices, newDevice],
    }));
    setSelectedDevice(newDevice);
    setActivePanel('properties');
  };

  // Delete device
  const deleteDevice = (id: string) => {
    setLabConfig(prev => ({
      ...prev,
      devices: prev.devices.filter(d => d.id !== id),
      connections: prev.connections.filter(c => c.from !== id && c.to !== id),
    }));
    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
    }
  };

  // Duplicate device
  const duplicateDevice = (device: Device) => {
    const newDevice: Device = {
      ...device,
      id: generateId(),
      name: `${device.name} (copy)`,
      x: device.x + 50,
      y: device.y + 50,
    };
    setLabConfig(prev => ({
      ...prev,
      devices: [...prev.devices, newDevice],
    }));
  };

  // Handle device drag
  const handleDeviceMouseDown = (e: React.MouseEvent, deviceId: string) => {
    if (isConnecting) {
      if (connectFrom === null) {
        setConnectFrom(deviceId);
      } else if (connectFrom !== deviceId) {
        // Create connection
        const newConnection: Connection = {
          id: generateId(),
          from: connectFrom,
          to: deviceId,
          type: 'ethernet',
        };
        setLabConfig(prev => ({
          ...prev,
          connections: [...prev.connections, newConnection],
        }));
        setConnectFrom(null);
        setIsConnecting(false);
      }
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    setDragTarget(deviceId);
    setSelectedDevice(labConfig.devices.find(d => d.id === deviceId) || null);
    setSelectedConnection(null);
    setActivePanel('properties');
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragTarget || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom - 40;
    const y = (e.clientY - rect.top - pan.y) / zoom - 40;
    
    setLabConfig(prev => ({
      ...prev,
      devices: prev.devices.map(d =>
        d.id === dragTarget
          ? { ...d, x: Math.max(0, Math.min(canvasSize.width - 80, x)), y: Math.max(0, Math.min(canvasSize.height - 80, y)) }
          : d
      ),
    }));
    
    // Update selected device position
    setSelectedDevice(prev => 
      prev && prev.id === dragTarget 
        ? { ...prev, x: Math.max(0, Math.min(canvasSize.width - 80, x)), y: Math.max(0, Math.min(canvasSize.height - 80, y)) }
        : prev
    );
  }, [isDragging, dragTarget, pan, zoom, canvasSize]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // Delete connection
  const deleteConnection = (id: string) => {
    setLabConfig(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== id),
    }));
    if (selectedConnection?.id === id) {
      setSelectedConnection(null);
    }
  };

  // Update device config
  const updateDeviceConfig = (key: keyof DeviceConfig, value: string | number | string[]) => {
    if (!selectedDevice) return;
    
    const updatedDevice = {
      ...selectedDevice,
      config: { ...selectedDevice.config, [key]: value },
    };
    
    setLabConfig(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === selectedDevice.id ? updatedDevice : d),
    }));
    setSelectedDevice(updatedDevice);
  };

  // Update device name
  const updateDeviceName = (name: string) => {
    if (!selectedDevice) return;
    
    const updatedDevice = { ...selectedDevice, name };
    setLabConfig(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === selectedDevice.id ? updatedDevice : d),
    }));
    setSelectedDevice(updatedDevice);
  };

  // Task management
  const addTask = () => {
    const newTask: Task = {
      id: generateId(),
      title: `Tugas ${labConfig.tasks.length + 1}`,
      description: '',
      points: 10,
      hints: [],
      validation: '',
    };
    setEditingTask(newTask);
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    if (!editingTask) return;
    
    setLabConfig(prev => {
      const exists = prev.tasks.find(t => t.id === editingTask.id);
      if (exists) {
        return { ...prev, tasks: prev.tasks.map(t => t.id === editingTask.id ? editingTask : t) };
      }
      return { ...prev, tasks: [...prev.tasks, editingTask] };
    });
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const deleteTask = (id: string) => {
    setLabConfig(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    }));
  };

  // Add hint to task
  const addHint = () => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      hints: [...editingTask.hints, ''],
    });
  };

  const updateHint = (index: number, value: string) => {
    if (!editingTask) return;
    const newHints = [...editingTask.hints];
    newHints[index] = value;
    setEditingTask({ ...editingTask, hints: newHints });
  };

  const removeHint = (index: number) => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      hints: editingTask.hints.filter((_, i) => i !== index),
    });
  };

  // Save lab configuration
  const saveLab = async () => {
    setSaving(true);
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Lab saved:', labConfig);
      // Show success notification
    } catch (error) {
      console.error('Error saving lab:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get connection line coordinates
  const getConnectionCoords = (connection: Connection) => {
    const fromDevice = labConfig.devices.find(d => d.id === connection.from);
    const toDevice = labConfig.devices.find(d => d.id === connection.to);
    if (!fromDevice || !toDevice) return null;
    
    return {
      x1: fromDevice.x + 40,
      y1: fromDevice.y + 40,
      x2: toDevice.x + 40,
      y2: toDevice.y + 40,
    };
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={labConfig.title}
              onChange={(e) => setLabConfig(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Judul Lab..."
              className="text-xl font-bold bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
            />
            <p className="text-sm text-zinc-500">Lab Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors",
              previewMode
                ? "bg-[#088395] text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={saveLab}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#088395] text-white font-medium hover:bg-[#09637E] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Device Palette / Tasks */}
        <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActivePanel('devices')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activePanel === 'devices'
                  ? "text-[#088395] border-b-2 border-[#088395]"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Perangkat
            </button>
            <button
              onClick={() => setActivePanel('tasks')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activePanel === 'tasks'
                  ? "text-[#088395] border-b-2 border-[#088395]"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Tugas
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'devices' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Klik untuk menambahkan</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(deviceIcons) as DeviceType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => addDevice(type)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all hover:scale-105",
                        deviceColors[type]
                      )}
                    >
                      {deviceIcons[type]}
                      <span className="text-xs font-medium">{deviceLabels[type]}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Tools</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setIsConnecting(!isConnecting); setConnectFrom(null); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isConnecting
                          ? "bg-[#088395] text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                    >
                      <Link className="w-4 h-4" />
                      {isConnecting ? 'Connecting...' : 'Hubungkan'}
                    </button>
                    {isConnecting && connectFrom && (
                      <p className="text-xs text-[#088395] px-3">
                        Pilih perangkat tujuan...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'tasks' && (
              <div className="space-y-4">
                <button
                  onClick={addTask}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-[#088395] hover:text-[#088395] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Tugas
                </button>

                <div className="space-y-2">
                  {labConfig.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#088395]/20 text-[#088395] text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-zinc-900 dark:text-white text-sm">{task.title}</h4>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description || 'Belum ada deskripsi'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {task.points} poin
                            </span>
                            {task.hints.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                {task.hints.length} hint
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#088395] hover:bg-[#088395]/10 transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {labConfig.tasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Belum ada tugas</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-zinc-500">
              {labConfig.devices.length} perangkat, {labConfig.connections.length} koneksi
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden bg-zinc-100 dark:bg-zinc-900"
            style={{
              backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => { setSelectedDevice(null); setSelectedConnection(null); }}
          >
            {/* SVG for connections */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: '0 0',
              }}
            >
              {labConfig.connections.map((connection) => {
                const coords = getConnectionCoords(connection);
                if (!coords) return null;
                
                const isSelected = selectedConnection?.id === connection.id;
                
                return (
                  <g key={connection.id}>
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={isSelected ? '#088395' : '#71717a'}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={connection.type === 'wireless' ? '5,5' : undefined}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(connection);
                        setSelectedDevice(null);
                        setActivePanel('properties');
                      }}
                    />
                    {connection.label && (
                      <text
                        x={(coords.x1 + coords.x2) / 2}
                        y={(coords.y1 + coords.y2) / 2 - 10}
                        textAnchor="middle"
                        className="text-xs fill-zinc-500"
                      >
                        {connection.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Connection preview line */}
              {isConnecting && connectFrom && (
                <line
                  x1={labConfig.devices.find(d => d.id === connectFrom)?.x! + 40}
                  y1={labConfig.devices.find(d => d.id === connectFrom)?.y! + 40}
                  x2={labConfig.devices.find(d => d.id === connectFrom)?.x! + 40}
                  y2={labConfig.devices.find(d => d.id === connectFrom)?.y! + 40}
                  stroke="#088395"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
            </svg>

            {/* Devices */}
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: '0 0',
              }}
            >
              {labConfig.devices.map((device) => {
                const isSelected = selectedDevice?.id === device.id;
                const isConnectSource = connectFrom === device.id;
                
                return (
                  <div
                    key={device.id}
                    className={cn(
                      "absolute w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-move transition-all",
                      deviceColors[device.type],
                      isSelected && "ring-2 ring-[#088395] ring-offset-2 ring-offset-zinc-100 dark:ring-offset-zinc-900",
                      isConnectSource && "ring-2 ring-[#088395] animate-pulse",
                      isConnecting && !isConnectSource && "hover:ring-2 hover:ring-[#088395]"
                    )}
                    style={{ left: device.x, top: device.y }}
                    onMouseDown={(e) => handleDeviceMouseDown(e, device.id)}
                  >
                    {deviceIcons[device.type]}
                    <span className="text-[10px] font-medium mt-1 text-center px-1 truncate w-full">
                      {device.name}
                    </span>
                    {device.config.ip && (
                      <span className="text-[8px] opacity-70">{device.config.ip}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {labConfig.devices.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Layers className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">Mulai dengan menambahkan perangkat dari panel kiri</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Properties</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedDevice ? (
              <div className="space-y-4">
                {/* Device Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <div className={cn("p-2 rounded-lg", deviceColors[selectedDevice.type])}>
                    {deviceIcons[selectedDevice.type]}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={selectedDevice.name}
                      onChange={(e) => updateDeviceName(e.target.value)}
                      className="font-medium text-zinc-900 dark:text-white bg-transparent border-none outline-none w-full"
                    />
                    <p className="text-xs text-zinc-500">{deviceLabels[selectedDevice.type]}</p>
                  </div>
                </div>

                {/* Network Config */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Konfigurasi Jaringan</h4>
                  
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">IP Address</label>
                    <input
                      type="text"
                      value={selectedDevice.config.ip || ''}
                      onChange={(e) => updateDeviceConfig('ip', e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Subnet Mask</label>
                    <input
                      type="text"
                      value={selectedDevice.config.subnet || ''}
                      onChange={(e) => updateDeviceConfig('subnet', e.target.value)}
                      placeholder="255.255.255.0"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Gateway</label>
                    <input
                      type="text"
                      value={selectedDevice.config.gateway || ''}
                      onChange={(e) => updateDeviceConfig('gateway', e.target.value)}
                      placeholder="192.168.1.254"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <button
                    onClick={() => duplicateDevice(selectedDevice)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplikat
                  </button>
                  <button
                    onClick={() => deleteDevice(selectedDevice.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ) : selectedConnection ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <div className="p-2 rounded-lg bg-[#088395]/20 text-[#088395]">
                    <Link className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Koneksi</p>
                    <p className="text-xs text-zinc-500">
                      {labConfig.devices.find(d => d.id === selectedConnection.from)?.name} →{' '}
                      {labConfig.devices.find(d => d.id === selectedConnection.to)?.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Tipe Koneksi</label>
                    <select
                      value={selectedConnection.type}
                      onChange={(e) => {
                        const updated = { ...selectedConnection, type: e.target.value as Connection['type'] };
                        setLabConfig(prev => ({
                          ...prev,
                          connections: prev.connections.map(c => c.id === selectedConnection.id ? updated : c),
                        }));
                        setSelectedConnection(updated);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                    >
                      <option value="ethernet">Ethernet</option>
                      <option value="wireless">Wireless</option>
                      <option value="wan">WAN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Label (opsional)</label>
                    <input
                      type="text"
                      value={selectedConnection.label || ''}
                      onChange={(e) => {
                        const updated = { ...selectedConnection, label: e.target.value };
                        setLabConfig(prev => ({
                          ...prev,
                          connections: prev.connections.map(c => c.id === selectedConnection.id ? updated : c),
                        }));
                        setSelectedConnection(updated);
                      }}
                      placeholder="Eth0"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => deleteConnection(selectedConnection.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    Hapus Koneksi
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MousePointer className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Pilih perangkat atau koneksi untuk melihat properties</p>
              </div>
            )}
          </div>

          {/* Lab Settings */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Pengaturan Lab</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tingkat Kesulitan</label>
                <select
                  value={labConfig.difficulty}
                  onChange={(e) => setLabConfig(prev => ({ ...prev, difficulty: e.target.value as LabConfig['difficulty'] }))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Lanjutan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Durasi (menit)</label>
                <input
                  type="number"
                  value={labConfig.duration}
                  onChange={(e) => setLabConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      {taskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {labConfig.tasks.find(t => t.id === editingTask.id) ? 'Edit Tugas' : 'Tambah Tugas'}
              </h3>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="Contoh: Konfigurasi IP Address pada Router"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white resize-none"
                  placeholder="Jelaskan apa yang harus dilakukan siswa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Poin
                  </label>
                  <input
                    type="number"
                    value={editingTask.points}
                    onChange={(e) => setEditingTask({ ...editingTask, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Validasi Command
                  </label>
                  <input
                    type="text"
                    value={editingTask.validation}
                    onChange={(e) => setEditingTask({ ...editingTask, validation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    placeholder="ping 192.168.1.1"
                  />
                </div>
              </div>

              {/* Hints */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Hints
                  </label>
                  <button
                    onClick={addHint}
                    className="flex items-center gap-1 text-sm text-[#088395] hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Hint
                  </button>
                </div>
                <div className="space-y-2">
                  {editingTask.hints.map((hint, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-medium mt-2">
                        {index + 1}
                      </div>
                      <textarea
                        value={hint}
                        onChange={(e) => updateHint(index, e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white resize-none"
                        placeholder="Masukkan hint..."
                      />
                      <button
                        onClick={() => removeHint(index)}
                        className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editingTask.hints.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      Belum ada hint. Tambahkan hint untuk membantu siswa.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setTaskModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveTask}
                className="px-4 py-2.5 rounded-xl bg-[#088395] text-white font-medium hover:bg-[#09637E] transition-colors"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
