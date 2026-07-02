import type { Node } from "@xyflow/react";
import type { CanvasImageData } from "@/search/types";

type CanvasNode = Node<CanvasImageData & Record<string, unknown>>;

export const normalizeRotation = (degrees: number): number =>
	((degrees % 360) + 360) % 360;

export const setRotation = <T extends CanvasNode>(node: T, degrees: number): T => ({
	...node,
	data: { ...node.data, rotation: normalizeRotation(degrees) },
}) as T;

export const toggleGrayscale = <T extends CanvasNode>(node: T): T => ({
	...node,
	data: { ...node.data, grayscale: !node.data.grayscale },
}) as T;

export const duplicateNode = <T extends CanvasNode>(node: T, offset = 24): T => ({
	...node,
	id: `${node.id}-copy-${Date.now()}`,
	position: {
		x: node.position.x + offset,
		y: node.position.y + offset,
	},
	selected: true,
}) as T;
