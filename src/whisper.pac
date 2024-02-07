function FindProxyForURL(url, host) {
  console.log(url);
  console.log(host);
  let blocklist = ['https://twitter.com/pandoks_'];
  for (const domain of blocklist) {
    if (blocklist.includes(domain)) {
      return 'PROXY 127.0.0.1';
    }
  }
  return 'DIRECT';
}

