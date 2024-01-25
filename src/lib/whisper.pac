function FindProxyForURL(url, host) {
  let whitelist = ['test'];
  for (const domain of whitelist) {
    if (dnsDomainIs(host, domain)) {
      return 'DIRECT';
    }
  }
  return 'PROXY proxy.server:port';
}