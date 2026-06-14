import type { ReactNode } from "react";
import { cn } from "#lib/utils";

export function Panel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"portal-panel overflow-hidden space-y-4 p-3 sm:p-4",
				className,
			)}
		>
			{children}
		</section>
	);
}

export function PanelHeader({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 border-b border-slate-200 pb-2 sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function PanelTitle({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"flex min-w-0 items-center gap-1.5 font-bold text-slate-700",
				className,
			)}
		>
			{children}
		</span>
	);
}
