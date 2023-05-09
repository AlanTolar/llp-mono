<script lang="ts">
	import type FileInput from '@uppy/file-input';

	const uploadPhoto = async (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		const file = e.currentTarget?.files?.[0]!;
		console.log('file: ', file);
		const filename = encodeURIComponent(file.name);
		const fileType = encodeURIComponent(file.type);
		const res = await fetch(`/api/upload-url?file=${filename}&fileType=${fileType}`, {
			method: 'POST'
		});
		const { url, fields } = await res.json();
		const formData = new FormData();
		Object.entries({ ...fields, file }).forEach(([key, value]) => {
			formData.append(key, value as string);
		});

		const upload = await fetch(url, {
			method: 'POST',
			body: formData
		});
		if (upload.ok) {
			console.log('Uploaded successfully!');
		} else {
			console.error('Upload failed.');
		}
	};
</script>

<p>Upload a .png or .jpg image (max 1MB).</p>
<input type="file" accept="image/png, image/jpeg" on:change={uploadPhoto} />
