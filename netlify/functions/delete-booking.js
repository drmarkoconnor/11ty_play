import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY
)

export async function handler(event) {
	if (event.httpMethod !== 'DELETE') {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: 'Method not allowed' }),
		}
	}
	const { id } = event.queryStringParameters || {}
	if (!id)
		return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) }

	const { error } = await supabase.from('bookings').delete().eq('id', id)
	if (error)
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) }

	return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}

