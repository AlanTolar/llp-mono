import { PUBLIC_MAPBOX_KEY } from '$env/static/public';
import { fabric } from 'fabric';

export function multiPolygonToPngDataURL(
	multiPolygon: number[][][][],
	width: number,
	height: number,
	scale = 4
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const sizeDimension = 0.5;
	canvas.width = width * scale;
	canvas.height = height * scale;

	// Draw the multiPolygon with a black fill
	ctx.fillStyle = 'black';
	ctx.scale(scale, scale);
	ctx.translate(sizeDimension * width, sizeDimension * height);
	multiPolygon.forEach((polygon) => {
		ctx.beginPath(); // Move the beginPath() call outside the inner loop
		polygon.forEach((ring, index) => {
			ring.forEach(([x, y], pointIndex) => {
				if (pointIndex === 0) {
					ctx.moveTo(x * width, y * -height);
				} else {
					ctx.lineTo(x * width, y * -height);
				}
			});
			ctx.closePath();
		});
		ctx.fill('evenodd'); // Set the fill rule outside the loop and use 'evenodd' for both outer and inner rings
	});

	// Return a PNG Data URL of the drawing
	return canvas.toDataURL('image/png');
}

export function multiPolygonToOutlineCanvas(
	multiPolygon: number[][][][],
	width: number,
	height: number
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const sizeDimension = 0.5;
	canvas.width = width;
	canvas.height = height;

	// Draw the multiPolygon with a black fill
	ctx.fillStyle = 'black';
	ctx.translate(sizeDimension * width, sizeDimension * height);
	multiPolygon.forEach((polygon) => {
		ctx.beginPath(); // Move the beginPath() call outside the inner loop
		polygon.forEach((ring, index) => {
			ring.forEach(([x, y], pointIndex) => {
				if (pointIndex === 0) {
					ctx.moveTo(x * width, y * -height);
				} else {
					ctx.lineTo(x * width, y * -height);
				}
			});
			ctx.closePath();
			ctx.stroke();
		});
	});

	// Return a PNG Data URL of the drawing
	return canvas;
}

export function multiPolygonOutlineHeight(
	heightCanvas: HTMLCanvasElement,
	outlineCanvas: HTMLCanvasElement,
	depth: number
): [number, number] {
	const heightCtx = heightCanvas.getContext('2d') as CanvasRenderingContext2D;

	// Apply the mask to the grayscale height-map canvas
	heightCtx.globalCompositeOperation = 'destination-in';
	heightCtx.drawImage(outlineCanvas, 0, 0);
	const heightMapImageData = heightCtx.getImageData(0, 0, heightCanvas.width, heightCanvas.height);
	let minPixel = 255;
	let maxPixel = 0;

	for (let i = 0; i < heightMapImageData.data.length; i += 4) {
		const grayscaleValue = heightMapImageData.data[i]; // Assuming the image is grayscale, R, G, and B values should be equal
		if (grayscaleValue !== 0) {
			// Skip transparent pixels (masked out areas)
			minPixel = Math.min(minPixel, grayscaleValue);
			maxPixel = Math.max(maxPixel, grayscaleValue);
		}
	}

	const edgeDepth = ((maxPixel - minPixel) / 255) * depth;
	console.log('edgeDepth: ', edgeDepth);
	return edgeDepth;
}

export async function fetchImages(mapboxSourceID, tiles) {
	const satImgs = await Promise.all(
		tiles.map((tile) => {
			const location = `${tile[2]}/${tile[0]}/${tile[1]}`;
			return new Promise((resolve, reject) => {
				const image = new Image();
				image.crossOrigin = 'anonymous';
				image.src = `https://a.tiles.mapbox.com/v4/${mapboxSourceID}/${location}.png?access_token=${PUBLIC_MAPBOX_KEY}`;
				image.onload = () => resolve(image);
				image.onerror = reject;
			});
		})
	);
	return satImgs;
}

export function createCanvas(tiles, imgs, canvasID = '') {
	const [tileMinX, tileMinY, tileMaxX, tileMaxY] = tiles.reduce(
		(acc, tile) => {
			if (tile[0] < acc[0]) acc[0] = tile[0];
			if (tile[1] < acc[1]) acc[1] = tile[1];
			if (tile[0] > acc[2]) acc[2] = tile[0];
			if (tile[1] > acc[3]) acc[3] = tile[1];
			return acc;
		},
		[Infinity, Infinity, -Infinity, -Infinity]
	);
	const widthInTiles = tileMaxX - tileMinX + 1;
	const heightInTiles = tileMaxY - tileMinY + 1;

	const canvas = new fabric.Canvas(canvasID, {
		width: widthInTiles * 256,
		height: heightInTiles * 256
	});
	imgs.forEach((img, index) => {
		const imgInstance = new fabric.Image(img, {
			left: (tiles[index][0] - tileMinX) * 256,
			top: (tiles[index][1] - tileMinY) * 256
		});
		canvas.add(imgInstance);
	});
	canvas.renderAll();

	return canvas;
}

export function cropCanvas(canvas, croppingWindow, containerID = '') {
	const croppedCanvas = canvas.toCanvasElement(undefined, {
		left: Math.round(canvas.width * croppingWindow.left),
		top: Math.round(canvas.height * croppingWindow.top),
		width: Math.round(canvas.width * croppingWindow.width),
		height: Math.round(canvas.height * croppingWindow.height)
	});
	if (containerID) {
		try {
			document.getElementById(containerID).appendChild(croppedCanvas);
		} catch (e) {
			console.error(e);
		}
	}
	return croppedCanvas;
}

