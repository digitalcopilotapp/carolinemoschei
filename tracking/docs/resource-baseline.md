# Resource Baseline — Digital Copilot Infrastructure

## Expected RAM Usage

| Container | Expected RAM | Limit |
|---|---|---|
| Stalwart Mail | 200-400 MB | — |
| PostgreSQL 15 | 300-500 MB | — |
| Chatwoot (web + sidekiq) | 1500-2000 MB | — |
| Redis | 100-256 MB | maxmemory 256MB |
| Listmonk | 100-200 MB | — |
| SnappyMail | 50-100 MB | — |
| dc-bridge | 30-50 MB | 256MB hard limit |
| Caddy | 30-50 MB | — |
| Uptime Kuma | 100-150 MB | — |
| OS (Ubuntu 22.04) | 300-500 MB | — |
| **Total** | **2.7 - 4.2 GB** | **Target: < 6 GB** |

## Server Specs

- **CPU:** 2 vCPU
- **RAM:** 8 GB
- **Disk:** 100 GB NVMe
- **Swap:** 4 GB (configured in setup)
- **OS:** Ubuntu 22.04 LTS

## Monitoring Commands

```bash
# Real-time container stats
docker stats

# Snapshot (non-streaming)
docker stats --no-stream

# Disk usage
df -h
docker system df

# Check swap usage
free -h
```

## When to Upgrade to KVM 4

Consider upgrading ($9.99/month, 4 vCPU, 16GB RAM) when:
- Total RAM usage consistently > 6GB
- CPU usage consistently > 80%
- Chatwoot has many concurrent agents/conversations
- Disk usage > 70GB
