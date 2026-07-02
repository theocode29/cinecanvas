import {
	ReactFlow,
	Background,
	BackgroundVariant,
	addEdge,
	useNodesState,
	useEdgesState,
	PanOnScrollMode,
	MarkerType,
	type Edge,
	type Connection as FlowConnection,
	type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useReducer, useRef, useState, type MouseEvent } from "react";
import { loadStaticIndex } from "@/search/staticIndex";
import type { Direction, FilmFrame, LineStyle, SearchQuery, SearchResult } from "@/search/types";
import { Spotlight, type SpotlightStatus } from "@/spotlight/Spotlight";
import {
	initialSpotlightState,
	spotlightReducer,
	type SpotlightPosition,
} from "@/spotlight/spotlightReducer";
import { alignNodes, packNodes, unifySizes, type Edge2D } from "./layoutOps";
import { ImageNode, type ImageNodeType } from "./ImageNode";
import { buildImageNode } from "./useCanvasDrop";
import { buildLocalImage, measureImage } from "./useLocalImport";
import { duplicateNode, normalizeRotation, toggleGrayscale } from "./transformStore";

const nodeTypes = { image: ImageNode };
const STORAGE_KEY = "cinecanvas.canvas.v1";
const canvasBackground =
	"radial-gradient(circle at 18% 12%, rgba(44, 33, 23, 0.035) 0 1px, transparent 1.4px), linear-gradient(135deg, rgba(44, 33, 23, 0.022), transparent 42%)";

export interface CanvasSearchClient {
	search(query: SearchQuery): Promise<SearchResult[]>;
}

interface CanvasRootProps {
	searchClient?: CanvasSearchClient;
	loadFrames?: () => Promise<FilmFrame[]>;
}

interface CanvasEdgeData extends Record<string, unknown> {
	direction: Direction;
	style: LineStyle;
}

type CanvasEdge = Edge;

interface PersistedCanvas {
	nodes: ImageNodeType[];
	edges: CanvasEdge[];
}

const getFallbackPointer = (): SpotlightPosition => ({
	x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
	y: typeof window === "undefined" ? 0 : window.innerHeight / 2,
});

const readPersistedCanvas = (): PersistedCanvas => {
	if (typeof window === "undefined") return { nodes: [], edges: [] };
	try {
		const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<PersistedCanvas>;
		return {
			nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
			edges: Array.isArray(parsed.edges) ? parsed.edges : [],
		};
	} catch {
		return { nodes: [], edges: [] };
	}
};

const edgeStyle = (direction: Direction, lineStyle: LineStyle): Partial<CanvasEdge> => {
	const marker = { type: MarkerType.ArrowClosed, color: "#2C2117" };
	return {
		style: {
			stroke: "#2C2117",
			strokeWidth: 1.6,
			strokeDasharray: lineStyle === "dashed" ? "6 5" : undefined,
		},
		...(direction === "A_TO_B" || direction === "BIDIRECTIONAL" ? { markerEnd: marker } : {}),
		...(direction === "B_TO_A" || direction === "BIDIRECTIONAL" ? { markerStart: marker } : {}),
	};
};

const toEdgeData = (data: Record<string, unknown> | undefined): CanvasEdgeData => ({
	direction:
		data?.direction === "NONE" ||
		data?.direction === "A_TO_B" ||
		data?.direction === "B_TO_A" ||
		data?.direction === "BIDIRECTIONAL"
			? data.direction
			: "A_TO_B",
	style: data?.style === "dashed" ? "dashed" : "solid",
});

const nextEdgeData = (data: Record<string, unknown> | undefined): CanvasEdgeData => {
	const current = toEdgeData(data);
	if (current.style === "solid") return { ...current, style: "dashed" };
	const directions: Direction[] = ["NONE", "A_TO_B", "B_TO_A", "BIDIRECTIONAL"];
	const nextDirection = directions[(directions.indexOf(current.direction) + 1) % directions.length] ?? "NONE";
	return { direction: nextDirection, style: "solid" };
};

