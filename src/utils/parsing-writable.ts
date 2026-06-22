import { Writable, type WritableOptions } from 'node:stream';

export class ParsingWritable extends Writable {

	public static readonly EVENT: string = 'parsed';

	private static readonly DEFAULT_ENCODING: BufferEncoding = 'utf8';
	private static readonly DEFAULT_DELIMITER: RegExp = /\r?\n/;

	private buffer: string = '';

	public constructor(
			options?: WritableOptions,
			private delimiter: RegExp = ParsingWritable.DEFAULT_DELIMITER,
			private encoding: BufferEncoding = ParsingWritable.DEFAULT_ENCODING
	) {
		super({ ...options, decodeStrings: false });
	}

	override _write(
		chunk: any,
		encoding: BufferEncoding,
		callback: (error?: Error | null) => void
	): void {
		let data: string;
		try {
			data = Buffer.isBuffer(chunk) ? chunk.toString(this.encoding) : String(chunk);

		} catch (err: unknown) {
			const error: Error = err instanceof Error ? err : new Error(String(err));
			callback(error);
			return;
		}

		this.buffer += data;
		const substrings = this.buffer.split(this.delimiter);

		// last element is either empty (if text ended with delimiter) or an incomplete partial parse
		this.buffer = substrings.pop() || '';

		for (const substring of substrings) {
			this.emit(ParsingWritable.EVENT, substring);
		}

		callback();
	}

	// flush any remaining text that did not end with a delimiter
	override _final(callback: (error?: Error | null) => void): void {
		if (this.buffer) {
			this.emit(ParsingWritable.EVENT, this.buffer);
			this.buffer = '';
		}
		callback();
	}

}
