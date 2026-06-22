import { Client, type AccessOptions } from 'basic-ftp';
import { EventEmitter } from 'node:events';
import type { Stream } from 'node:stream';
import type { LogEventMap } from './log-event-map.js';
import { ParsingWritable } from './utils/parsing-writable.js';
import { sleep } from './utils/sleep.js';

export class LogEventEmitter extends EventEmitter<LogEventMap> {

	private readonly options: AccessOptions;

	public constructor(
			host: string, port: number, username: string, password: string,
			private readonly log: string,
			private readonly delay: number) {
		super();
		this.options = { host, port, user: username, password };
	}

	public async start(signal: AbortSignal): Promise<void> {
		const ftp = new Client();

		try {
			await ftp.access(this.options);
			console.log('connected to ftp');

			let position = await ftp.size(this.log);
			while(!signal.aborted) {
				position = await this.download(ftp, position);
				await this.sleep(signal);
			}

		} finally {
			ftp.close();
		}
	}

	private async download(ftp: Client, position: number): Promise<number> {
		let size: number;
		try {
			size = await ftp.size(this.log);
			if (size === position) return position;

			const stream: Stream.Writable = this.createStream();
			await ftp.downloadTo(stream, this.log, position);

		} catch (err) {
			console.error("error during poll:", err);

			if (ftp.closed) {
				await ftp.access(this.options);
				console.log("reconnected");
			}

			return position;
		}

		return size;
	}

	private createStream(): Stream.Writable {
		const result = new ParsingWritable();
		result.on(ParsingWritable.EVENT, (line: string) => this.emit('parsed', line));
		return result;
	}

	private async sleep(signal: AbortSignal): Promise<void> {
		try {
			await sleep(this.delay, signal);

		} catch (err: unknown) {
			if (signal.aborted) return;
			throw err;
		}
	}

}
