export function drawCanvas(mapCanvas, mergeCanvas, logo, scroll_text, bannerPosition) {
	let mergeCtx = mergeCanvas.getContext('2d');

	mergeCanvas.height = mapCanvas.height;
	mergeCanvas.width = mapCanvas.width;
	const bannerHeight = mapCanvas.height / 10;

	// Clear the canvas and draw the map
	mergeCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
	mergeCtx.drawImage(mapCanvas, 0, 0);

	// Set font size and measure width of text
	const fontSize = bannerHeight * (2 / 5);
	mergeCtx.font = `${fontSize}px sans-serif`;
	const metrics = mergeCtx.measureText(scroll_text);

	if (scroll_text) {
		// Draw the background
		const textPadding = (bannerHeight - fontSize) / 2;
		mergeCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		mergeCtx.fillRect(
			bannerPosition + bannerHeight - textPadding,
			0,
			metrics.width + textPadding * 3,
			bannerHeight
		);

		// Draw the text
		mergeCtx.fillStyle = 'white';
		mergeCtx.textAlign = 'start';
		mergeCtx.fillText(
			scroll_text,
			bannerPosition + bannerHeight + textPadding,
			(bannerHeight + fontSize) / 2
		);
	}

	// Set the square size and corner radius
	var squareSize = bannerHeight;
	var cornerRadius = bannerHeight * 0.5;
	let xPos = 0;
	let yPos = 0;

	// Draw the square with a rounded bottom right corner
	mergeCtx.beginPath();
	mergeCtx.moveTo(xPos, yPos);
	mergeCtx.lineTo(xPos + squareSize, yPos);
	mergeCtx.lineTo(xPos + squareSize, yPos + squareSize - cornerRadius);
	mergeCtx.quadraticCurveTo(
		xPos + squareSize,
		yPos + squareSize,
		xPos + squareSize - cornerRadius,
		yPos + squareSize
	);
	mergeCtx.lineTo(xPos, yPos + squareSize);
	mergeCtx.lineTo(xPos, yPos);
	mergeCtx.closePath();

	// Fill the square with a color
	mergeCtx.fillStyle = 'white';
	mergeCtx.fill();

	// Draw the logo in the center of the square
	const logoWidth = bannerHeight * 0.8;
	const logoHeight = bannerHeight * 0.8;
	const x = xPos + squareSize * 0.48 - logoWidth / 2;
	const y = yPos + squareSize * 0.48 - logoHeight / 2;

	mergeCtx.drawImage(logo, x, y, logoWidth, logoHeight);
}
