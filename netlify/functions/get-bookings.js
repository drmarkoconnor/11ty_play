import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_KEY
)

export async function handler() {
	const { data, error } = await supabase
		.from('bookings')
		.select('id, guest_name, start_date, end_date, status')

	if (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: error.message }),
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify(data),
	}
}

