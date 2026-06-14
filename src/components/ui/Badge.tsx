import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "#lib/utils";

const badgeVariants = cva(
	[
		"inline-flex w-fit rounded-portal-sm border px-2 py-0.5 text-[10px] font-bold uppercase [text-shadow:0_1px_0_#fff] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)]",
	],
	{
		variants: {
			type: {
				success:
					"border-badge-success-border text-badge-success-text bg-linear-to-b from-badge-success-start to-badge-success-end",
				error:
					"border-badge-error-border text-badge-error-text bg-linear-to-b from-badge-error-start to-badge-error-end",
				warning:
					"border-badge-warning-border text-badge-warning-text bg-linear-to-b from-badge-warning-start to-badge-warning-end",
				purple:
					"border-badge-purple-border text-badge-purple-text bg-linear-to-b from-badge-purple-start to-badge-purple-end",
			},
		},
		defaultVariants: {
			type: "success",
		},
	},
);

export type BadgeProps = HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants>;

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
	{ type, className, children, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(badgeVariants({ type }), className)}
			{...props}
		>
			{children}
		</div>
	);
});

export { badgeVariants };
