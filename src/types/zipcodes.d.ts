declare module "zipcodes" {
	export interface ZipLookupResult {
		zip: string;
		latitude: number;
		longitude: number;
		city: string;
		state: string;
		country: string;
	}

	export function lookup(zip: string | number): ZipLookupResult | undefined;

	const zipcodes: { lookup: typeof lookup };
	export default zipcodes;
}
