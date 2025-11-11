export async function blobToDataUri(blob: Blob): Promise<string> {
	// Check if we're in a browser environment
	if (typeof FileReader === 'undefined') {
		throw new Error('FileReader is not available in this environment')
	}

	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadend = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result)
			} else {
				reject(new Error('Failed to convert Blob to base64 data URI'))
			}
		}
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}
