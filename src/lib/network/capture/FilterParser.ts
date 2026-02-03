// FilterParser - Wireshark-style display filter expression parser
// Supports expressions like: tcp.port == 80, ip.src == 192.168.1.1 && tcp, udp || icmp

import type { CapturedPacketDetail, CaptureProtocol } from '@/store/packetCaptureStore';

/**
 * Token types for lexical analysis
 */
type TokenType =
    | 'IDENTIFIER'   // field name or protocol
    | 'NUMBER'       // numeric value
    | 'STRING'       // string value
    | 'OPERATOR'     // ==, !=, >, <, >=, <=
    | 'LOGICAL'      // &&, ||, !
    | 'LPAREN'       // (
    | 'RPAREN'       // )
    | 'CONTAINS'     // contains keyword
    | 'EOF';

/**
 * Token structure
 */
interface Token {
    type: TokenType;
    value: string;
    position: number;
}

/**
 * AST Node types
 */
type ASTNodeType =
    | 'BinaryExpression'
    | 'UnaryExpression'
    | 'ComparisonExpression'
    | 'Identifier'
    | 'Literal'
    | 'ProtocolCheck';

/**
 * AST Node structure
 */
interface ASTNode {
    type: ASTNodeType;
    operator?: string;
    left?: ASTNode;
    right?: ASTNode;
    operand?: ASTNode;
    value?: string | number | boolean;
    field?: string;
    protocol?: string;
}

/**
 * Filter field definitions
 */
const FILTER_FIELDS = {
    // IP fields
    'ip.src': (p: CapturedPacketDetail) => p.ip?.sourceIP?.toString() ?? '',
    'ip.dst': (p: CapturedPacketDetail) => p.ip?.destinationIP?.toString() ?? '',
    'ip.addr': (p: CapturedPacketDetail) => `${p.ip?.sourceIP?.toString() ?? ''} ${p.ip?.destinationIP?.toString() ?? ''}`,
    'ip.proto': (p: CapturedPacketDetail) => p.ip?.protocol ?? 0,
    'ip.ttl': (p: CapturedPacketDetail) => p.ip?.ttl ?? 0,
    'ip.len': (p: CapturedPacketDetail) => p.ip?.totalLength ?? 0,
    'ip.id': (p: CapturedPacketDetail) => p.ip?.identification ?? 0,
    
    // TCP fields
    'tcp.srcport': (p: CapturedPacketDetail) => p.tcp?.sourcePort ?? 0,
    'tcp.dstport': (p: CapturedPacketDetail) => p.tcp?.destinationPort ?? 0,
    'tcp.port': (p: CapturedPacketDetail) => `${p.tcp?.sourcePort ?? ''} ${p.tcp?.destinationPort ?? ''}`,
    'tcp.seq': (p: CapturedPacketDetail) => p.tcp?.sequenceNumber ?? 0,
    'tcp.ack': (p: CapturedPacketDetail) => p.tcp?.acknowledgmentNumber ?? 0,
    'tcp.flags': (p: CapturedPacketDetail) => {
        if (!p.tcp?.flags) return '';
        const flags: string[] = [];
        if (p.tcp.flags.syn) flags.push('SYN');
        if (p.tcp.flags.ack) flags.push('ACK');
        if (p.tcp.flags.fin) flags.push('FIN');
        if (p.tcp.flags.rst) flags.push('RST');
        if (p.tcp.flags.psh) flags.push('PSH');
        if (p.tcp.flags.urg) flags.push('URG');
        return flags.join(',');
    },
    'tcp.flags.syn': (p: CapturedPacketDetail) => p.tcp?.flags?.syn ?? false,
    'tcp.flags.ack': (p: CapturedPacketDetail) => p.tcp?.flags?.ack ?? false,
    'tcp.flags.fin': (p: CapturedPacketDetail) => p.tcp?.flags?.fin ?? false,
    'tcp.flags.rst': (p: CapturedPacketDetail) => p.tcp?.flags?.rst ?? false,
    'tcp.flags.psh': (p: CapturedPacketDetail) => p.tcp?.flags?.psh ?? false,
    'tcp.flags.urg': (p: CapturedPacketDetail) => p.tcp?.flags?.urg ?? false,
    'tcp.window': (p: CapturedPacketDetail) => p.tcp?.window ?? 0,
    
    // UDP fields
    'udp.srcport': (p: CapturedPacketDetail) => p.udp?.sourcePort ?? 0,
    'udp.dstport': (p: CapturedPacketDetail) => p.udp?.destinationPort ?? 0,
    'udp.port': (p: CapturedPacketDetail) => `${p.udp?.sourcePort ?? ''} ${p.udp?.destinationPort ?? ''}`,
    'udp.length': (p: CapturedPacketDetail) => p.udp?.length ?? 0,
    
    // ICMP fields
    'icmp.type': (p: CapturedPacketDetail) => p.icmp?.type ?? 0,
    'icmp.code': (p: CapturedPacketDetail) => p.icmp?.code ?? 0,
    
    // ARP fields
    'arp.opcode': (p: CapturedPacketDetail) => p.arp?.opcode ?? 0,
    'arp.src.hw_mac': (p: CapturedPacketDetail) => p.arp?.senderMAC?.toString() ?? '',
    'arp.dst.hw_mac': (p: CapturedPacketDetail) => p.arp?.targetMAC?.toString() ?? '',
    'arp.src.proto_ipv4': (p: CapturedPacketDetail) => p.arp?.senderIP?.toString() ?? '',
    'arp.dst.proto_ipv4': (p: CapturedPacketDetail) => p.arp?.targetIP?.toString() ?? '',
    
    // Ethernet fields
    'eth.src': (p: CapturedPacketDetail) => p.ethernet?.sourceMAC ?? '',
    'eth.dst': (p: CapturedPacketDetail) => p.ethernet?.destinationMAC ?? '',
    'eth.type': (p: CapturedPacketDetail) => p.ethernet?.etherType ?? 0,
    
    // ESP/AH fields
    'esp.spi': (p: CapturedPacketDetail) => p.esp?.spi ?? 0,
    'ah.spi': (p: CapturedPacketDetail) => p.ah?.spi ?? 0,
    
    // Frame fields
    'frame.len': (p: CapturedPacketDetail) => p.length,
    'frame.number': (p: CapturedPacketDetail) => p.number,
    'frame.time': (p: CapturedPacketDetail) => p.timestamp,
    
    // General
    'protocol': (p: CapturedPacketDetail) => p.protocol,
    'info': (p: CapturedPacketDetail) => p.info,
} as const;

