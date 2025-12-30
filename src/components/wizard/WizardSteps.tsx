'use client';

import { Input, Select, Card } from '../ui';
import { WizardStepProps } from './types';
import { Network, Globe, Server, ArrowRight } from 'lucide-react';

// IP Configuration Step
export function IPConfigStep({ data, onChange, errors }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="IP Address"
          value={data.ipAddress || ''}
          onChange={(e) => onChange({ ipAddress: e.target.value })}
          placeholder="192.168.1.1"
          error={errors.ipAddress}
          helperText="Masukkan IP address untuk interface"
          leftIcon={<Network size={16} />}
        />
        <Input
          label="Subnet Mask"
          value={data.subnetMask || ''}
          onChange={(e) => onChange({ subnetMask: e.target.value })}
          placeholder="255.255.255.0"
          error={errors.subnetMask}
          helperText="Masukkan subnet mask"
        />
      </div>

      <Input
        label="Default Gateway"
        value={data.defaultGateway || ''}
        onChange={(e) => onChange({ defaultGateway: e.target.value })}
        placeholder="192.168.1.254"
        error={errors.defaultGateway}
        helperText="Opsional - gateway default untuk routing"
        leftIcon={<Globe size={16} />}
      />

      <Card variant="bordered" className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          💡 Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>• IP address harus unik dalam jaringan</li>
          <li>• Subnet mask menentukan ukuran jaringan</li>
          <li>• Gateway diperlukan untuk komunikasi antar jaringan</li>
        </ul>
      </Card>
    </div>
  );
}

