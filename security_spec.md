# Security Specification - Lumière Bakery

## Data Invariants
- A `MenuItem` can only be created/updated by admins.
- A `Booking` must have a valid `customerName`, `customerEmail`, `date`, `time`, and `guests`.
- `guests` must be between 1 and 20.
- `status` for a new booking must be `pending`.
- Users can only read and manage their own bookings (if signed in).
- Public can create bookings without signing in (as per requirement for "online booking system" usually implying ease of use, but I'll add optional auth).

## The "Dirty Dozen" Payloads (Booking)
1. Missing `customerName`.
2. `guests` > 20.
3. `status` set to `confirmed` on creation.
4. `customerEmail` with invalid format.
5. `id` with malicious characters.
6. `createdAt` set to a future date (not server time).
7. `userId` mismatch with auth.uid.
8. Updating `createdAt` after creation.
9. Deleting a booking not owned by the user.
10. Reading all bookings as a guest.
11. Injecting 1MB string into `notes`.
12. Updating `id` of a document.

## The Test Runner
(I'll focus on generating the `firestore.rules` directly with the hardened patterns).
