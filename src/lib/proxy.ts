import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export class Domain {
	private domain: string | string[] = ''; // domain.tld
	private whiteList: string[] = []; // only use whitelist if blockAllToggle is true
	private blackList: string[] = []; // only use blacklist if blockAllToggle is false
	private modifyList: string[] = [];
	private blockAllToggle: boolean = false;

	constructor(domain: string | string[]) {
		this.domain = domain;
		return this;
	}

	public getBlacklist() {
		return this.blackList;
	}

	public getWhitelist() {
		return this.whiteList;
	}

	public getDomain() {
		return this.domain;
	}

	public isBlockAll() {
		return this.blockAllToggle;
	}

	public blockAll() {
		this.blockAllToggle = true;
		return this;
	}

	public whitelist(subdomain: string, slug: string) {
		if (!this.blockAllToggle) {
			throw new Error('Whitelist only works if blocking all of a domain');
		}

		if (typeof this.domain === 'string') {
			this.whiteList.push(`${subdomain}.${this.domain}/${slug}`);
			return this;
		}

		for (const domain of this.domain) {
			this.whiteList.push(`${subdomain}.${domain}/${slug}`);
		}
		return this;
	}

	public blacklist(subdomain: string, slug: string) {
		if (!this.blockAllToggle) {
			throw new Error("Blacklist doesn't work when you're blocking everything already");
		}

		if (typeof this.domain === 'string') {
			this.blackList.push(`${subdomain}.${this.domain}/${slug}`);
			return this;
		}

		for (const domain of this.domain) {
			this.blackList.push(`${subdomain}.${domain}/${slug}`);
		}
		return this;
	}

	public modify(subdomain: string, slug: string) {
		if (typeof this.domain === 'string') {
			this.modifyList.push(`${subdomain}.${this.domain}/${slug}`);
			return this;
		}

		for (const domain of this.domain) {
			this.modifyList.push(`${subdomain}.${domain}/${slug}`);
		}
		return this;
	}
}

export class Proxy {
	private whiteList: Domain[] = []; // only use whitelist if blockAllToggle is true
	private blackList: Domain[] = []; // only use blacklist if blockAllToggle is false
	private modifyList: Domain[] = [];
	private blockAllToggle: boolean = false;
	private startStatus: boolean = false;

	private serviceGUID: string;
	private serviceName: string;

	constructor() {
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
		if (!serviceGUID) {
			throw new Error('Primary service not found.');
		}

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
		if (!serviceName) {
			throw new Error('Service name not found.');
		}

		this.serviceGUID = serviceGUID;
		this.serviceName = serviceName;
		return this;
	}

	public blockAll() {
		this.blockAllToggle = true;
		return this;
	}

	public whitelist(domain: Domain) {
		if (!this.blockAllToggle) {
			throw new Error('Whitelist only works if blocking all domains');
		}
		this.whiteList.push(domain);
		return this;
	}

	public blacklist(domain: Domain) {
		if (this.blockAllToggle) {
			throw new Error("Blacklist doesn't work when you're blocking everything already");
		}
		this.blackList.push(domain);
		return this;
	}

	public modify(domain: Domain) {
		this.modifyList.push(domain);
		return this;
	}

	public start() {
		if (this.startStatus) {
			throw new Error('Proxy is already started');
		}
	}

	public stop() {}

	public udpate() {}

	public writePACBlackList(blockList: string[]) {
		if (this.blockAllToggle) {
			throw new Error("Can't update blocklist because Whisper is blocking all");
		}
		const filePath = path.join(__dirname, 'whisper.pac');
		const content = `function FindProxyForURL(url, host) {\n\
  let blocklist = [${blockList.map((domain) => `'${domain}'`).join(', ')}];\n\
  for (const domain of blocklist) {\n\
    if (dnsDomainIs(host, domain)) {\n\
      return "PROXY proxy.server:port";\n\
    }\n\
  }\n\
  return "DIRECT";\n\
}`;

		fs.writeFileSync(filePath, content, 'utf-8');
	}
}
