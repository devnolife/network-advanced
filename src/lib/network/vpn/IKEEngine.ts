/**
 * IKE Engine - Internet Key Exchange Protocol Simulation
 * 
 * Simulates IKEv2 negotiation for educational purposes.
 * Implements state machine, message generation, and SA management.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  IKEVersion,
  IKEState,
  IKEProposal,
  IKESA,
  IKEMessage,
  IKEv2MessageType,
  IKEPayload,
  IKEPayloadType,
  VPNEvent,
  VPNEventType,
  VPNConfig,
  IKE_PROPOSALS,
  IKEDHGroup,
} from './types';

// ============================================================================
// Types
// ============================================================================

type IKEEventCallback = (data: unknown) => void;

interface IKENegotiationContext {
  tunnelId: string;
  localIP: string;
  remoteIP: string;
  proposal: IKEProposal;
  psk: string;
  isInitiator: boolean;
}

interface DHKeyPair {
  privateKey: string;
  publicKey: string;
}

interface DerivedKeys {
  skD: string;
  skAi: string;
  skAr: string;
  skEi: string;
  skEr: string;
  skPi: string;
  skPr: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: VPNConfig = {
  ikeVersion: 'ikev2',
  ikeMode: 'main',
  ikeLifetime: 28800, // 8 hours
  ipsecProtocol: 'esp',
  ipsecMode: 'tunnel',
  ipsecLifetime: 3600, // 1 hour
  enablePFS: true,
  pfsGroup: 'group14',
  enableDPD: true,
  dpdInterval: 30,
  enableNATT: true,
  enableAntiReplay: true,
  replayWindowSize: 64,
  logLevel: 'info',
  logIKEMessages: true,
  logESPPackets: false,
};

// DH Group bit lengths for simulation
const DH_GROUP_BITS: Record<IKEDHGroup, number> = {
  'group1': 768,
  'group2': 1024,
  'group5': 1536,
  'group14': 2048,
  'group15': 3072,
  'group16': 4096,
  'group19': 256,
  'group20': 384,
  'group21': 521,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ike-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSPI(): string {
  // Generate 8-byte SPI as hex string
  const bytes = new Array(8);
  for (let i = 0; i < 8; i++) {
    bytes[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return bytes.join('');
}

function generateNonce(): string {
  // Generate 32-byte nonce as hex string
  const bytes = new Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return bytes.join('');
}

function generateKey(bits: number): string {
  // Generate random key of specified bit length as hex string
  const bytes = Math.ceil(bits / 8);
  const key = new Array(bytes);
  for (let i = 0; i < bytes; i++) {
    key[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return key.join('');
}

function simulateDHKeyPair(group: IKEDHGroup): DHKeyPair {
  // Simulate DH key pair generation
  const bits = DH_GROUP_BITS[group];
  return {
    privateKey: generateKey(bits),
    publicKey: generateKey(bits),
  };
}

function simulateDHSharedSecret(group: IKEDHGroup): string {
  // Simulate DH shared secret computation
  const bits = DH_GROUP_BITS[group];
  return generateKey(bits);
}

function deriveKeys(sharedSecret: string, proposal: IKEProposal): DerivedKeys {
  // Simulate key derivation (SKEYSEED -> SK_d, SK_ai, SK_ar, etc.)
  // In reality, this uses PRF with nonces and SPIs
  const keyLength = proposal.encryption.includes('256') ? 256 : 
                    proposal.encryption.includes('192') ? 192 : 128;
  
  return {
    skD: generateKey(keyLength),
    skAi: generateKey(160), // SHA-1 output
    skAr: generateKey(160),
    skEi: generateKey(keyLength),
    skEr: generateKey(keyLength),
    skPi: generateKey(160),
    skPr: generateKey(160),
  };
}

// ============================================================================
// IKE Engine Class
// ============================================================================

export class IKEEngine extends EventEmitter {
  private config: VPNConfig;
  private ikeSAs: Map<string, IKESA> = new Map();
  private negotiations: Map<string, IKENegotiationContext> = new Map();
  private messages: IKEMessage[] = [];
  private events: VPNEvent[] = [];
  private messageIdCounter: Map<string, number> = new Map();
  private isRunning: boolean = false;
  
  // Timers for DPD and rekey
  private dpdTimers: Map<string, NodeJS.Timeout> = new Map();
  private rekeyTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Statistics
  private stats = {
    negotiationsStarted: 0,
    negotiationsCompleted: 0,
    negotiationsFailed: 0,
    messagesExchanged: 0,
    rekeyOperations: 0,
  };

  constructor(config: Partial<VPNConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  updateConfig(config: Partial<VPNConfig>): void {
    this.config = { ...this.config, ...config };
    this.emitEvent('info', 'config_updated', 'IKE configuration updated');
  }

  getConfig(): VPNConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // SA Management
  // ==========================================================================

  getSA(saId: string): IKESA | undefined {
    return this.ikeSAs.get(saId);
  }

  getAllSAs(): IKESA[] {
    return Array.from(this.ikeSAs.values());
  }

  getActiveSAs(): IKESA[] {
    return Array.from(this.ikeSAs.values()).filter(sa => sa.state === 'established');
  }

  getSABySPI(initiatorSPI: string, responderSPI?: string): IKESA | undefined {
    for (const sa of this.ikeSAs.values()) {
      if (sa.initiatorSPI === initiatorSPI) {
        if (!responderSPI || sa.responderSPI === responderSPI) {
          return sa;
        }
      }
    }
    return undefined;
  }

  // ==========================================================================
  // IKE Negotiation - Initiator
  // ==========================================================================

  async initiateNegotiation(
    tunnelId: string,
    localIP: string,
    remoteIP: string,
    proposal: IKEProposal,
    psk: string
  ): Promise<IKESA> {
    this.stats.negotiationsStarted++;
    
    // Create negotiation context
    const context: IKENegotiationContext = {
      tunnelId,
      localIP,
      remoteIP,
      proposal,
      psk,
      isInitiator: true,
    };
    
    // Create initial IKE SA
    const initiatorSPI = generateSPI();
    const sa: IKESA = {
      id: generateId(),
      version: this.config.ikeVersion,
      initiatorSPI,
      responderSPI: '', // Will be filled by responder
      localIP,
      remoteIP,
      state: 'initiating',
      createdAt: Date.now(),
      expiresAt: Date.now() + (proposal.lifetime * 1000),
      lastActivity: Date.now(),
      childSAs: [],
      packetsIn: 0,
      packetsOut: 0,
      bytesIn: 0,
      bytesOut: 0,
    };
    
    this.ikeSAs.set(sa.id, sa);
    this.negotiations.set(sa.id, context);
    this.messageIdCounter.set(sa.id, 0);
    
    this.emitVPNEvent('tunnel_initiating', tunnelId, 'Starting IKE negotiation', {
      localIP,
      remoteIP,
      proposal: proposal.name,
    });
    
    // Step 1: Send IKE_SA_INIT
    await this.sendIKESAInit(sa, context);
    
    return sa;
  }

  private async sendIKESAInit(sa: IKESA, context: IKENegotiationContext): Promise<void> {
    // Generate DH key pair
    const dhKeyPair = simulateDHKeyPair(context.proposal.dhGroup);
    const nonce = generateNonce();
    
    // Build IKE_SA_INIT message
    const message: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'IKE_SA_INIT',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: '',
      isRequest: true,
      messageId: this.getNextMessageId(sa.id),
      payloads: [
        {
          type: 'SA',
          data: {
            proposals: [{
              id: 1,
              encryption: context.proposal.encryption,
              hash: context.proposal.hash,
              dhGroup: context.proposal.dhGroup,
              authMethod: context.proposal.authMethod,
            }],
          },
          description: 'Security Association Proposal',
        },
        {
          type: 'KE',
          data: {
            dhGroup: context.proposal.dhGroup,
            publicKey: dhKeyPair.publicKey,
          },
          description: `Key Exchange (${context.proposal.dhGroup})`,
        },
        {
          type: 'NONCE',
          data: {
            nonce,
          },
          description: 'Initiator Nonce (Ni)',
        },
      ],
      direction: 'sent',
      sourceIP: context.localIP,
      destIP: context.remoteIP,
    };
    
    this.addMessage(message);
    this.updateSAState(sa.id, 'sa_init_sent');
    
    this.emitVPNEvent('ike_sa_init_sent', context.tunnelId, 
      'IKE_SA_INIT request sent', { messageId: message.id });
    
    // Simulate response delay
    await this.delay(100 + Math.random() * 200);
    
    // Simulate receiving response
    await this.simulateIKESAInitResponse(sa, context, dhKeyPair, nonce);
  }

  private async simulateIKESAInitResponse(
    sa: IKESA,
    context: IKENegotiationContext,
    initiatorDH: DHKeyPair,
    initiatorNonce: string
  ): Promise<void> {
    // Simulate responder's IKE_SA_INIT response
    const responderSPI = generateSPI();
    const responderDH = simulateDHKeyPair(context.proposal.dhGroup);
    const responderNonce = generateNonce();
    
    const response: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'IKE_SA_INIT',
      initiatorSPI: sa.initiatorSPI,
      responderSPI,
      isRequest: false,
      messageId: 0,
      payloads: [
        {
          type: 'SA',
          data: {
            proposals: [{
              id: 1,
              encryption: context.proposal.encryption,
              hash: context.proposal.hash,
              dhGroup: context.proposal.dhGroup,
              authMethod: context.proposal.authMethod,
            }],
          },
          description: 'Accepted Security Association',
        },
        {
          type: 'KE',
          data: {
            dhGroup: context.proposal.dhGroup,
            publicKey: responderDH.publicKey,
          },
          description: `Key Exchange (${context.proposal.dhGroup})`,
        },
        {
          type: 'NONCE',
          data: {
            nonce: responderNonce,
          },
          description: 'Responder Nonce (Nr)',
        },
      ],
      direction: 'received',
      sourceIP: context.remoteIP,
      destIP: context.localIP,
    };
    
    this.addMessage(response);
    
    // Update SA with responder SPI
    sa.responderSPI = responderSPI;
    this.updateSAState(sa.id, 'sa_init_received');
    
    this.emitVPNEvent('ike_sa_init_received', context.tunnelId,
      'IKE_SA_INIT response received', { messageId: response.id });
    
    // Derive keys from DH exchange
    const sharedSecret = simulateDHSharedSecret(context.proposal.dhGroup);
    const derivedKeys = deriveKeys(sharedSecret, context.proposal);
    
    // Store keys in SA
    sa.skD = derivedKeys.skD;
    sa.skAi = derivedKeys.skAi;
    sa.skAr = derivedKeys.skAr;
    sa.skEi = derivedKeys.skEi;
    sa.skEr = derivedKeys.skEr;
    sa.skPi = derivedKeys.skPi;
    sa.skPr = derivedKeys.skPr;
    
    // Proceed to IKE_AUTH
    await this.delay(50 + Math.random() * 100);
    await this.sendIKEAuth(sa, context);
  }

  private async sendIKEAuth(sa: IKESA, context: IKENegotiationContext): Promise<void> {
    // Build IKE_AUTH message (encrypted)
    const message: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'IKE_AUTH',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: true,
      messageId: this.getNextMessageId(sa.id),
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted Payload Container',
        },
        {
          type: 'IDi',
          data: {
            type: 'ID_IPV4_ADDR',
            value: context.localIP,
          },
          description: 'Initiator Identity',
        },
        {
          type: 'AUTH',
          data: {
            method: context.proposal.authMethod,
            data: generateKey(160), // Simulated AUTH data
          },
          description: `Authentication (${context.proposal.authMethod.toUpperCase()})`,
        },
        {
          type: 'SA',
          data: {
            protocol: 'esp',
            spi: generateSPI().substring(0, 8),
          },
          description: 'Child SA Proposal (ESP)',
        },
        {
          type: 'TSi',
          data: {
            selectors: [{
              type: 'TS_IPV4_ADDR_RANGE',
              startAddr: '0.0.0.0',
              endAddr: '255.255.255.255',
              protocol: 0,
              startPort: 0,
              endPort: 65535,
            }],
          },
          description: 'Traffic Selector - Initiator',
        },
        {
          type: 'TSr',
          data: {
            selectors: [{
              type: 'TS_IPV4_ADDR_RANGE',
              startAddr: '0.0.0.0',
              endAddr: '255.255.255.255',
              protocol: 0,
              startPort: 0,
              endPort: 65535,
            }],
          },
          description: 'Traffic Selector - Responder',
        },
      ],
      direction: 'sent',
      sourceIP: context.localIP,
      destIP: context.remoteIP,
    };
    
    this.addMessage(message);
    this.updateSAState(sa.id, 'auth_sent');
    
    this.emitVPNEvent('ike_auth_sent', context.tunnelId,
      'IKE_AUTH request sent (encrypted)', { messageId: message.id });
    
    // Simulate response delay
    await this.delay(100 + Math.random() * 200);
    
    // Simulate receiving AUTH response
    await this.simulateIKEAuthResponse(sa, context);
  }

  private async simulateIKEAuthResponse(sa: IKESA, context: IKENegotiationContext): Promise<void> {
    const response: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'IKE_AUTH',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: false,
      messageId: 1,
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted Payload Container',
        },
        {
          type: 'IDr',
          data: {
            type: 'ID_IPV4_ADDR',
            value: context.remoteIP,
          },
          description: 'Responder Identity',
        },
        {
          type: 'AUTH',
          data: {
            method: context.proposal.authMethod,
            data: generateKey(160),
          },
          description: `Authentication (${context.proposal.authMethod.toUpperCase()})`,
        },
        {
          type: 'SA',
          data: {
            protocol: 'esp',
            spi: generateSPI().substring(0, 8),
          },
          description: 'Accepted Child SA (ESP)',
        },
        {
          type: 'TSi',
          data: {
            selectors: [{
              type: 'TS_IPV4_ADDR_RANGE',
              startAddr: '0.0.0.0',
              endAddr: '255.255.255.255',
            }],
          },
          description: 'Traffic Selector - Initiator (Accepted)',
        },
        {
          type: 'TSr',
          data: {
            selectors: [{
              type: 'TS_IPV4_ADDR_RANGE',
              startAddr: '0.0.0.0',
              endAddr: '255.255.255.255',
            }],
          },
          description: 'Traffic Selector - Responder (Accepted)',
        },
      ],
      direction: 'received',
      sourceIP: context.remoteIP,
      destIP: context.localIP,
    };
    
    this.addMessage(response);
    this.updateSAState(sa.id, 'auth_received');
    
    this.emitVPNEvent('ike_auth_received', context.tunnelId,
      'IKE_AUTH response received - Authentication successful', { messageId: response.id });
    
    // SA is now established
    await this.delay(50);
    this.completeNegotiation(sa, context);
  }

  private completeNegotiation(sa: IKESA, context: IKENegotiationContext): void {
    sa.proposal = context.proposal;
    this.updateSAState(sa.id, 'established');
    this.stats.negotiationsCompleted++;
    
    this.emitVPNEvent('ike_sa_established', context.tunnelId,
      `IKE SA established - ${context.proposal.name}`, {
        saId: sa.id,
        initiatorSPI: sa.initiatorSPI,
        responderSPI: sa.responderSPI,
        encryption: context.proposal.encryption,
        hash: context.proposal.hash,
        dhGroup: context.proposal.dhGroup,
      });
    
    // Setup DPD timer if enabled
    if (this.config.enableDPD) {
      this.startDPDTimer(sa.id, context.tunnelId);
    }
    
    // Setup rekey timer
    const rekeyTime = (context.proposal.lifetime * 0.9) * 1000; // 90% of lifetime
    this.startRekeyTimer(sa.id, context.tunnelId, rekeyTime);
    
    // Clean up negotiation context
    this.negotiations.delete(sa.id);
    
    // Emit completion event
    this.emit('negotiationComplete', {
      saId: sa.id,
      tunnelId: context.tunnelId,
      sa,
    });
  }

  // ==========================================================================
  // Rekey and DPD
  // ==========================================================================

  private startDPDTimer(saId: string, tunnelId: string): void {
    const timer = setInterval(() => {
      const sa = this.ikeSAs.get(saId);
      if (!sa || sa.state !== 'established') {
        this.stopDPDTimer(saId);
        return;
      }
      
      this.sendDPD(sa, tunnelId);
    }, this.config.dpdInterval * 1000);
    
    this.dpdTimers.set(saId, timer);
  }

  private stopDPDTimer(saId: string): void {
    const timer = this.dpdTimers.get(saId);
    if (timer) {
      clearInterval(timer);
      this.dpdTimers.delete(saId);
    }
  }

  private sendDPD(sa: IKESA, tunnelId: string): void {
    const message: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'INFORMATIONAL',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: true,
      messageId: this.getNextMessageId(sa.id),
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted (Empty payload for DPD)',
        },
      ],
      direction: 'sent',
      sourceIP: sa.localIP,
      destIP: sa.remoteIP,
    };
    
    this.addMessage(message);
    sa.lastActivity = Date.now();
    
    this.emitVPNEvent('dpd_sent', tunnelId, 'Dead Peer Detection probe sent', {
      saId: sa.id,
    });
    
    // Simulate DPD response
    setTimeout(() => {
      const response: IKEMessage = {
        id: generateId(),
        timestamp: Date.now(),
        version: this.config.ikeVersion,
        messageType: 'INFORMATIONAL',
        initiatorSPI: sa.initiatorSPI,
        responderSPI: sa.responderSPI,
        isRequest: false,
        messageId: message.messageId,
        payloads: [
          {
            type: 'SK',
            data: { encrypted: true },
            description: 'Encrypted (DPD Response)',
          },
        ],
        direction: 'received',
        sourceIP: sa.remoteIP,
        destIP: sa.localIP,
      };
      
      this.addMessage(response);
      
      this.emitVPNEvent('dpd_received', tunnelId, 'Dead Peer Detection response received', {
        saId: sa.id,
      });
    }, 50 + Math.random() * 100);
  }

  private startRekeyTimer(saId: string, tunnelId: string, delay: number): void {
    const timer = setTimeout(() => {
      const sa = this.ikeSAs.get(saId);
      if (sa && sa.state === 'established') {
        this.initiateRekey(sa, tunnelId);
      }
    }, delay);
    
    this.rekeyTimers.set(saId, timer);
  }

  private stopRekeyTimer(saId: string): void {
    const timer = this.rekeyTimers.get(saId);
    if (timer) {
      clearTimeout(timer);
      this.rekeyTimers.delete(saId);
    }
  }

  async initiateRekey(sa: IKESA, tunnelId: string): Promise<void> {
    if (sa.state !== 'established') return;
    
    this.updateSAState(sa.id, 'rekeying');
    this.stats.rekeyOperations++;
    
    this.emitVPNEvent('rekey_initiated', tunnelId, 'IKE SA rekey initiated', {
      saId: sa.id,
    });
    
    // Send CREATE_CHILD_SA for rekey
    const message: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'CREATE_CHILD_SA',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: true,
      messageId: this.getNextMessageId(sa.id),
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted Payload',
        },
        {
          type: 'SA',
          data: {
            proposals: [{
              id: 1,
              encryption: sa.proposal?.encryption,
              hash: sa.proposal?.hash,
              dhGroup: sa.proposal?.dhGroup,
            }],
          },
          description: 'New IKE SA Proposal',
        },
        {
          type: 'NONCE',
          data: { nonce: generateNonce() },
          description: 'Initiator Nonce',
        },
        {
          type: 'KE',
          data: {
            dhGroup: sa.proposal?.dhGroup,
            publicKey: generateKey(DH_GROUP_BITS[sa.proposal?.dhGroup || 'group14']),
          },
          description: 'Key Exchange',
        },
      ],
      direction: 'sent',
      sourceIP: sa.localIP,
      destIP: sa.remoteIP,
    };
    
    this.addMessage(message);
    
    // Simulate rekey completion
    await this.delay(200 + Math.random() * 300);
    
    // Simulate response
    const response: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'CREATE_CHILD_SA',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: false,
      messageId: message.messageId,
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted Payload',
        },
        {
          type: 'SA',
          data: { accepted: true },
          description: 'Accepted SA',
        },
        {
          type: 'NONCE',
          data: { nonce: generateNonce() },
          description: 'Responder Nonce',
        },
        {
          type: 'KE',
          data: {
            dhGroup: sa.proposal?.dhGroup,
            publicKey: generateKey(DH_GROUP_BITS[sa.proposal?.dhGroup || 'group14']),
          },
          description: 'Key Exchange',
        },
      ],
      direction: 'received',
      sourceIP: sa.remoteIP,
      destIP: sa.localIP,
    };
    
    this.addMessage(response);
    
    // Generate new keys
    const newKeys = deriveKeys(
      simulateDHSharedSecret(sa.proposal?.dhGroup || 'group14'),
      sa.proposal || IKE_PROPOSALS.balanced
    );
    
    sa.skD = newKeys.skD;
    sa.skAi = newKeys.skAi;
    sa.skAr = newKeys.skAr;
    sa.skEi = newKeys.skEi;
    sa.skEr = newKeys.skEr;
    sa.skPi = newKeys.skPi;
    sa.skPr = newKeys.skPr;
    
    // Update expiration
    sa.expiresAt = Date.now() + (sa.proposal?.lifetime || 28800) * 1000;
    
    this.updateSAState(sa.id, 'established');
    
    this.emitVPNEvent('rekey_completed', tunnelId, 'IKE SA rekey completed - New keys in use', {
      saId: sa.id,
      newExpiration: new Date(sa.expiresAt).toISOString(),
    });
    
    // Reset rekey timer
    const rekeyTime = ((sa.proposal?.lifetime || 28800) * 0.9) * 1000;
    this.startRekeyTimer(sa.id, tunnelId, rekeyTime);
    
    this.emit('rekeyComplete', { saId: sa.id, tunnelId });
  }

  // ==========================================================================
  // SA Deletion
  // ==========================================================================

  async deleteSA(saId: string, tunnelId: string): Promise<void> {
    const sa = this.ikeSAs.get(saId);
    if (!sa) return;
    
    this.updateSAState(saId, 'deleting');
    
    // Send DELETE notification
    const message: IKEMessage = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.config.ikeVersion,
      messageType: 'INFORMATIONAL',
      initiatorSPI: sa.initiatorSPI,
      responderSPI: sa.responderSPI,
      isRequest: true,
      messageId: this.getNextMessageId(saId),
      payloads: [
        {
          type: 'SK',
          data: { encrypted: true },
          description: 'Encrypted Payload',
        },
        {
          type: 'D',
          data: {
            protocolId: 1, // IKE
            spiCount: 0,
          },
          description: 'Delete IKE SA',
        },
      ],
      direction: 'sent',
      sourceIP: sa.localIP,
      destIP: sa.remoteIP,
    };
    
    this.addMessage(message);
    
    this.emitVPNEvent('tunnel_down', tunnelId, 'IKE SA deletion initiated', {
      saId: sa.id,
    });
    
    // Stop timers
    this.stopDPDTimer(saId);
    this.stopRekeyTimer(saId);
    
    // Clean up
    this.ikeSAs.delete(saId);
    this.negotiations.delete(saId);
    this.messageIdCounter.delete(saId);
    
    this.emit('saDeleted', { saId, tunnelId });
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  private addMessage(message: IKEMessage): void {
    this.messages.push(message);
    this.stats.messagesExchanged++;
    
    // Keep only last 1000 messages
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    
    if (this.config.logIKEMessages) {
      this.emit('message', message);
    }
  }

  getMessages(saId?: string): IKEMessage[] {
    if (!saId) return [...this.messages];
    
    return this.messages.filter(m => 
      m.initiatorSPI === this.ikeSAs.get(saId)?.initiatorSPI
    );
  }

  getRecentMessages(count: number = 50): IKEMessage[] {
    return this.messages.slice(-count);
  }

  private getNextMessageId(saId: string): number {
    const current = this.messageIdCounter.get(saId) || 0;
    const next = current + 1;
    this.messageIdCounter.set(saId, next);
    return current;
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private updateSAState(saId: string, state: IKEState): void {
    const sa = this.ikeSAs.get(saId);
    if (sa) {
      sa.state = state;
      sa.lastActivity = Date.now();
      this.emit('stateChange', { saId, state });
    }
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  private emitVPNEvent(
    type: VPNEventType,
    tunnelId: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: VPNEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      tunnelId,
      message,
      details,
      severity: this.getSeverityForEvent(type),
    };
    
    this.events.push(event);
    
    // Keep only last 500 events
    if (this.events.length > 500) {
      this.events = this.events.slice(-500);
    }
    
    this.emit('event', event);
  }

  private getSeverityForEvent(type: VPNEventType): 'info' | 'warning' | 'error' {
    switch (type) {
      case 'auth_failed':
      case 'replay_detected':
      case 'error':
        return 'error';
      case 'tunnel_down':
      case 'rekey_initiated':
        return 'warning';
      default:
        return 'info';
    }
  }

  private emitEvent(
    severity: 'info' | 'warning' | 'error',
    type: string,
    message: string
  ): void {
    this.emit('log', { severity, type, message, timestamp: Date.now() });
  }

  getEvents(tunnelId?: string): VPNEvent[] {
    if (!tunnelId) return [...this.events];
    return this.events.filter(e => e.tunnelId === tunnelId);
  }

  getRecentEvents(count: number = 50): VPNEvent[] {
    return this.events.slice(-count);
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  getStatistics() {
    return {
      ...this.stats,
      activeSAs: this.getActiveSAs().length,
      totalSAs: this.ikeSAs.size,
      totalMessages: this.messages.length,
      totalEvents: this.events.length,
    };
  }

  resetStatistics(): void {
    this.stats = {
      negotiationsStarted: 0,
      negotiationsCompleted: 0,
      negotiationsFailed: 0,
      messagesExchanged: 0,
      rekeyOperations: 0,
    };
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    // Stop all timers
    for (const saId of this.dpdTimers.keys()) {
      this.stopDPDTimer(saId);
    }
    for (const saId of this.rekeyTimers.keys()) {
      this.stopRekeyTimer(saId);
    }
    
    this.isRunning = false;
    this.emit('stopped');
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.ikeSAs.clear();
    this.negotiations.clear();
    this.messages = [];
    this.events = [];
    this.messageIdCounter.clear();
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ikeEngineInstance: IKEEngine | null = null;

export function getIKEEngine(): IKEEngine {
  if (!ikeEngineInstance) {
    ikeEngineInstance = new IKEEngine();
  }
  return ikeEngineInstance;
}

export function resetIKEEngine(): void {
  if (ikeEngineInstance) {
    ikeEngineInstance.destroy();
    ikeEngineInstance = null;
  }
}
