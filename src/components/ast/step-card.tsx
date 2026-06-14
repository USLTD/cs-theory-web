import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#lib/utils";
import type { ASTStep } from "#types/ast";

const stepCardVariants = cva(
	[
		"overflow-hidden",
		"rounded-portal",
		"border",
		"bg-white",
		"shadow-sm",
		"[box-shadow:inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(0,0,0,0.05)]",
	],
	{
		variants: {
			accent: {
				input: "border-slate-300 bg-slate-50",
				rewrite: "border-blue-300 bg-blue-50",
				normalize: "border-emerald-300 bg-emerald-50",
				cnf: "border-purple-300 bg-purple-50",
				dnf: "border-amber-300 bg-amber-50",
			},
		},
		defaultVariants: {
			accent: "input",
		},
	},
);

const stepHeaderVariants = cva(
	[
		"flex",
		"items-center",
		"justify-between",
		"gap-3",
		"bg-linear-to-b",
		"px-3",
		"py-2",
	],
	{
		variants: {
			accent: {
				input: "from-slate-100 to-slate-200 text-slate-800",
				rewrite: "from-blue-100 to-blue-200 text-blue-900",
				normalize: "from-emerald-100 to-emerald-200 text-emerald-900",
				cnf: "from-purple-100 to-purple-200 text-purple-900",
				dnf: "from-amber-100 to-amber-200 text-amber-900",
			},
		},
		defaultVariants: {
			accent: "input",
		},
	},
);

const stepNumberVariants = cva(
	[
		"inline-flex",
		"h-7",
		"w-7",
		"shrink-0",
		"items-center",
		"justify-center",
		"rounded-full",
		"border",
		"text-[11px]",
		"font-bold",
	],
	{
		variants: {
			accent: {
				input: "border-slate-300 bg-white text-slate-700",
				rewrite: "border-blue-300 bg-white text-blue-800",
				normalize: "border-emerald-300 bg-white text-emerald-800",
				cnf: "border-purple-300 bg-white text-purple-800",
				dnf: "border-amber-300 bg-white text-amber-800",
			},
		},
		defaultVariants: {
			accent: "input",
		},
	},
);

type StepCardProps = {
	step: ASTStep;
	index: number;
	className?: string;
};

export function StepCard({ step, index, className }: StepCardProps) {
	return (
		<article
			className={cn(
				stepCardVariants({
					accent: step.accent,
				}),
				className,
			)}
		>
			<header
				className={stepHeaderVariants({
					accent: step.accent,
				})}
			>
				<div className="flex min-w-0 items-center gap-2.5">
					<span
						className={stepNumberVariants({
							accent: step.accent,
						})}
					>
						{index + 1}
					</span>

					<div className="min-w-0">
						<h3 className="truncate text-sm font-bold">{step.title}</h3>

						<p className="text-[9px] uppercase tracking-[0.22em] opacity-70">
							{step.stage}
						</p>
					</div>
				</div>

				<span className="rounded-full border border-white/50 bg-white/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
					Step {index + 1}
				</span>
			</header>

			<div className="space-y-2 p-3">
				<p className="text-[11px] leading-relaxed text-slate-700">
					{step.description}
				</p>

				<div className="overflow-x-auto rounded-portal-sm border border-slate-300 bg-[#fbfcfe] p-3 shadow-inner">
					<pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-slate-900">
						{step.expression}
					</pre>
				</div>
			</div>
		</article>
	);
}

export type StepCardAccent = VariantProps<typeof stepCardVariants>["accent"];
