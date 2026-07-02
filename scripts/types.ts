export interface RawFilmPost {
	wpId: number;
	title: string;
	director: string;
	year: number;
	imageUrls: string[];
	sourceUrl: string;
	crawledAt: string;
}

export interface WPPost {
	id: number;
	title: { rendered: string };
	link: string;
	date: string;
}