export const CanvasRoot = ({
	searchClient,
	loadFrames = loadStaticIndex,
}: CanvasRootProps = {}) => {
	const initialCanvas = useRef(readPersistedCanvas());
	const [nodes, setNodes, onNodesChange] = useNodesState<ImageNodeType>(initialCanvas.current.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialCanvas.current.edges);
	const [flow, setFlow] = useState<ReactFlowInstance<ImageNodeType> | null>(
		null,
	);
	const [spotlight, dispatchSpotlight] = useReducer(
		spotlightReducer,
		initialSpotlightState,
	);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [activeSearchClient, setActiveSearchClient] =
		useState<CanvasSearchClient | null>(searchClient ?? null);
	const [spotlightStatus, setSpotlightStatus] = useState<SpotlightStatus>(
		searchClient ? "ready" : "loading",
	);
	const pointerRef = useRef<SpotlightPosition>(getFallbackPointer());
	const canvasRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
	}, [edges, nodes]);

	useEffect(() => {
		if (searchClient) {
			setActiveSearchClient(searchClient);
			setSpotlightStatus("ready");
			return;
		}

		let cancelled = false;

		const load = async (): Promise<void> => {
			setSpotlightStatus("loading");
			let frames: FilmFrame[] = [];

			try {
				frames = await loadFrames();
			} catch {
				if (!cancelled) {
					setActiveSearchClient(null);
					setSpotlightStatus("error");
				}
				return;
			}

			if (cancelled || frames.length === 0) {
				if (!cancelled) {
					setActiveSearchClient(null);
					setSpotlightStatus("empty");
				}
				return;
			}

			const { SearchEngine } = await import("@/search/searchEngine");
			const engine = new SearchEngine();
			await engine.init();
			await engine.ingest(frames);

			if (!cancelled) {
				setActiveSearchClient(engine);
				setSpotlightStatus("ready");
			}
		};

		void load();

		return () => {
			cancelled = true;
		};
	}, [loadFrames, searchClient]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			const key = event.key.toLowerCase();

			if ((event.metaKey || event.ctrlKey) && key === "f") {
				event.preventDefault();
				dispatchSpotlight({
					type: "OPEN",
					position: pointerRef.current,
				});
				return;
			}

			if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === "p") {
				event.preventDefault();
				void import("@/window/windowControls").then(({ toggleAlwaysOnTop }) => toggleAlwaysOnTop());
				return;
			}

			if ((event.metaKey || event.ctrlKey) && key === "e") {
				event.preventDefault();
				const viewport = canvasRef.current?.querySelector(".react-flow__viewport");
				if (viewport instanceof HTMLElement) {
					void import("@/export/exportEngine").then(({ exportViewportToPng }) =>
						exportViewportToPng(viewport),
					);
				}
				return;
			}

			if ((event.metaKey || event.ctrlKey) && key === "d") {
				event.preventDefault();
				setNodes((currentNodes) => {
					const copies = currentNodes.filter((node) => node.selected).map((node) => duplicateNode(node));
					return [
						...currentNodes.map((node) => ({ ...node, selected: false })),
						...copies,
					];
				});
				return;
			}

			if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.altKey && key === "g") {
				event.preventDefault();
				setNodes((currentNodes) =>
					currentNodes.map((node) => {
						if (!node.selected) return node;
						const { groupId: _groupId, ...data } = node.data;
						return { ...node, data };
					}),
				);
				return;
			}

			if ((event.metaKey || event.ctrlKey) && !event.shiftKey && key === "g") {
				event.preventDefault();
				const groupId = `group-${crypto.randomUUID()}`;
				setNodes((currentNodes) => {
					const selectedCount = currentNodes.filter((node) => node.selected).length;
					if (selectedCount < 2) return currentNodes;
					return currentNodes.map((node) =>
						node.selected ? { ...node, data: { ...node.data, groupId } } : node,
					);
				});
				return;
			}

			if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
				const edgeByKey: Record<string, Edge2D> = {
					arrowleft: "left",
					arrowright: "right",
					arrowup: "top",
					arrowdown: "bottom",
				};
				const edge = edgeByKey[key];
				if (edge) {
					event.preventDefault();
					setNodes((currentNodes) => {
						const selected = currentNodes.filter((node) => node.selected);
						const aligned = new Map(alignNodes(selected, edge).map((node) => [node.id, node]));
						return currentNodes.map((node) => aligned.get(node.id) ?? node);
					});
					return;
				}
				if (key === "g") {
					event.preventDefault();
					setNodes((currentNodes) => {
						const selected = currentNodes.filter((node) => node.selected);
						const packed = new Map(packNodes(selected).map((node) => [node.id, node]));
						return currentNodes.map((node) => packed.get(node.id) ?? node);
					});
					return;
				}
			}

			if ((event.metaKey || event.ctrlKey) && event.altKey && (key === "arrowleft" || key === "arrowright")) {
				event.preventDefault();
				const dimension = key === "arrowleft" ? "width" : "height";
				setNodes((currentNodes) => {
					const selected = currentNodes.filter((node) => node.selected);
					const unified = new Map(unifySizes(selected, dimension).map((node) => [node.id, node]));
					return currentNodes.map((node) => unified.get(node.id) ?? node);
				});
				return;
			}

			if (key === "g") {
				event.preventDefault();
				setNodes((currentNodes) =>
					currentNodes.map((node) => (node.selected ? toggleGrayscale(node) : node)),
				);
				return;
			}

			if (key === "[" || key === "]") {
				event.preventDefault();
				const delta = key === "[" ? -5 : 5;
				setNodes((currentNodes) =>
					currentNodes.map((node) =>
						node.selected
							? {
									...node,
									data: {
										...node.data,
										rotation: normalizeRotation(node.data.rotation + delta),
									},
								}
							: node,
					),
				);
				return;
			}

			if (key === "t") {
				const selected = nodes.find((node) => node.selected);
				if (!selected) return;
				event.preventDefault();
				const text = window.prompt("Annotation", String(selected.data.annotation ?? ""));
				if (text === null) return;
				setNodes((currentNodes) =>
					currentNodes.map((node) =>
						node.id === selected.id ? { ...node, data: { ...node.data, annotation: text } } : node,
					),
				);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [nodes, setNodes]);

	useEffect(() => {
		const query = spotlight.query.trim();

		if (!spotlight.isOpen || query.length < 2 || !activeSearchClient || spotlightStatus !== "ready") {
			setResults([]);
			dispatchSpotlight({ type: "SET_RESULTS_COUNT", count: 0 });
			return;
		}

		let cancelled = false;

		const runSearch = async (): Promise<void> => {
			const nextResults = await activeSearchClient.search({
				text: query,
				limit: 6,
			});

			if (!cancelled) {
				setResults(nextResults);
				dispatchSpotlight({
					type: "SET_RESULTS_COUNT",
					count: nextResults.length,
				});
			}
		};

		void runSearch();

		return () => {
			cancelled = true;
		};
	}, [activeSearchClient, spotlight.isOpen, spotlight.query, spotlightStatus]);

	const confirmSpotlight = useCallback((): void => {
		const selected = results[spotlight.selectedIndex];

		if (!selected) {
			return;
		}

		const position = flow
			? flow.screenToFlowPosition(spotlight.position)
			: spotlight.position;
		const node = buildImageNode(selected.frame, position);

		setNodes((currentNodes) => [
			...currentNodes.map((currentNode) => ({
				...currentNode,
				selected: false,
			})),
			{ ...node, selected: true },
		]);
		setResults([]);
		dispatchSpotlight({ type: "CLOSE" });
	}, [flow, results, setNodes, spotlight.position, spotlight.selectedIndex]);

	const dropLocalFiles = useCallback(
		async (files: FileList, screenPosition: SpotlightPosition): Promise<void> => {
			if (!flow) return;
			const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
			if (imageFiles.length === 0) return;

			const nextNodes: ImageNodeType[] = [];
			for (const [index, file] of imageFiles.entries()) {
				const objectUrl = URL.createObjectURL(file);
				const dimensions = await measureImage(objectUrl);
				const source = buildLocalImage(file.name, dimensions.width, dimensions.height, {
					convert: () => objectUrl,
				});
				const position = flow.screenToFlowPosition({
					x: screenPosition.x + index * 24,
					y: screenPosition.y + index * 24,
				});
				nextNodes.push(buildImageNode(source, position));
			}

			setNodes((currentNodes) => [
				...currentNodes.map((node) => ({ ...node, selected: false })),
				...nextNodes.map((node) => ({ ...node, selected: true })),
			]);
		},
		[flow, setNodes],
	);

	const connectNodes = useCallback(
		(connection: FlowConnection): void => {
			if (!connection.source || !connection.target) return;
			const data: CanvasEdgeData = { direction: "A_TO_B", style: "solid" };
			const edge: CanvasEdge = {
				...connection,
				id: `connection-${connection.source}-${connection.target}-${Date.now()}`,
				type: "smoothstep",
				data,
				...edgeStyle(data.direction, data.style),
			};
			setEdges((currentEdges) => addEdge(edge, currentEdges));
		},
		[setEdges],
	);

	const cycleEdge = useCallback(
		(_event: MouseEvent, edge: CanvasEdge): void => {
			const data = nextEdgeData(edge.data);
			setEdges((currentEdges) =>
				currentEdges.map((currentEdge) =>
					currentEdge.id === edge.id
						? {
								...currentEdge,
								data,
								...edgeStyle(data.direction, data.style),
							}
						: currentEdge,
				),
			);
		},
		[setEdges],
	);

	return (
		<div
			ref={canvasRef}
			onPointerMove={(event) => {
				pointerRef.current = { x: event.clientX, y: event.clientY };
			}}
			onDragOver={(event) => {
				event.preventDefault();
			}}
			onDrop={(event) => {
				event.preventDefault();
				void dropLocalFiles(event.dataTransfer.files, {
					x: event.clientX,
					y: event.clientY,
				});
			}}
			onPaste={(event) => {
				void dropLocalFiles(event.clipboardData.files, pointerRef.current);
			}}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				background: "var(--cc-bg)",
				overflow: "hidden",
			}}
		>
			<ReactFlow
				className="cinecanvas-flow"
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={connectNodes}
				onEdgeClick={cycleEdge}
				onInit={setFlow}
				nodeTypes={nodeTypes}
				onlyRenderVisibleElements
				panActivationKeyCode="Space"
				panOnDrag={[1, 2]}
				panOnScroll
				panOnScrollMode={PanOnScrollMode.Free}
				panOnScrollSpeed={0.7}
				zoomOnScroll={false}
				zoomOnPinch
				zoomOnDoubleClick={false}
				minZoom={0.05}
				maxZoom={8}
				deleteKeyCode="Delete"
				selectionOnDrag
				multiSelectionKeyCode="Shift"
				style={{
					background: canvasBackground,
					backgroundColor: "var(--cc-bg)",
					backgroundSize: "18px 18px, auto",
				}}
				proOptions={{ hideAttribution: true }}
			>
				<Background
					id="major-grid"
					color="var(--cc-border)"
					gap={128}
					lineWidth={1}
					variant={BackgroundVariant.Lines}
				/>
				<Background
					id="minor-dots"
					color="var(--cc-border-strong)"
					gap={32}
					size={1.2}
					variant={BackgroundVariant.Dots}
				/>
			</ReactFlow>
			<Spotlight
				state={spotlight}
				results={results}
				onQueryChange={(query) =>
					dispatchSpotlight({ type: "SET_QUERY", query })
				}
				onNavigateLeft={() =>
					dispatchSpotlight({ type: "NAVIGATE_LEFT" })
				}
				onNavigateRight={() =>
					dispatchSpotlight({ type: "NAVIGATE_RIGHT" })
				}
				onConfirm={confirmSpotlight}
				onClose={() => {
					setResults([]);
					dispatchSpotlight({ type: "CLOSE" });
				}}
				status={spotlightStatus}
			/>
		</div>
	);
};
