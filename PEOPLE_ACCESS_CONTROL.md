# Recharza People & Access Control

This subsystem makes customer restrictions, staff roles, scoped permissions, and session revocation real backend controls rather than visual admin labels.

## Account access states

| State | Sign in | Existing session | Create orders |
|---|---:|---:|---:|
| `ACTIVE` | Yes | Yes | Yes |
| `ORDER_RESTRICTED` | Yes | Yes | No |
| `SIGN_IN_RESTRICTED` | No | Revoked | No |
| `SUSPENDED` | No | Revoked | No |

Order access is protected at both the authenticated request boundary and a PostgreSQL insert trigger. This prevents an alternative or future order-writing route from bypassing the restriction.

## Staff permissions

The backend recognizes these permission IDs:

- `orders.read`
- `orders.manage`
- `fulfilment.manage`
- `customers.read`
- `catalogue.read`
- `support.manage`
- `audit.read`

Existing staff records created before this migration receive the legacy operational permission set until an administrator explicitly saves their permission configuration. Once configured, an empty permission list means no protected operator permissions.

The current operator backend enforces:

- order listing: `orders.read`
- order status transitions: `orders.manage`
- fulfilment planning and retries: `fulfilment.manage`

Administrators retain all permissions. The emergency operator token remains a separate audited override path.

## Administrator controls

The `/admin` People & Access console supports:

- searching all account records;
- filtering by role and access state;
- viewing order, stored-session, and active-session counts;
- changing customer access state;
- promoting a customer to staff;
- demoting staff to customer;
- selecting exact staff permissions;
- revoking all active sessions;
- reviewing current restriction evidence.

Every mutation requires an audit reason and creates an `AdminAuditLog` record.

## Safety invariants

- The active administrator cannot modify or revoke their own account.
- Administrator accounts cannot be changed through this single-admin route.
- Creating or promoting administrators requires a future dual-approval workflow.
- Role changes revoke all active sessions for the target account.
- Sign-in restriction and suspension revoke all active sessions.
- Staff permission changes are enforced by backend routes, not trusted from the UI.
- Session token hashes, magic-link hashes, and user-agent hashes are never returned by the people API.
- Environment allowlists establish a role only when an account is first created. Database role decisions remain authoritative after creation.

## Future work

- dual approval for administrator changes;
- individual-session inspection and selective revocation;
- permission bundles and named staff teams;
- temporary access with automatic expiry;
- support-case assignment permissions;
- catalogue write permissions;
- audit export and access-review reports;
- clearer customer-facing restriction messages at checkout.
