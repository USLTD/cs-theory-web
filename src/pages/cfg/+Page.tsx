import {
	type ChangeEvent,
	Fragment,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { CFGRule } from "#/types/cfg";
import { Icon } from "#components/Icon";
import { useToast } from "#components/Toast";
import { Badge } from "#components/ui/Badge";
import { Button } from "#components/ui/Button";
import { Panel, PanelHeader, PanelTitle } from "#components/ui/Panel";
import { CFG_PRESETS } from "#constants/presets";

interface GenerationResult {
	str: string;
	history: string[];
}

export default function Page() {
	const showToast = useToast();

	const [startSymbol, setStartSymbol] = useState<string>(
		CFG_PRESETS.anbn.start,
	);
	const [rules, setRules] = useState<CFGRule[]>(CFG_PRESETS.anbn.rules);
	const [presetSelection, setPresetSelection] = useState<string>("anbn");
	const [maxLen, setMaxLen] = useState<number>(6);

	const [results, setResults] = useState<GenerationResult[]>([]);
	const [hasGenerated, setHasGenerated] = useState<boolean>(false);

	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		workerRef.current = new Worker(
			new URL("#lib/cfg.worker.js", import.meta.url),
			{
				type: "module",
			},
		);
		return () => workerRef.current?.terminate();
	}, []);

	const handleLoadPreset = (e: ChangeEvent<HTMLSelectElement>) => {
		const key = e.target.value;
		setPresetSelection(key);
		const config = CFG_PRESETS[key];
		if (config) {
			setStartSymbol(config.start);
			setRules(JSON.parse(JSON.stringify(config.rules)));
			setHasGenerated(false);
			setResults([]);
			showToast(
				"Grammar Preset Loaded",
				`Rules for "${key}" initialized.`,
				"success",
			);
		}
	};

	const updateRule = (id: string, field: keyof CFGRule, value: string) => {
		setRules((prev) =>
			prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
		);
	};

	const addRule = () => {
		setRules((prev) => [
			...prev,
			{ id: crypto.randomUUID(), nt: "", prods: "" },
		]);
	};

	const deleteRule = (id: string) => {
		setRules((prev) => prev.filter((r) => r.id !== id));
	};

	const generateStrings = useCallback(() => {
		if (!startSymbol || rules.length === 0) {
			return showToast(
				"Configuration Error",
				"Provide a start variable and rules.",
				"error",
			);
		}

		if (!workerRef.current) return;

		const id = crypto.randomUUID();
		const handler = (e: MessageEvent) => {
			if (e.data.id === id) {
				workerRef.current?.removeEventListener("message", handler);
				if (e.data.error) {
					showToast("Error", e.data.error, "error");
				} else {
					setResults(e.data.result);
					setHasGenerated(true);
					if (e.data.halted) {
						showToast(
							"Generation Halted",
							`Hit safety limit (4000 steps). Showing partial results.`,
							"warning",
						);
					} else {
						showToast(
							"Generation Complete",
							`Evaluated language strings successfully.`,
							"success",
						);
					}
				}
			}
		};

		workerRef.current.addEventListener("message", handler);
		workerRef.current.postMessage({
			type: "GENERATE_CFG",
			id,
			startSymbol,
			rules,
			maxLen,
		});
	}, [startSymbol, rules, maxLen, showToast]);

	return (
		<div className="grid grid-cols-1 gap-4 animate-in fade-in lg:grid-cols-12">
			<div className="flex flex-col gap-3 lg:col-span-5">
				<Panel>
					<PanelHeader>
						<PanelTitle>
							<Icon name="information" />
							Grammar Preset
						</PanelTitle>
						<select
							value={presetSelection}
							onChange={handleLoadPreset}
							className="w-full rounded-portal-sm border border-slate-300 bg-white px-2 py-1.25 text-xs font-sans shadow-sm sm:w-52"
						>
							<option value="anbn">aⁿbⁿ (Equal Counts)</option>
							<option value="brackets">Balanced Parentheses</option>
							<option value="english_struct">
								Simple Sentence Parser Structure
							</option>
						</select>
					</PanelHeader>

					<div className="space-y-3">
						<div className="space-y-1">
							<span className="block font-bold text-slate-600">
								Start Variable:
							</span>
							<input
								value={startSymbol}
								onChange={(e) => setStartSymbol(e.target.value)}
								type="text"
								className="w-16 rounded-portal-sm border border-slate-300 bg-white py-1.25 text-center font-bold text-purple-800 shadow-inner"
							/>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between items-center">
								<span className="font-bold text-slate-600 flex items-center gap-1">
									<Icon name="wrench" />
									Production Rules (P):
								</span>
								<Button onClick={addRule} className="text-xs py-0.5">
									<Icon name="add" className="w-3 h-3" />
									New Rule
								</Button>
							</div>

							<div className="max-h-85 space-y-2 overflow-y-auto pr-1">
								{rules.map((rule) => (
									<div
										key={rule.id}
										className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded"
									>
										<input
											type="text"
											placeholder="NT"
											value={rule.nt}
											onChange={(e) =>
												updateRule(rule.id, "nt", e.target.value)
											}
											className="w-14 text-center font-bold text-purple-800 border rounded py-1"
										/>
										<span className="font-bold text-slate-500 font-mono">
											➔
										</span>
										<input
											type="text"
											placeholder="Alternatives (separated by '|')"
											value={rule.prods}
											onChange={(e) =>
												updateRule(rule.id, "prods", e.target.value)
											}
											className="min-w-0 grow rounded border px-2 py-1 text-sm font-mono"
										/>
										<Button
											onClick={() => deleteRule(rule.id)}
											className="shrink-0 p-1"
											title="Delete Rule"
										>
											<Icon name="cross" />
										</Button>
									</div>
								))}
							</div>
						</div>
					</div>
				</Panel>
			</div>

			<div className="flex flex-col gap-3 lg:col-span-7">
				<Panel>
					<div className="pb-2 border-b border-slate-200">
						<PanelTitle>
							<Icon name="lightning" />
							Derivation Sandbox Engine
						</PanelTitle>
					</div>

					<div className="flex flex-col gap-3 rounded border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center">
						<span className="font-bold text-slate-600 whitespace-nowrap text-sm">
							Max Word Length:
						</span>
						<input
							type="number"
							value={maxLen}
							onChange={(e) => setMaxLen(Number(e.target.value))}
							min={0}
							max={15}
							className="w-20 rounded-portal-sm border border-slate-300 bg-white px-2 py-1.25 font-mono shadow-inner"
						/>
						<Button
							onClick={generateStrings}
							variant="primary"
							className="w-full sm:w-auto justify-center px-4 py-1.25 text-xs ml-auto"
						>
							<Icon name="lightning" />
							Generate
						</Button>
					</div>

					{hasGenerated && (
						<div className="space-y-3">
							<div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
								<span className="font-bold text-slate-700 text-xs uppercase">
									Set of Generated Strings (L)
								</span>
								<Badge type="purple">{results.length} words</Badge>
							</div>

							<div className="border border-slate-200 rounded max-h-100 overflow-y-auto">
								<table className="listview-table select-none">
									<thead>
										<tr>
											<th className="w-10 text-center text-xs">#</th>
											<th className="w-40 text-xs">Derived String Result</th>
											<th className="text-xs">
												Leftmost Derivation Tree Trace
											</th>
										</tr>
									</thead>
									<tbody className="font-mono text-xs">
										{results.length === 0 ? (
											<tr>
												<td
													colSpan={3}
													className="p-4 text-center text-slate-500 italic"
												>
													No strings generated within the length parameter.
												</td>
											</tr>
										) : (
											results.map((sol, index) => (
												<tr key={`sol-${index}`}>
													<td className="text-center font-bold text-slate-500">
														{index + 1}
													</td>
													<td className="font-bold text-slate-900 tracking-wider">
														{sol.str}
													</td>
													<td className="py-2">
														<div className="flex flex-wrap items-center gap-y-1">
															{sol.history.map((step, sIdx) => (
																<Fragment key={`hist-${index}-${sIdx}`}>
																	<span className="px-1.5 py-0.5 border border-purple-300 bg-purple-50 rounded font-bold text-[10px] text-purple-900 shadow-sm">
																		{step}
																	</span>
																	{sIdx < sol.history.length - 1 && (
																		<span className="text-slate-400 px-1">
																			➔
																		</span>
																	)}
																</Fragment>
															))}
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</Panel>
			</div>
		</div>
	);
}
