# Security Specification: Nautiyal Cyber Cafe

## 1. Data Invariants
1. Customer PII (name, phone, email) can only be read by the owner user or an authorized admin.
2. A customer cannot grant themselves the admin or main_admin role.
3. Every application must be bound to the authenticated customerId matching `request.auth.uid`.
4. Customers can only update their own application's payment proof and submitted documents, never the status or completed documents.
5. Service catalogue is private to logged-in users and only modifiable by authorized admins.
6. Messages under an application are strictly gated by parent application ownership or admin role.
7. Document returns and completed files can only be attached by authorized administrators.
8. Bootstrapped super admin is reserved for owner email `Anujnautiyal.ca@gmail.com`.

## 2. The Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. **Ghost Admin Escalation**: Customer sets `role: "main_admin"` in `/users/{uid}`.
2. **ID Impersonation on Application**: User A creates application with `customerId: "userB"`.
3. **Status Short-circuit**: Customer updates application status directly from `Pending` to `Completed`.
4. **Completed Document Forgery**: Customer attaches completed PDF directly into `completedDocuments`.
5. **Unauthorized Application Inspection**: Customer A lists or gets `/applications/{appB}` belonging to Customer B.
6. **Service Price Tampering**: Regular customer tries to modify `fee` in `/services/{serviceId}`.
7. **Broadcast Hijacking**: Non-admin user tries to write into `/announcements/{id}`.
8. **Admin Creation Bypass**: Regular admin tries to create another `main_admin` or edit admin roles without main_admin privilege.
9. **Message Spoofing**: Customer A posts a message in Customer B's application.
10. **Payment Fraud Flagging**: Customer marks their own `paymentStatus: "verified"`.
11. **Config Overwrite**: Unauthenticated or normal customer modifies UPI ID or QR code in `/cafeConfig/general`.
12. **Customer Data Destruction**: Customer attempts to delete financial application records of another user.