/**
 * Protocol detection
 */
const PROTOCOL_CHECKS: Record<string, (p: CapturedPacketDetail) => boolean> = {
    'tcp': (p) => p.protocol === 'tcp' || !!p.tcp,
    'udp': (p) => p.protocol === 'udp' || !!p.udp,
    'icmp': (p) => p.protocol === 'icmp' || !!p.icmp,
    'arp': (p) => p.protocol === 'arp' || !!p.arp,
    'ip': (p) => !!p.ip,
    'ipv4': (p) => !!p.ip,
    'eth': (p) => !!p.ethernet,
    'ethernet': (p) => !!p.ethernet,
    'dns': (p) => p.protocol === 'dns' || (p.udp?.sourcePort === 53 || p.udp?.destinationPort === 53),
    'http': (p) => p.protocol === 'http' || (p.tcp?.sourcePort === 80 || p.tcp?.destinationPort === 80),
    'https': (p) => p.protocol === 'https' || (p.tcp?.sourcePort === 443 || p.tcp?.destinationPort === 443),
    'ssh': (p) => p.protocol === 'ssh' || (p.tcp?.sourcePort === 22 || p.tcp?.destinationPort === 22),
    'telnet': (p) => p.protocol === 'telnet' || (p.tcp?.sourcePort === 23 || p.tcp?.destinationPort === 23),
    'dhcp': (p) => p.protocol === 'dhcp' || (p.udp?.sourcePort === 67 || p.udp?.destinationPort === 67 || p.udp?.sourcePort === 68 || p.udp?.destinationPort === 68),
    'esp': (p) => p.protocol === 'esp' || !!p.esp,
    'ah': (p) => p.protocol === 'ah' || !!p.ah,
    'ipsec': (p) => !!p.esp || !!p.ah,
    'isakmp': (p) => p.protocol === 'isakmp',
};

/**
 * Parse error
 */
export class FilterParseError extends Error {
    position: number;
    
    constructor(message: string, position: number) {
        super(`Filter parse error at position ${position}: ${message}`);
        this.name = 'FilterParseError';
        this.position = position;
    }
}

/**
 * Lexer - tokenizes the filter expression
 */
class Lexer {
    private input: string;
    private position: number = 0;
    private tokens: Token[] = [];
    
