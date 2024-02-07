function FindProxyForURL(url, host) {
  let blocklist = ['news.ycombinator.com'];
  for (const domain of blocklist) {
    if (dnsDomainIs(host, domain)) {
      return 'PROXY 127.0.0.1';
    }
  }
  return 'DIRECT';
}