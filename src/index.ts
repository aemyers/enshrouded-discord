import { type Channel, Client, type ClientOptions, Events, GatewayIntentBits, TextChannel } from 'discord.js';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { PlayerCountHandler } from './handlers/player-count-handler.js';
import { PlayerLoginHandler } from './handlers/player-login-handler.js';
import { LogEventEmitter } from './log-event-emitter.js';
import type { LogHandler } from './log-handler.js';
import { VERSION } from './version.js';

console.log(`version: ${VERSION}`)

if (existsSync('.env')) loadEnvFile();

const abort = new AbortController();
process.on('SIGTERM', (signal: string) => shutdown(signal, abort));
process.on('SIGINT', (signal: string) => shutdown(signal, abort));

let channel: TextChannel;
const handlers: LogHandler[] = [];

const client = buildClient();
client.once(Events.ClientReady, onReady);
client.login(process.env.DISCORD_TOKEN);

const host: string = process.env.FTP_SERVER!.split(':')[0]!;
const port: number = Number.parseInt(process.env.FTP_SERVER!.split(':')[1]!);
const user: string = process.env.FTP_USERNAME!;
const password: string = process.env.FTP_PASSWORD!;
const log: string = process.env.FTP_LOG!;
const delay: number = Number.parseInt(process.env.FTP_DELAY!);

const monitor = new LogEventEmitter(host, port, user, password, log, delay);
monitor.on('parsed', (line: string) => onParsed(line));
await monitor.start(abort.signal);
process.exit(0);



function buildClient(): Client {
	const intents: GatewayIntentBits[] = [];
	const options: ClientOptions = { intents: intents };
	return new Client(options);
}

async function onReady(): Promise<void> {
	console.log('discord client ready');
	client.user?.setStatus('online');
	channel = await getChannel(process.env.DISCORD_CHANNEL!);

	handlers.push(
		new PlayerLoginHandler(channel),
		new PlayerCountHandler(channel)
	);
}

async function getChannel(id: string): Promise<TextChannel> {
	let channel: Channel | null = await client.channels.fetch(id);
	if (!channel) throw new Error(`channel not found; id: ${id}`);
	if (!(channel instanceof TextChannel)) throw new Error(`channel not text; id: ${id}; type: ${channel.type}`);
	return channel;
}

function onParsed(line: string): void {
	let received: string = new Date().toISOString()
	console.log(`${received}: ${line}`);
	handlers.forEach(handler => handler.onParsed(line));
}

async function shutdown(reason: string, abort: AbortController): Promise<void> {
	console.log(`shutting down; reason: ${reason}`);
	abort.abort();
}
