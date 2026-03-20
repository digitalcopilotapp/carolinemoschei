# Operational Runbook — Digital Copilot Infrastructure

## Service Management

### Start all services
```bash
cd /opt/dc-tracking
docker compose up -d
```

### Stop all services
```bash
docker compose down
```

### Restart a specific service
```bash
docker compose restart dc-bridge
docker compose restart chatwoot-web chatwoot-sidekiq
docker compose restart stalwart
```

### View logs
```bash
# All services
docker compose logs -f --tail=100

# Specific service
docker compose logs -f dc-bridge
docker compose logs -f chatwoot-web
docker compose logs -f stalwart
docker compose logs -f listmonk
docker compose logs -f postgres
```

### Check resource usage
```bash
docker stats --no-stream
```

---

## Email Administration

### Add a new domain to Stalwart
1. Access Stalwart admin panel (https://mail.digitalcopilot.app:8443 or configured URL)
2. Navigate to Domains → Add Domain
3. Enter the new domain name
4. Copy the DKIM record shown and add it to DNS
5. Add SPF, DMARC, and MX records (see `docs/dns-records.md`)
6. Wait for DNS propagation (up to 1 hour)
7. Test with mail-tester.com

### Add a new email account
1. Access Stalwart admin panel
2. Navigate to Accounts → Add Account
3. Enter email, password, and display name
4. Set storage quota (recommended: 2GB)
5. Test login via SnappyMail (webmail.digitalcopilot.app)

---

## Listmonk

### Create a new list
1. Access campaigns.digitalcopilot.app
2. Navigate to Lists → New List
3. Set name, type (public/private), opt-in mode (single/double)

### Create a new template
1. Navigate to Campaigns → Templates → New
2. Use HTML or Markdown editor
3. Include `{{ .Subscriber.Email }}` and `{{ .UnsubscribeURL }}` placeholders
4. Test with a preview send

---

## dc-bridge

### Run database migrations
```bash
docker compose exec dc-bridge node src/db/migrate.js
```

### Add a new Hotmart product
Edit `dc-bridge/src/config/templates.js` to add product-specific WhatsApp template mappings, then rebuild:
```bash
docker compose build dc-bridge
docker compose up -d dc-bridge
```

### Check retry queue
```bash
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT id, event_type, attempts, last_error, next_retry FROM retry_queue WHERE attempts < max_attempts ORDER BY next_retry;"
```

### Check failed events (permanently failed)
```bash
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT id, event_type, attempts, last_error, created_at FROM retry_queue WHERE attempts >= max_attempts ORDER BY created_at DESC LIMIT 20;"
```

### Clear permanently failed events
```bash
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "DELETE FROM retry_queue WHERE attempts >= max_attempts;"
```

### Debug webhook processing
```bash
# Watch dc-bridge logs in real-time
docker compose logs -f dc-bridge | jq .

# Check recent leads
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT id, email, source, created_at FROM leads ORDER BY created_at DESC LIMIT 10;"

# Check recent conversions
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT c.id, l.email, c.product, c.amount, c.status, c.sent_to_meta, c.created_at FROM conversions c JOIN leads l ON l.id = c.lead_id ORDER BY c.created_at DESC LIMIT 10;"

# Check Meta CAPI delivery
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT event_name, event_id, response_code, sent_at FROM meta_events ORDER BY sent_at DESC LIMIT 10;"
```

### Check scheduled messages
```bash
docker compose exec postgres psql -U dcadmin -d dcbridge -c \
  "SELECT id, template_name, scheduled_for, sent, canceled FROM scheduled_messages ORDER BY created_at DESC LIMIT 10;"
```

---

## Backups

### Run manual backup
```bash
sudo /opt/dc-tracking/scripts/backup.sh
```

### Restore from backup
```bash
# PostgreSQL
sudo /opt/dc-tracking/scripts/restore.sh postgres /backups/postgres/listmonk_2026-03-14_03-00.sql.gz

# Stalwart
sudo /opt/dc-tracking/scripts/restore.sh stalwart /backups/stalwart/stalwart_2026-03-14_03-30.tar.gz

# Redis
sudo /opt/dc-tracking/scripts/restore.sh redis /backups/redis/redis_2026-03-14_03-15.rdb.gz
```

### List available backups
```bash
ls -la /backups/postgres/
ls -la /backups/stalwart/
ls -la /backups/redis/
```

### Setup backup cron
```bash
sudo crontab -e
# Add:
0 3 * * * /opt/dc-tracking/scripts/backup.sh >> /var/log/dc-backup.log 2>&1
```

---

## Docker Image Updates

### Update all services
```bash
cd /opt/dc-tracking
docker compose pull
docker compose up -d
```

### Update a specific service
```bash
docker compose pull stalwart
docker compose up -d stalwart
```

### Rebuild dc-bridge after code changes
```bash
docker compose build dc-bridge
docker compose up -d dc-bridge
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
docker compose logs <service_name>

# Check if port is in use
ss -tlnp | grep <port>

# Check disk space
df -h
```

### Email not delivered
1. Check Stalwart logs: `docker compose logs stalwart`
2. Verify DNS: `dig +short MX digitalcopilot.app`
3. Check blacklists: mxtoolbox.com/blacklists.aspx
4. Test sending score: mail-tester.com
5. Check Google Postmaster Tools reputation

### Webhook not processing
1. Check dc-bridge health: `curl https://webhook.digitalcopilot.app/health`
2. Check dc-bridge logs: `docker compose logs -f dc-bridge | jq .`
3. Verify HMAC secret matches Hotmart dashboard
4. Check retry queue for stuck events

### High RAM usage
```bash
# Check per-container usage
docker stats --no-stream

# Restart heavy services
docker compose restart chatwoot-web chatwoot-sidekiq

# Check for memory leaks in dc-bridge
docker compose logs dc-bridge | grep -i "memory\|heap"
```

### Meta CAPI events not appearing
1. Check meta_events table for response codes
2. Verify META_PIXEL_ID and META_ACCESS_TOKEN in .env
3. Check Meta Events Manager → Test Events
4. Ensure event_id is unique per conversion
5. Verify PII hashing (SHA256, lowercase, trimmed)