    constructor(input: string) {
        this.input = input.trim();
    }
    
    tokenize(): Token[] {
        while (this.position < this.input.length) {
            this.skipWhitespace();
            if (this.position >= this.input.length) break;
            
            const char = this.input[this.position];
            
            if (char === '(') {
                this.tokens.push({ type: 'LPAREN', value: '(', position: this.position });
                this.position++;
            } else if (char === ')') {
                this.tokens.push({ type: 'RPAREN', value: ')', position: this.position });
                this.position++;
            } else if (char === '!' && this.input[this.position + 1] !== '=') {
                this.tokens.push({ type: 'LOGICAL', value: '!', position: this.position });
                this.position++;
            } else if (char === '&' && this.input[this.position + 1] === '&') {
                this.tokens.push({ type: 'LOGICAL', value: '&&', position: this.position });
                this.position += 2;
            } else if (char === '|' && this.input[this.position + 1] === '|') {
                this.tokens.push({ type: 'LOGICAL', value: '||', position: this.position });
                this.position += 2;
            } else if (this.isOperatorStart(char)) {
                this.readOperator();
            } else if (char === '"' || char === "'") {
                this.readString(char);
            } else if (this.isDigit(char)) {
                this.readNumber();
            } else if (this.isIdentifierStart(char)) {
                this.readIdentifier();
            } else {
                throw new FilterParseError(`Unexpected character: ${char}`, this.position);
            }
        }
        
        this.tokens.push({ type: 'EOF', value: '', position: this.position });
        return this.tokens;
    }
    
    private skipWhitespace(): void {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }
    
    private isOperatorStart(char: string): boolean {
        return ['=', '!', '>', '<'].includes(char);
    }
    
    private isDigit(char: string): boolean {
        return /[0-9]/.test(char);
    }
    
    private isIdentifierStart(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }
    
    private isIdentifierPart(char: string): boolean {
        return /[a-zA-Z0-9_.]/.test(char);
    }
    
    private readOperator(): void {
        const start = this.position;
        let operator = this.input[this.position];
        this.position++;
        
        if (this.position < this.input.length) {
            const next = this.input[this.position];
            if (next === '=') {
                operator += next;
                this.position++;
            }
        }
        
        this.tokens.push({ type: 'OPERATOR', value: operator, position: start });
    }
    
    private readString(quote: string): void {
        const start = this.position;
        this.position++; // Skip opening quote
        
        let value = '';
        while (this.position < this.input.length && this.input[this.position] !== quote) {
            if (this.input[this.position] === '\\' && this.position + 1 < this.input.length) {
                this.position++;
                value += this.input[this.position];
            } else {
                value += this.input[this.position];
            }
            this.position++;
        }
        
        if (this.position >= this.input.length) {
            throw new FilterParseError('Unterminated string', start);
        }
        
        this.position++; // Skip closing quote
        this.tokens.push({ type: 'STRING', value, position: start });
    }
    
    private readNumber(): void {
        const start = this.position;
        let value = '';
        
        while (this.position < this.input.length && /[0-9.]/.test(this.input[this.position])) {
            value += this.input[this.position];
            this.position++;
        }
        
        this.tokens.push({ type: 'NUMBER', value, position: start });
    }
    
    private readIdentifier(): void {
        const start = this.position;
        let value = '';
        
        while (this.position < this.input.length && this.isIdentifierPart(this.input[this.position])) {
            value += this.input[this.position];
            this.position++;
        }
        
        // Check for keywords
        if (value.toLowerCase() === 'contains') {
            this.tokens.push({ type: 'CONTAINS', value: value.toLowerCase(), position: start });
        } else if (value.toLowerCase() === 'and') {
            this.tokens.push({ type: 'LOGICAL', value: '&&', position: start });
        } else if (value.toLowerCase() === 'or') {
            this.tokens.push({ type: 'LOGICAL', value: '||', position: start });
        } else if (value.toLowerCase() === 'not') {
            this.tokens.push({ type: 'LOGICAL', value: '!', position: start });
        } else {
            this.tokens.push({ type: 'IDENTIFIER', value, position: start });
        }
    }
}

/**
 * Parser - builds AST from tokens
 */
class Parser {
    private tokens: Token[];
    private position: number = 0;
    
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
    
    parse(): ASTNode {
        const result = this.parseOrExpression();
        
        if (this.current().type !== 'EOF') {
            throw new FilterParseError(
                `Unexpected token: ${this.current().value}`,
                this.current().position
            );
        }
        
        return result;
    }
    
