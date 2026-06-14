import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "#components/Icon";
import { Badge } from "#components/ui/Badge";
import { Button } from "#components/ui/Button";
import { Panel, PanelHeader, PanelTitle } from "#components/ui/Panel";
import { RESOLUTION_EXAMPLES } from "#constants/examples";
import { useToast } from "#hooks/use-toast";
import { cn } from "#lib/utils";
import type { ResolutionDerivation } from "#types/res";

export const ResolutionWorkspace = memo(function ResolutionWorkspace() {
	const showToast = useToast();
	const [clausesInput, setClausesInput] = useState("P|Q, ~P|R, ~Q|R, ~R");
	const [derivation, setDerivation] = useState<ResolutionDerivation | null>(
		null,
	);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		workerRef.current = new Worker(
			new URL("#lib/resolution.worker.js", import.meta.url),
			{ type: "module" },
		);
		return () => workerRef.current?.terminate();
	}, []);

	const runResolution = useCallback(
		(nextInput = clausesInput) => {
			if (!workerRef.current) return;

			const id = crypto.randomUUID();
			const worker = workerRef.current;
			const handler = (e: MessageEvent) => {
				if (e.data.id !== id) return;
				worker.removeEventListener("message", handler);

				if (e.data.error) {
					showToast("Error", e.data.error, "error");
					return;
				}

				const result: ResolutionDerivation = e.data.result;
				setDerivation(result);
				showToast(
					"Resolution Complete",
					result.success
						? "Derived the empty clause."
						: "Search saturated without contradiction.",
					result.success ? "success" : "info",
				);
			};

			worker.addEventListener("message", handler);
			worker.postMessage({
				type: "RUN_RESOLUTION",
				id,
				clausesInput: nextInput,
			});
		},
		[clausesInput, showToast],
	);

	return (
		<Panel className="animate-in fade-in">
			<PanelHeader>
				<PanelTitle>
					<Icon name="sitemap" />
					Propositional Logic Resolution Graph
				</PanelTitle>
				<span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
					Classic proof search
				</span>
			</PanelHeader>

			<div className="space-y-3 rounded-portal border border-blue-200 bg-blue-50/80 p-3">
				<p className="text-[11px] leading-relaxed text-blue-800">
					Enter clauses separated by commas. Use <code>|</code> for OR and{" "}
					<code>~</code> for NOT. Tautological clauses are ignored
					automatically.
				</p>

				<div className="flex flex-wrap gap-2">
					{RESOLUTION_EXAMPLES.map((example) => (
						<Button
							key={example.label}
							type="button"
							variant="chip"
							onClick={() => {
								setClausesInput(example.clausesInput);
								runResolution(example.clausesInput);
							}}
							className="justify-center"
						>
							{example.label}
						</Button>
					))}
				</div>

				<div className="flex flex-col gap-2 md:flex-row">
					<input
						value={clausesInput}
						onChange={(e) => setClausesInput(e.target.value)}
						className="min-w-0 flex-1 rounded-portal-sm border border-blue-200 bg-white px-3 py-2 font-mono text-sm shadow-inner outline-none focus:border-blue-400"
						placeholder="P|Q, ~P|R, ~Q|R, ~R"
					/>
					<Button
						onClick={() => runResolution()}
						variant="primary"
						className="w-full justify-center md:w-auto"
					>
						<Icon name="sitemap" />
						Resolve Logic
					</Button>
				</div>
			</div>

			{derivation && (
				<div className="space-y-4">
					<div className="flex flex-col gap-2 rounded-portal border border-slate-200 bg-slate-50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0">
							<span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
								Result diagnostics
							</span>
							<span className="mt-1 block text-sm font-bold text-slate-800">
								{derivation.msg}
							</span>
						</div>
						<Badge
							type={derivation.success ? "success" : "purple"}
							className="justify-center"
						>
							{derivation.success ? "UNSAT" : "SAT"}
						</Badge>
					</div>

					<div className="overflow-hidden rounded-portal border border-slate-200 bg-white shadow-sm">
						<div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
							Derivation trail
						</div>
						<div className="max-h-[32.5rem] overflow-auto p-3">
							<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
								{derivation.clauses.map((clause) => (
									<div
										key={clause.id}
										className={cn(
											"rounded-portal border p-3 shadow-sm",
											clause.lits.length === 0
												? "border-rose-300 bg-rose-50"
												: "border-slate-200 bg-[#fbfcfe]",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-700">
													{clause.id}
												</span>
												<span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
													Clause
												</span>
											</div>
											{clause.lits.length === 0 ? (
												<Badge type="error">empty</Badge>
											) : (
												<Badge type="warning">{clause.lits.length} lits</Badge>
											)}
										</div>
										<div className="mt-3 overflow-x-auto rounded-portal-sm border border-slate-200 bg-white p-2 font-mono text-sm text-slate-800">
											{clause.lits.length === 0
												? "[]"
												: clause.lits.join(" ∨ ")}
										</div>
										<div className="mt-2 text-[10px] text-slate-500">
											{clause.parents.length > 0
												? `Derived from ${clause.parents.join(" × ")}`
												: "Premise clause"}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</Panel>
	);
});
