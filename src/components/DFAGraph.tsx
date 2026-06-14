import {
	memo,
	type PointerEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { DFATransitions } from "#types/dfa";

interface DFAGraphProps {
	states: string[];
	transitions: DFATransitions;
	startState: string;
	acceptStates: string[];
	currentState?: string;
	alphabet: string[];
	wrapperClassName?: string;
}

const EDGE_COLORS = [
	"#e6194B",
	"#3cb44b",
	"#4363d8",
	"#f58231",
	"#911eb4",
	"#42d4f4",
	"#f032e6",
	"#bfef45",
	"#469990",
	"#9A6324",
	"#800000",
	"#808000",
	"#000075",
	"#000000",
];

export const DFAGraph = memo(function DFAGraph({
	states,
	transitions,
	startState,
	acceptStates,
	currentState,
	alphabet,
	wrapperClassName = "",
}: DFAGraphProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [nodesMap, setNodesMap] = useState<
		Record<string, { x: number; y: number }>
	>({});
	const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
	const viewRef = useRef(view);

	const [dragState, setDragState] = useState<{
		type: "node" | "pan";
		id: string | null;
		lastX: number;
		lastY: number;
		pointerId: number;
	} | null>(null);

	const [dimensions, setDimensions] = useState({ width: 600, height: 300 });

	// Sync view ref for non-react event listeners (pinch-zoom)
	useEffect(() => {
		viewRef.current = view;
	}, [view]);

	// Responsive container setup
	useEffect(() => {
		if (!containerRef.current) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setDimensions({
					width: entry.contentRect.width,
					height: entry.contentRect.height,
				});
			}
		});
		observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, []);

	const { width, height } = dimensions;
	const nodeR = 18;

	// Initial Circular Layout Calculation
	useEffect(() => {
		setNodesMap((prev) => {
			const newMap = { ...prev };
			const cx = width / 2,
				cy = height / 2,
				radius = Math.min(width, height) / 3.5;
			let dirty = false;

			states.forEach((s, i) => {
				if (!newMap[s]) {
					dirty = true;
					if (states.length === 1) {
						newMap[s] = { x: cx, y: cy };
					} else {
						const angle = (i / states.length) * 2 * Math.PI - Math.PI / 2;
						newMap[s] = {
							x: cx + radius * Math.cos(angle),
							y: cy + radius * Math.sin(angle),
						};
					}
				}
			});

			Object.keys(newMap).forEach((k) => {
				if (!states.includes(k)) {
					dirty = true;
					delete newMap[k];
				}
			});

			return dirty ? newMap : prev;
		});
	}, [width, height, states]);

	// Optimized edge map generation
	const edgesMap = useMemo(() => {
		const map: Record<string, string[]> = {};
		states.forEach((u) => {
			alphabet.forEach((sym) => {
				const v = transitions[u]?.[sym];
				if (v && v !== "REJECT") {
					const key = `${u}->${v}`;
					if (!map[key]) map[key] = [];
					map[key].push(sym);
				}
			});
		});
		return map;
	}, [states, alphabet, transitions]);

	// Pinch to Zoom & Mouse Wheel Logic
	useEffect(() => {
		const node = svgRef.current;
		if (!node) return;

		let pinchActive = false;
		let initialDist = 0;
		let initialScale = 1;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const scaleAdj = e.deltaY > 0 ? 0.9 : 1.1;
			setView((prev) => ({
				...prev,
				scale: Math.min(Math.max(0.3, prev.scale * scaleAdj), 3),
			}));
		};

		const onTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				pinchActive = true;
				initialDist = Math.hypot(
					e.touches[0].clientX - e.touches[1].clientX,
					e.touches[0].clientY - e.touches[1].clientY,
				);
				initialScale = viewRef.current.scale;
			}
		};

		const onTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && pinchActive) {
				e.preventDefault();
				const dist = Math.hypot(
					e.touches[0].clientX - e.touches[1].clientX,
					e.touches[0].clientY - e.touches[1].clientY,
				);
				const scaleAdj = dist / initialDist;
				setView((prev) => ({
					...prev,
					scale: Math.min(Math.max(0.3, initialScale * scaleAdj), 3),
				}));
			}
		};

		const onTouchEnd = (e: TouchEvent) => {
			if (e.touches.length < 2) {
				pinchActive = false;
			}
		};

		node.addEventListener("wheel", onWheel, { passive: false });
		node.addEventListener("touchstart", onTouchStart, { passive: false });
		node.addEventListener("touchmove", onTouchMove, { passive: false });
		node.addEventListener("touchend", onTouchEnd);
		node.addEventListener("touchcancel", onTouchEnd);

		return () => {
			node.removeEventListener("wheel", onWheel);
			node.removeEventListener("touchstart", onTouchStart);
			node.removeEventListener("touchmove", onTouchMove);
			node.removeEventListener("touchend", onTouchEnd);
			node.removeEventListener("touchcancel", onTouchEnd);
		};
	}, []);

	// Unified Pointer Events for Dragging & Panning
	const handlePointerDown = (
		e: PointerEvent<SVGSVGElement | SVGGElement>,
		nodeId: string | null,
	) => {
		if (!e.isPrimary) return; // Ignore multi-touch secondary fingers for drag
		e.stopPropagation();

		// Capture the pointer to track movement even outside the element
		(e.target as Element).setPointerCapture(e.pointerId);

		setDragState({
			type: nodeId ? "node" : "pan",
			id: nodeId,
			lastX: e.clientX,
			lastY: e.clientY,
			pointerId: e.pointerId,
		});
	};

	const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
		if (!dragState || dragState.pointerId !== e.pointerId) return;

		const dx = e.clientX - dragState.lastX;
		const dy = e.clientY - dragState.lastY;
		const id = dragState.id;

		if (dragState.type === "node" && typeof id === "string") {
			setNodesMap((prev) => ({
				...prev,
				[id]: {
					x: prev[id].x + dx / view.scale,
					y: prev[id].y + dy / view.scale,
				},
			}));
		} else if (dragState.type === "pan") {
			setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
		}

		setDragState((prev) =>
			prev ? { ...prev, lastX: e.clientX, lastY: e.clientY } : null,
		);
	};

	const handlePointerUp = (e: PointerEvent<SVGSVGElement | SVGGElement>) => {
		if (dragState && dragState.pointerId === e.pointerId) {
			try {
				(e.target as Element).releasePointerCapture(e.pointerId);
			} catch (_) {
				// Ignore if capture was already gracefully lost
			}
			setDragState(null);
		}
	};

	return (
		<div
			ref={containerRef}
			className={`border border-slate-300 bg-[#f9fafc] rounded relative overflow-hidden shadow-inner flex justify-center w-full ${wrapperClassName}`}
			style={{
				backgroundImage:
					"linear-gradient(#ebebeb 1px, transparent 1px), linear-gradient(90deg, #ebebeb 1px, transparent 1px)",
				backgroundSize: "20px 20px",
			}}
		>
			<div className="absolute top-2 left-2 text-[10px] sm:text-[11px] bg-white/90 border border-slate-300 px-2 py-1.5 rounded text-slate-600 shadow-sm pointer-events-none z-10 flex flex-col sm:flex-row gap-1 sm:gap-3 font-semibold backdrop-blur-sm">
				<span className="flex items-center gap-1 sm:border-l sm:border-slate-300 sm:first:border-0 sm:pl-2 sm:first:pl-0">
					<span className="text-[12px]">🖱️</span> Pan / Drag
				</span>
				<span className="flex items-center gap-1 sm:border-l sm:border-slate-300 sm:pl-2">
					<span className="text-[12px]">🤏</span> Zoom
				</span>
			</div>

			<svg
				ref={svgRef}
				role="application"
				aria-label="Interactive DFA Graph Workspace"
				viewBox={`0 0 ${width} ${height}`}
				className="drop-shadow-sm font-sans select-none touch-none cursor-grab active:cursor-grabbing w-full h-full"
				style={{ overflow: "visible" }}
				onPointerDown={(e) => handlePointerDown(e, null)}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
			>
				<defs>
					<linearGradient id="nodeGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ffffff" />
						<stop offset="100%" stopColor="#e4e9ed" />
					</linearGradient>
					<linearGradient id="nodeActiveGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#dbeafe" />
						<stop offset="100%" stopColor="#93c5fd" />
					</linearGradient>
					<filter id="shadow">
						<feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.2" />
					</filter>

					{EDGE_COLORS.map((color, index) => (
						<marker
							key={`arr-${index}`}
							id={`arr-${index}`}
							viewBox="0 0 10 10"
							refX="24"
							refY="5"
							markerWidth="5"
							markerHeight="5"
							orient="auto-start-reverse"
						>
							<path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
						</marker>
					))}

					<marker
						id="arrow-start"
						viewBox="0 0 10 10"
						refX="24"
						refY="5"
						markerWidth="5"
						markerHeight="5"
						orient="auto-start-reverse"
					>
						<path d="M 0 0 L 10 5 L 0 10 z" fill="#1e3f6c" />
					</marker>
				</defs>

				<g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
					{Object.keys(edgesMap).map((key, index) => {
						const [u, v] = key.split("->");
						const labels = edgesMap[key].join(", ");
						const p1 = nodesMap[u];
						const p2 = nodesMap[v];
						const edgeColor = EDGE_COLORS[index % EDGE_COLORS.length];

						if (!p1 || !p2) return null;

						if (u === v) {
							const graphCx = width / 2;
							const graphCy = height / 2;
							const angle = Math.atan2(p1.y - graphCy, p1.x - graphCx);
							const loopDist = 50;
							const cpx1 = p1.x + Math.cos(angle - 0.6) * loopDist;
							const cpy1 = p1.y + Math.sin(angle - 0.6) * loopDist;
							const cpx2 = p1.x + Math.cos(angle + 0.6) * loopDist;
							const cpy2 = p1.y + Math.sin(angle + 0.6) * loopDist;
							const textX = p1.x + Math.cos(angle) * (loopDist + 15);
							const textY = p1.y + Math.sin(angle) * (loopDist + 15);

							return (
								<g key={`edge-${key}`}>
									<path
										d={`M ${p1.x} ${p1.y} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`}
										fill="none"
										stroke={edgeColor}
										strokeWidth="1.5"
										markerEnd={`url(#arr-${index % EDGE_COLORS.length})`}
									/>
									<text
										x={textX}
										y={textY + 3}
										textAnchor="middle"
										fontSize="10"
										stroke="#ffffff"
										strokeWidth="3"
										fontWeight="bold"
									>
										{labels}
									</text>
									<text
										x={textX}
										y={textY + 3}
										textAnchor="middle"
										fontSize="10"
										fill={edgeColor}
										fontWeight="bold"
									>
										{labels}
									</text>
								</g>
							);
						} else {
							const dx = p2.x - p1.x;
							const dy = p2.y - p1.y;
							const dist = Math.sqrt(dx * dx + dy * dy);
							const midX = (p1.x + p2.x) / 2;
							const midY = (p1.y + p2.y) / 2;

							const nx = -dy / dist;
							const ny = dx / dist;
							const offset = 25;
							const ctrlX = midX + nx * offset;
							const ctrlY = midY + ny * offset;

							const textX = midX + nx * (offset + 10);
							const textY = midY + ny * (offset + 10);

							return (
								<g key={`edge-${key}`}>
									<path
										d={`M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`}
										fill="none"
										stroke={edgeColor}
										strokeWidth="1.5"
										markerEnd={`url(#arr-${index % EDGE_COLORS.length})`}
									/>
									<text
										x={textX}
										y={textY + 3}
										textAnchor="middle"
										fontSize="10"
										stroke="#ffffff"
										strokeWidth="3"
										fontWeight="bold"
									>
										{labels}
									</text>
									<text
										x={textX}
										y={textY + 3}
										textAnchor="middle"
										fontSize="10"
										fill={edgeColor}
										fontWeight="bold"
									>
										{labels}
									</text>
								</g>
							);
						}
					})}

					{states.map((s) => {
						const pos = nodesMap[s];
						if (!pos) return null;
						const isActive = currentState === s;
						const isAccept = acceptStates.includes(s);
						const isStart = startState === s;

						return (
							<g
								key={`node-${s}`}
								onPointerDown={(e) => handlePointerDown(e, s)}
								className="cursor-pointer"
								aria-label={`State ${s}`}
							>
								{isStart && (
									<path
										d={`M ${pos.x - 45} ${pos.y} L ${pos.x - 25} ${pos.y}`}
										fill="none"
										stroke="#1e3f6c"
										strokeWidth="1.5"
										markerEnd="url(#arrow-start)"
									/>
								)}
								<circle
									cx={pos.x}
									cy={pos.y}
									r={nodeR}
									fill={isActive ? "url(#nodeActiveGrad)" : "url(#nodeGrad)"}
									stroke={isActive ? "#2563eb" : "#7f9db9"}
									strokeWidth={isActive ? "2.5" : "1.5"}
									filter="url(#shadow)"
								/>
								{isAccept && (
									<circle
										cx={pos.x}
										cy={pos.y}
										r={nodeR - 4}
										fill="none"
										stroke={isActive ? "#2563eb" : "#7f9db9"}
										strokeWidth="1.2"
									/>
								)}
								<text
									x={pos.x}
									y={pos.y + 4}
									textAnchor="middle"
									fontSize="11"
									fontWeight="bold"
									fill={isActive ? "#1e40af" : "#333"}
									pointerEvents="none"
								>
									{s}
								</text>
								{isActive && (
									<circle
										cx={pos.x}
										cy={pos.y}
										r={nodeR}
										fill="none"
										stroke="#3b82f6"
										strokeWidth="2"
										pointerEvents="none"
									>
										<animate
											attributeName="r"
											values={`${nodeR};${nodeR + 10}`}
											dur="1.5s"
											repeatCount="indefinite"
										/>
										<animate
											attributeName="opacity"
											values="1;0"
											dur="1.5s"
											repeatCount="indefinite"
										/>
									</circle>
								)}
							</g>
						);
					})}
				</g>
			</svg>
		</div>
	);
});
