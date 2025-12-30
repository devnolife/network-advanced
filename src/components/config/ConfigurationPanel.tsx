'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Network,
  Globe,
  Server,
  Terminal,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button, Input, Select, Tabs, Card, Badge } from '../ui';
import { StatusIndicator } from '../status';
import {
  TopologyNode,
  InterfaceConfig,
  RoutingConfig,
  DHCPConfig,
  NATConfig,
  StaticRoute
} from '../topology/types';

interface ConfigurationPanelProps {
  device: TopologyNode;
  onSave: (config: TopologyNode['config']) => void;
  onClose: () => void;
  onExecuteCommand?: (command: string) => Promise<string>;
}

type ConfigTab = 'general' | 'interfaces' | 'routing' | 'dhcp' | 'nat';

export function ConfigurationPanel({
  device,
  onSave,
  onClose,
  onExecuteCommand
}: ConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('general');
  const [configMode, setConfigMode] = useState<'gui' | 'cli'>('gui');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local config state
  const [hostname, setHostname] = useState(device.config?.hostname || device.label);
  const [interfaces, setInterfaces] = useState<InterfaceConfig[]>(
    device.config?.interfaces ||
    device.interfaces?.map(i => ({
      name: i.name,
      ipAddress: i.ipAddress || '',
      subnetMask: i.subnetMask || '',
      enabled: i.status !== 'disabled',
      description: ''
    })) || []
  );
  const [routing, setRouting] = useState<RoutingConfig>(
    device.config?.routing || { staticRoutes: [], defaultGateway: '', protocol: 'static' }
  );
  const [dhcp, setDhcp] = useState<DHCPConfig>(
    device.config?.dhcp || { enabled: false, pools: [], excludedAddresses: [] }
  );
  const [nat, setNat] = useState<NATConfig>(
    device.config?.nat || { enabled: false }
  );

  // CLI state
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState<string[]>([
    `${hostname}#`,
    'Selamat datang di CLI Configuration Mode',
    'Ketik "help" untuk melihat daftar perintah yang tersedia.',
    ''
  ]);

  // Mark changes
  const markChange = useCallback(() => {
    setHasChanges(true);
    setSaveMessage(null);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const config = {
        hostname,
        interfaces,
        routing,
        dhcp,
        nat
      };
      await onSave(config);
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Konfigurasi berhasil disimpan!' });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Gagal menyimpan konfigurasi.' });
    } finally {
      setIsSaving(false);
    }
  }, [hostname, interfaces, routing, dhcp, nat, onSave]);

  // Handle CLI command
  const handleCliCommand = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !cliInput.trim()) return;

    const command = cliInput.trim();
    const newOutput = [...cliOutput, `${hostname}# ${command}`];

    if (onExecuteCommand) {
      try {
        const result = await onExecuteCommand(command);
        newOutput.push(result);
      } catch (error) {
        newOutput.push(`Error: ${error}`);
      }
    } else {
      // Basic command simulation
      if (command === 'help') {
        newOutput.push(
          'Perintah yang tersedia:',
          '  show running-config     - Tampilkan konfigurasi saat ini',
          '  show interfaces         - Tampilkan status interface',
          '  show ip route           - Tampilkan tabel routing',
          '  configure terminal      - Masuk ke mode konfigurasi',
          '  hostname <name>         - Ubah hostname',
          '  interface <name>        - Konfigurasi interface',
          '  ip route <network> <mask> <next-hop> - Tambah static route',
          '  exit                    - Keluar dari mode konfigurasi',
          '  clear                   - Bersihkan layar'
        );
      } else if (command === 'show running-config') {
        newOutput.push(
          '!',
          `hostname ${hostname}`,
          '!',
          ...interfaces.map(i => [
            `interface ${i.name}`,
            i.description ? ` description ${i.description}` : '',
            i.ipAddress ? ` ip address ${i.ipAddress} ${i.subnetMask}` : ' no ip address',
            i.enabled ? ' no shutdown' : ' shutdown',
            '!'
          ].filter(Boolean)).flat()
        );
      } else if (command === 'show interfaces') {
        newOutput.push(
          ...interfaces.map(i =>
            `${i.name} is ${i.enabled ? 'up' : 'administratively down'}, line protocol is ${i.enabled ? 'up' : 'down'}\n` +
            `  Internet address is ${i.ipAddress || 'not set'}/${i.subnetMask || 'not set'}`
          )
        );
      } else if (command === 'clear') {
        setCliOutput([`${hostname}#`]);
        setCliInput('');
        return;
      } else if (command.startsWith('hostname ')) {
        const newHostname = command.replace('hostname ', '').trim();
        setHostname(newHostname);
        markChange();
        newOutput.push(`Hostname changed to ${newHostname}`);
      } else {
        newOutput.push(`% Unknown command: "${command}"`);
      }
    }

    newOutput.push('');
    setCliOutput(newOutput);
    setCliInput('');
  }, [cliInput, cliOutput, hostname, interfaces, onExecuteCommand, markChange]);

  // Add interface
  const addInterface = useCallback(() => {
    const newInterface: InterfaceConfig = {
      name: `GigabitEthernet0/${interfaces.length}`,
      ipAddress: '',
      subnetMask: '',
      enabled: true,
      description: ''
    };
    setInterfaces([...interfaces, newInterface]);
    markChange();
  }, [interfaces, markChange]);

  // Update interface
  const updateInterface = useCallback((index: number, field: keyof InterfaceConfig, value: string | boolean) => {
    const updated = [...interfaces];
    updated[index] = { ...updated[index], [field]: value };
    setInterfaces(updated);
    markChange();
  }, [interfaces, markChange]);

  // Remove interface
  const removeInterface = useCallback((index: number) => {
    setInterfaces(interfaces.filter((_, i) => i !== index));
    markChange();
  }, [interfaces, markChange]);

  // Add static route
  const addStaticRoute = useCallback(() => {
    const newRoute: StaticRoute = {
      network: '',
      mask: '',
      nextHop: '',
      metric: 1
    };
    setRouting({
      ...routing,
      staticRoutes: [...(routing.staticRoutes || []), newRoute]
    });
    markChange();
  }, [routing, markChange]);

  // Tabs configuration
  const tabsConfig: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'Umum', icon: <Settings size={16} /> },
    { id: 'interfaces', label: 'Interface', icon: <Network size={16} /> },
    { id: 'routing', label: 'Routing', icon: <Globe size={16} /> },
    { id: 'dhcp', label: 'DHCP', icon: <Server size={16} /> },
    { id: 'nat', label: 'NAT', icon: <Globe size={16} /> }
  ];

  // Filter tabs based on device type
  const availableTabs = tabsConfig.filter(tab => {
    if (device.type === 'pc') {
      return ['general', 'interfaces'].includes(tab.id);
    }
    if (device.type === 'switch') {
      return ['general', 'interfaces'].includes(tab.id);
    }
    return true; // Router and server have all tabs
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIndicator status={device.status} size="md" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {device.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {device.type} Configuration
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <Badge variant={hasChanges ? 'warning' : 'default'}>
              {hasChanges ? 'Belum Disimpan' : 'Tersimpan'}
            </Badge>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setConfigMode('gui')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${configMode === 'gui'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
              >
                GUI
              </button>
              <button
                onClick={() => setConfigMode('cli')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${configMode === 'cli'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
              >
                <Terminal size={14} className="inline mr-1" />
                CLI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {configMode === 'gui' ? (
            <motion.div
              key="gui"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              {/* Tabs */}
              <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {availableTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* General Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <Input
                      label="Hostname"
                      value={hostname}
                      onChange={(e) => { setHostname(e.target.value); markChange(); }}
                      placeholder="Enter hostname"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipe Perangkat
                        </label>
                        <Badge variant="info" className="capitalize">
                          {device.type}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <StatusIndicator status={device.status} showLabel size="sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interfaces Tab */}
                {activeTab === 'interfaces' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Daftar Interface
                      </h3>
                      <Button size="sm" variant="outline" onClick={addInterface}>
                        <Plus size={14} className="mr-1" />
                        Tambah Interface
                      </Button>
                    </div>

                    {interfaces.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Belum ada interface yang dikonfigurasi
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interfaces.map((iface, index) => (
                          <Card key={index} variant="bordered" className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Network size={16} className="text-gray-500" />
                                <span className="font-medium">{iface.name}</span>
                                <Badge
                                  variant={iface.enabled ? 'success' : 'danger'}
                                  size="sm"
                                >
                                  {iface.enabled ? 'Up' : 'Down'}
                                </Badge>
                              </div>
                              <button
                                onClick={() => removeInterface(index)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="IP Address"
                                value={iface.ipAddress || ''}
                                onChange={(e) => updateInterface(index, 'ipAddress', e.target.value)}
                                placeholder="192.168.1.1"
                                size="sm"
                              />
                              <Input
                                label="Subnet Mask"
                                value={iface.subnetMask || ''}
                                onChange={(e) => updateInterface(index, 'subnetMask', e.target.value)}
                                placeholder="255.255.255.0"
                                size="sm"
                              />
                            </div>

                            <div className="mt-3">
                              <Input
                                label="Deskripsi"
                                value={iface.description || ''}
                                onChange={(e) => updateInterface(index, 'description', e.target.value)}
                                placeholder="Interface description"
                                size="sm"
                              />
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`enabled-${index}`}
                                checked={iface.enabled}
                                onChange={(e) => updateInterface(index, 'enabled', e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <label
                                htmlFor={`enabled-${index}`}
                                className="text-sm text-gray-600 dark:text-gray-400"
                              >
                                Interface Aktif
                              </label>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Routing Tab */}
                {activeTab === 'routing' && (
                  <div className="space-y-4">
                    <Input
                      label="Default Gateway"
                      value={routing.defaultGateway || ''}
                      onChange={(e) => { setRouting({ ...routing, defaultGateway: e.target.value }); markChange(); }}
                      placeholder="0.0.0.0"
                    />

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Static Routes
                        </h3>
                        <Button size="sm" variant="outline" onClick={addStaticRoute}>
                          <Plus size={14} className="mr-1" />
                          Tambah Route
                        </Button>
                      </div>

                      {(!routing.staticRoutes || routing.staticRoutes.length === 0) ? (
                        <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                          Belum ada static route
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {routing.staticRoutes?.map((route, index) => (
                            <Card key={index} variant="bordered" className="p-3">
                              <div className="grid grid-cols-4 gap-2">
                                <Input
                                  placeholder="Network"
                                  value={route.network}
                                  onChange={(e) => {
                                    const updated = [...(routing.staticRoutes || [])];
                                    updated[index] = { ...updated[index], network: e.target.value };
                                    setRouting({ ...routing, staticRoutes: updated });
                                    markChange();
                                  }}
                                  size="sm"
                                />
                                <Input
                                  placeholder="Mask"
                                  value={route.mask}
                                  onChange={(e) => {
                                    const updated = [...(routing.staticRoutes || [])];
                                    updated[index] = { ...updated[index], mask: e.target.value };
                                    setRouting({ ...routing, staticRoutes: updated });
                                    markChange();
                                  }}
                                  size="sm"
                                />
                                <Input
                                  placeholder="Next Hop"
                                  value={route.nextHop}
                                  onChange={(e) => {
                                    const updated = [...(routing.staticRoutes || [])];
                                    updated[index] = { ...updated[index], nextHop: e.target.value };
                                    setRouting({ ...routing, staticRoutes: updated });
                                    markChange();
                                  }}
                                  size="sm"
                                />
                                <button
                                  onClick={() => {
                                    setRouting({
                                      ...routing,
                                      staticRoutes: routing.staticRoutes?.filter((_, i) => i !== index)
                                    });
                                    markChange();
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DHCP Tab */}
                {activeTab === 'dhcp' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="dhcp-enabled"
                        checked={dhcp.enabled}
                        onChange={(e) => { setDhcp({ ...dhcp, enabled: e.target.checked }); markChange(); }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="dhcp-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aktifkan DHCP Server
                      </label>
                    </div>

                    {dhcp.enabled && (
                      <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-500">
                          Konfigurasi DHCP pool untuk memberikan IP address secara otomatis ke client.
                        </p>

                        <Button size="sm" variant="outline">
                          <Plus size={14} className="mr-1" />
                          Tambah DHCP Pool
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* NAT Tab */}
                {activeTab === 'nat' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="nat-enabled"
                        checked={nat.enabled}
                        onChange={(e) => { setNat({ ...nat, enabled: e.target.checked }); markChange(); }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="nat-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aktifkan NAT
                      </label>
                    </div>

                    {nat.enabled && (
                      <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                        <Select
                          label="Tipe NAT"
                          value={nat.type || 'pat'}
                          onChange={(value) => { setNat({ ...nat, type: value as 'static' | 'dynamic' | 'pat' }); markChange(); }}
                          options={[
                            { value: 'pat', label: 'PAT (Port Address Translation)' },
                            { value: 'static', label: 'Static NAT' },
                            { value: 'dynamic', label: 'Dynamic NAT' }
                          ]}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            label="Inside Interface"
                            value={nat.insideInterface || ''}
                            onChange={(value) => { setNat({ ...nat, insideInterface: value }); markChange(); }}
                            options={interfaces.map(i => ({ value: i.name, label: i.name }))}
                            placeholder="Pilih interface..."
                          />
                          <Select
                            label="Outside Interface"
                            value={nat.outsideInterface || ''}
                            onChange={(value) => { setNat({ ...nat, outsideInterface: value }); markChange(); }}
                            options={interfaces.map(i => ({ value: i.name, label: i.name }))}
                            placeholder="Pilih interface..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* CLI Mode */
            <motion.div
              key="cli"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 bg-gray-900 p-4 font-mono text-sm overflow-y-auto">
                {cliOutput.map((line, index) => (
                  <div key={index} className="text-green-400 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                <div className="flex items-center text-green-400">
                  <span>{hostname}# </span>
                  <input
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    onKeyDown={handleCliCommand}
                    className="flex-1 bg-transparent outline-none border-none text-green-400"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-center gap-2 mb-3 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {saveMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setHostname(device.config?.hostname || device.label);
              setInterfaces(device.config?.interfaces || []);
              setRouting(device.config?.routing || { staticRoutes: [], defaultGateway: '', protocol: 'static' });
              setDhcp(device.config?.dhcp || { enabled: false, pools: [], excludedAddresses: [] });
              setNat(device.config?.nat || { enabled: false });
              setHasChanges(false);
            }}
            disabled={!hasChanges}
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            loading={isSaving}
          >
            <Save size={14} className="mr-1" />
            Simpan Konfigurasi
          </Button>
        </div>
      </div>
    </div>
  );
}
