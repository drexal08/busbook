# Firestore Rules Compatibility Notes

Generated during the BusBook rules update.

## Collections and Access Patterns

- `users`: owner profile reads/updates, admin reads, company owner approves/rejects operators in the same company.
- `companies`: public read for current dashboards and trip search; authenticated company signup creates pending company; admin changes status only.
- `routes`, `buses`, `trips`, `tripTemplates`: public read for search/dashboard compatibility; approved company accounts manage their own company records.
- `bookings`: role-scoped list queries in the app; public document get and confirmed-to-used update retained for the current ticket URL and scan demo.
- `payments`: passenger/company/admin read, server-only writes.
- `emailOtps`: server-only read/write.

## Query Compatibility

- Passenger bookings: `where('passengerId', '==', user.id)`.
- Company/operator bookings: `where('companyId', '==', user.companyId)`.
- Admin bookings: collection read.
- Company routes/buses/trips/templates: `where('companyId', '==', companyId)`.
- Public trip search reads `companies`, `routes`, `buses`, and `trips`.

## Known Compatibility Exceptions

- Booking document `get` is public because `/ticket/:bookingId` currently reads by raw booking ID.
- Booking status can move from `confirmed` to `used` without auth because `/scan` is intentionally left as a demonstration page.
- Public reads on companies expose company contact fields because the current app stores display and contact fields together.

## Hardening Follow-Up

- Replace raw booking IDs in QR codes with signed ticket tokens.
- Move scan validation to a backend function and require approved operators.
- Split public company display data from private company contact data.
- Move company/operator/admin mutations to backend functions or custom-claim-backed rules.
