import { error } from '@sveltejs/kit';
import fs from 'fs';

let counter = 0;
// When changing the PAC file, you need to turn off PAC in the network settings completely and then
// turn it back on

export const GET = () => {
	console.log('Endpoint HIT', counter);
	try {
		const pacFileContent = fs.readFileSync('./src/routes/whisper.pac/whisper.pac', 'utf-8');
		console.log(pacFileContent);

		const options: ResponseInit = {
			status: 200,
			headers: {
				'Content-Type': 'application/x-ns-proxy-autoconfig',
			},
		};

		return new Response(pacFileContent, options);
	} catch (e: any) {
		throw error(404, `File not found: ${e.message}`);
	}
};
