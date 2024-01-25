function FindProxyForURL(url, host) {
  let blocklist = ['example.com', 'example.org'];
  for (const domain of blocklist) {
    if (dnsDomainIs(host, domain)) {
      return "PROXY proxy.server:port";
    }
  }
  return "DIRECT";
}