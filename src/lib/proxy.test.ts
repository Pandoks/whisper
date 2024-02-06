import { test, expect, describe } from 'vitest';
import { Domain, Proxy } from '$lib/proxy';

describe('Proxy', () => {
	const proxy = new Proxy().blacklist(new Domain('news.ycombinator.com'));
	proxy.start();
});
