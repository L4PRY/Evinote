export function load({ params }) {
	const { id } = params;

	// okay so
	// check for perms if board.type is private
	// if board.type is public, just return the board
	// if board.type is unlisted, check for perms if user is logged in, otherwise just return the board
	return {
		id
	};
}