    private current(): Token {
        return this.tokens[this.position] || { type: 'EOF', value: '', position: -1 };
    }
    
    private advance(): Token {
        return this.tokens[this.position++];
    }
    
    private parseOrExpression(): ASTNode {
        let left = this.parseAndExpression();
        
        while (this.current().type === 'LOGICAL' && this.current().value === '||') {
            this.advance();
            const right = this.parseAndExpression();
            left = {
                type: 'BinaryExpression',
                operator: '||',
                left,
                right,
            };
        }
        
        return left;
    }
    
    private parseAndExpression(): ASTNode {
        let left = this.parseUnaryExpression();
        
        while (this.current().type === 'LOGICAL' && this.current().value === '&&') {
            this.advance();
            const right = this.parseUnaryExpression();
            left = {
                type: 'BinaryExpression',
                operator: '&&',
                left,
                right,
            };
        }
        
        return left;
    }
    
    private parseUnaryExpression(): ASTNode {
        if (this.current().type === 'LOGICAL' && this.current().value === '!') {
            this.advance();
            const operand = this.parseUnaryExpression();
            return {
                type: 'UnaryExpression',
                operator: '!',
                operand,
            };
        }
        
        return this.parsePrimaryExpression();
    }
    
    private parsePrimaryExpression(): ASTNode {
        const token = this.current();
        
        // Parenthesized expression
        if (token.type === 'LPAREN') {
            this.advance();
            const expr = this.parseOrExpression();
            
            if (this.current().type !== 'RPAREN') {
                throw new FilterParseError('Expected closing parenthesis', this.current().position);
            }
            this.advance();
            
            return expr;
        }
        
        // Identifier (could be field comparison or protocol check)
        if (token.type === 'IDENTIFIER') {
            this.advance();
            
            // Check if it's a comparison expression
            if (this.current().type === 'OPERATOR' || this.current().type === 'CONTAINS') {
                return this.parseComparison(token.value);
            }
            
            // It's a protocol check or field presence check
            return {
                type: 'ProtocolCheck',
                protocol: token.value.toLowerCase(),
            };
        }
        
        throw new FilterParseError(`Unexpected token: ${token.value}`, token.position);
    }
    
    private parseComparison(field: string): ASTNode {
        const operatorToken = this.advance();
        let operator = operatorToken.value;
        
        if (operatorToken.type === 'CONTAINS') {
            operator = 'contains';
        }
        
        // Parse the value
        const valueToken = this.advance();
        let value: string | number;
        
        if (valueToken.type === 'NUMBER') {
            value = parseFloat(valueToken.value);
        } else if (valueToken.type === 'STRING') {
            value = valueToken.value;
        } else if (valueToken.type === 'IDENTIFIER') {
            // Could be an IP address or other identifier
            value = valueToken.value;
        } else {
            throw new FilterParseError(
                `Expected value, got: ${valueToken.type}`,
                valueToken.position
            );
        }
        
        return {
            type: 'ComparisonExpression',
            operator,
            field,
            value,
        };
    }
}

/**
 * Evaluator - evaluates AST against packet
 */
