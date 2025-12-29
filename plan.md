# 🔐 Network Security Virtual Lab - Next.js Full Simulator

> **Advanced Network Security and Protocols Interactive Learning Platform**  
> Built with Next.js 15, TypeScript, and Custom JavaScript Network Simulation Engine

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Lab Modules](#lab-modules)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Network Security Virtual Lab** adalah platform pembelajaran interaktif berbasis web yang mensimulasikan environment jaringan komputer lengkap dengan router, switch, firewall, dan security appliances - semua berjalan di browser menggunakan JavaScript.

### Tujuan Project

Menyediakan hands-on learning experience untuk mahasiswa dalam mempelajari:
- Network security fundamentals
- VPN configuration (IPSec & SSL)
- Firewall management
- Intrusion Detection/Prevention Systems
- Network protocol analysis
- Security best practices

### Kenapa Next.js?

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Full-stack dalam satu framework                     │
│  ✅ Server-side simulation untuk heavy computation      │
│  ✅ Real-time updates dengan Server-Sent Events         │
│  ✅ Fast development dengan hot reload                  │
│  ✅ Easy deployment (Vercel, Netlify, Docker)           │
│  ✅ TypeScript support out of the box                   │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🖥️ Interactive Network Simulator

```
┌──────────────────────────────────────────────────────────────┐
│                   Network Topology Canvas                    │
│  ┌─────────┐         ┌─────────┐         ┌─────────┐       │
│  │ Router1 │────────│Internet │────────│ Router2 │       │
│  │ (Site A)│         │ Router  │         │ (Site B)│       │
│  └────┬────┘         └─────────┘         └────┬────┘       │
│       │                                         │            │
│  ┌────▼────┐                              ┌────▼────┐       │
│  │   PC1   │                              │   PC2   │       │
│  │10.1.1.2 │                              │10.2.1.2 │       │
│  └─────────┘                              └─────────┘       │
│                                                              │
│  [▶️ Start] [⏸️ Pause] [🔄 Reset] [📊 Statistics]           │
└──────────────────────────────────────────────────────────────┘
```

- **Drag-and-drop** device placement
- **Real-time** packet animation
- **Visual indicators** for link status (up/down)
- **Interactive tooltips** untuk device info

### 💻 Web-based CLI Terminal

```
┌──────────────────────────────────────────────────────────────┐
│ Router1 - Terminal                                [─][□][×]  │
├──────────────────────────────────────────────────────────────┤
│ Router1> show ip interface brief                             │
│ Interface         IP-Address      Status       Protocol      │
│ GigabitEthernet0  10.1.1.1        up           up           │
│ GigabitEthernet1  192.168.1.1     up           up           │
│ Tunnel0           10.10.10.1      up           up           │
│                                                               │
│ Router1> configure terminal                                  │
│ Router1(config)# crypto isakmp policy 10                     │
│ Router1(config-isakmp)# encryption aes 256                   │
│ Router1(config-isakmp)# hash sha256                          │
│ Router1(config-isakmp)# group 14                             │
│ Router1(config-isakmp)# ✓ Configuration applied              │
│                                                               │
│ Router1(config-isakmp)# █                                    │
└──────────────────────────────────────────────────────────────┘
```

- **Xterm.js** powered terminal
- **Command auto-completion**
- **Syntax highlighting**
- **Command history** (up/down arrows)
- **Tab completion**

### 📡 Live Packet Capture & Analysis

```
┌──────────────────────────────────────────────────────────────┐
│ Packet Capture - Interface: GigabitEthernet0    [Start][Stop]│
├──┬──────┬─────────────┬─────────────┬──────────┬────────────┤
│# │ Time │   Source    │ Destination │ Protocol │    Info    │
├──┼──────┼─────────────┼─────────────┼──────────┼────────────┤
│1 │ 0.00 │ 10.1.1.2    │ 10.2.1.2    │   ICMP   │Echo Request│
│2 │ 0.01 │ 10.1.1.1    │ 10.2.1.1    │   ESP    │Encrypted   │
│3 │ 0.02 │ 10.2.1.1    │ 10.1.1.1    │   ESP    │Encrypted   │
│4 │ 0.03 │ 10.2.1.2    │ 10.1.1.2    │   ICMP   │Echo Reply  │
└──┴──────┴─────────────┴─────────────┴──────────┴────────────┘

[Filter: ___________] [🔍] [Export PCAP] [Clear]

Selected Packet Details:
┌──────────────────────────────────────────────────────────────┐
│ ▼ Frame 2: 134 bytes on wire                                │
│ ▼ Ethernet II                                                │
│ ▼ Internet Protocol Version 4                               │
│   ▼ Encapsulating Security Payload                          │
│     SPI: 0x12345678                                         │
│     Sequence: 42                                            │
│     ▶ Encrypted Data (96 bytes)                             │
└──────────────────────────────────────────────────────────────┘
```

- **Real-time** packet capture
- **Protocol decoding** (IP, TCP, UDP, ICMP, ESP, AH)
- **Filtering** by protocol, IP, port
- **Export** to PCAP format
- **Deep packet inspection**

### 🎓 Guided Learning System

```
┌──────────────────────────────────────────────────────────────┐
│ Lab 3: IPSec VPN Configuration                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Progress: ████████░░░░░░░░░░ 40% (4/10 tasks completed)     │
│                                                               │
│ ✅ Task 1: Configure IKE Phase 1 Policy                      │
│ ✅ Task 2: Set Pre-Shared Key                                │
│ ✅ Task 3: Create Crypto Map                                 │
│ ✅ Task 4: Apply Crypto Map to Interface                     │
│ ⏳ Task 5: Configure Peer Router                             │
│ 🔒 Task 6: Verify Tunnel Status (Locked)                     │
│ 🔒 Task 7: Test Connectivity (Locked)                        │
│ 🔒 Task 8: Analyze Encrypted Traffic (Locked)                │
│ 🔒 Task 9: Troubleshoot Issues (Locked)                      │
│ 🔒 Task 10: Submit Configuration (Locked)                    │
│                                                               │
│ Current Task:                                                 │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Configure the second router (Router2) with matching    │  │
│ │ IPSec parameters. Use the same pre-shared key and     │  │
│ │ ensure crypto ACLs are mirror images.                 │  │
│ │                                                         │  │
│ │ Hints Available: 3 💡                                   │  │
│ │ [Show Hint 1] [-5 points]                              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ [Previous Task] [Skip Task] [Need Help?] [Next Task]        │
└──────────────────────────────────────────────────────────────┘
```

- **Progressive unlocking** of tasks
- **Hint system** (with point deduction)
- **Auto-validation** of configurations
- **Instant feedback**
- **Score tracking**

### 📊 Real-time Statistics & Monitoring

```
┌──────────────────────────────────────────────────────────────┐
│ Network Statistics Dashboard                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Packets Transmitted: 1,547                                   │
│ ███████████████████░░░░░░░░░░░ 65%                          │
│                                                               │
│ Packets Dropped: 12                                          │
│ █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.8%                        │
│                                                               │
│ VPN Tunnel Status:                                           │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Tunnel0: ✅ UP (Active: 00:05:34)                     │    │
│ │ Packets Encrypted: 847                               │    │
│ │ Packets Decrypted: 842                               │    │
│ │ Encryption: AES-256-CBC                              │    │
│ │ Authentication: SHA256                               │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                               │
│ Firewall Statistics:                                         │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Rules Evaluated: 4,521                               │    │
│ │ Packets Allowed: 4,509 (99.7%)                       │    │
│ │ Packets Denied: 12 (0.3%)                            │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                               │
│ [📊 View Graphs] [📄 Export Report] [🔄 Refresh]             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              React UI Components (Client)                    │  │
│  │  ┌───────────┬───────────┬──────────┬──────────────────┐   │  │
│  │  │ Topology  │ Terminal  │  Packet  │  Task Validator  │   │  │
│  │  │  Canvas   │ Emulator  │  Viewer  │   & Progress     │   │  │
│  │  └───────────┴───────────┴──────────┴──────────────────┘   │  │
│  │                            │                                 │  │
│  │                    ┌───────▼────────┐                       │  │
│  │                    │  State Manager │                       │  │
│  │                    │   (Zustand)    │                       │  │
│  │                    └───────┬────────┘                       │  │
│  └────────────────────────────┼──────────────────────────────┘  │
│                                │                                  │
│                    ┌───────────▼─────────────┐                   │
│                    │  WebSocket / SSE Client │                   │
│                    └───────────┬─────────────┘                   │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                    ═════════════╪═════════════
                                 │ HTTP/WS
                    ═════════════╪═════════════
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                      Next.js Server (Node.js)                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Routes Layer                         │ │
│  │  ┌──────────┬──────────┬──────────┬─────────────────────┐ │ │
│  │  │/api/lab  │/api/device│/api/packet│/api/validate      │ │ │
│  │  │  /start  │ /execute │ /capture  │  /task            │ │ │
│  │  └──────────┴──────────┴──────────┴─────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │            Network Simulation Engine (Core)                 │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Simulation Manager                                │   │ │
│  │  │  - Event Queue                                     │   │ │
│  │  │  - Time Management                                 │   │ │
│  │  │  - State Synchronization                           │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Virtual Devices Layer                             │   │ │
│  │  │  ┌──────────┬─────────┬─────────┬──────────────┐  │   │ │
│  │  │  │  Router  │ Switch  │Firewall │     PC       │  │   │ │
│  │  │  │  Class   │  Class  │  Class  │    Class     │  │   │ │
│  │  │  └──────────┴─────────┴─────────┴──────────────┘  │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Protocol Implementation Layer                      │   │ │
│  │  │  ┌────┬────┬─────┬──────┬─────┬─────┬─────────┐   │   │ │
│  │  │  │TCP │UDP │ICMP │ IPSec│ ARP │ NAT │Firewall │   │   │ │
│  │  │  └────┴────┴─────┴──────┴─────┴─────┴─────────┘   │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Packet Processing Engine                          │   │ │
│  │  │  - Packet Queue                                    │   │ │
│  │  │  - Forwarding Logic                                │   │ │
│  │  │  - Encryption/Decryption                           │   │ │
│  │  │  - Capture & Analysis                              │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Session & State Management                  │ │
│  │  - User Sessions (isolated environments)                │ │
│  │  - Lab Configurations                                    │ │
│  │  - Progress Tracking                                     │ │
│  │  - Auto-save & Resume                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                │                               │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Database (Prisma)     │
                    │  ┌──────────────────┐   │
                    │  │ Users            │   │
                    │  │ Labs             │   │
                    │  │ Progress         │   │
                    │  │ Configurations   │   │
                    │  │ Submissions      │   │
                    │  └──────────────────┘   │
                    │  PostgreSQL / MongoDB   │
                    └─────────────────────────┘
```

### Component Interaction Flow

```
User Action (e.g., "Configure IPSec")
           │
           ▼
    ┌──────────────┐
    │   Frontend   │
    │  Component   │
    └──────┬───────┘
           │ 1. Send command via API
           ▼
    ┌──────────────┐
    │  API Route   │
    │ /api/device  │
    │  /execute    │
    └──────┬───────┘
           │ 2. Route to simulation engine
           ▼
    ┌──────────────┐
    │  Simulation  │
    │   Manager    │
    └──────┬───────┘
           │ 3. Get device instance
           ▼
    ┌──────────────┐
    │Virtual Router│
    │   Instance   │
    └──────┬───────┘
           │ 4. Parse & execute command
           │ 5. Update device state
           │ 6. Create events (if needed)
           ▼
    ┌──────────────┐
    │    Event     │
    │    Queue     │
    └──────┬───────┘
           │ 7. Process events
           │    (packet forwarding, etc.)
           ▼
    ┌──────────────┐
    │   Return     │
    │   Result     │
    └──────┬───────┘
           │ 8. Send response
           ▼
    ┌──────────────┐
    │   Frontend   │
    │   Update UI  │
    └──────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

```typescript
// Core Framework
Next.js 15          // React framework with App Router
React 18            // UI library
TypeScript 5.0      // Type safety

// UI & Styling
Tailwind CSS 3.4    // Utility-first CSS
Shadcn/ui           // Component library
Framer Motion       // Animations
Lucide React        // Icons

// Visualization
D3.js / vis.js      // Network topology rendering
Cytoscape.js        // Alternative for graph visualization
Recharts            // Charts and graphs

// Terminal
Xterm.js            // Terminal emulator
xterm-addon-fit     // Terminal fitting
xterm-addon-web-links // Clickable links

// State Management
Zustand             // Lightweight state management
React Query         // Server state management

// Code Editor
Monaco Editor       // VS Code-powered editor (for config files)
```

### Backend

```typescript
// Runtime
Node.js 20+         // JavaScript runtime

// Framework
Next.js API Routes  // Backend endpoints
Server-Sent Events  // Real-time updates

// Database
Prisma ORM          // Database toolkit
PostgreSQL 15       // Primary database
Redis (optional)    // Caching & pub/sub

// Authentication
NextAuth.js         // Authentication
bcrypt              // Password hashing
```

### Network Simulation Engine

```typescript
// Core Libraries (Custom Built)
@/lib/network/simulator          // Main simulation engine
@/lib/network/devices/*           // Device implementations
@/lib/network/protocols/*         // Protocol implementations
@/lib/network/packet              // Packet structure & handling
@/lib/network/routing             // Routing algorithms
@/lib/network/security            // Security features (IPSec, firewall)

// Utilities
event-emitter       // Event handling
priority-queue      // Event scheduling
crypto-js           // Cryptography simulation (not real crypto!)
```

### Development Tools

```bash
TypeScript          # Type checking
ESLint              # Linting
Prettier            # Code formatting
Husky               # Git hooks
Jest                # Unit testing
Playwright          # E2E testing
```

---

## 💻 System Requirements

### For Development

```
├── Node.js >= 20.0.0
├── npm >= 10.0.0 or pnpm >= 8.0.0
├── RAM: 8GB minimum (16GB recommended)
├── Storage: 2GB free space
└── OS: Windows 10+, macOS 11+, or Linux
```

### For Production Deployment

```
├── Node.js 20.x LTS
├── PostgreSQL 15+
├── RAM: 4GB per instance
├── CPU: 2 cores minimum
├── Storage: 10GB
└── Network: 100Mbps
```

### Browser Compatibility

```
✅ Chrome 100+
✅ Firefox 100+
✅ Safari 15+
✅ Edge 100+
❌ IE (not supported)
```

---

## 🚀 Installation

### Prerequisites

```bash
# Install Node.js (using nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-username/network-security-lab.git
cd network-security-lab

# 2. Install dependencies
npm install
# or using pnpm (faster)
pnpm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Setup database
npx prisma generate
npx prisma db push

# 5. Seed initial data (labs, topologies)
npm run db:seed

# 6. Run development server
npm run dev

# 7. Open browser
open http://localhost:3000
```

### Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/netseclab"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"

# Simulation Settings
MAX_SIMULATION_TIME=3600        # 1 hour max
MAX_CONCURRENT_SESSIONS=100     # Per server instance
PACKET_QUEUE_SIZE=10000         # Max packets in queue
```

### Database Setup

```bash
# Using PostgreSQL with Docker
docker run --name netseclab-db \
  -e POSTGRES_PASSWORD=securepassword \
  -e POSTGRES_DB=netseclab \
  -p 5432:5432 \
  -d postgres:15-alpine

# Run migrations
npx prisma migrate dev --name init

# Prisma Studio (Database GUI)
npx prisma studio
```

---

## 📁 Project Structure

```
network-security-lab/
├── app/                                    # Next.js App Router
│   ├── (auth)/                            # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/                       # Main app group
│   │   ├── labs/
│   │   │   ├── [labId]/
│   │   │   │   └── page.tsx              # Individual lab page
│   │   │   └── page.tsx                  # Labs listing
│   │   ├── progress/
│   │   └── settings/
│   ├── api/                               # API Routes
│   │   ├── auth/
│   │   ├── lab/
│   │   │   ├── start/route.ts
│   │   │   ├── stop/route.ts
│   │   │   └── validate/route.ts
│   │   ├── device/
│   │   │   ├── execute/route.ts
│   │   │   └── config/route.ts
│   │   ├── packet/
│   │   │   ├── capture/route.ts
│   │   │   └── export/route.ts
│   │   └── simulation/
│   │       ├── start/route.ts
│   │       └── events/route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                            # React Components
│   ├── lab/
│   │   ├── NetworkTopology.tsx           # Main network canvas
│   │   ├── DeviceTerminal.tsx            # CLI terminal
│   │   ├── PacketCapture.tsx             # Packet viewer
│   │   ├── TaskValidator.tsx             # Task checking
│   │   ├── ConfigEditor.tsx              # Config file editor
│   │   └── StatisticsPanel.tsx           # Metrics dashboard
│   ├── ui/                                # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── providers/
│       └── SessionProvider.tsx
│
├── lib/                                   # Core libraries
│   ├── network/                           # ⭐ Network Simulation Engine
│   │   ├── core/
│   │   │   ├── Simulator.ts              # Main simulation class
│   │   │   ├── EventQueue.ts             # Event scheduling
│   │   │   ├── Packet.ts                 # Packet structure
│   │   │   └── types.ts                  # Type definitions
│   │   ├── devices/
│   │   │   ├── Device.ts                 # Base device class
│   │   │   ├── Router.ts                 # Virtual router
│   │   │   ├── Switch.ts                 # Virtual switch
│   │   │   ├── Firewall.ts               # Virtual firewall
│   │   │   ├── PC.ts                     # End device
│   │   │   └── IDS.ts                    # IDS/IPS device
│   │   ├── protocols/
│   │   │   ├── IP.ts                     # IPv4 protocol
│   │   │   ├── TCP.ts                    # TCP protocol
│   │   │   ├── UDP.ts                    # UDP protocol
│   │   │   ├── ICMP.ts                   # ICMP protocol
│   │   │   ├── IPSec.ts                  # IPSec implementation
│   │   │   ├── ARP.ts                    # ARP protocol
│   │   │   └── IKE.ts                    # IKE (for IPSec)
│   │   ├── security/
│   │   │   ├── ACL.ts                    # Access Control Lists
│   │   │   ├── NAT.ts                    # Network Address Translation
│   │   │   ├── Firewall.ts               # Firewall rules
│   │   │   └── IDS.ts                    # Intrusion detection
│   │   ├── routing/
│   │   │   ├── RoutingTable.ts           # Routing table
│   │   │   ├── StaticRoute.ts            # Static routing
│   │   │   ├── OSPF.ts                   # OSPF (simplified)
│   │   │   └── BGP.ts                    # BGP (simplified)
│   │   └── utils/
│   │       ├── IPAddress.ts              # IP address utilities
│   │       ├── MACAddress.ts             # MAC address utilities
│   │       └── Crypto.ts                 # Crypto helpers
│   ├── validation/
│   │   ├── CommandValidator.ts           # CLI command validation
│   │   ├── ConfigValidator.ts            # Configuration validation
│   │   └── TaskChecker.ts                # Lab task verification
│   ├── parser/
│   │   ├── CLIParser.ts                  # Command line parser
│   │   └── ConfigParser.ts               # Config file parser
│   └── utils/
│       ├── session.ts                    # Session management
│       └── db.ts                         # Database utilities
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── seed.ts                           # Seed data
│
├── data/                                  # Lab definitions
│   └── labs/
│       ├── lab1-tcp-analysis.json
│       ├── lab2-vpn-ipsec.json
│       ├── lab3-firewall.json
│       ├── lab4-acl.json
│       ├── lab5-nat.json
│       ├── lab6-ids.json
│       ├── lab7-snort.json
│       └── lab8-uts-project.json
│
├── public/
│   ├── icons/
│   │   ├── router.svg
│   │   ├── switch.svg
│   │   ├── firewall.svg
│   │   └── pc.svg
│   └── assets/
│
├── tests/
│   ├── unit/
│   │   ├── network/
│   │   │   ├── router.test.ts
│   │   │   ├── ipsec.test.ts
│   │   │   └── firewall.test.ts
│   │   └── validation/
│   └── e2e/
│       └── lab-flow.spec.ts
│
├── docs/                                  # Documentation
│   ├── architecture.md
│   ├── simulation-engine.md
│   ├── api-reference.md
│   └── lab-development.md
│
├── scripts/
│   ├── seed-labs.ts                      # Seed lab data
│   └── generate-topologies.ts            # Generate topology files
│
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── README.md
└── LICENSE
```

---

## 🧩 Core Components

### 1. Network Simulation Engine

**File:** `lib/network/core/Simulator.ts`

**Responsibility:** Orchestrate keseluruhan simulasi jaringan

```typescript
class NetworkSimulator {
  // Core simulation loop
  async run(): Promise<void>
  
  // Device management
  addDevice(device: NetworkDevice): void
  removeDevice(deviceId: string): void
  getDevice(deviceId: string): NetworkDevice
  
  // Packet handling
  sendPacket(packet: Packet): void
  forwardPacket(packet: Packet, from: Device, to: Device): void
  
  // Event management
  scheduleEvent(event: SimulationEvent): void
  processEvents(): void
  
  // State management
  getState(): SimulationState
  saveState(): void
  loadState(state: SimulationState): void
}
```

### 2. Virtual Router

**File:** `lib/network/devices/Router.ts`

**Features:**
- Routing table management
- IPSec tunnel establishment
- NAT configuration
- ACL processing
- Interface management

```typescript
class VirtualRouter extends NetworkDevice {
  interfaces: Map<string, Interface>
  routingTable: RoutingTable
  ipsecTunnels: Map<string, IPSecTunnel>
  natRules: NATRule[]
  accessLists: Map<string, ACL>
  
  // CLI commands
  executeCommand(cmd: string): CommandResult
  
  // Packet processing
  processPacket(packet: Packet): void
  forwardPacket(packet: Packet): void
  
  // IPSec
  establishTunnel(config: IPSecConfig): IPSecTunnel
  encryptPacket(packet: Packet, tunnel: IPSecTunnel): Packet
  decryptPacket(packet: Packet, tunnel: IPSecTunnel): Packet
}
```

### 3. IPSec Implementation

**File:** `lib/network/protocols/IPSec.ts`

**Implements:**
- IKE Phase 1 (Main Mode & Aggressive Mode)
- IKE Phase 2 (Quick Mode)
- ESP (Encapsulating Security Payload)
- AH (Authentication Header)

```typescript
class IPSecProtocol {
  // Phase 1: IKE negotiation
  negotiatePhase1(config: IKEConfig): IKESession
  
  // Phase 2: IPSec SA
  negotiatePhase2(session: IKESession): IPSecSA
  
  // ESP encapsulation
  encapsulateESP(packet: Packet, sa: IPSecSA): ESPPacket
  decapsulateESP(espPacket: ESPPacket, sa: IPSecSA): Packet
  
  // AH processing
  addAH(packet: Packet, sa: IPSecSA): AHPacket
  verifyAH(ahPacket: AHPacket, sa: IPSecSA): boolean
}
```

### 4. Firewall Engine

**File:** `lib/network/security/Firewall.ts`

**Features:**
- Stateful inspection
- Application layer filtering
- Logging & alerts
- Zone-based policies

```typescript
class FirewallEngine {
  rules: FirewallRule[]
  zones: Map<string, Zone>
  sessionTable: Map<string, Session>
  
  // Rule processing
  evaluatePacket(packet: Packet): FirewallDecision
  
  // Stateful tracking
  trackSession(packet: Packet): void
  isEstablishedSession(packet: Packet): boolean
  
  // Logging
  logEvent(event: FirewallEvent): void
}
```

### 5. IDS/IPS System

**File:** `lib/network/devices/IDS.ts`

**Features:**
- Signature-based detection
- Anomaly detection
- Alert generation
- Rule management

```typescript
class IDSEngine {
  signatures: Map<string, Signature>
  alerts: Alert[]
  statistics: IDSStats
  
  // Packet inspection
  inspectPacket(packet: Packet): Alert[]
  
  // Signature matching
  matchSignatures(packet: Packet): Signature[]
  
  // Alert management
  generateAlert(signature: Signature, packet: Packet): Alert
  getAlerts(filter?: AlertFilter): Alert[]
}
```

---

## 📚 Lab Modules (Pertemuan 1-8)

### Pertemuan 1: Network Security Fundamentals Review

**Objectives:**
- Understanding network security concepts
- Setting up lab environment
- Basic device configuration

**Topology:**
```
    PC1 -------- Router -------- PC2
            (Simple network)
```

**Tasks:**
1. Navigate the interface
2. Configure router interface
3. Test connectivity (ping)
4. View routing table

**Skills Learned:**
- CLI navigation
- Basic IP configuration
- Connectivity testing

---

### Pertemuan 2: TCP/IP Protocol Security Analysis

**Objectives:**
- Understand TCP/IP stack
- Analyze packets with built-in analyzer
- Identify security vulnerabilities

**Topology:**
```
    Client -------- Switch -------- Server
                      |
                  Analyzer
```

**Tasks:**
1. Capture TCP handshake
2. Analyze packet headers
3. Identify protocol fields
4. Export PCAP file

**Skills Learned:**
- Packet capture
- Protocol analysis
- PCAP export

---

### Pertemuan 3: VPN Technologies - IPSec & SSL VPN

**Objectives:**
- Configure site-to-site IPSec VPN
- Understand IKE phases
- Verify tunnel establishment

**Topology:**
```
[Site A]                    [Internet]                    [Site B]
  PC1 -- Router1 -- [Cloud/Internet Router] -- Router2 -- PC2
  10.1.1.2  .1                                  .1  10.2.1.2
            \                                    /
             \______ IPSec Tunnel ______________/
```

**Tasks:**
1. Configure IKE Phase 1 policy
2. Set pre-shared key
3. Create crypto map
4. Apply to interface
5. Configure peer router
6. Verify tunnel status
7. Test encrypted traffic
8. Analyze ESP packets

**Configuration Example:**
```cisco
Router1(config)# crypto isakmp policy 10
Router1(config-isakmp)# encryption aes 256
Router1(config-isakmp)# hash sha256
Router1(config-isakmp)# group 14
Router1(config-isakmp)# exit

Router1(config)# crypto isakmp key MySecretKey address 192.168.2.1

Router1(config)# crypto ipsec transform-set MYSET esp-aes 256 esp-sha256-hmac
Router1(config)# mode tunnel

Router1(config)# crypto map MYMAP 10 ipsec-isakmp
Router1(config-crypto-map)# set peer 192.168.2.1
Router1(config-crypto-map)# set transform-set MYSET
Router1(config-crypto-map)# match address VPN-TRAFFIC

Router1(config)# interface GigabitEthernet0/1
Router1(config-if)# crypto map MYMAP
```

**Skills Learned:**
- IPSec configuration
- VPN troubleshooting
- Encryption verification

---

### Pertemuan 4: Next-Generation Firewall (NGFW)

**Objectives:**
- Configure firewall zones
- Create security policies
- Application-layer filtering

**Topology:**
```
Internet --- [Firewall] --- DMZ
                  |
              Internal LAN
```

**Tasks:**
1. Define security zones
2. Create firewall rules
3. Configure NAT
4. Test traffic filtering
5. View firewall logs

**Skills Learned:**
- Firewall policy creation
- Zone-based security
- Traffic inspection

---

### Pertemuan 5: Advanced Access Control Lists (ACL)

**Objectives:**
- Create standard & extended ACLs
- Implement complex filtering rules
- ACL optimization

**Tasks:**
1. Standard ACL configuration
2. Extended ACL with port/protocol
3. Time-based ACL
4. ACL troubleshooting
5. Performance analysis

**Skills Learned:**
- ACL syntax
- Rule ordering
- Traffic filtering

---

### Pertemuan 6: Network Address Translation (NAT) Security

**Objectives:**
- Configure static & dynamic NAT
- PAT (Port Address Translation)
- NAT troubleshooting

**Tasks:**
1. Static NAT configuration
2. Dynamic NAT pool
3. PAT implementation
4. NAT translation verification
5. Connection tracking

**Skills Learned:**
- NAT types
- Address translation
- Connection tracking

---

### Pertemuan 7: Intrusion Detection System (Snort)

**Objectives:**
- Deploy IDS sensor
- Create detection signatures
- Analyze alerts

**Tasks:**
1. Configure IDS interface
2. Load signature database
3. Create custom signatures
4. Generate test traffic
5. Analyze alerts
6. Tune false positives

**Skills Learned:**
- IDS deployment
- Signature creation
- Alert analysis

---

### Pertemuan 8: UTS - Network Security Implementation

**Objectives:**
- Design secure network topology
- Implement multiple security controls
- Comprehensive security audit

**Requirements:**
1. Minimum 5 devices
2. Implement VPN
3. Configure firewall
4. Enable IDS
5. Document configuration
6. Security assessment

**Grading Criteria:**
- Topology design (20%)
- VPN implementation (25%)
- Firewall configuration (20%)
- IDS deployment (15%)
- Documentation (10%)
- Security audit (10%)

---

## 🗓️ Development Roadmap

### Phase 1: Foundation (Month 1-2)

**Week 1-2: Project Setup**
- [x] Initialize Next.js project
- [x] Setup TypeScript configuration
- [x] Install core dependencies
- [x] Configure Tailwind CSS
- [x] Setup Prisma ORM
- [x] Create base project structure

**Week 3-4: Core Simulation Engine**
- [ ] Build Simulator class
- [ ] Implement Event Queue
- [ ] Create Packet structure
- [ ] Basic device abstraction
- [ ] Simple packet forwarding

**Week 5-6: Router Implementation**
- [ ] Virtual Router class
- [ ] Routing table management
- [ ] Interface configuration
- [ ] Basic CLI commands
- [ ] Packet processing

**Week 7-8: Frontend Foundation**
- [ ] Network topology canvas
- [ ] Device drag-and-drop
- [ ] Basic terminal emulator
- [ ] API routes setup
- [ ] State management

---

### Phase 2: Protocol Implementation (Month 3-4)

**Week 9-10: TCP/IP Stack**
- [ ] IP protocol implementation
- [ ] TCP protocol (handshake, flow control)
- [ ] UDP protocol
- [ ] ICMP protocol
- [ ] Packet capture system

**Week 11-12: IPSec & VPN**
- [ ] IKE Phase 1 negotiation
- [ ] IKE Phase 2 (Quick Mode)
- [ ] ESP encapsulation
- [ ] Tunnel establishment
- [ ] Encryption simulation

**Week 13-14: Firewall & ACL**
- [ ] Firewall engine
- [ ] ACL implementation
- [ ] Rule evaluation
- [ ] Stateful inspection
- [ ] Logging system

**Week 15-16: NAT & IDS**
- [ ] NAT translation
- [ ] PAT implementation
- [ ] IDS signature engine
- [ ] Alert generation
- [ ] Pattern matching

---

### Phase 3: Lab Development (Month 5)

**Week 17-18: Labs 1-4**
- [ ] Lab 1: TCP/IP Analysis
- [ ] Lab 2: VPN Configuration
- [ ] Lab 3: Firewall Setup
- [ ] Lab 4: ACL Rules

**Week 19-20: Labs 5-8**
- [ ] Lab 5: NAT Configuration
- [ ] Lab 6: IDS Deployment
- [ ] Lab 7: Snort Signatures
- [ ] Lab 8: UTS Project

---

### Phase 4: Polish & Testing (Month 6)

**Week 21-22: Testing**
- [ ] Unit tests for simulation engine
- [ ] Integration tests
- [ ] E2E tests for labs
- [ ] Performance testing
- [ ] Load testing

**Week 23-24: UX & Documentation**
- [ ] UI/UX improvements
- [ ] Tutorial system
- [ ] Help documentation
- [ ] Video guides
- [ ] Deployment guides

---

## 👨‍💻 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

```bash
# 1. Fork repository
# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# 4. Write tests
npm run test

# 5. Commit with conventional commits
git commit -m "feat: add IPSec encryption visualization"

# 6. Push and create Pull Request
git push origin feature/your-feature-name
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Cisco Systems** - For network device CLI inspiration
- **GNS3 & EVE-NG** - For network simulation concepts
- **Wireshark** - For packet analysis UI inspiration
- **Next.js Team** - For amazing framework
- **Open Source Community** - For countless libraries

---

## 📞 Contact & Support

- **Email**: support@netseclab.dev
- **Discord**: [Join our community](https://discord.gg/netseclab)
- **Issues**: [GitHub Issues](https://github.com/your-username/network-security-lab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/network-security-lab/discussions)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/network-security-lab&type=Date)](https://star-history.com/#your-username/network-security-lab&Date)

---

**Built with ❤️ for Network Security Education**

*Last Updated: December 2024*
