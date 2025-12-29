// Task Validation Logic

export interface ValidationCriteria {
  type: 'command-executed' | 'config-check' | 'connectivity-test';
  device?: string;
  command?: string;
  expected?: Record<string, unknown>;
  from?: string;
  to?: string;
}

export interface ValidationContext {
  deviceConfigs: Record<string, DeviceConfig>;
  commandHistory: Record<string, string[]>;
  connectivityResults: Record<string, boolean>;
}

export interface DeviceConfig {
  ip?: string;
  mask?: string;
  gateway?: string;
  interfaces?: InterfaceConfig[];
  hostname?: string;
}

export interface InterfaceConfig {
  name: string;
  ip?: string;
  mask?: string;
  status?: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

// Validate a task based on its criteria
export function validateTask(
  criteria: ValidationCriteria,
  context: ValidationContext
): ValidationResult {
  switch (criteria.type) {
    case 'command-executed':
      return validateCommandExecuted(criteria, context);
    case 'config-check':
      return validateConfigCheck(criteria, context);
    case 'connectivity-test':
      return validateConnectivityTest(criteria, context);
    default:
      return { valid: false, message: 'Unknown validation type' };
  }
}

// Check if a specific command was executed on a device
function validateCommandExecuted(
  criteria: ValidationCriteria,
  context: ValidationContext
): ValidationResult {
  const { device, command } = criteria;

  if (!device || !command) {
    return { valid: false, message: 'Invalid validation criteria' };
  }

  const history = context.commandHistory[device] || [];

  // Check if the command (or similar) was executed
  const commandLower = command.toLowerCase();
  const wasExecuted = history.some((cmd) => {
    const cmdLower = cmd.toLowerCase().trim();
    // Exact match or starts with the command
    return cmdLower === commandLower || cmdLower.startsWith(commandLower);
  });

  if (wasExecuted) {
    return {
      valid: true,
      message: `Command '${command}' executed successfully on ${device}`,
    };
  }

  return {
    valid: false,
    message: `Command '${command}' has not been executed on ${device}`,
    details: `Execute the command '${command}' on ${device} to complete this task`,
  };
}

// Check if device configuration matches expected values
function validateConfigCheck(
  criteria: ValidationCriteria,
  context: ValidationContext
): ValidationResult {
  const { device, expected } = criteria;

  if (!device || !expected) {
    return { valid: false, message: 'Invalid validation criteria' };
  }

  const config = context.deviceConfigs[device];

  if (!config) {
    return {
      valid: false,
      message: `Device ${device} has no configuration`,
      details: 'Configure the device first',
    };
  }

  // Check each expected value
  const mismatches: string[] = [];

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = config[key as keyof DeviceConfig];

    if (actualValue !== expectedValue) {
      mismatches.push(`${key}: expected '${expectedValue}', got '${actualValue || 'not set'}'`);
    }
  }

  if (mismatches.length === 0) {
    return {
      valid: true,
      message: `Device ${device} configuration is correct`,
    };
  }

  return {
    valid: false,
    message: `Device ${device} configuration does not match expected values`,
    details: mismatches.join('; '),
  };
}

// Check if connectivity test was successful
function validateConnectivityTest(
  criteria: ValidationCriteria,
  context: ValidationContext
): ValidationResult {
  const { from, to } = criteria;

  if (!from || !to) {
    return { valid: false, message: 'Invalid validation criteria' };
  }

  const testKey = `${from}->${to}`;
  const reverseKey = `${to}->${from}`;

  const isConnected =
    context.connectivityResults[testKey] ||
    context.connectivityResults[reverseKey];

  if (isConnected) {
    return {
      valid: true,
      message: `Connectivity from ${from} to ${to} verified`,
    };
  }

  return {
    valid: false,
    message: `No successful connectivity from ${from} to ${to}`,
    details: `Use ping command from ${from} to test connectivity to ${to}`,
  };
}

// Helper: Simulate ping result based on network topology
export function simulatePing(
  sourceDevice: string,
  targetIP: string,
  deviceConfigs: Record<string, DeviceConfig>,
  topology: { devices: Array<{ id: string; type: string }>; links: Array<{ source: { device: string }; destination: { device: string } }> }
): { success: boolean; message: string } {
  const sourceConfig = deviceConfigs[sourceDevice];

  if (!sourceConfig) {
    return { success: false, message: 'Source device not configured' };
  }

  // Check if source has an IP
  if (!sourceConfig.ip && !sourceConfig.interfaces?.some(i => i.ip)) {
    return { success: false, message: 'Source device has no IP address' };
  }

  // Find target device by IP
  let targetDevice: string | null = null;

  for (const [deviceId, config] of Object.entries(deviceConfigs)) {
    if (config.ip === targetIP) {
      targetDevice = deviceId;
      break;
    }
    // Check interfaces for routers
    if (config.interfaces) {
      for (const iface of config.interfaces) {
        if (iface.ip === targetIP) {
          targetDevice = deviceId;
          break;
        }
      }
    }
  }

  if (!targetDevice) {
    return { success: false, message: `Destination ${targetIP} unreachable` };
  }

  // Check if devices are connected (directly or via router)
  const isConnected = checkConnectivity(sourceDevice, targetDevice, topology);

  if (isConnected) {
    return {
      success: true,
      message: `Reply from ${targetIP}: bytes=32 time<1ms TTL=128`,
    };
  }

  return { success: false, message: `Request timed out` };
}

