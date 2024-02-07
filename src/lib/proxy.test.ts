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

	let serviceGUID = execSync(
		`echo "open|||get State:/Network/Global/IPv4|||d.show"\
        | tr '|||' '\\n'\
        | scutil\
        | grep "PrimaryService"\
        | awk '{print $3}'`,
		{ encoding: 'utf-8' },
	)
		.toString()
		.trim();
	let serviceName = execSync(
		`echo "open|||get Setup:/Network/Service/${serviceGUID}|||d.show"\
          | tr '|||' '\\n'\
          | scutil\
          | grep "UserDefinedName"\
          | awk -F': ' '{print $2}'`,
		{ encoding: 'utf-8' },
	)
		.toString()
		.trim();

	const backupPAC = execSync(`networksetup -getautoproxyurl "${serviceName}"`)
		.toString()
		.split('\n')[0]
		.split(' ')[1];

	const proxy = new Proxy(PORT).blacklist(new Domain('news.ycombinator.com'));
	execSync(`networksetup -setautoproxystate "${serviceName}" off`); // reset PAC settings

	test('Proxy should store the backup PAC URL that was originally there', () => {
		expect(proxy.getPACBackupURL()).toBe(backupPAC);
	});

	test('PAC network settings should be set', () => {
		proxy.start();
		expect(execSync(`networksetup -getautoproxyurl "${serviceName}"`).toString()).toBe(
			`URL: http://localhost:${PORT}/whisper.pac\nEnabled: Yes\n`,
		);
		proxy.stop();
	});

	test('PAC network settings should be turned off', () => {
		proxy.start();
		proxy.stop();
		expect(execSync(`networksetup -getautoproxyurl "${serviceName}"`).toString()).toBe(
			`URL: http://localhost:${PORT}/whisper.pac\nEnabled: No\n`,
		);
	});

	execSync(`networksetup -setautoproxyurl "${serviceName}" "${backupPAC}"`);
});
