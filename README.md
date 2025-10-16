# RAG Security Game

A web-based red-teaming game platform for testing AI agent security vulnerabilities.

## Overview

This project contains the design specifications and architecture for a comprehensive red-teaming game that allows security researchers and enthusiasts to test various attack vectors against AI agents in a controlled environment.

## Game Concept

The platform provides a structured environment where attackers can attempt various prompt injection, privilege escalation, and social engineering attacks against AI agents with different permission levels and capabilities.

### Key Features

- **Multi-level Attack Scenarios**: Various pre-configured scenarios testing different vulnerability types
- **Role-based Access Control**: Different user roles (public, employee, manager, CEO) with varying permissions
- **Real-time Interaction**: Live chat interface with AI agents
- **Scoring System**: Automated evaluation of attack success with detailed metrics
- **Educational Content**: Clear explanations of attack vectors and defense mechanisms

### Planned Attack Scenarios

1. **Web Search Exploits**: Convince agents to visit attacker-controlled sites
2. **Document Injection**: Hide malicious prompts in documents for later execution
3. **Privilege Escalation**: Exploit content injection to gain higher permissions
4. **Employee Review Manipulation**: Manipulate automated performance evaluations
5. **Meeting Transcript Attacks**: Inject malicious content into meeting summaries
6. **Memory Sabotage**: Abuse persistent memory systems
7. **Alignment Attacks**: Exploit moral reasoning weaknesses

## Architecture

### Frontend Components
- **Landing Page**: Project description, mission, game links, and global rankings
- **Left Panel**: Attack setup, goals, agent capabilities, and scenario descriptions
- **Center Panel**: Primary interaction surface (chat, file explorer, tool triggers)
- **Right Panel**: Live process summary, statistics, and leaderboards

### Backend Systems
- **Agent Framework**: Configurable AI agents with various tool access levels
- **Sandboxing**: Secure execution environment for potentially malicious inputs
- **Evaluation Engine**: Automated scoring and attack success detection
- **User Management**: Authentication and role-based access control

## Getting Started

This repository currently contains the design specifications. Implementation is planned to integrate with the RAG system backend.

## Contributing

This is an open-source security research project. Contributions are welcome for:
- New attack scenario designs
- Security vulnerability research
- Frontend/backend implementation
- Documentation improvements

## Security Notice

This platform is designed for educational and research purposes only. All attacks are contained within a sandboxed environment and should not be used against production systems without explicit permission.

## License

MIT License - See LICENSE file for details.
