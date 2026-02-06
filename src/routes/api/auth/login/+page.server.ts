// user sends credentials thru api
// backend authenticates and sends back a session token
//  with which they can set a bearer header to access protected routes

export function POST({ request, cookies }) {
	const { username, password } = await request.json();
}
