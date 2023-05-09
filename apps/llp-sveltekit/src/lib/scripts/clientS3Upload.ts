export async function s3PostPresignUrl(
	filename: string,
	fileType: string,
	file: Blob | File | string
): Promise<Response> {
	const res = await fetch(
		`/api/upload-url?fileName=${encodeURIComponent(filename)}&fileType=${encodeURIComponent(
			fileType
		)}`
	);
	const { url, fields } = await res.json();

	const formData = new FormData();
	Object.entries(fields).forEach(([key, value]) => {
		formData.append(key, value as string);
	});
	formData.append('file', file);

	let attempts = 0;
	const runUpload = async () => {
		attempts++;
		let upload = await fetch(url, {
			method: 'POST',
			body: formData
		});
		console.log(`upload attempt #${attempts} for ${filename}`);
		if (!upload.ok && attempts < 3) {
			upload = await runUpload();
		}
		return upload;
	};

	return await runUpload();
}

export function readResponseBodyStream(
	stream: ReadableStream,
	printReturnedValue = true,
	callback?: (value: Uint8Array) => void
) {
	const reader = stream.getReader();
	if (!reader) throw new Error('reader is undefined');
	return reader.read().then(({ done, value }) => {
		if (done) {
			console.log('Stream fully read');
			return;
		}
		console.log(`Received ${value.length} bytes`);
		if (callback) callback(value);
		if (printReturnedValue) {
			const decoder = new TextDecoder();
			const text = decoder.decode(value);
			console.log(`Received data: ${text}`);
		}
		return readResponseBodyStream();
	});
}
