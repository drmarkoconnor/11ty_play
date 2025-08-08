import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY
)

export async function handler(event) {
	const { id } = event.queryStringParameters || {}
	if (!id)
		return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) }

	const { data, error } = await supabase
		.from('bookings')
		.select('*')
		.eq('id', id)
		.single()
	if (error)
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) }

	return { statusCode: 200, body: JSON.stringify(data) }
}

