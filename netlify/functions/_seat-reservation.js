/**
 * Trip seat holds: reserved when payment starts, released if payment fails.
 */

export function assertSeatBookable(trip, seatNumber) {
  const bookedSeats = trip.bookedSeats || [];

  if (trip.status !== 'scheduled') {
    throw Object.assign(new Error('Trip is not available for booking'), { statusCode: 409 });
  }

  if (seatNumber > trip.onlineSeats || seatNumber > trip.totalSeats) {
    throw Object.assign(new Error('Seat is not available for online booking'), { statusCode: 409 });
  }

  if (bookedSeats.includes(seatNumber)) {
    throw Object.assign(new Error('Seat is already booked'), { statusCode: 409 });
  }
}

export function reserveSeatInTransaction(tx, tripRef, trip, seatNumber) {
  assertSeatBookable(trip, seatNumber);
  const bookedSeats = trip.bookedSeats || [];
  const newBooked = [...bookedSeats, seatNumber];
  tx.update(tripRef, {
    bookedSeats: newBooked,
    availableSeats: trip.onlineSeats - newBooked.length,
  });
  return newBooked;
}

export function releaseSeatInTransaction(tx, tripRef, trip, seatNumber) {
  const bookedSeats = trip.bookedSeats || [];
  if (!bookedSeats.includes(seatNumber)) return bookedSeats;
  const newBooked = bookedSeats.filter((s) => s !== seatNumber);
  tx.update(tripRef, {
    bookedSeats: newBooked,
    availableSeats: trip.onlineSeats - newBooked.length,
  });
  return newBooked;
}

/**
 * Completes a successful payment: creates booking. Seat may already be in bookedSeats (hold).
 */
export function applySuccessfulBooking(tx, {
  tripRef,
  trip,
  payment,
  bookingRef,
  bookingId,
  admin,
}) {
  const bookedSeats = trip.bookedSeats || [];
  const seatNumber = payment.seatNumber;

  if (bookedSeats.includes(seatNumber)) {
    if (!payment.seatReserved) {
      return { ok: false, failureReason: 'Seat is already booked' };
    }
  } else {
    const newBooked = [...bookedSeats, seatNumber];
    tx.update(tripRef, {
      bookedSeats: newBooked,
      availableSeats: trip.onlineSeats - newBooked.length,
    });
  }

  tx.set(bookingRef, {
    id: bookingId,
    tripId: payment.tripId,
    passengerId: payment.passengerId,
    companyId: payment.companyId,
    seatNumber,
    passengerName: payment.passengerName,
    passengerPhone: payment.passengerPhone,
    origin: payment.origin,
    destination: payment.destination,
    departureDate: payment.departureDate,
    departureTime: payment.departureTime,
    price: payment.amount,
    status: 'confirmed',
    qrCode: bookingId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, bookingId };
}
