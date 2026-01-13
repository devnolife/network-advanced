import { NextRequest, NextResponse } from 'next/server';

// Simulated device state storage (in production, use proper session/database)
const deviceStates = new Map<string, {
    mode: string;
    hostname: string;
    output: string[];
}>();

interface ExecuteRequest {
    deviceId: string;
    command: string;
    sessionId?: string;
}

// POST /api/device/execute - Execute command on a device
export async function POST(request: NextRequest) {
    try {
        const body: ExecuteRequest = await request.json();
        const { deviceId, command, sessionId } = body;

        if (!deviceId || !command) {
            return NextResponse.json(
                { error: 'deviceId and command are required' },
                { status: 400 }
            );
        }

        // Get or create device state
        const stateKey = `${sessionId || 'default'}-${deviceId}`;
        let state = deviceStates.get(stateKey);
        if (!state) {
            state = {
                mode: 'user',
                hostname: deviceId.toUpperCase(),
                output: [],
            };
            deviceStates.set(stateKey, state);
        }

        // Process command
        const result = processCommand(command, state);

        return NextResponse.json({
            success: result.success,
            output: result.output,
            error: result.error,
            prompt: getPrompt(state),
            mode: state.mode,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to execute command', details: String(error) },
            { status: 500 }
        );
    }
}

function processCommand(
    command: string,
    state: { mode: string; hostname: string; output: string[] }
): { success: boolean; output: string; error?: string } {
    const cmd = command.trim().toLowerCase();

    // Mode navigation commands
    if (cmd === 'enable') {
        if (state.mode === 'user') {
            state.mode = 'privileged';
            return { success: true, output: '' };
        }
        return { success: false, output: '', error: 'Already in privileged mode' };
    }

    if (cmd === 'disable') {
        state.mode = 'user';
        return { success: true, output: '' };
    }

    if (cmd === 'configure terminal' || cmd === 'conf t') {
        if (state.mode === 'privileged') {
            state.mode = 'config';
            return { success: true, output: 'Enter configuration commands, one per line.  End with CNTL/Z.' };
        }
        return { success: false, output: '', error: 'Must be in privileged mode' };
    }

    if (cmd === 'exit') {
        if (state.mode.includes('config-')) {
            state.mode = 'config';
        } else if (state.mode === 'config') {
            state.mode = 'privileged';
        } else if (state.mode === 'privileged') {
            state.mode = 'user';
        }
        return { success: true, output: '' };
    }

    if (cmd === 'end') {
        state.mode = 'privileged';
        return { success: true, output: '' };
    }

    // Config mode commands
    if (state.mode === 'config' || state.mode.startsWith('config-')) {
        if (cmd.startsWith('hostname ')) {
            state.hostname = cmd.split(' ')[1].toUpperCase();
            return { success: true, output: '' };
        }

        if (cmd.startsWith('interface') || cmd.startsWith('int ')) {
            state.mode = 'config-if';
            return { success: true, output: '' };
        }

        if (cmd.startsWith('crypto isakmp policy')) {
            state.mode = 'config-isakmp';
            return { success: true, output: '' };
        }

        if (cmd.startsWith('crypto map') && cmd.includes('ipsec-isakmp')) {
            state.mode = 'config-crypto-map';
            return { success: true, output: '' };
        }

        // Generic config commands that just acknowledge
        if (
            cmd.startsWith('encryption') ||
            cmd.startsWith('hash') ||
            cmd.startsWith('group') ||
            cmd.startsWith('lifetime') ||
            cmd.startsWith('authentication') ||
            cmd.startsWith('set peer') ||
            cmd.startsWith('set transform') ||
            cmd.startsWith('match address') ||
            cmd.startsWith('ip address') ||
            cmd === 'no shutdown' ||
            cmd.startsWith('crypto isakmp key') ||
            cmd.startsWith('crypto ipsec transform-set') ||
            cmd.startsWith('ip route') ||
            cmd.startsWith('access-list')
        ) {
            return { success: true, output: '✓ Configuration applied' };
        }
    }

    // Show commands
    if (cmd === 'show ip interface brief' || cmd === 'sh ip int br') {
        return {
            success: true,
            output: `Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.1.1.1        YES manual up                    up
GigabitEthernet0/1     192.168.1.1     YES manual up                    up
Tunnel0                10.10.10.1      YES manual up                    up`,
        };
    }

    if (cmd === 'show ip route') {
        return {
            success: true,
            output: `Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP

C    10.1.1.0/24 is directly connected, GigabitEthernet0/0
C    192.168.1.0/24 is directly connected, GigabitEthernet0/1
S    10.2.1.0/24 via 192.168.1.2`,
        };
    }

    if (cmd === 'show crypto isakmp sa') {
        return {
            success: true,
            output: `IPv4 Crypto ISAKMP SA
dst             src             state          conn-id status
192.168.2.1     192.168.1.1     QM_IDLE            1001 ACTIVE`,
        };
    }

    if (cmd === 'show crypto ipsec sa') {
        return {
            success: true,
            output: `interface: GigabitEthernet0/1
    Crypto map tag: MYMAP, local addr: 192.168.1.1

   protected vrf: (none)
   local  ident (addr/mask/prot/port): (10.1.1.0/255.255.255.0/0/0)
   remote ident (addr/mask/prot/port): (10.2.1.0/255.255.255.0/0/0)
   current_peer 192.168.2.1
    #pkts encaps: 847, #pkts encrypt: 847
    #pkts decaps: 842, #pkts decrypt: 842`,
        };
    }

    if (cmd === 'show version' || cmd === 'show ver') {
        return {
            success: true,
            output: `Network Security Virtual Lab Simulator
Version 1.0.0
Hostname: ${state.hostname}

Compiled with TypeScript for educational purposes.`,
        };
    }

    if (cmd === 'show running-config' || cmd === 'show run') {
        return {
            success: true,
            output: `Building configuration...

Current configuration:
!
hostname ${state.hostname}
!
interface GigabitEthernet0/0
 ip address 10.1.1.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/1
 ip address 192.168.1.1 255.255.255.0
 crypto map MYMAP
 no shutdown
!
end`,
        };
    }

    // Ping - accept both 'ping' alone and 'ping <destination>'
    if (cmd === 'ping') {
        return {
            success: false,
            output: '',
            error: `% Incomplete command. Usage: ping <destination-ip>`,
        };
    }

    if (cmd.startsWith('ping ')) {
        const dest = cmd.split(' ')[1] || '10.2.1.2';
        return {
            success: true,
            output: `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to ${dest}, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`,
        };
    }

    // Traceroute
    if (cmd.startsWith('traceroute ') || cmd.startsWith('tracert ')) {
        const dest = cmd.split(' ')[1] || '10.2.1.2';
        return {
            success: true,
            output: `Tracing route to ${dest} over a maximum of 30 hops:

  1    1 ms    1 ms    1 ms  10.1.1.1
  2    2 ms    2 ms    2 ms  192.168.1.1
  3    3 ms    3 ms    3 ms  ${dest}

Trace complete.`,
        };
    }

    // ipconfig (PC command)
    if (cmd === 'ipconfig' || cmd === 'ifconfig' || cmd === 'ip addr') {
        return {
            success: true,
            output: `Ethernet adapter eth0:

   Connection-specific DNS Suffix  . : localdomain
   IPv4 Address. . . . . . . . . . . : 10.1.1.2
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.1.1.1`,
        };
    }

    // arp (PC command)
    if (cmd === 'arp -a' || cmd === 'arp') {
        return {
            success: true,
            output: `Interface: 10.1.1.2 --- 0x1
  Internet Address      Physical Address      Type
  10.1.1.1              00-0c-29-ab-cd-ef     dynamic
  10.1.1.254            00-0c-29-12-34-56     dynamic
  10.2.1.2              00-0c-29-98-76-54     dynamic`,
        };
    }

    // Capture commands (for Lab 2)
    if (cmd === 'capture start') {
        return {
            success: true,
            output: `Packet capture started on interface eth0.
Output file: capture.pcap
Filter: none
Promiscuous mode: enabled`,
        };
    }

    if (cmd === 'capture stop') {
        return {
            success: true,
            output: `Packet capture stopped.
Packets captured: 42
File saved: capture.pcap`,
        };
    }

    // netstat (PC command)
    if (cmd === 'netstat' || cmd === 'netstat -an') {
        return {
            success: true,
            output: `Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    10.1.1.2:445           10.1.1.1:49152        ESTABLISHED
  TCP    10.1.1.2:80            0.0.0.0:0             LISTENING
  UDP    10.1.1.2:53            *:*                   `,
        };
    }

    // Help
    if (cmd === '?' || cmd === 'help') {
        return {
            success: true,
            output: `Available commands:
  enable              Enter privileged mode (Router)
  disable             Exit privileged mode (Router)
  configure terminal  Enter config mode (Router)
  show                Display system information
  ping <ip>           Send ICMP echo
  traceroute <ip>     Trace route to destination
  ipconfig            Display IP configuration (PC)
  arp -a              Display ARP table (PC)
  netstat             Display network statistics (PC)
  exit                Exit current mode
  help                Show this help`,
        };
    }

    if (cmd === '') {
        return { success: true, output: '' };
    }

    return {
        success: false,
        output: '',
        error: `% Unknown command or computer name: "${command}"`,
    };
}

function getPrompt(state: { mode: string; hostname: string }): string {
    switch (state.mode) {
        case 'user':
            return `${state.hostname}>`;
        case 'privileged':
            return `${state.hostname}#`;
        case 'config':
            return `${state.hostname}(config)#`;
        case 'config-if':
            return `${state.hostname}(config-if)#`;
        case 'config-isakmp':
            return `${state.hostname}(config-isakmp)#`;
        case 'config-crypto-map':
            return `${state.hostname}(config-crypto-map)#`;
        default:
            return `${state.hostname}>`;
    }
}
