import type { Node, NodeProps } from "@xyflow/react";
import type { CanvasImageData } from "@/search/types";

const MAX_W = 400;

// React Flow v12 requires node data to satisfy Record<string, unknown>.
// The intersection adds the index signature without changing the domain shape
// (keeps src/search/types.ts — the public data model — pure).
type ImageNodeData = CanvasImageData & Record<string, unknown>;
export type ImageNodeType = Node<ImageNodeData, "image">;

export const ImageNode = ({ data, selected }: NodeProps<ImageNodeType>) => {
	const { source, rotation, grayscale } = data;
	const scale = source.width > MAX_W ? MAX_W / source.width : 1;
	const w = Math.round(source.width * scale);
	const h = Math.round(source.height * scale);
	const src =
		"localThumbPath" in source ? source.localThumbPath : source.localPath;
	const alt =
		"title" in source
			? `${source.title} — ${source.director}`
			: "Imported reference";
	return (
		<div
			style={{
				width: w,
				height: h,
				transform: `rotate(${rotation}deg)`,
				filter: grayscale ? "grayscale(1)" : "none",
				boxShadow: selected
					? "0 0 0 2px var(--cc-accent), 0 0 0 5px var(--cc-accent-soft)"
					: "0 2px 8px rgba(44,33,23,0.18)",
				borderRadius: 4,
				overflow: "hidden",
				cursor: "grab",
			}}
		>
			<img
				src={src}
				alt={alt}
				width={w}
				height={h}
				style={{ display: "block", objectFit: "cover" }}
				draggable={false}
			/>
		</div>
	);
};