// DHCP Configuration Step
export function DHCPConfigStep({ data, onChange, errors }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="dhcp-enabled"
          checked={data.dhcpEnabled || false}
          onChange={(e) => onChange({ dhcpEnabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="dhcp-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Aktifkan DHCP Server
        </label>
      </div>

      {data.dhcpEnabled && (
        <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
          <Input
            label="Nama Pool"
            value={data.dhcpPoolName || ''}
            onChange={(e) => onChange({ dhcpPoolName: e.target.value })}
            placeholder="LAN_POOL"
            error={errors.dhcpPoolName}
          />

          <Input
            label="Network"
            value={data.dhcpNetwork || ''}
            onChange={(e) => onChange({ dhcpNetwork: e.target.value })}
            placeholder="192.168.1.0"
            error={errors.dhcpNetwork}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Alamat Awal"
              value={data.dhcpStartAddress || ''}
              onChange={(e) => onChange({ dhcpStartAddress: e.target.value })}
              placeholder="192.168.1.10"
              error={errors.dhcpStartAddress}
            />
            <Input
              label="Alamat Akhir"
              value={data.dhcpEndAddress || ''}
              onChange={(e) => onChange({ dhcpEndAddress: e.target.value })}
              placeholder="192.168.1.100"
              error={errors.dhcpEndAddress}
            />
          </div>

          <Input
            label="DNS Server"
            value={data.dhcpDnsServer || ''}
            onChange={(e) => onChange({ dhcpDnsServer: e.target.value })}
            placeholder="8.8.8.8"
            error={errors.dhcpDnsServer}
            leftIcon={<Server size={16} />}
          />
        </div>
      )}
    </div>
  );
}

// Static Route Step
export function StaticRouteStep({ data, onChange, errors }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Network Tujuan"
          value={data.routeNetwork || ''}
          onChange={(e) => onChange({ routeNetwork: e.target.value })}
          placeholder="10.0.0.0"
          error={errors.routeNetwork}
          helperText="Network yang ingin dicapai"
        />
        <Input
          label="Subnet Mask"
          value={data.routeMask || ''}
          onChange={(e) => onChange({ routeMask: e.target.value })}
          placeholder="255.255.255.0"
          error={errors.routeMask}
        />
      </div>

      <Input
        label="Next Hop"
        value={data.routeNextHop || ''}
        onChange={(e) => onChange({ routeNextHop: e.target.value })}
        placeholder="192.168.1.1"
        error={errors.routeNextHop}
        helperText="IP address router selanjutnya"
        leftIcon={<ArrowRight size={16} />}
      />

      <Input
        label="Metric (Opsional)"
        type="number"
        value={data.routeMetric?.toString() || ''}
        onChange={(e) => onChange({ routeMetric: parseInt(e.target.value) || undefined })}
        placeholder="1"
        error={errors.routeMetric}
        helperText="Prioritas route (lebih kecil = lebih prioritas)"
      />

      {/* Visual Representation */}
      <Card variant="bordered" className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Preview Route
        </h4>
        <div className="flex items-center gap-2 text-sm">
          <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-300">
            {data.routeNetwork || '?.?.?.?'}/{data.routeMask || '?'}
          </div>
          <ArrowRight size={16} className="text-gray-400" />
          <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-700 dark:text-green-300">
            {data.routeNextHop || '?.?.?.?'}
          </div>
        </div>
      </Card>
    </div>
  );
}

// NAT Configuration Step
export function NATConfigStep({ data, onChange, errors }: WizardStepProps) {
  const natTypes = [
    { value: 'pat', label: 'PAT (Port Address Translation)' },
    { value: 'static', label: 'Static NAT' },
    { value: 'dynamic', label: 'Dynamic NAT' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="nat-enabled"
          checked={data.natEnabled || false}
          onChange={(e) => onChange({ natEnabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="nat-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Aktifkan NAT
        </label>
      </div>

      {data.natEnabled && (
        <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
          <Select
            label="Tipe NAT"
            value={data.natType || 'pat'}
            onChange={(value) => onChange({ natType: value as 'pat' | 'static' | 'dynamic' })}
            options={natTypes}
          />

          <Select
            label="Inside Interface"
            value={data.natInsideInterface || ''}
            onChange={(value) => onChange({ natInsideInterface: value })}
            options={[
              { value: 'GigabitEthernet0/0', label: 'GigabitEthernet0/0' },
              { value: 'GigabitEthernet0/1', label: 'GigabitEthernet0/1' },
              { value: 'GigabitEthernet0/2', label: 'GigabitEthernet0/2' }
            ]}
            placeholder="Pilih interface..."
          />

          <Select
            label="Outside Interface"
            value={data.natOutsideInterface || ''}
            onChange={(value) => onChange({ natOutsideInterface: value })}
            options={[
              { value: 'GigabitEthernet0/0', label: 'GigabitEthernet0/0' },
              { value: 'GigabitEthernet0/1', label: 'GigabitEthernet0/1' },
              { value: 'GigabitEthernet0/2', label: 'GigabitEthernet0/2' }
            ]}
            placeholder="Pilih interface..."
          />

          <Card variant="bordered" className="p-4 bg-amber-50 dark:bg-amber-900/20">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
              ⚠️ Catatan
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <li>• PAT cocok untuk banyak host menggunakan satu IP publik</li>
              <li>• Static NAT untuk pemetaan 1:1</li>
              <li>• Dynamic NAT untuk pool IP publik</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

// Interface Configuration Step
export function InterfaceConfigStep({ data, onChange, errors }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <Select
        label="Pilih Interface"
        value={data.selectedInterface || ''}
        onChange={(value) => onChange({ selectedInterface: value })}
        options={[
          { value: 'GigabitEthernet0/0', label: 'GigabitEthernet0/0' },
          { value: 'GigabitEthernet0/1', label: 'GigabitEthernet0/1' },
          { value: 'GigabitEthernet0/2', label: 'GigabitEthernet0/2' },
          { value: 'FastEthernet0/0', label: 'FastEthernet0/0' },
          { value: 'Serial0/0/0', label: 'Serial0/0/0' }
        ]}
        placeholder="Pilih interface..."
        error={errors.selectedInterface}
      />

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Status Interface
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onChange({ interfaceStatus: 'up' })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${data.interfaceStatus === 'up'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => onChange({ interfaceStatus: 'down' })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${data.interfaceStatus === 'down'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
          >
            Down
          </button>
        </div>
      </div>

      <Input
        label="Deskripsi Interface"
        value={data.interfaceDescription || ''}
        onChange={(e) => onChange({ interfaceDescription: e.target.value })}
        placeholder="Contoh: Link ke Router ISP"
        error={errors.interfaceDescription}
        helperText="Opsional - deskripsi untuk dokumentasi"
      />
    </div>
  );
}

// Summary/Review Step
export function SummaryStep({ data }: WizardStepProps) {
  return (
    <div className="space-y-4">
      <Card variant="bordered" className="p-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Ringkasan Konfigurasi
        </h4>

        <div className="space-y-3 text-sm">
          {data.ipAddress && (
            <div className="flex justify-between">
              <span className="text-gray-500">IP Address</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {data.ipAddress}/{data.subnetMask}
              </span>
            </div>
          )}

          {data.defaultGateway && (
            <div className="flex justify-between">
              <span className="text-gray-500">Default Gateway</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {data.defaultGateway}
              </span>
            </div>
          )}

          {data.dhcpEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-500">DHCP Pool</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {data.dhcpPoolName} ({data.dhcpStartAddress} - {data.dhcpEndAddress})
              </span>
            </div>
          )}

          {data.routeNetwork && (
            <div className="flex justify-between">
              <span className="text-gray-500">Static Route</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {data.routeNetwork} via {data.routeNextHop}
              </span>
            </div>
          )}

          {data.natEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-500">NAT</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {data.natType?.toUpperCase()} - {data.natInsideInterface} → {data.natOutsideInterface}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card variant="gradient" className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Klik &quot;Selesai&quot; untuk menerapkan konfigurasi ini ke perangkat.
          Anda dapat melihat perubahan di terminal atau panel konfigurasi.
        </p>
      </Card>
    </div>
  );
}
