# GTM Web + Server-Side GTM Configuration

## GTM Web Container

### Tags

| Tag Name | Type | Trigger | Details |
|---|---|---|---|
| Meta Pixel - Base | Custom HTML | All Pages | Standard fbevents.js with Pixel ID |
| GA4 - Config | Google Analytics 4 | All Pages | Measurement ID |
| sGTM Transport | GA4 Event (Web) | All Pages | Transport URL = t.digitalcopilot.app |

### Triggers

| Trigger Name | Type | Conditions |
|---|---|---|
| All Pages | Page View | All page views |
| Product Page View | Page View | URL contains /produto/ or /oferta/ |
| Checkout Initiated | Custom Event | event = begin_checkout |
| Lead Form Submit | Form Submission | Form ID matches lead forms |

### Variables

| Variable Name | Type | Value |
|---|---|---|
| DL - User Email Hash | Data Layer Variable | user.email_hash |
| DL - User ID | Data Layer Variable | user.id |
| Cookie - _fbc | 1st Party Cookie | _fbc |
| Cookie - _fbp | 1st Party Cookie | _fbp |

### DataLayer Setup (WordPress)

Add to the WordPress theme or via GTM4WP plugin:

```javascript
// Push user data to dataLayer when logged in
window.dataLayer = window.dataLayer || [];
// The email hash should be generated server-side (PHP)
if (typeof userEmailHash !== 'undefined') {
  dataLayer.push({
    'user': {
      'email_hash': userEmailHash,
      'id': userId
    }
  });
}
```

## Server-Side GTM Container (on Stape.io)

### Clients

| Client Name | Type | Details |
|---|---|---|
| GA4 Client | GA4 | Receives GA4 requests from web container |

### Tags

| Tag Name | Type | Trigger | Details |
|---|---|---|---|
| Meta CAPI - PageView | Meta Conversions API | GA4 - page_view | action_source: website |
| Meta CAPI - ViewContent | Meta Conversions API | GA4 - view_item | With product data |
| Meta CAPI - InitiateCheckout | Meta Conversions API | GA4 - begin_checkout | With cart value |
| Meta CAPI - Lead | Meta Conversions API | GA4 - generate_lead | With form data |
| Meta CAPI - Purchase | Meta Conversions API | GA4 - purchase | With transaction data |

### Meta CAPI Tag Configuration

For each Meta CAPI tag:
- **Pixel ID:** {{Meta Pixel ID}} (server variable)
- **API Access Token:** {{Meta Access Token}} (server variable)
- **Action Source:** website
- **Event ID:** {{Event ID}} (for deduplication with client-side Pixel)

### User Data Parameters

| Parameter | Source | Notes |
|---|---|---|
| em | User email from DataLayer | Auto-hashed by tag |
| ph | User phone from DataLayer | Auto-hashed by tag |
| fbc | _fbc cookie | Forwarded by GA4 client |
| fbp | _fbp cookie | Forwarded by GA4 client |
| client_ip_address | Request IP | Auto-captured by sGTM |
| client_user_agent | Request UA | Auto-captured by sGTM |

## Consent Mode v2 (LGPD)

Implement on all WordPress sites:

```javascript
// Default denied (before user consent)
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied'
});

// After user grants consent
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted'
});
```

Use a cookie consent plugin (e.g., Cookiebot, CookieYes) that integrates with GTM Consent Mode v2.

## WordPress Integration

1. Install the GTM4WP plugin
2. Enter GTM Container ID (GTM-XXXXXXX)
3. Enable "Use Custom Loader" with Stape.io URL
4. Configure DataLayer enrichment for logged-in users
5. Verify events firing in GTM Preview mode
6. Verify events appearing in Meta Events Manager
