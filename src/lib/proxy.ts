import { execSync } from 'child_process';

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
			this.blackList.push(`${subdomain}.${domain}/${slug}`);
		}
		return this;
	}
}

export class Proxy {
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

	public getServiceGUID() {
		return this.serviceGUID;
	}

	public getServiceName() {
		return this.serviceName;
	}
}
