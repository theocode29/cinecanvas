import {
	ReactFlow,
	Background,
	useNodesState,
	useEdgesState,
	PanOnScrollMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ImageNode, type ImageNodeType } from "./ImageNode";

const nodeTypes = { image: ImageNode };

export const CanvasRoot = () => {
	const [nodes, , onNodesChange] = useNodesState<ImageNodeType>([]);
	const [edges, , onEdgesChange] = useEdgesState([]);

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				background: "var(--cc-bg)",
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				panOnScroll
				panOnScrollMode={PanOnScrollMode.Free}
				zoomOnScroll={false}
				zoomOnPinch
				minZoom={0.05}
				maxZoom={8}
				deleteKeyCode="Delete"
				selectionOnDrag
				multiSelectionKeyCode="Shift"
				proOptions={{ hideAttribution: true }}
			>
				<Background color="var(--cc-border)" gap={32} size={1} />
			</ReactFlow>
		</div>
	);
};
