import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, forwardRef } from "react";
import { cn } from "#lib/cn";

export const buttonVariants = cva(
	[
		"inline-flex items-center justify-center gap-1.5 rounded-portal-sm border px-2.5 py-1 text-[11px] cursor-pointer select-none shadow-portal-soft",
		"[text-shadow:0_1px_0_#fff]",
		"transition-colors",
		"disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none",
	],
	{
		variants: {
			variant: {
				default:
					"border-portal-btn-border text-portal-text bg-linear-to-b from-portal-btn-start to-portal-btn-end hover:border-portal-btn-border-hover hover:from-portal-btn-hover-start hover:to-portal-btn-hover-end active:bg-portal-btn-hover-end active:[box-shadow:var(--shadow-portal-inset-strong)]",
				primary:
					"border-portal-btn-primary-border font-bold text-white bg-linear-to-b from-portal-btn-primary-start to-portal-btn-primary-end hover:border-portal-btn-primary-border-hover hover:from-portal-btn-primary-hover-start hover:to-portal-btn-primary-hover-end active:[box-shadow:var(--shadow-portal-inset-strong)] [text-shadow:0_-1px_0_rgba(0,0,0,0.25)]",
				chip:
					"border-portal-btn-border text-portal-text bg-linear-to-b from-portal-btn-start to-portal-btn-end px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-portal-btn-border-hover hover:from-portal-btn-hover-start hover:to-portal-btn-hover-end active:bg-portal-btn-hover-end active:[box-shadow:var(--shadow-portal-inset-strong)]",
				icon:
					"h-8 w-8 px-0 py-0 border-portal-btn-border text-portal-text bg-linear-to-b from-portal-btn-start to-portal-btn-end hover:border-portal-btn-border-hover hover:from-portal-btn-hover-start hover:to-portal-btn-hover-end active:bg-portal-btn-hover-end active:[box-shadow:var(--shadow-portal-inset-strong)]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{ children, className, variant, type = "button", ...props },
		ref,
	) {
		return (
			<button
				ref={ref}
				type={type}
				className={cn(buttonVariants({ variant }), className)}
				{...props}
			>
				{children}
			</button>
		);
	},
);
