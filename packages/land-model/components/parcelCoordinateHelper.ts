import tilebelt from '@mapbox/tilebelt';
import * as turf from '@turf/turf';

export class ParcelCoordinateHelper {
	boundaryCoords: number[][][][];
	multiPolygon: turf.Feature<turf.MultiPolygon>;
	bbox: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	};
	center: [number, number];
	tiles!: number[][];
	coordinateDimensions: {
		x: number;
		y: number;
	};
	meterDimensions: {
		x: number;
		y: number;
	};

	constructor(boundaryCoords: number[][][][], padding = 0.05) {
		this.boundaryCoords = boundaryCoords;
		this.multiPolygon = turf.multiPolygon(boundaryCoords);
		const bboxArray = turf.bbox(this.multiPolygon);

		this.bbox = {
			minX: bboxArray[0],
			minY: bboxArray[1],
			maxX: bboxArray[2],
			maxY: bboxArray[3]
		};
		const lngPadding = (this.bbox.maxX - this.bbox.minX) * padding;
		const latPadding = (this.bbox.maxY - this.bbox.minY) * padding;
		this.bbox = {
			minX: bboxArray[0] - lngPadding,
			minY: bboxArray[1] - latPadding,
			maxX: bboxArray[2] + lngPadding,
			maxY: bboxArray[3] + latPadding
		};

		this.center = turf.center(this.multiPolygon).geometry.coordinates as [number, number];
		this.coordinateDimensions = {
			x: this.bbox.maxX - this.bbox.minX,
			y: this.bbox.maxY - this.bbox.minY
		};
		this.meterDimensions = {
			x: turf.distance([this.bbox.minX, this.bbox.minY], [this.bbox.maxX, this.bbox.minY]) * 1000,
			y: turf.distance([this.bbox.minX, this.bbox.minY], [this.bbox.minX, this.bbox.maxY]) * 1000
		};
	}

	simplifyPolygon(targetRange: number[], tolerance = 0) {
		let simplified = this.multiPolygon;
		let pointCount = turf.coordAll(simplified).length;
		if (tolerance === 0) tolerance = 0.002 / pointCount;

		let attempts = 0;
		let adjustmentMultiplier = 1;
		let lastMiss = '';
		if (pointCount > targetRange[1]) {
			while ((pointCount > targetRange[1] || pointCount < targetRange[0]) && attempts < 100) {
				attempts++;
				simplified = turf.simplify(this.multiPolygon, { tolerance: tolerance, highQuality: false });
				pointCount = turf.coordAll(simplified).length;
				console.log('attempt #', attempts, '- tolerance of ', tolerance);
				if (pointCount > targetRange[1]) {
					if (lastMiss === 'under') adjustmentMultiplier /= 2;
					tolerance *= 1 + adjustmentMultiplier;
					lastMiss = 'over';
				}
				if (pointCount < targetRange[0]) {
					if (lastMiss === 'over') adjustmentMultiplier /= 2;
					tolerance /= 1 + adjustmentMultiplier;
					lastMiss = 'under';
				}
			}
		}

		this.boundaryCoords = simplified.geometry.coordinates;
		return this.boundaryCoords;
	}

	tileSelection() {
		let tileMinX = -Infinity;
		let tileMinY = -Infinity;
		let tileMaxX = Infinity;
		let tileMaxY = Infinity;
		let zoom = 32;
		const tilesWidth = 6;
		const tilesHeight = 6;
		let tileSelectionFits = false;
		while (!tileSelectionFits) {
			[tileMinX, tileMaxY] = tilebelt.pointToTile(this.bbox.minX, this.bbox.minY, zoom);
			[tileMaxX, tileMinY] = tilebelt.pointToTile(this.bbox.maxX, this.bbox.maxY, zoom);
			tileSelectionFits = tileMaxX - tileMinX < tilesWidth && tileMaxY - tileMinY < tilesHeight;
			if (!tileSelectionFits) zoom--;
		}

		this.tiles = [];
		for (let x = tileMinX; x <= tileMaxX; x++) {
			for (let y = tileMinY; y <= tileMaxY; y++) {
				this.tiles.push([x, y, zoom]);
			}
		}
		console.log('this.tiles: ', this.tiles);
		return this.tiles;
	}

	coordRelativeToBounds(coord: number[], centered = true) {
		const xPercent = (coord[0] - this.bbox.minX) / (this.bbox.maxX - this.bbox.minX);
		const yPercent = (coord[1] - this.bbox.minY) / (this.bbox.maxY - this.bbox.minY);
		if (!centered) {
			return [xPercent, yPercent];
		} else {
			return [xPercent - 0.5, yPercent - 0.5];
		}
	}

	boundaryCoordsRelativeToBounds() {
		// translate coordinates to a range of -0.5 to 0.5 for lat and lng
		const relativeCoords = this.boundaryCoords.map((polyCoords) => {
			return polyCoords.map((ringCoords) => {
				return ringCoords.map((coord) => this.coordRelativeToBounds(coord));
			});
		});
		return relativeCoords;
	}

	tileCroppingWindow() {
		const tilesGeoJSON = this.tiles.map((tile) => turf.feature(tilebelt.tileToGeoJSON(tile)));
		const tilesCollection = turf.featureCollection(tilesGeoJSON);
		const [tileMinX, tileMinY, tileMaxX, tileMaxY] = turf.envelope(tilesCollection)
			.bbox as number[];

		const croppingWindow = {
			left: (this.bbox.minX - tileMinX) / (tileMaxX - tileMinX),
			top: (tileMaxY - this.bbox.maxY) / (tileMaxY - tileMinY),
			width: (this.bbox.maxX - this.bbox.minX) / (tileMaxX - tileMinX),
			height: (this.bbox.maxY - this.bbox.minY) / (tileMaxY - tileMinY),
			xDistance: this.meterDimensions.x,
			yDistance: this.meterDimensions.y,
			boundaryLengths: this.boundaryCoords.map((polygonCoords) => {
				return polygonCoords.reduce((length, ringCoords) => {
					length += turf.length(turf.lineString(ringCoords)) * 1000;
					return length;
				}, 0);
			})
		};

		return croppingWindow;
	}
}
