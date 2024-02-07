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

	private pacFilePath: string = `${path.join(
		__dirname,
		'..',
		'routes/whisper.pac',
		'whisper.pac',
	)}`;
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

		if (this.blockAllToggle) {
			this.writePACWhiteList(this.extractDomains(this.whiteList));
		} else {
			this.writePACBlackList(this.extractDomains(this.blackList));
		}

		// TODO: start proxy and deal with modification
		execSync(`networksetup -setautoproxyurl "${this.serviceName}" "${this.pacFilePath}"`);
		this.startStatus = true;
		return this;
	}

	public stop() {
		if (!this.startStatus) {
			throw new Error("Proxy hasn't started");
		}

		execSync(`networksetup -setautoproxyurl "${this.serviceName}" ""`);
		this.startStatus = false;
		return this;
	}

	public udpate() {}

	private writePACBlackList(blockList: string[]) {
		if (this.blockAllToggle) {
			throw new Error("Can't update blocklist because Whisper is blocking all");
		}
		const content = `function FindProxyForURL(url, host) {\n\
  let blocklist = [${blockList.map((domain) => `'${domain}'`).join(', ')}];\n\
  for (const domain of blocklist) {\n\
    if (dnsDomainIs(host, domain)) {\n\
      return 'PROXY 127.0.0.1';\n\
    }\n\
  }\n\
  return 'DIRECT';\n\
}`;

		fs.writeFileSync(this.pacFilePath, content, 'utf-8');
	}

	private writePACWhiteList(whiteList: string[]) {
		if (!this.blockAllToggle) {
			throw new Error("Can't update whitelist because Whisper isn't blocking all");
		}
		const content = `function FindProxyForURL(url, host) {\n\
  let whitelist = [${whiteList.map((domain) => `'${domain}'`).join(', ')}];\n\
  for (const domain of whitelist) {\n\
    if (dnsDomainIs(host, domain)) {\n\
      return 'DIRECT';\n\
    }\n\
  }\n\
  return 'PROXY 127.0.0.1';\n\
}`;

		fs.writeFileSync(this.pacFilePath, content, 'utf-8');
	}

	private extractDomains(domains: Domain[]): string[] {
		let list: string[] = [];
		for (const domain of domains) {
			const domainList = domain.getDomain();
			if (typeof domainList === 'string') {
				list.push(domainList);
			} else {
				list = list.concat(domainList);
			}
		}

		return list;
	}
}
