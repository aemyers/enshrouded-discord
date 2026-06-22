import type { TextChannel } from 'discord.js';
import type { LogHandler } from '../log-handler.js';

export class PlayerCountHandler implements LogHandler {

	// [I 48:24:40,129] [server] Player 'Name' logged in with Permissions:
	private static readonly ADDED: RegExp = /^\[.+\] \[server\] Player '.+' logged in with Permissions:$/;

	// [I 51:07:42,567] [server] Remove Player 'Name'
	private static readonly REMOVED: RegExp = /^\[.+\] \[server\] Remove Player '.+'$/;

	private count: number = 0;

	public constructor(private channel: TextChannel) {}

	public async onParsed(line: string): Promise<void> {
		let changed: boolean = this.parseAdded(line);
		if (!changed) changed = this.parseRemoved(line);
		if (!changed) return;
		await this.channel.send(`count: ${this.count}`);
	}

	private parseAdded(line: string): boolean {
		const added: boolean = PlayerCountHandler.ADDED.test(line);
		if (!added) return false;
		this.count = this.count + 1;
		return true;
	}

	private parseRemoved(line: string): boolean {
		const removed: boolean = PlayerCountHandler.REMOVED.test(line);
		if (!removed) return false;

		const updated = this.count - 1;
		this.count = Math.max(0, updated);
		return true;
	}

}
