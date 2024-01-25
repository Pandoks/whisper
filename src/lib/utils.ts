import { execSync } from 'child_process';

export const execute = (command: string): string => {
	return execSync(`echo ${command} | tr '|||' '\\n' | scutil`).toString();
};
