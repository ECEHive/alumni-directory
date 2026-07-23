export interface Alumni {
	name: string;
	graduation_date: string;
	company: string;
	major: string;
	/** Locality name, e.g. "Atlanta", "Zürich". */
	city: string;
	/** First-level subdivision: US state code ("GA"), province ("Ontario"), … */
	region: string;
	/** English country name, e.g. "United States", "Switzerland". */
	country: string;
	latitude: number;
	longitude: number;
	email: string;
	linkedin: string;
}
