import { test, expect, describe } from 'vitest';
import { Domain, Proxy } from '$lib/proxy';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';

describe('Proxy', () => {
	const mockServer = http.createServer((request, response) => {
		if (request.method !== 'GET' || request.url !== '/whisper.pac') {
			response.statusCode = 404;
			response.setHeader('Content-Type', 'text/plain');
			response.write('Bad Request');
			response.end();
			return;
		}

		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', 'GET');
		response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		const pacFileContent = fs.readFileSync('./src/whisper.pac', 'utf-8');
		response.statusCode = 200;
		response.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig');
		response.write(pacFileContent);
		response.end();
	});
	mockServer.listen(0, () => {
		// @ts-ignore
		const port = mockServer.address()!.port;
		console.log(`Server is listening on port ${port}`);
	});
	// @ts-ignore
	const PORT = mockServer.address()!.port;

	const proxy = new Proxy(PORT).blacklist(new Domain('news.ycombinator.com'));
	const serviceName = proxy.getServiceName();
	execSync(`networksetup -setautoproxystate "${serviceName}" off`); // reset PAC settings

	proxy.start();
});
