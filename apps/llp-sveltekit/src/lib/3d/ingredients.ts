import { PUBLIC_MAPBOX_KEY } from '$env/static/public';
import { fabric } from 'fabric';

export async function fetchImages(
	mapboxSourceID: string,
	tiles: number[][]
): Promise<HTMLImageElement[]> {
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
	return satImgs as HTMLImageElement[];
}

export function createCanvas(
	tiles: number[][],
	imgs: HTMLImageElement[],
	croppingWindow: CroppingWindow
): HTMLCanvasElement {
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

	const canvas = new fabric.Canvas(null, {
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

	if (!canvas.width || !canvas.height) throw new Error('Canvas has no width or height');
	const croppedCanvas = canvas.toCanvasElement(undefined, {
		left: Math.round(canvas.width * croppingWindow.left),
		top: Math.round(canvas.height * croppingWindow.top),
		width: Math.round(canvas.width * croppingWindow.width),
		height: Math.round(canvas.height * croppingWindow.height)
	});

	return croppedCanvas;
}

type CroppingWindow = {
	left: number;
	top: number;
	width: number;
	height: number;
	xDistance: number;
	yDistance: number;
	boundaryLengths: number[];
};

function fixElevations(terrain: Float32Array, sizeX: number, sizeY: number) {
	// backfill bottom border
	for (let x = 0; x < sizeX - 1; x++) {
		let rowsBack = 0;
		let currentRowElevation = terrain[sizeX * (sizeY - 1 - rowsBack) + x];
		while (currentRowElevation === 0 || (isNaN(currentRowElevation) && rowsBack < sizeY)) {
			rowsBack++;
			currentRowElevation = terrain[sizeX * (sizeY - 1 - rowsBack) + x];
		}
		for (let y = 0; y < rowsBack; y++) {
			terrain[sizeX * (sizeY - 1 - y) + x] = currentRowElevation;
		}
	}
	// backfill right border
	for (let y = 0; y < sizeY; y++) {
		let columnsBack = 0;
		let currentColumnElevation = terrain[sizeX * y + (sizeX - 1) - columnsBack];
		while (currentColumnElevation === 0 || (isNaN(currentColumnElevation) && columnsBack < sizeX)) {
			columnsBack++;
			currentColumnElevation = terrain[sizeX * y + (sizeX - 1) - columnsBack];
		}
		for (let x = 0; x < columnsBack; x++) {
			terrain[sizeX * y + (sizeX - 1 - x)] = currentColumnElevation;
		}
	}

	return terrain;
}

// special function to account elevation glitches caused by browser fingerprint blockers
function findMinMax(
	terrain: Float32Array,
	sizeX: number,
	sizeY: number
): { min: number; max: number } {
	let minElevation = Infinity;
	let maxElevation = -Infinity;
	for (let y = 0; y < sizeY; y++) {
		for (let x = 0; x < sizeX; x++) {
			const i = y * sizeX + x;
			const elevation = terrain[i];
			if (elevation > maxElevation || elevation < minElevation) {
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
					(neighbor) => isNaN(neighbor) || Math.abs(neighbor - elevation) > 5
				);
				if (!isDifferent) {
					if (elevation < minElevation) minElevation = elevation;
					if (elevation > maxElevation) maxElevation = elevation;
				}
			}
		}
	}
	return { min: minElevation, max: maxElevation };
}

export function canvasRGBtoGray(canvas: HTMLCanvasElement): [number, number] {
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

	const fixedTerrain = fixElevations(terrain, sizeX, sizeY);
	const { min: minElevation, max: maxElevation } = findMinMax(fixedTerrain, sizeX, sizeY);

	const newImgData = new ImageData(sizeX, sizeY);
	const depth = maxElevation - minElevation;
	fixedTerrain.forEach((elevation, i) => {
		const gray = ((elevation - minElevation) / depth) * 255;
		newImgData.data[i * 4] = gray;
		newImgData.data[i * 4 + 1] = gray;
		newImgData.data[i * 4 + 2] = gray;
		newImgData.data[i * 4 + 3] = 256;
	});
	ctx.putImageData(newImgData, 0, 0);

	return [minElevation, maxElevation];
}

export type ParcelDimensions = {
	width: number;
	height: number;
	depth: number;
	boundaryLengths: number[];
};

export function getParcelDimensions(
	croppingWindow: CroppingWindow,
	terrainCanvas: HTMLCanvasElement,
	terrainHeight: number,
	maxDimension = 1
) {
	const xMeterPerPixel = croppingWindow.xDistance / terrainCanvas.width;
	const yMeterPerPixel = croppingWindow.yDistance / terrainCanvas.height;
	const zMeterPerPixel = (xMeterPerPixel + yMeterPerPixel) / 2;
	const heightInPixels = terrainHeight / zMeterPerPixel;
	const boundaryLengthsInPixels = croppingWindow.boundaryLengths.map(
		(sideLength) => sideLength / zMeterPerPixel
	);
	const parcelDimensions = {
		width: terrainCanvas.width,
		height: terrainCanvas.height,
		depth: heightInPixels,
		boundaryLengths: boundaryLengthsInPixels
	} as ParcelDimensions;

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

export function multiPolygonToCanvas(
	multiPolygon: number[][][][],
	width: number,
	height: number,
	inverse = false,
	lineWidth = 0,
	color = 'black'
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const sizeDimension = 0.5;
	canvas.width = width;
	canvas.height = height;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;

	if (inverse) {
		ctx.fillRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'destination-out';
	}
	ctx.translate(sizeDimension * width, sizeDimension * height);
	if (lineWidth) ctx.lineWidth = lineWidth;

	multiPolygon.forEach((polygon) => {
		ctx.beginPath(); // Move the beginPath() call outside the inner loop
		polygon.forEach((ring) => {
			ring.forEach(([x, y], pointIndex) => {
				if (pointIndex === 0) {
					ctx.moveTo(x * width, y * -height);
				} else {
					ctx.lineTo(x * width, y * -height);
				}
			});
			ctx.closePath();
			if (lineWidth) ctx.stroke();
		});
		if (!lineWidth) ctx.fill('evenodd'); // Set the fill rule outside the loop and use 'evenodd' for both outer and inner rings
	});

	return canvas;
}

export function canvasOverlay(
	baseCanvas: HTMLCanvasElement,
	overlayCanvas: HTMLCanvasElement,
	mask = false
): HTMLCanvasElement {
	const outputCanvas: HTMLCanvasElement = document.createElement('canvas');
	outputCanvas.width = baseCanvas.width;
	outputCanvas.height = baseCanvas.height;
	const outputCtx = outputCanvas.getContext('2d');
	if (!outputCtx) throw new Error('Could not get canvas context');

	outputCtx.drawImage(baseCanvas, 0, 0);
	if (mask) outputCtx.globalCompositeOperation = 'destination-out';
	outputCtx.drawImage(overlayCanvas, 0, 0);
	return outputCanvas;
}

export function heightRangeFromCanvas(
	heightCanvas: HTMLCanvasElement,
	height: number
): [number, number] {
	const heightCtx = heightCanvas.getContext('2d');
	if (!heightCtx) throw new Error('Could not get canvas context');
	const heightMapImageData = heightCtx.getImageData(0, 0, heightCanvas.width, heightCanvas.height);

	let minPixel = 255;
	let maxPixel = 0;
	for (let i = 0; i < heightMapImageData.data.length; i += 4) {
		const grayscaleValue = heightMapImageData.data[i]; // Assuming the image is grayscale, R, G, and B values should be equal
		const alphaValue = heightMapImageData.data[i + 3];
		if (alphaValue !== 0) {
			// Skip transparent pixels (masked out areas)
			minPixel = Math.min(minPixel, grayscaleValue);
			maxPixel = Math.max(maxPixel, grayscaleValue);
		}
	}

	const minHeight = (minPixel / 255) * height;
	const maxHeight = (maxPixel / 255) * height;
	console.log('minHeight: ', minHeight, 'maxHeight: ', maxHeight);
	return [minHeight, maxHeight];
}
