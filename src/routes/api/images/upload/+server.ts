import AllowedFiles from '$lib/types/AllowedFiles.js';

export const POST = async ({ request }) => {
	const form = await request.formData();
	const file = form.get('file') as File;

	if (!file) return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });

	const fileExtension = file.name.split('.').pop()?.toLowerCase();

	if (!fileExtension || !AllowedFiles.includes(fileExtension))
		return new Response(JSON.stringify({ error: 'File type not allowed' }), { status: 400 });
};
