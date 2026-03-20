# Email Warm-Up Schedule

## Overview

New IP addresses have no email reputation. Sending too many emails too fast from a new IP will result in spam filtering or blacklisting. This schedule gradually builds reputation.

## Schedule

### Week 1 — Foundation
- **Max:** 100 emails/day (accounts for cart abandonment + transactional emails from day one)
- **Target:** Only engaged contacts + transactional emails (purchase confirmations, cart abandonment)
- **Rate limit in Listmonk:** 5 emails/minute
- **Note:** Cart abandonment emails are transactional/triggered — they have higher engagement rates and help build positive IP reputation
- **Actions:**
  - [ ] Send personal emails to known contacts
  - [ ] Ensure cart abandonment + purchase emails are flowing
  - [ ] Check MXToolbox for blacklists daily
  - [ ] Monitor Stalwart logs for bounces

### Week 2 — Ramp Up
- **Max:** 300 emails/day
- **Target:** Opt-in lists with high engagement + all transactional emails
- **Rate limit in Listmonk:** 8 emails/minute
- **Actions:**
  - [ ] Send first small newsletter campaign
  - [ ] Monitor bounce rate (target: < 2%)
  - [ ] Check spam complaint rate (target: < 0.1%)
  - [ ] Register at Google Postmaster Tools

### Week 3 — Scale
- **Max:** 500 emails/day
- **Target:** Full newsletter lists
- **Rate limit in Listmonk:** 10 emails/minute
- **Actions:**
  - [ ] Verify Google Postmaster Tools reputation
  - [ ] Run mail-tester.com (target: 8+/10)
  - [ ] Contact Hostinger to request sending limit increase

### Week 4+ — Normal Operations
- **Max:** Increase gradually (1000/day, then 2000/day, etc.)
- **Rate limit in Listmonk:** Adjust based on Hostinger limits
- **Actions:**
  - [ ] Continue monitoring reputation weekly
  - [ ] Clean bounced emails from lists
  - [ ] Maintain bounce rate < 2% and complaints < 0.1%

## Monitoring Tools

| Tool | URL | What it checks |
|---|---|---|
| MXToolbox | mxtoolbox.com/blacklists.aspx | IP blacklist status |
| Google Postmaster Tools | postmaster.google.com | Gmail reputation |
| Microsoft SNDS | sendersupport.olc.protection.outlook.com | Outlook reputation |
| mail-tester.com | mail-tester.com | Overall sending score |

## Listmonk Rate Limit Configuration

In `listmonk-config.toml` under `[smtp.default]`:
```toml
max_conns = 5        # Concurrent SMTP connections
idle_timeout = "15s"
```

Adjust `max_conns` as your sending limit increases.
