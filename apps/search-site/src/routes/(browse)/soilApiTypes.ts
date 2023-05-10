export interface SoilResponse {
	type: string;
	geometry: Geometry;
	properties: Properties;
	query_time_s: number;
}

export interface Geometry {
	type: string;
	coordinates: number[];
}

export interface Properties {
	layers: Layer[];
}

export interface Layer {
	name: string;
	unit_measure: UnitMeasure;
	depths: Depth[];
}

export interface Depth {
	range: Range;
	label: Label;
	values: { [key: string]: number };
}

export enum Label {
	The030CM = '0-30cm',
	The05CM = '0-5cm',
	The100200CM = '100-200cm',
	The1530CM = '15-30cm',
	The3060CM = '30-60cm',
	The515CM = '5-15cm',
	The60100CM = '60-100cm'
}

export interface Range {
	top_depth: number;
	bottom_depth: number;
	unit_depth: UnitDepth;
}

export enum UnitDepth {
	CM = 'cm'
}

export interface UnitMeasure {
	d_factor: number;
	mapped_units: string;
	target_units: string;
	uncertainty_unit: string;
}
