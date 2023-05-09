export interface WeatherResponse {
	meta: Meta;
	data: Data[];
}

export interface Meta {
	generated: Date;
	stations: string[];
}

export interface Data {
	month: number | null;
	tavg: number | null;
	tmin: number | null;
	tmax: number | null;
	prcp: number | null;
	wspd: number | null;
	pres: number | null;
	tsun: number | null;
}