function fixHeights(terrain: Float32Array, sizeX: number, sizeY: number) {
	// backfill bottom border
	for (let x = 0; x < sizeX - 1; x++) {
		let rowsBack = 0;
		let currentRowHeight = terrain[sizeX * (sizeY - 1 - rowsBack) + x];
		while (currentRowHeight === 0 || (isNaN(currentRowHeight) && rowsBack < sizeY)) {
			rowsBack++;
			currentRowHeight = terrain[sizeX * (sizeY - 1 - rowsBack) + x];
		}
		for (let y = 0; y < rowsBack; y++) {
			terrain[sizeX * (sizeY - 1 - y) + x] = currentRowHeight;
		}
	}
	// backfill right border
	for (let y = 0; y < sizeY; y++) {
		let columnsBack = 0;
		let currentColumnHeight = terrain[sizeX * y + (sizeX - 1) - columnsBack];
		while (currentColumnHeight === 0 || isNaN(currentColumnHeight && columnsBack < sizeX)) {
			columnsBack++;
			currentColumnHeight = terrain[sizeX * y + (sizeX - 1) - columnsBack];
		}
		for (let x = 0; x < columnsBack; x++) {
			terrain[sizeX * y + (sizeX - 1 - x)] = currentColumnHeight;
		}
	}

	return terrain;
}

function findMinMax(
	terrain: Float32Array,
	sizeX: number,
	sizeY: number
): { min: number; max: number } {
	let minHeight = Infinity;
	let maxHeight = -Infinity;
	for (let y = 0; y < sizeY; y++) {
		for (let x = 0; x < sizeX; x++) {
			const i = y * sizeX + x;
			const height = terrain[i];
			if (height > maxHeight || height < minHeight) {
				const neighbors = [];
				for (let yOffset = -1; yOffset <= 1; yOffset++) {
					for (let xOffset = -1; xOffset <= 1; xOffset++) {
						if (xOffset === 0 && yOffset === 0) continue;
						const newX = x + xOffset;
						const newY = y + yOffset;

						// check if neighbor is touching pixel (not other side of image)
						if (newX >= 0 && newX < sizeX && newY >= 0 && newY < sizeY) {
							const neighborIndex = newY * sizeX + newX;
							neighbors.push(terrain[neighborIndex]);
						}
					}
				}

				const isDifferent = neighbors.some(
					(neighbor) => isNaN(neighbor) || Math.abs(neighbor - height) > 5
				);
				if (!isDifferent) {
					if (height < minHeight) minHeight = height;
					if (height > maxHeight) maxHeight = height;
				}
			}
		}
	}
	console.log('minHeight: ', minHeight, 'maxHeight: ', maxHeight);
	return { min: minHeight, max: maxHeight };
}

export function canvasRGBtoGray(canvas: fabric.Canvas) {
	const sizeX = canvas.width as number;
	const sizeY = canvas.height as number;

	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const imgData = ctx.getImageData(0, 0, sizeX, sizeY).data;

	const terrain = new Float32Array(sizeX * sizeY);
	for (let y = 0; y < sizeY; y++) {
		for (let x = 0; x < sizeX; x++) {
			// decode terrain values
			const k = (y * sizeX + x) * 4;
			const r = imgData[k + 0];
			const g = imgData[k + 1];
			const b = imgData[k + 2];

			const height = (r * 256 * 256 + g * 256 + b) / 10 - 10000;
			terrain[y * sizeX + x] = height;
		}
	}

	const fixedTerrain = fixHeights(terrain, sizeX, sizeY);
	const { min: minHeight, max: maxHeight } = findMinMax(fixedTerrain, sizeX, sizeY);

	const newImgData = new ImageData(sizeX, sizeY);
	const heightRange = maxHeight - minHeight;
	fixedTerrain.forEach((height, i) => {
		const gray = ((height - minHeight) / heightRange) * 255;
		newImgData.data[i * 4] = gray;
		newImgData.data[i * 4 + 1] = gray;
		newImgData.data[i * 4 + 2] = gray;
		newImgData.data[i * 4 + 3] = 256;
	});
	ctx.putImageData(newImgData, 0, 0);

	return heightRange;
}

type ParcelDimensions = {
	width: number;
	height: number;
	depth: number;
	boundaryLengths: number[];
};

export function calculateParcelDimensions(
	croppingWindow,
	terrainCanvas,
	terrainHeight
): ParcelDimensions {
	const xMeterPerPixel = croppingWindow.xDistance / terrainCanvas.width;
	const yMeterPerPixel = croppingWindow.yDistance / terrainCanvas.height;
	const zMeterPerPixel = (xMeterPerPixel + yMeterPerPixel) / 2;
	const heightInPixels = terrainHeight / zMeterPerPixel;
	const boundaryLengthsInPixels = croppingWindow.boundaryLengths.map(
		(sideLength) => sideLength / zMeterPerPixel
	);
	const parcelDimensionsInPixels = {
		width: terrainCanvas.width,
		height: terrainCanvas.height,
		depth: heightInPixels,
		boundaryLengths: boundaryLengthsInPixels
	} as ParcelDimensions;
	return parcelDimensionsInPixels;
}

export function scaleParcelDimension(parcelDimensions: ParcelDimensions, maxDimension = 1) {
	const maxDimensionInPixels = Math.max(
		parcelDimensions.width,
		parcelDimensions.height,
		parcelDimensions.depth
	);
	const scaleFactor = maxDimension / maxDimensionInPixels;
	parcelDimensions.width *= scaleFactor;
	parcelDimensions.height *= scaleFactor;
	parcelDimensions.depth *= scaleFactor;
	parcelDimensions.boundaryLengths = parcelDimensions.boundaryLengths.map(
		(length) => length * scaleFactor
	);

	return parcelDimensions;
}
