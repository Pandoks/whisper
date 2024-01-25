import { test, expect, describe } from 'vitest';
import { Proxy } from '$lib/proxy';

test('Proxy', () => {
	const proxy = new Proxy();
	console.log('ServiceGUID:', proxy.getServiceGUID());
	console.log('ServiceName:', proxy.getServiceName());
});
