import { test, expect, describe } from 'vitest';
import { Proxy } from '$lib/proxy';

describe('Proxy', () => {
	const proxy = new Proxy();

	test('writePACBlackList', () => {
		proxy.writePACBlackList(['example.com', 'example.org']);
	});
});
