import { KnowledgeArticle } from '../src/types';

export const ENTERPRISE_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-sso-01',
    title: 'SAML 2.0 & Okta SSO Authentication Troubleshooting Guide',
    category: 'Authentication & SSO',
    summary: 'Resolution steps for 403 Forbidden, certificate expiry, and clock drift during enterprise SSO logins.',
    content: `1. Verify Identity Provider (IdP) Metadata certificate is current and not expired.
2. Ensure Assertion Consumer Service (ACS) URL matches exactly: https://app.enterprise.io/auth/saml/callback
3. Check Clock Skew settings in IdP (tolerance must be within 180 seconds).
4. Verify user attributes are mapped correctly: 'email', 'firstName', 'lastName', and 'groups'.
5. For Okta: Ensure user is explicitly assigned to the application tile in Okta Admin Console.
6. Temporary workaround: Prompt user to clear session cookies or authenticate via incognito session while directory synchronization syncs.`,
    tags: ['sso', 'okta', 'saml', '403-forbidden', 'login-error', 'cert-expired'],
    lastUpdated: '2026-08-15',
    usageCount: 428,
  },
  {
    id: 'kb-billing-02',
    title: 'Enterprise Subscription Invoicing, Seat Adjustments & Refund Policy',
    category: 'Billing & Invoices',
    summary: 'Standard procedures for duplicate charges, seat tier changes, pro-rated refunds, and invoice PO updates.',
    content: `1. Billing Discrepancies: Invoices are generated on the 1st of every calendar month. Pro-rated charges apply for newly added user seats during active billing cycles.
2. Duplicate Charges: If a customer reports duplicate transaction IDs, verify with Stripe payment gateway logs. If confirmed duplicate, issue an immediate automatic reversal within 3-5 business days.
3. PO / Tax Exempt Updates: Billing contacts can update VAT/Tax exemption numbers under Organization Settings > Billing > Tax Details.
4. Refund Guidelines: Annual contract cancellations within 14 days of renewal are eligible for a 100% refund upon management approval.
5. Involuntary Downgrades / Payment Failure: Accounts receive a 7-day grace period before access is throttled to read-only mode.`,
    tags: ['billing', 'invoice', 'refund', 'stripe', 'seats', 'duplicate-charge', 'tax-exemption'],
    lastUpdated: '2026-08-10',
    usageCount: 312,
  },
  {
    id: 'kb-it-03',
    title: 'VPN Connectivity, IP Allowlisting & Network Latency Protocol',
    category: 'IT Infrastructure',
    summary: 'Steps to diagnose WireGuard/OpenVPN tunnel drops, split-tunnel routing, and corporate gateway timeouts.',
    content: `1. Gateway Health Check: Check status dashboard at https://status.enterprise.io/gateways.
2. MTU Packet Size: If connection drops during high throughput, reduce MTU setting from 1500 to 1380 bytes.
3. IP Allowlisting: Ensure outbound egress IPs (198.51.100.4/32, 203.0.113.8/32) are whitelisted on customer enterprise firewalls for port 443/8443.
4. Certificate Rotation: If VPN client logs show 'TLS Handshake Failed: Certificate Expired', user must download latest profile from Employee Self-Service Portal.
5. DNS Resolution: Flush local DNS cache via 'ipconfig /flushdns' (Windows) or 'sudo dscacheutil -flushcache' (macOS).`,
    tags: ['vpn', 'network', 'firewall', 'ip-allowlist', 'latency', 'gateway-timeout'],
    lastUpdated: '2026-08-20',
    usageCount: 567,
  },
  {
    id: 'kb-security-04',
    title: 'Role-Based Access Control (RBAC) & Multi-Factor Auth (MFA) Reset',
    category: 'Security & Access',
    summary: 'Security verification protocols for resetting hardware security keys, TOTP authenticator apps, and admin role elevation.',
    content: `1. Identity Verification: Before resetting an MFA device, verify caller identity via manager authorization or out-of-band Slack verification ping.
2. MFA Reset Process: Navigate to Security Console > Users > [Target User] > Authentication Methods > Revoke Registered MFA Tokens.
3. Temporary Bypass: Issue a 1-time 24-hour backup bypass code restricted to standard privilege level only.
4. Privilege Escalation (Admin/Owner): Admin elevations require dual-custody approval in Jira Access Request queue.
5. Suspicious Login Alerts: If impossible travel is detected, immediately terminate all active JWT sessions and force password reset.`,
    tags: ['mfa', 'totp', 'rbac', 'security', 'password-reset', 'permissions', 'access-control'],
    lastUpdated: '2026-08-22',
    usageCount: 689,
  },
  {
    id: 'kb-bug-05',
    title: 'API Rate Limiting (429 Too Many Requests) & Webhook Retries',
    category: 'Bug & Technical Issue',
    summary: 'Developer guide for handling HTTP 429 status codes, exponential backoff, and webhook delivery failures.',
    content: `1. Tier Limits: Standard API tier permits 600 req/min; Enterprise tier permits 5,000 req/min with burst allowance.
2. Rate Limit Headers: Inspect response headers 'X-RateLimit-Limit', 'X-RateLimit-Remaining', and 'Retry-After'.
3. Recommended Client Handling: Implement jittered exponential backoff (initial delay 500ms, max 3 retries).
4. Webhook Failures: Webhooks automatically retry at 1m, 5m, 15m, 1h, 6h intervals. Ensure endpoint returns HTTP 200 within 4,000ms timeout window.
5. Batch Endpoints: Recommend customer migrate high-frequency single requests to the bulk batch endpoint '/api/v2/events/batch' (up to 500 records per payload).`,
    tags: ['api', 'rate-limit', '429', 'webhooks', 'developer', 'http-error', 'latency'],
    lastUpdated: '2026-08-18',
    usageCount: 294,
  },
  {
    id: 'kb-prod-06',
    title: 'Data Export, Compliance (GDPR/SOC2) & Custom Reporting Setup',
    category: 'Product & Feature Request',
    summary: 'Instructions for exporting workspace audit logs, generating SOC2 compliance reports, and configuring scheduled CSV exports.',
    content: `1. Audit Log Export: Org Admins can export 90-day activity logs in JSON/CSV format from Settings > Compliance & Governance.
2. Automated S3 / GCS Sync: Enterprise plans support streaming real-time audit events to custom AWS S3 bucket or Google Cloud Storage via CloudEvents.
3. Right to Erasure / GDPR: Submit DPO data deletion requests to compliance@enterprise.io. Processing SLA is 30 calendar days.
4. Custom Dashboards: Use the Visual Query Builder to construct scheduled executive reports sent via email or Slack Webhook every Monday at 08:00 UTC.`,
    tags: ['compliance', 'export', 'gdpr', 'soc2', 'audit-log', 'reports', 'analytics'],
    lastUpdated: '2026-08-05',
    usageCount: 184,
  },
];
