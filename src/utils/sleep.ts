export function sleep(ms: number, signal: AbortSignal): Promise<void> {

	return new Promise((resolve, reject) => {
		if (signal.aborted) return reject(signal.reason);

		const timerId = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);

		function onAbort() {
			clearTimeout(timerId);
			reject(signal.reason);
		}

		signal.addEventListener("abort", onAbort);
	});

}
