import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY
)

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
	if (event.httpMethod !== 'PUT') {
		return noCache({ error: 'Method not allowed' }, 405)
	}

	let body
	try {
		body = JSON.parse(event.body || '{}')
	} catch {
		return noCache({ error: 'Invalid JSON' }, 400)
	}

	const { id, ...fields } = body
	if (!id) return noCache({ error: 'id required' }, 400)

	// Load current record to know the effective dates/status if not all fields are supplied
	const { data: current, error: getErr } = await supabase
		.from('bookings')
		.select('id, guest_name, email, start_date, end_date, status')
		.eq('id', id)
		.single()

	if (getErr || !current) {
		return noCache({ error: getErr?.message || 'Not found' }, 404)
	}

	const next = {
		guest_name: fields.guest_name ?? current.guest_name,
		email: fields.email ?? current.email,
		start_date: fields.start_date ?? current.start_date,
		end_date: fields.end_date ?? current.end_date,
		status: (fields.status ?? current.status ?? 'pending').toLowerCase(),
	}

	const s = new Date(next.start_date)
	const e = new Date(next.end_date)
	if (isNaN(s) || isNaN(e)) {
		return noCache({ error: 'Invalid dates' }, 400)
	}
	if (s > e) {
		return noCache({ error: 'start_date must be <= end_date' }, 400)
	}

	// Only check for conflicts if resulting status is not 'cancelled'
	if (next.status !== 'cancelled') {
		const { data: conflicts, error: conflictErr } = await supabase
			.from('bookings')
			.select('id, start_date, end_date, status')
			.neq('id', id) // exclude self
			.lte('start_date', next.end_date)
			.gte('end_date', next.start_date)
			.in('status', ['pending', 'confirmed'])

		if (conflictErr) return noCache({ error: conflictErr.message }, 500)

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
	}

	// Perform the update (only the provided fields — you can also pass `next` if you prefer)
	const { data, error } = await supabase
		.from('bookings')
		.update(fields)
		.eq('id', id)
		.select()
		.single()

	if (error) return noCache({ error: error.message }, 500)
	return noCache({ ok: true, booking: data }, 200)
}