class Evaluator {
    evaluate(node: ASTNode, packet: CapturedPacketDetail): boolean {
        switch (node.type) {
            case 'BinaryExpression':
                return this.evaluateBinary(node, packet);
            
            case 'UnaryExpression':
                return this.evaluateUnary(node, packet);
            
            case 'ComparisonExpression':
                return this.evaluateComparison(node, packet);
            
            case 'ProtocolCheck':
                return this.evaluateProtocolCheck(node, packet);
            
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    
    private evaluateBinary(node: ASTNode, packet: CapturedPacketDetail): boolean {
        const left = this.evaluate(node.left!, packet);
        
        if (node.operator === '||') {
            return left || this.evaluate(node.right!, packet);
        }
        
        if (node.operator === '&&') {
            return left && this.evaluate(node.right!, packet);
        }
        
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
    
    private evaluateUnary(node: ASTNode, packet: CapturedPacketDetail): boolean {
        if (node.operator === '!') {
            return !this.evaluate(node.operand!, packet);
        }
        
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
    
    private evaluateComparison(node: ASTNode, packet: CapturedPacketDetail): boolean {
        const field = node.field!.toLowerCase();
        const expectedValue = node.value!;
        const operator = node.operator!;
        
        // Get the field getter
        const fieldGetter = FILTER_FIELDS[field as keyof typeof FILTER_FIELDS];
        if (!fieldGetter) {
            // Unknown field - treat as always false
            return false;
        }
        
        const actualValue = fieldGetter(packet);
        
        // Handle 'contains' specially for fields like ip.addr, tcp.port
        if (operator === 'contains') {
            return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        }
        
        // Handle fields that return space-separated values (like ip.addr, tcp.port)
        if (typeof actualValue === 'string' && actualValue.includes(' ')) {
            const values = actualValue.split(' ').filter(v => v);
            
            switch (operator) {
                case '==':
                    return values.some(v => this.compare(v, expectedValue, '=='));
                case '!=':
                    return values.every(v => this.compare(v, expectedValue, '!='));
                default:
                    return values.some(v => this.compare(v, expectedValue, operator));
            }
        }
        
        return this.compare(actualValue, expectedValue, operator);
    }
    
    private compare(actual: unknown, expected: unknown, operator: string): boolean {
        // Convert to comparable types
        let actualVal: string | number;
        let expectedVal: string | number;
        
        // If both are numbers or one is a number string, compare as numbers
        if (typeof expected === 'number' || !isNaN(Number(expected))) {
            actualVal = Number(actual);
            expectedVal = Number(expected);
        } else {
            actualVal = String(actual).toLowerCase();
            expectedVal = String(expected).toLowerCase();
        }
        
        switch (operator) {
            case '==':
                return actualVal === expectedVal;
            case '!=':
                return actualVal !== expectedVal;
            case '>':
                return actualVal > expectedVal;
            case '<':
                return actualVal < expectedVal;
            case '>=':
                return actualVal >= expectedVal;
            case '<=':
                return actualVal <= expectedVal;
            default:
                throw new Error(`Unknown comparison operator: ${operator}`);
        }
    }
    
    private evaluateProtocolCheck(node: ASTNode, packet: CapturedPacketDetail): boolean {
        const protocol = node.protocol!;
        
        // Check if it's a known protocol
        const checker = PROTOCOL_CHECKS[protocol];
        if (checker) {
            return checker(packet);
        }
        
        // Check if it's a field presence check (e.g., "tcp.flags.syn")
        const fieldGetter = FILTER_FIELDS[protocol as keyof typeof FILTER_FIELDS];
        if (fieldGetter) {
            const value = fieldGetter(packet);
            // For boolean fields, return the value
            if (typeof value === 'boolean') {
                return value;
            }
            // For other fields, return true if non-empty/non-zero
            return value !== '' && value !== 0 && value !== null && value !== undefined;
        }
        
        // Unknown protocol/field
        return false;
    }
}

/**
 * Compiled filter for efficient repeated evaluation
 */
export class CompiledFilter {
    private ast: ASTNode;
    private evaluator: Evaluator;
    readonly expression: string;
    
    constructor(expression: string, ast: ASTNode) {
        this.expression = expression;
        this.ast = ast;
        this.evaluator = new Evaluator();
    }
    
    /**
     * Test if a packet matches the filter
     */
    matches(packet: CapturedPacketDetail): boolean {
        try {
            return this.evaluator.evaluate(this.ast, packet);
        } catch (e) {
            console.error('Filter evaluation error:', e);
            return false;
        }
    }
}

/**
 * FilterParser - main entry point for filter parsing
 */
export class FilterParser {
    /**
     * Parse and compile a filter expression
     */
    static compile(expression: string): CompiledFilter {
        if (!expression || expression.trim() === '') {
            // Empty filter matches everything
            return new CompiledFilter('', { type: 'Literal', value: true });
        }
        
        const lexer = new Lexer(expression);
        const tokens = lexer.tokenize();
        
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        return new CompiledFilter(expression, ast);
    }
    
    /**
     * Validate a filter expression without compiling
     */
    static validate(expression: string): { valid: boolean; error?: string; position?: number } {
        if (!expression || expression.trim() === '') {
            return { valid: true };
        }
        
        try {
            FilterParser.compile(expression);
            return { valid: true };
        } catch (e) {
            if (e instanceof FilterParseError) {
                return { valid: false, error: e.message, position: e.position };
            }
            return { valid: false, error: String(e) };
        }
    }
    
    /**
     * Create a filter function from expression
     */
    static createFilter(expression: string): (packet: CapturedPacketDetail) => boolean {
        const compiled = FilterParser.compile(expression);
        return (packet) => compiled.matches(packet);
    }
    
    /**
     * Get available filter fields
     */
    static getAvailableFields(): string[] {
        return Object.keys(FILTER_FIELDS);
    }
    
    /**
     * Get available protocol names
     */
    static getAvailableProtocols(): string[] {
        return Object.keys(PROTOCOL_CHECKS);
    }
    
    /**
     * Get filter syntax help
     */
    static getSyntaxHelp(): FilterSyntaxHelp {
        return {
            operators: [
                { operator: '==', description: 'Equal to', example: 'ip.src == 192.168.1.1' },
                { operator: '!=', description: 'Not equal to', example: 'tcp.port != 80' },
                { operator: '>', description: 'Greater than', example: 'frame.len > 100' },
                { operator: '<', description: 'Less than', example: 'ip.ttl < 64' },
                { operator: '>=', description: 'Greater than or equal', example: 'tcp.window >= 1000' },
                { operator: '<=', description: 'Less than or equal', example: 'udp.length <= 512' },
                { operator: 'contains', description: 'Contains substring', example: 'info contains "SYN"' },
            ],
            logicalOperators: [
                { operator: '&&', alias: 'and', description: 'Logical AND', example: 'tcp && ip.src == 192.168.1.1' },
                { operator: '||', alias: 'or', description: 'Logical OR', example: 'dns || http' },
                { operator: '!', alias: 'not', description: 'Logical NOT', example: '!arp' },
            ],
            examples: [
                { expression: 'tcp', description: 'Show only TCP packets' },
                { expression: 'tcp.port == 80', description: 'Show HTTP traffic (port 80)' },
                { expression: 'ip.src == 192.168.1.1', description: 'Filter by source IP' },
                { expression: 'tcp && !http', description: 'TCP but not HTTP' },
                { expression: 'udp.port == 53 || dns', description: 'DNS traffic' },
                { expression: 'tcp.flags.syn && !tcp.flags.ack', description: 'TCP SYN packets only' },
                { expression: 'frame.len > 1000', description: 'Large packets' },
                { expression: 'arp || icmp', description: 'ARP or ICMP packets' },
            ],
        };
    }
}

/**
 * Filter syntax help structure
 */
export interface FilterSyntaxHelp {
    operators: { operator: string; description: string; example: string }[];
    logicalOperators: { operator: string; alias: string; description: string; example: string }[];
    examples: { expression: string; description: string }[];
}

/**
 * Autocomplete suggestion
 */
export interface FilterSuggestion {
    text: string;
    type: 'field' | 'protocol' | 'operator' | 'keyword';
    description?: string;
}

/**
 * Get autocomplete suggestions for filter input
 */
export function getFilterSuggestions(partial: string): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];
    const lowerPartial = partial.toLowerCase();
    
    // Get the last token (word being typed)
    const lastWord = partial.split(/[\s()|&!]+/).pop() ?? '';
    const lowerLastWord = lastWord.toLowerCase();
    
    // Suggest protocols
    for (const protocol of Object.keys(PROTOCOL_CHECKS)) {
        if (protocol.startsWith(lowerLastWord)) {
            suggestions.push({
                text: protocol,
                type: 'protocol',
                description: `Filter ${protocol.toUpperCase()} packets`,
            });
        }
    }
    
    // Suggest fields
    for (const field of Object.keys(FILTER_FIELDS)) {
        if (field.startsWith(lowerLastWord)) {
            suggestions.push({
                text: field,
                type: 'field',
                description: `Filter by ${field}`,
            });
        }
    }
    
    // Suggest operators if after a field
    if (partial.endsWith(' ') || lastWord === '') {
        const beforeSpace = partial.trim().split(/\s+/).pop() ?? '';
        if (FILTER_FIELDS[beforeSpace as keyof typeof FILTER_FIELDS]) {
            suggestions.push(
                { text: '==', type: 'operator', description: 'Equal to' },
                { text: '!=', type: 'operator', description: 'Not equal to' },
                { text: '>', type: 'operator', description: 'Greater than' },
                { text: '<', type: 'operator', description: 'Less than' },
                { text: 'contains', type: 'keyword', description: 'Contains substring' },
            );
        }
    }
    
    // Suggest logical operators
    if (partial.includes(' ') && !partial.endsWith(' ')) {
        suggestions.push(
            { text: '&&', type: 'operator', description: 'Logical AND' },
            { text: '||', type: 'operator', description: 'Logical OR' },
        );
    }
    
    return suggestions.slice(0, 10);
}

export default FilterParser;
