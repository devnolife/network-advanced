// Network Capture utilities
// Utilities for packet parsing, filtering, stream tracking, and protocol decoding

// Packet Parser
export {
    parsePacket,
    generateSamplePackets,
    resetPacketCounter,
    type ParsePacketOptions,
} from './PacketParser';
export { default as PacketParser } from './PacketParser';

// Packet Capture Service
export {
    PacketCaptureService,
    getPacketCaptureService,
    captureSimulatorPacket,
    type PacketEventType,
    type PacketEvent,
    type CaptureFilterFn,
    type PacketEventListener,
    type CaptureServiceStats,
} from './PacketCaptureService';

// Filter Parser
export {
    FilterParser,
    CompiledFilter,
    FilterParseError,
    getFilterSuggestions,
    type FilterSuggestion,
    type FilterSyntaxHelp,
} from './FilterParser';

// Stream Tracker
export {
    StreamTracker,
    getStreamTracker,
    resetStreamTracker,
    type StreamKey,
    type StreamDirection,
    type StreamSegment,
    type StreamState,
    type StreamStatistics,
    type TCPStream,
    type StreamFilterOptions,
    type ReassemblyOptions,
} from './StreamTracker';

// Protocol Decoders
export {
    ProtocolDecoderManager,
    DNSDecoder,
    HTTPDecoder,
    DHCPDecoder,
    DNS_RECORD_TYPES,
    DNS_RCODES,
    DHCP_MESSAGE_TYPES,
    DHCP_OPTIONS,
    HTTP_METHODS,
    HTTP_STATUS_CODES,
    type DNSQuestion,
    type DNSAnswer,
    type DecodedDNS,
    type HTTPHeader,
    type DecodedHTTP,
    type DHCPOption,
    type DecodedDHCP,
} from './ProtocolDecoders';
