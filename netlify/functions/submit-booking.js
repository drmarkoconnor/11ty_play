import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY
)

// send JSON with no-cache headers
function noCache(body, statusCode = 200) {
	return {
		statusCode,
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			Pragma: 'no-cache',
			Expires: '0',
			'Surrogate-Control': 'no-store',
			'Content-Type': 'application/json',
		},
		body: typeof body === 'string' ? body : JSON.stringify(body),
	}
}

export async function handler(event) {
	if (event.httpMethod !== 'POST') {
		return noCache({ error: 'Method not allowed' }, 405)
	}

	let payload
	try {
		payload = JSON.parse(event.body || '{}')
	} catch {
		return noCache({ error: 'Invalid JSON body' }, 400)
	}

	const {
		guest_name,
		email,
		start_date, // "YYYY-MM-DD"
		end_date, // "YYYY-MM-DD"
		status = 'pending',
	} = payload

	if (!guest_name || !email || !start_date || !end_date) {
		return noCache(
			{ error: 'guest_name, email, start_date, end_date are required' },
			400
		)
	}

	const s = new Date(start_date)
	const e = new Date(end_date)
	if (isNaN(s) || isNaN(e)) {
		return noCache({ error: 'Invalid dates' }, 400)
	}
	if (s > e) {
		return noCache({ error: 'start_date must be <= end_date' }, 400)
	}

	// --- Conflict detection: overlap with non-cancelled bookings
	// Overlap rule: existing.start <= new_end AND existing.end >= new_start
	const { data: conflicts, error: conflictErr } = await supabase
		.from('bookings')
		.select('id, guest_name, start_date, end_date, status')
		.lte('start_date', end_date)
		.gte('end_date', start_date)
		.in('status', ['pending', 'confirmed'])

	if (conflictErr) {
		return noCache({ error: conflictErr.message }, 500)
	}
	if (conflicts && conflicts.length > 0) {
		return noCache(
			{
				error: 'DATES_CONFLICT',
				message: 'Requested dates overlap an existing booking.',
				conflicts: conflicts.map((c) => ({
					id: c.id,
					status: c.status,
					start_date: c.start_date,
					end_date: c.end_date,
				})),
			},
			409
		)
	}

	// --- Create
	const { data, error } = await supabase
		.from('bookings')
		.insert([{ guest_name, email, start_date, end_date, status }])
		.select()
		.single()

	if (error) return noCache({ error: error.message }, 500)
	return noCache({ ok: true, booking: data }, 200)
}

