import { Hono } from 'hono'

const app = new Hono()

// ข้อมูลอุปกรณ์เริ่มต้นตามข้อกำหนด
const equipmentList = [
  { id: "eq-1", name: "Projector A", location: "Building 1" },
  { id: "eq-2", name: "Camera B", location: "Studio 2" }
]

interface Booking {
  id: string
  equipmentId: string
  borrowerName: string
  startAt: string
  endAt: string
  purpose: string
}

let bookings: Booking[] = []

// Helper: ตรวจสอบรูปแบบวันที่
function isValidDate(dateStr: string) {
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

// Helper: ตรวจสอบการจองเวลาทับซ้อน (Overlap Logic)
function isOverlapping(
  eqId: string, 
  startAt: string, 
  endAt: string, 
  excludeId?: string
) {
  const newStart = new Date(startAt).getTime()
  const newEnd = new Date(endAt).getTime()

  return bookings.some(b => {
    if (b.equipmentId !== eqId) return false
    if (excludeId && b.id === excludeId) return false

    const bStart = new Date(b.startAt).getTime()
    const bEnd = new Date(b.endAt).getTime()

    return newStart < bEnd && newEnd > bStart
  })
}

// 1. GET /api/equipment
app.get('/api/equipment', (c) => {
  return c.json(equipmentList, 200)
})

// 2. GET /api/bookings
app.get('/api/bookings', (c) => {
  return c.json(bookings, 200)
})

// 3. GET /api/bookings/:id
app.get('/api/bookings/:id', (c) => {
  const id = c.req.param('id')
  const booking = bookings.find(b => b.id === id)
  if (!booking) {
    return c.json({ error: "Booking not found" }, 404)
  }
  return c.json(booking, 200)
})

// 4. POST /api/bookings (สร้างการจอง + เช็ค Overlap)
app.post('/api/bookings', async (c) => {
  try {
    const body = await c.req.json()
    const { equipmentId, borrowerName, startAt, endAt, purpose } = body

    // Validation: ตรวจสอบข้อมูลจำเป็น
    if (!equipmentId || !borrowerName || !startAt || !endAt || !purpose) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    // Validation: ตรวจสอบว่ามีอุปกรณ์นี้จริงหรือไม่
    const eqExists = equipmentList.some(eq => eq.id === equipmentId)
    if (!eqExists) {
      return c.json({ error: "Equipment not found" }, 400)
    }

    // Validation: รูปแบบวันที่
    if (!isValidDate(startAt) || !isValidDate(endAt)) {
      return c.json({ error: "Invalid date format" }, 400)
    }

    // Validation: เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      return c.json({ error: "startAt must be before endAt" }, 400)
    }

    // Validation: ตรวจสอบเวลาจองทับซ้อน
    if (isOverlapping(equipmentId, startAt, endAt)) {
      return c.json({ error: "Booking time conflicts with an existing booking" }, 409)
    }

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      equipmentId,
      borrowerName,
      startAt,
      endAt,
      purpose
    }

    bookings.push(newBooking)
    return c.json(newBooking, 201)
  } catch (e) {
    return c.json({ error: "Invalid JSON payload" }, 400)
  }
})

// 5. PATCH /api/bookings/:id (แก้ไขการจอง)
app.patch('/api/bookings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const bookingIndex = bookings.findIndex(b => b.id === id)
    if (bookingIndex === -1) {
      return c.json({ error: "Booking not found" }, 404)
    }

    const body = await c.req.json()
    const current = bookings[bookingIndex]

    const equipmentId = body.equipmentId ?? current.equipmentId
    const borrowerName = body.borrowerName ?? current.borrowerName
    const startAt = body.startAt ?? current.startAt
    const endAt = body.endAt ?? current.endAt
    const purpose = body.purpose ?? current.purpose

    if (!isValidDate(startAt) || !isValidDate(endAt)) {
      return c.json({ error: "Invalid date format" }, 400)
    }

    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      return c.json({ error: "startAt must be before endAt" }, 400)
    }

    if (isOverlapping(equipmentId, startAt, endAt, id)) {
      return c.json({ error: "Booking time conflicts with an existing booking" }, 409)
    }

    const updatedBooking: Booking = {
      id,
      equipmentId,
      borrowerName,
      startAt,
      endAt,
      purpose
    }

    bookings[bookingIndex] = updatedBooking
    return c.json(updatedBooking, 200)
  } catch (e) {
    return c.json({ error: "Invalid JSON payload" }, 400)
  }
})

// 6. DELETE /api/bookings/:id (ลบการจอง)
app.delete('/api/bookings/:id', (c) => {
  const id = c.req.param('id')
  const index = bookings.findIndex(b => b.id === id)
  if (index === -1) {
    return c.json({ error: "Booking not found" }, 404)
  }

  bookings.splice(index, 1)
  return c.body(null, 204)
})

export default app