// Check if two devices are connected in the topology
function checkConnectivity(
  source: string,
  target: string,
  topology: { devices: Array<{ id: string; type: string }>; links: Array<{ source: { device: string }; destination: { device: string } }> }
): boolean {
  if (source === target) return true;

  // BFS to find path
  const visited = new Set<string>();
  const queue: string[] = [source];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === target) return true;
    if (visited.has(current)) continue;

    visited.add(current);

    // Find connected devices
    for (const link of topology.links) {
      if (link.source.device === current && !visited.has(link.destination.device)) {
        queue.push(link.destination.device);
      }
      if (link.destination.device === current && !visited.has(link.source.device)) {
        queue.push(link.source.device);
      }
    }
  }

  return false;
}

// Parse and execute a command, returning the result
export function executeCommand(
  command: string,
  device: string,
  deviceType: 'pc' | 'router',
  deviceConfig: DeviceConfig
): { output: string; updatedConfig?: Partial<DeviceConfig> } {
  const cmd = command.toLowerCase().trim();
  const parts = cmd.split(/\s+/);

  // PC commands
  if (deviceType === 'pc') {
    if (parts[0] === 'set' && parts[1] === 'ip') {
      // set ip <ip> <mask> <gateway>
      const [, , ip, mask, gateway] = parts;
      if (ip && mask && gateway) {
        return {
          output: `IP configuration set:\n  IP Address: ${ip}\n  Subnet Mask: ${mask}\n  Default Gateway: ${gateway}`,
          updatedConfig: { ip, mask, gateway },
        };
      }
      return { output: 'Usage: set ip <address> <mask> <gateway>' };
    }

    if (parts[0] === 'ipconfig' || parts[0] === 'ifconfig') {
      return {
        output: `Ethernet adapter:\n  IP Address: ${deviceConfig.ip || 'Not configured'}\n  Subnet Mask: ${deviceConfig.mask || 'Not configured'}\n  Default Gateway: ${deviceConfig.gateway || 'Not configured'}`,
      };
    }
  }

  // Router commands
  if (deviceType === 'router') {
    if (cmd === 'enable') {
      return { output: `${deviceConfig.hostname || device}#` };
    }

    if (cmd === 'show ip interface brief') {
      let output = 'Interface              IP-Address      OK? Method Status                Protocol\n';
      output += '─'.repeat(80) + '\n';

      if (deviceConfig.interfaces) {
        for (const iface of deviceConfig.interfaces) {
          output += `${iface.name.padEnd(22)} ${(iface.ip || 'unassigned').padEnd(15)} YES manual ${(iface.status || 'up').padEnd(21)} up\n`;
        }
      }

      return { output };
    }

    if (cmd === 'show ip route') {
      let output = 'Codes: C - connected, S - static, R - RIP, O - OSPF\n\n';
      output += 'Gateway of last resort is not set\n\n';

      if (deviceConfig.interfaces) {
        for (const iface of deviceConfig.interfaces) {
          if (iface.ip) {
            const network = iface.ip.split('.').slice(0, 3).join('.') + '.0';
            output += `C    ${network}/24 is directly connected, ${iface.name}\n`;
          }
        }
      }

      return { output };
    }

    if (cmd === 'show running-config' || cmd === 'show run') {
      let output = `Building configuration...\n\n`;
      output += `hostname ${deviceConfig.hostname || device}\n!\n`;

      if (deviceConfig.interfaces) {
        for (const iface of deviceConfig.interfaces) {
          output += `interface ${iface.name}\n`;
          if (iface.ip) {
            output += ` ip address ${iface.ip} ${iface.mask || '255.255.255.0'}\n`;
          }
          output += ` no shutdown\n!\n`;
        }
      }

      return { output };
    }
  }

  // Common commands
  if (parts[0] === 'ping') {
    // Ping is handled separately with connectivity simulation
    return { output: `Pinging ${parts[1]}...` };
  }

  if (parts[0] === 'traceroute' || parts[0] === 'tracert') {
    return { output: `Tracing route to ${parts[1] || 'unknown'}...` };
  }

  if (cmd === 'help' || cmd === '?') {
    if (deviceType === 'pc') {
      return {
        output: `Available commands:\n  set ip <address> <mask> <gateway> - Configure IP\n  ipconfig - Show IP configuration\n  ping <address> - Test connectivity\n  tracert <address> - Trace route`,
      };
    }
    return {
      output: `Available commands:\n  enable - Enter privileged mode\n  show ip interface brief - Show interfaces\n  show ip route - Show routing table\n  show running-config - Show configuration\n  ping <address> - Test connectivity`,
    };
  }

  return { output: `Unknown command: ${command}` };
}
