import type { TextChannel } from 'discord.js';
import type { LogHandler } from '../log-handler.js';

export class PlayerLoginHandler implements LogHandler {

	// [I 48:24:40,129] [server] Player 'Name' logged in with Permissions:
	private static readonly PATTERN: RegExp = /^\[.+\] \[server\] Player '(?<name>.+)' logged in with Permissions:$/;

	public constructor(private channel: TextChannel) {}

	public async onParsed(line: string): Promise<void> {
		const match: RegExpMatchArray | null = line.match(PlayerLoginHandler.PATTERN);
		if (!match) return;

		const name: string = match.groups!.name!;
		console.log(`player logged in: ${name}`);
		await this.channel.send(`${name} logged in`);
	}

}
