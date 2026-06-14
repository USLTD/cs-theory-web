import { Icon } from "#components/Icon";
import { buttonVariants } from "#components/ui/Button";
import { cn } from "#lib/utils";

export default function Page({ is404 }: { is404: boolean }) {
	if (is404) {
		return (
			<div className="flex min-h-100 flex-col items-center justify-center p-8">
				<Icon name="information" className="mb-4 h-16 w-16" />
				<h1 className="text-2xl font-bold text-portal-blue">404 Not Found</h1>
				<p className="mt-2 text-slate-500">
					The workspace you are looking for does not exist.
				</p>
				<a
					href="/"
					className={cn(buttonVariants({ variant: "default" }), "mt-6")}
				>
					Return to Selection
				</a>
			</div>
		);
	}

	return (
		<div className="flex min-h-100 flex-col items-center justify-center p-8">
			<Icon name="cross" className="mb-4 h-16 w-16" />
			<h1 className="text-2xl font-bold text-red-600">500 Internal Error</h1>
			<p className="mt-2 text-slate-500">Something went wrong.</p>
		</div>
	);
}
