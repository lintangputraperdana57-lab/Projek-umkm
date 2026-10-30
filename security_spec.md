# Security Specification - Pembukuan UMKM

## 1. Data Invariants
1. A transaction can only be created, read, updated, or deleted by the authenticated user who owns the parent `/users/{userId}` path (`request.auth.uid == userId`).
2. A category can only be created, read, updated, or deleted by the authenticated user who owns the parent `/users/{userId}` path (`request.auth.uid == userId`).
3. The `userId` property within any document payload must strictly match the authenticated user's UID (`incoming().userId == request.auth.uid`).
4. Financial transaction amounts must be strictly positive numbers (`incoming().amount is number && incoming().amount > 0`).
5. Transaction types must strictly be either `'income'` or `'expense'`.
6. User profiles under `/users/{userId}` are strictly isolated so that only the user can read or modify their own profile information (`request.auth.uid == userId`).
7. Default deny-all catch rule protects all other paths.

## 2. The "Dirty Dozen" Threat Payloads (Must be Rejected)
1. **Unauthenticated Read on User Profile**: Attempting to read `/users/target_user_123` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Cross-Tenant Read on Transactions**: User B attempting to read `/users/userA/transactions/tx_1` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Transaction Injection**: User B attempting to create `/users/userA/transactions/tx_2` -> `PERMISSION_DENIED`.
4. **Identity Spoofing in Transaction**: User A creating a transaction in their subcollection with payload `userId: "userB"` -> `PERMISSION_DENIED`.
5. **Negative Amount Exploit**: Creating a transaction with `amount: -500000` -> `PERMISSION_DENIED`.
6. **Zero Amount Exploit**: Creating a transaction with `amount: 0` -> `PERMISSION_DENIED`.
7. **Invalid Transaction Type**: Creating a transaction with `type: "stolen_cash"` -> `PERMISSION_DENIED`.
8. **Denial-of-Wallet Payload (Excessive String Size)**: Creating a transaction with a description greater than 250 characters -> `PERMISSION_DENIED`.
9. **Malformed Document ID Attack**: Injecting a path ID with invalid characters or excessive length -> `PERMISSION_DENIED`.
10. **Category Cross-Tenant Write**: User B attempting to modify User A's custom category -> `PERMISSION_DENIED`.
11. **Shadow Field Injection**: Adding arbitrary fields like `isAdmin: true` or `verified: true` to a transaction -> `PERMISSION_DENIED`.
12. **Blanket Query Scraping**: Attempting a collectionGroup query across all users' transactions without user isolation -> `PERMISSION_DENIED`.

## 3. Test Runner Design
The tests verify all operations from unauthenticated clients or unauthorized users return `PERMISSION_DENIED`, and only valid, scoped operations with positive amounts by the authentic owner succeed.
