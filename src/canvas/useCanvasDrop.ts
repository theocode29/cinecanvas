import type { FilmFrame, LocalImage } from "@/search/types";
import type { ImageNodeType } from "./ImageNode";

const MAX_W = 400;

type ImageSource = FilmFrame | LocalImage;

const getNodeId = (source: ImageSource): string => {
	const prefix = "localPath" in source ? "local" : "frame";
	return `${prefix}-${source.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const getImageNodeSize = (
	frame: Pick<ImageSource, "width" | "height">,
): { width: number; height: number } => {
	const scale = frame.width > MAX_W ? MAX_W / frame.width : 1;

	return {
		width: Math.round(frame.width * scale),
		height: Math.round(frame.height * scale),
	};
};

export const buildImageNode = (
	frame: ImageSource,
	canvasPos: { x: number; y: number },
): ImageNodeType => {
	const { width, height } = getImageNodeSize(frame);

	return {
		id: getNodeId(frame),
		type: "image",
		position: canvasPos,
		data: { source: frame, rotation: 0, grayscale: false },
		style: { width, height },
	};
};
