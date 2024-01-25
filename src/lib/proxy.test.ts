import { test, expect, describe } from 'vitest';
import { Proxy } from '$lib/proxy';

describe('Proxy', () => {
	const proxy = new Proxy();
	proxy.blockAll();
	test('whitelist', () => {
		proxy.writePACWhiteList(['test']);
	});
});
