import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { DFAGraph } from "#components/DFAGraph";
import { Icon } from "#components/Icon";
import { Badge } from "#components/ui/Badge";
import { Button } from "#components/ui/Button";
import { Panel, PanelHeader, PanelTitle } from "#components/ui/Panel";
import { DFA_PRESETS } from "#constants/presets";
import { useToast } from "#hooks/use-toast";
import type { DFAPreset, DFAStepHistory, DFATransitions } from "#types/dfa";

export default function Page() {
	const showToast = useToast();

	const [states, setStates] = useState<string[]>(DFA_PRESETS.ends_11.states);
	const [alphabet, setAlphabet] = useState<string[]>(
		DFA_PRESETS.ends_11.symbols,
	);
	const [transitions, setTransitions] = useState<DFATransitions>(
		DFA_PRESETS.ends_11.transitions,
	);
	const [startState, setStartState] = useState<string>(
		DFA_PRESETS.ends_11.start,
	);
	const [acceptStates, setAcceptStates] = useState<string[]>(
		DFA_PRESETS.ends_11.accept,
	);

	const [newStateInput, setNewStateInput] = useState("");
	const [newSymbolInput, setNewSymbolInput] = useState("");
	const [testInputString, setTestInputString] = useState("");
	const [presetSelection, setPresetSelection] = useState("ends_11");
	const [isDfaGraphExpanded, setIsDfaGraphExpanded] = useState(false);

	const [traceHistory, setTraceHistory] = useState<DFAStepHistory[]>([]);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackSpeed, setPlaybackSpeed] = useState(800);
	const [hasStarted, setHasStarted] = useState(false);

	const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const workerRef = useRef<Worker | null>(null);

	// Mock results for Quick Test Suite so it updates reactively without async overhead purely for UI display
	const [mockResults, setMockResults] = useState<Record<string, boolean>>({});

	useEffect(() => {
		workerRef.current = new Worker(
			new URL("#lib/dfa.worker.js", import.meta.url),
			{ type: "module" },
		);
		return () => workerRef.current?.terminate();
	}, []);

	const handleLoadPreset = (e: ChangeEvent<HTMLSelectElement>) => {
		const key = e.target.value;
		setPresetSelection(key);
		const config = DFA_PRESETS[key];
		if (config) {
			setStates([...config.states]);
			setAlphabet([...config.symbols]);
			setTransitions(JSON.parse(JSON.stringify(config.transitions)));
			setStartState(config.start);
			setAcceptStates([...config.accept]);
			resetStepper();
			setHasStarted(false);
			showToast(
				"Preset Loaded",
				`DFA Rules for "${key}" loaded successfully.`,
				"success",
			);
		}
	};

	useEffect(() => {
		if (isDfaGraphExpanded) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isDfaGraphExpanded]);

	const handleAddState = () => {
		const s = newStateInput.trim().replace(/\s+/g, "");
		if (!s)
			return showToast(
				"Invalid Input",
				"Please specify a non-empty name.",
				"error",
			);
		if (states.includes(s))
			return showToast("Duplicate Key", "State already exists.", "error");

		setStates((prev) => [...prev, s]);
		setTransitions((prev) => {
			const next: DFATransitions = { ...prev, [s]: {} };
			alphabet.forEach((sym) => {
				next[s][sym] = "REJECT";
			});
			return next;
		});
		setNewStateInput("");
		showToast("Node Registered", `State ${s} was added.`, "success");
	};

	const handleAddSymbol = () => {
		const sym = newSymbolInput.trim();
		if (!sym)
			return showToast(
				"Invalid Input",
				"Enter a non-empty character.",
				"error",
			);
		if (alphabet.includes(sym))
			return showToast("Duplicate", "Alphabet already has this.", "error");

		setAlphabet((prev) => [...prev, sym]);
		setTransitions((prev) => {
			const next: DFATransitions = { ...prev };
			states.forEach((state) => {
				if (!next[state]) next[state] = {};
				next[state][sym] = "REJECT";
			});
			return next;
		});
		setNewSymbolInput("");
		showToast("Alphabet Updated", `Character '${sym}' added.`, "success");
	};

	const handleDeleteState = (stateToRemove: string) => {
		setStates((prev) => prev.filter((s) => s !== stateToRemove));
		setAcceptStates((prev) => prev.filter((s) => s !== stateToRemove));
		if (startState === stateToRemove) setStartState("");

		setTransitions((prev) => {
			const next: DFATransitions = { ...prev };
			delete next[stateToRemove];
			Object.keys(next).forEach((s) => {
				Object.keys(next[s]).forEach((sym) => {
					if (next[s][sym] === stateToRemove) next[s][sym] = "REJECT";
				});
			});
			return next;
		});
	};

	const handleDeleteSymbol = (symToRemove: string) => {
		setAlphabet((prev) => prev.filter((s) => s !== symToRemove));
		setTransitions((prev) => {
			const next: DFATransitions = { ...prev };
			Object.keys(next).forEach((state) => {
				delete next[state][symToRemove];
			});
			return next;
		});
	};

	const handleMatrixChange = (
		state: string,
		symbol: string,
		targetState: string,
	) => {
		setTransitions((prev) => ({
			...prev,
			[state]: {
				...(prev[state] || {}),
				[symbol]: targetState,
			},
		}));
	};

	const checkDFAWithMock = useCallback((config: DFAPreset, testStr: string) => {
		if (!workerRef.current) return;
		const id = crypto.randomUUID();
		const handler = (e: MessageEvent) => {
			if (e.data.id === id) {
				workerRef.current?.removeEventListener("message", handler);
				if (!e.data.error) {
					setMockResults((prev) => ({ ...prev, [testStr]: e.data.result }));
				}
			}
		};
		workerRef.current.addEventListener("message", handler);
		workerRef.current.postMessage({
			type: "CHECK_MOCK",
			id,
			testStr,
			transitions: config.transitions,
			startState: config.start,
			acceptStates: config.accept,
		});
	}, []);

	useEffect(() => {
		const config = DFA_PRESETS[presetSelection];

		if (config) {
			config.tests.forEach((tCase) => {
				checkDFAWithMock(config, tCase);
			});
		}
	}, [presetSelection, checkDFAWithMock]);

	const initializeSimulation = useCallback(
		(input = testInputString) => {
			if (!startState) {
				showToast("Error", "Please select a start state first.", "error");
				return;
			}

			if (!workerRef.current) return;

			const id = crypto.randomUUID();
			const handler = (e: MessageEvent) => {
				if (e.data.id === id) {
					workerRef.current?.removeEventListener("message", handler);
					if (e.data.error) {
						showToast("Error", e.data.error, "error");
					} else {
						setTraceHistory(e.data.result);
						setCurrentStepIndex(0);
						setHasStarted(true);
						setIsPlaying(false);
						showToast(
							"Simulation Loaded",
							"The simulation trace was initialized.",
							"info",
						);
					}
				}
			};

			workerRef.current.addEventListener("message", handler);
			workerRef.current.postMessage({
				type: "INITIALIZE_SIMULATION",
				id,
				startState,
				testInputString: input,
				alphabet,
				transitions,
				acceptStates,
			});
		},
		[
			startState,
			testInputString,
			alphabet,
			transitions,
			acceptStates,
			showToast,
		],
	);

	const stepForward = useCallback(() => {
		setCurrentStepIndex((prev) => {
			if (prev < traceHistory.length - 1) return prev + 1;
			pauseStepper();
			return prev;
		});
	}, [traceHistory.length]);

	const stepBackward = useCallback(() => {
		setCurrentStepIndex((prev) => Math.max(0, prev - 1));
	}, []);

	const pauseStepper = () => setIsPlaying(false);

	const resetStepper = useCallback(() => {
		setIsPlaying(false);
		setCurrentStepIndex(0);
	}, []);

	const togglePlay = () => setIsPlaying((prev) => !prev);

	useEffect(() => {
		if (isPlaying) {
			playIntervalRef.current = setInterval(() => {
				setCurrentStepIndex((prev) => {
					if (prev < traceHistory.length - 1) return prev + 1;
					setIsPlaying(false);
					return prev;
				});
			}, playbackSpeed);
		} else if (playIntervalRef.current) {
			clearInterval(playIntervalRef.current);
		}
		return () => {
			if (playIntervalRef.current) clearInterval(playIntervalRef.current);
		};
	}, [isPlaying, playbackSpeed, traceHistory.length]);

	const currentStep = traceHistory[currentStepIndex];

	return (
		<div className="grid grid-cols-1 gap-4 animate-in fade-in lg:grid-cols-12">
			<div className="flex flex-col gap-3 lg:col-span-5">
				<Panel>
					<PanelHeader>
						<PanelTitle>
							<Icon name="information" />
							Automaton Settings
						</PanelTitle>
						<select
							value={presetSelection}
							onChange={handleLoadPreset}
							className="w-full rounded border p-1 text-xs font-sans sm:w-52"
						>
							<option value="ends_11">Ends with '11' (Binary Alphabet)</option>
							<option value="even_zeros">Even Count of '0's (Binary)</option>
							<option value="ab_pattern">Contains Substring 'ab'</option>
						</select>
					</PanelHeader>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-1">
							<span className="block font-bold text-slate-600">New State:</span>
							<div className="flex gap-1.5">
								<input
									value={newStateInput}
									onChange={(e) => setNewStateInput(e.target.value)}
									type="text"
									placeholder="e.g. q3"
									className="w-full font-mono text-xs border rounded px-2"
								/>
								<Button onClick={handleAddState}>
									<Icon name="add" className="w-3 h-3" />
									Add
								</Button>
							</div>
						</div>
						<div className="space-y-1">
							<span className="block font-bold text-slate-600">
								New Alphabet Symbol:
							</span>
							<div className="flex gap-1.5">
								<input
									value={newSymbolInput}
									onChange={(e) => setNewSymbolInput(e.target.value)}
									maxLength={1}
									type="text"
									placeholder="e.g. 2"
									className="w-full font-mono text-xs text-center border rounded px-2"
								/>
								<Button onClick={handleAddSymbol}>
									<Icon name="add" className="w-3 h-3" />
									Add
								</Button>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
						<div>
							<span className="block font-bold text-slate-600 mb-1">
								Start State:
							</span>
							<select
								value={startState}
								onChange={(e) => setStartState(e.target.value)}
								className="w-full font-mono text-xs p-1 border rounded"
							>
								{states.map((s) => (
									<option key={`start-${s}`} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div>
							<span className="block font-bold text-slate-600 mb-1">
								Accept States:
							</span>
							<div className="bg-white border border-slate-300 max-h-18 overflow-y-auto p-1 rounded text-xs">
								{states.map((s) => (
									<label
										key={`acc-${s}`}
										className="flex items-center gap-1.5 p-0.5 hover:bg-slate-100 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={acceptStates.includes(s)}
											onChange={(e) => {
												if (e.target.checked)
													setAcceptStates((prev) => [...prev, s]);
												else
													setAcceptStates((prev) =>
														prev.filter((a) => a !== s),
													);
											}}
										/>
										<span>{s}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-1.5">
						<div className="flex justify-between items-center">
							<span className="font-bold text-slate-700 flex items-center gap-1">
								<Icon name="table" />
								Transition Function (𝛿):
							</span>
						</div>
						<div className="border border-slate-200 rounded max-h-56 overflow-auto">
							<table className="listview-table select-none text-xs w-max min-w-full">
								<thead>
									<tr>
										<th className="w-[1%] whitespace-nowrap"></th>
										{alphabet.map((sym) => (
											<th
												key={`th-${sym}`}
												className="text-center font-mono w-[1%] whitespace-nowrap px-2"
											>
												<Button
													onClick={() => handleDeleteSymbol(sym)}
													className="m-auto flex items-center justify-center p-1"
													aria-label="Delete Symbol"
													title="Delete Symbol"
												>
													Delete
													<Icon name="cross" className="size-2" />
												</Button>
											</th>
										))}
										<th className="text-right w-[1%] whitespace-nowrap"></th>
									</tr>
									<tr>
										<th className="w-[1%] whitespace-nowrap">State</th>
										{alphabet.map((sym) => (
											<th
												key={`th-${sym}`}
												className="text-center font-mono w-[1%] whitespace-nowrap px-2"
											>
												𝛿(q, '{sym}')
											</th>
										))}
										<th className="text-right w-[1%] whitespace-nowrap"></th>
									</tr>
								</thead>
								<tbody className="font-mono">
									{states.map((state) => (
										<tr key={`tr-${state}`}>
											<td className="font-bold whitespace-nowrap">
												{state}{" "}
												{state === startState && (
													<span className="text-[8px] bg-blue-100 border border-blue-600 px-1 font-sans rounded ml-1">
														START
													</span>
												)}
											</td>
											{alphabet.map((sym) => (
												<td
													key={`td-${state}-${sym}`}
													className="text-center whitespace-nowrap px-1"
												>
													<select
														value={transitions[state]?.[sym] || "REJECT"}
														onChange={(e) =>
															handleMatrixChange(state, sym, e.target.value)
														}
														className="text-[10px] min-w-15 max-w-30 w-full py-0.5 border rounded"
													>
														{states.map((opt) => (
															<option key={`opt-${opt}`} value={opt}>
																{opt}
															</option>
														))}
														<option value="REJECT">[REJECT]</option>
													</select>
												</td>
											))}
											<td className="text-right whitespace-nowrap">
												<Button
													onClick={() => handleDeleteState(state)}
													className="m-auto flex items-center justify-center p-1"
													aria-label="Delete State"
													title="Delete State"
												>
													<Icon name="cross" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</Panel>
			</div>

			<div className="flex flex-col gap-3 lg:col-span-7">
				<Panel>
					<div className="pb-2 border-b border-slate-200">
						<PanelTitle>
							<Icon name="lightning" />
							Execution Engine
						</PanelTitle>
					</div>

					<div className="space-y-1.5">
						<span className="block font-bold text-slate-600 text-xs">
							Test Input String:
						</span>
						<div className="flex flex-col gap-2 sm:flex-row">
							<input
								value={testInputString}
								onChange={(e) => setTestInputString(e.target.value)}
								type="text"
								placeholder="e.g. 10110"
								className="grow font-mono text-sm tracking-widest px-2.5 py-1.5 border rounded"
							/>
							<Button onClick={(_) => initializeSimulation()} variant="primary">
								<Icon name="lightning" />
								Initialize
							</Button>
						</div>
					</div>

					{hasStarted && currentStep && (
						<>
							<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
								<div className="flex flex-col items-center justify-center py-2 bg-white border border-slate-200 rounded">
									<span className="text-[9px] text-slate-500 font-bold tracking-widest mb-1.5 uppercase">
										Tape Reader
									</span>
									<div className="flex gap-1.5 font-mono text-lg">
										{testInputString.length === 0 ? (
											<span className="px-2 py-0.5 border border-slate-300 bg-white font-bold text-sm">
												λ (empty)
											</span>
										) : (
											testInputString.split("").map((char, i) => {
												const isActive = currentStep.index === i;
												return (
													<span
														key={`tape-${i}`}
														className={`px-2.5 py-1 border font-bold ${isActive ? "border-blue-600 bg-blue-100 text-blue-900 border-2" : "border-slate-300 bg-white text-slate-800"}`}
													>
														{char}
													</span>
												);
											})
										)}
									</div>
								</div>

								<div className="flex flex-wrap items-center justify-between gap-2 pt-1">
									<div className="flex flex-wrap items-center gap-1.5">
										<Button
											onClick={() => {
												setIsPlaying(false);
												setCurrentStepIndex(0);
											}}
											className="px-2"
											title="Skip to Start"
										>
											<Icon name="control_start" />
										</Button>
										<Button
											onClick={stepBackward}
											disabled={currentStepIndex === 0}
											className="px-2"
											title="Step Backward"
										>
											<Icon name="control_rewind" />
										</Button>
										<Button
											onClick={togglePlay}
											className="w-12 justify-center px-4 font-bold text-blue-900"
											title={isPlaying ? "Pause" : "Play"}
										>
											{isPlaying ? (
												<Icon name="control_pause" />
											) : (
												<Icon name="control_play" />
											)}
										</Button>
										<Button
											onClick={stepForward}
											disabled={currentStepIndex === traceHistory.length - 1}
											className="px-2"
											title="Step Forward"
										>
											<Icon name="control_fastforward" />
										</Button>
										<Button
											onClick={() => {
												setIsPlaying(false);
												setCurrentStepIndex(traceHistory.length - 1);
											}}
											disabled={currentStepIndex === traceHistory.length - 1}
											className="px-2"
											title="Skip to End"
										>
											<Icon name="control_end" />
										</Button>
									</div>
									<div className="flex flex-wrap items-center gap-1.5 text-xs">
										<span className="text-slate-600 font-sans">Delay:</span>
										<select
											value={playbackSpeed}
											onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
											className="text-xs p-1 border rounded"
										>
											<option value={1500}>Slow (1.5s)</option>
											<option value={800}>Normal (0.8s)</option>
											<option value={300}>Fast (0.3s)</option>
										</select>
									</div>
								</div>
							</div>

							<div className="space-y-1 relative">
								<div className="flex justify-between items-center">
									<span className="block font-bold text-slate-600">
										Active States Monitor (Node Graph):
									</span>
									<Button
										onClick={() => setIsDfaGraphExpanded(true)}
										title="Expand Graph to Fullscreen"
									>
										<Icon name="arrow_out" />
										Fullscreen
									</Button>
								</div>
								<div className="relative">
									<DFAGraph
										states={states}
										transitions={transitions}
										startState={startState}
										acceptStates={acceptStates}
										currentState={currentStep.currentState}
										alphabet={alphabet}
										wrapperClassName="min-h-[250px]"
									/>
								</div>
							</div>

							{isDfaGraphExpanded && (
								<div className="fixed inset-0 z-50 bg-slate-900/40 p-4 sm:p-8 flex items-center justify-center backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
									<div className="bg-white rounded shadow-2xl w-full h-full flex flex-col border border-slate-300">
										<div className="portal-header flex items-center justify-between p-3 select-none">
											<span className="font-bold text-[13px] flex items-center gap-1.5">
												<Icon name="sitemap" />
												Node Graph Full View
											</span>
											<Button
												onClick={() => setIsDfaGraphExpanded(false)}
												className="bg-white p-1 hover:bg-slate-100"
												title="Close Fullscreen"
											>
												<Icon name="cross" />
											</Button>
										</div>
										<div className="grow p-4 bg-slate-100 overflow-hidden relative">
											<DFAGraph
												states={states}
												transitions={transitions}
												startState={startState}
												acceptStates={acceptStates}
												currentState={currentStep.currentState}
												alphabet={alphabet}
												wrapperClassName="w-full h-full min-h-0"
											/>
										</div>
									</div>
								</div>
							)}

							<div className="space-y-3">
								<div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded shadow-sm">
									<span className="text-[10px] text-slate-500 font-bold uppercase leading-none block">
										Status Report
									</span>
									{currentStep.isFinal ? (
										<Badge type={currentStep.accepted ? "success" : "error"}>
											{currentStep.accepted ? "PASS" : "FAIL"}
										</Badge>
									) : (
										<Badge type="warning" className="animate-pulse">
											RUNNING
										</Badge>
									)}
									<span className="text-[12px] font-bold text-slate-800 leading-tight">
										{currentStep.isFinal
											? currentStep.accepted
												? `Accepted (State: ${currentStep.currentState})`
												: `Rejected (State: ${currentStep.currentState})`
											: `Simulating: Step ${currentStepIndex} of ${traceHistory.length - 1}`}
									</span>
								</div>

								<div className="border border-slate-200 rounded text-xs select-none bg-white">
									<table className="w-full text-left table-fixed">
										<thead className="bg-slate-100 border-b border-slate-200">
											<tr>
												<th className="p-1 px-2 w-10 text-center font-bold text-slate-600">
													Step
												</th>
												<th className="p-1 px-2 w-14 font-bold text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
													Init
												</th>
												<th className="p-1 px-2 w-12 text-center font-bold text-slate-600">
													Sym
												</th>
												<th className="p-1 px-2 w-14 font-bold text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
													Dest
												</th>
												<th className="p-1 px-2 font-bold text-slate-600 w-auto">
													Log
												</th>
											</tr>
										</thead>
										<tbody className="font-mono text-[10px]">
											{traceHistory.map((step, idx) => (
												<tr
													key={`log-${idx}`}
													className={`border-b border-slate-100 last:border-b-0 ${idx === currentStepIndex ? "bg-portal-mobile-hover-mid-2 font-bold shadow-inner" : idx > currentStepIndex ? "opacity-30" : "opacity-90"}`}
												>
													<td className="p-1 px-2 text-center font-bold border-r border-slate-100">
														{idx}
													</td>
													<td
														className={`p-1 px-2 border-r border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis ${step.currentState === "REJECT" ? "text-rose-600" : ""}`}
														title={step.currentState}
													>
														{step.currentState}
													</td>
													<td className="p-1 px-2 text-center border-r border-slate-100 bg-slate-50/50">
														{step.char === null ? "-" : step.char}
													</td>
													<td
														className={`p-1 px-2 border-r border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis ${step.nextState === "REJECT" ? "text-rose-600" : ""}`}
														title={step.nextState}
													>
														{step.nextState}
													</td>
													<td className="p-1 px-2 text-slate-700 wrap-break-word whitespace-pre-wrap">
														{step.msg}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</Panel>

				<Panel>
					<PanelTitle className="mb-3">
						<Icon name="information" />
						Quick Test Suite
					</PanelTitle>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
						{DFA_PRESETS[presetSelection]?.tests.map((tCase, idx) => {
							const expectedPass = mockResults[tCase] ?? false;
							return (
								<Button
									key={`test-${idx}`}
									onClick={() => {
										setTestInputString(tCase);
										initializeSimulation(tCase);
									}}
									className="flex-col justify-center gap-1 items-center text-center p-1 sm:p-2 h-14 w-full sm:w-28 shrink-0 shadow-sm"
								>
									<code className="text-[10px] sm:text-xs font-bold text-blue-900 block truncate w-full">
										{tCase === "" ? "λ (empty)" : tCase}
									</code>
									<span className="text-[9px] text-slate-500 block leading-none">
										Expect: {expectedPass ? "Pass" : "Fail"}
									</span>
								</Button>
							);
						})}
					</div>
				</Panel>
			</div>
		</div>
	);
}
