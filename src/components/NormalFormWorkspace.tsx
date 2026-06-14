import { memo, useCallback, useEffect, useRef, useState } from "react";
import { StepTimeline } from "#components/ast/step-timeline";
import { Icon } from "#components/Icon";
import { Button } from "#components/ui/Button";
import { Panel, PanelHeader, PanelTitle } from "#components/ui/Panel";
import { AST_EXAMPLES } from "#constants/examples";
import { useToast } from "#hooks/use-toast";
import { cn } from "#lib/cn";
import LogicWorker from "#lib/logicWorker?worker";
import type { ASTOutputs } from "#types/ast";

export const NormalFormWorkspace = memo(function NormalFormWorkspace() {
	const [formula, setFormula] = useState("~(A & (B | ~C))");
	const [outputs, setOutputs] = useState<ASTOutputs | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const showToast = useToast();
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		workerRef.current = new LogicWorker();
		return () => workerRef.current?.terminate();
	}, []);

	const transformLogic = useCallback(
		(nextFormula = formula) => {
			if (!workerRef.current) return;

			setIsRunning(true);
			const id = crypto.randomUUID();
			const worker = workerRef.current;

			const handler = (e: MessageEvent) => {
				if (e.data.id !== id) return;
				worker.removeEventListener("message", handler);
				setIsRunning(false);

				if (e.data.error) {
					showToast("Syntax Error", e.data.error, "error");
					return;
				}

				setOutputs(e.data.result);
				showToast(
					"Success",
					"Formula parsed and transformed into NNF, CNF, and DNF.",
					"success",
				);
			};

			worker.addEventListener("message", handler);
			worker.postMessage({ type: "TRANSFORM_LOGIC", id, formula: nextFormula });
		},
		[formula, showToast],
	);

	return (
		<Panel className="animate-in fade-in">
			<PanelHeader>
				<PanelTitle>
					<Icon name="arrow_switch" />
					NNF, CNF &amp; DNF AST Transformer
				</PanelTitle>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{isRunning && (
						<span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
							Working…
						</span>
					)}
				</div>
			</PanelHeader>

			<div className="space-y-3 rounded-portal border border-purple-200 bg-purple-50/80 p-3">
				<p className="text-[11px] leading-relaxed text-purple-800">
					Allowed operators: <code>~</code> NOT, <code>&amp;</code> AND,{" "}
					<code>|</code> OR, <code>-&gt;</code> IMPLIES, <code>&lt;-&gt;</code>{" "}
					EQUIVALENCE. Parentheses are respected, and implication is handled as
					right-associative.
				</p>

				<div className="flex flex-wrap gap-2">
					{AST_EXAMPLES.map((example) => (
						<Button
							key={example.label}
							type="button"
							variant="chip"
							onClick={() => {
								setFormula(example.formula);
								transformLogic(example.formula);
							}}
							className="justify-center"
						>
							{example.label}
						</Button>
					))}
				</div>

				<div className="flex flex-col gap-2 md:flex-row">
					<input
						value={formula}
						onChange={(e) => setFormula(e.target.value)}
						className="min-w-0 flex-1 rounded-portal-sm border border-purple-200 bg-white px-3 py-2 font-mono text-sm shadow-inner outline-none ring-0 placeholder:text-slate-400 focus:border-purple-400"
						placeholder="Type a logical formula"
					/>
					<Button
						onClick={() => transformLogic()}
						variant="primary"
						className="w-full justify-center md:w-auto"
					>
						<Icon name="arrow_switch" />
						Transform Formula
					</Button>
				</div>
			</div>

			{outputs && (
				<div className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
						{[
							{ label: "Parsed AST", value: outputs.parsed, tone: "slate" },
							{ label: "NNF", value: outputs.nnf, tone: "blue" },
							{ label: "CNF", value: outputs.cnf, tone: "emerald" },
							{ label: "DNF", value: outputs.dnf, tone: "purple" },
						].map((entry) => (
							<div
								key={entry.label}
								className={cn(
									"rounded-portal border bg-white p-3 shadow-sm",
									entry.tone === "slate" && "border-slate-200 bg-slate-50",
									entry.tone === "blue" && "border-blue-200 bg-blue-50",
									entry.tone === "emerald" &&
										"border-emerald-200 bg-emerald-50",
									entry.tone === "purple" && "border-purple-200 bg-purple-50",
								)}
							>
								<span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
									{entry.label}
								</span>
								<div className="mt-2 overflow-x-auto rounded-portal-sm border border-slate-200 bg-[#fbfcfe] p-2 font-mono text-[12px] leading-5 text-slate-900">
									{entry.value}
								</div>
							</div>
						))}
					</div>

					<div className="rounded-portal border border-slate-200 bg-slate-50 p-3 shadow-sm">
						<div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
							Transformation trail
						</div>
						<StepTimeline steps={outputs.steps} />
					</div>
				</div>
			)}
		</Panel>
	);
});
