import type { ASTStep } from "#types/ast";
import { StepCard } from "./step-card";

type StepTimelineProps = {
	steps: ASTStep[];
};

export function StepTimeline({ steps }: StepTimelineProps) {
	return (
		<div className="grid gap-3 xl:grid-cols-2">
			{steps.map((step, index) => (
				<StepCard key={`${step.stage}-${index}`} step={step} index={index} />
			))}
		</div>
	);
}
