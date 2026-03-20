# Stape.io + sGTM Setup

## Step 1: Create Stape.io Account

1. Go to stape.io and create an account
2. Select the Starter plan ($20/month — 500k requests/month)
3. Create a new sGTM container

## Step 2: Configure Custom Domain

1. In Stape.io dashboard, go to your container settings
2. Add custom domain: `t.digitalcopilot.app`
3. Add the DNS records Stape provides (usually a CNAME)
4. Wait for DNS propagation and SSL provisioning
5. Verify the custom domain is active

## Step 3: Enable Custom Loader

1. In Stape dashboard → Custom Loader
2. Enable it — this loads GTM via your first-party domain
3. Copy the custom loader script to replace the standard GTM snippet
4. This bypasses most adblockers since requests go to your own domain

## Step 4: Enable Cookie Keeper

1. In Stape dashboard → Cookie Keeper
2. Enable it
3. This extends cookie attribution from 7 days (ITP) to 90+ days
4. Significantly improves conversion tracking accuracy

## Step 5: Configure sGTM Container

1. Open Google Tag Manager → Server-side container
2. Link it to your Stape.io container URL
3. Configure tags (see docs/gtm-setup.md)

## Verification

```
# Check custom domain responds
curl -I https://t.digitalcopilot.app

# Should return 200 OK with Stape headers
```
