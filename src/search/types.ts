// Data model — spec §8. Pure types, no logic.

export interface FilmFrame {
	id: string;
	title: string;
	director: string;
	year: number;
	localThumbPath: string;
	sourceUrl: string;
	filmGrabWpId: number;
	dominantColors: [string, string, string];
	embedding: number[];
	width: number;
	height: number;
}

export interface LocalImage {
	id: string;
	localPath: string;
	width: number;
	height: number;
	importedAt: string;
}

export interface CanvasImageData {
	source: FilmFrame | LocalImage;
	rotation: number;
	grayscale: boolean;
	groupId?: string;
}

export interface SearchQuery {
	text?: string;
	colorHex?: string;
	limit?: number;
}

export interface SearchResult {
	frame: FilmFrame;
	score: number;
}

export type Direction = "NONE" | "A_TO_B" | "B_TO_A" | "BIDIRECTIONAL";
export type LineStyle = "solid" | "dashed";

export interface Connection {
	id: string;
	fromId: string;
	toId: string;
	direction: Direction;
	style: LineStyle;
}

export interface Group {
	id: string;
	nodeIds: string[];
}
