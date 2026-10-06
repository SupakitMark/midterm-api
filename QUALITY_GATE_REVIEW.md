# Quality Gate Review

## Finding 1 (Reliability/Accuracy)
- **What was found:** Initial code did not reject bookings where startAt was equal to or after endAt.
- **How it was fixed:** Added a validation check `new Date(startAt).getTime() >= new Date(endAt).getTime()` returning 400 Bad Request.
- **Evidence:** Tested with POST request with startAt after endAt, received status 400 with `{ "error": "startAt must be before endAt" }`.

## Finding 2 (Reliability/Accuracy - Overlap Logic)
- **What was found:** Overlapping booking time check needed to cover partial time overlaps for the same equipment.
- **How it was fixed:** Implemented interval logic `newStart < bEnd && newEnd > bStart` returning 409 Conflict.
- **Evidence:** Creating a overlapping booking returns HTTP 409 with `{ "error": "Booking time conflicts with an existing booking" }`.

## Finding 3 (Reasoning / You Own It)
- **What was found:** Error format across endpoints needed strict consistency to match the specification.
- **How it was fixed:** Ensured all HTTP 400, 404, and 409 error responses return uniform JSON format `{ "error": "..." }`.
- **Evidence:** Verified 400, 404, and 409 responses in curl tests all return `{ "error": "message" }`.