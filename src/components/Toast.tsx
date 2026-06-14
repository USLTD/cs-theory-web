import { cva } from "class-variance-authority";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ToastMessage } from "#/types/toast";
import type { IconName } from "#constants/icons-16x16";
import { cn } from "#lib/cn";
import { Icon } from "./Icon";

type ShowToastFunction = (
	title: string,
	message: string,
	type?: ToastMessage["type"],
) => void;

const ToastContext = createContext<ShowToastFunction | null>(null);

const toastVariants = cva(
	[
		"pointer-events-auto flex w-80 gap-2.5 rounded-[4px] border p-3 shadow-lg",
		"motion-safe:transition-all motion-safe:duration-200",
		"[text-shadow:0_1px_0_#fff]",
	],
	{
		variants: {
			type: {
				success: "border-emerald-500 bg-emerald-50 text-emerald-950",
				error: "border-rose-500 bg-rose-50 text-rose-950",
				warning: "border-amber-500 bg-amber-50 text-amber-950",
				info: "border-blue-500 bg-blue-50 text-blue-950",
			},
		},
		defaultVariants: {
			type: "info",
		},
	},
);

const iconByType: Record<ToastMessage["type"], IconName> = {
	success: "tick",
	error: "error",
	warning: "exclamation",
	info: "information",
};

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const nextIdRef = useRef(0);
	const timersRef = useRef<number[]>([]);

	const showToast = useCallback<ShowToastFunction>(
		(title, message, type = "info") => {
			const id = ++nextIdRef.current;
			setToasts((prev) => [...prev, { id, title, message, type }]);

			const timer = window.setTimeout(() => {
				setToasts((prev) => prev.filter((toast) => toast.id !== id));
				timersRef.current = timersRef.current.filter((t) => t !== timer);
			}, 4500);

			timersRef.current.push(timer);
		},
		[],
	);

	useEffect(() => {
		return () => {
			for (const timer of timersRef.current) window.clearTimeout(timer);
			timersRef.current = [];
		};
	}, []);

	return (
		<ToastContext.Provider value={showToast}>
			{children}
			<div
				className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3"
				aria-live="polite"
				aria-relevant="additions removals"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						role="status"
						className={cn(toastVariants({ type: toast.type }))}
					>
						<div className="mt-0.5 shrink-0">
							<Icon name={iconByType[toast.type]} />
						</div>
						<div className="min-w-0">
							<h4 className="text-xs font-bold">{toast.title}</h4>
							<p className="mt-0.5 text-[10px] opacity-80">{toast.message}</p>
						</div>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export const useToast = (): ShowToastFunction => {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used within a ToastProvider");
	return context;
};
