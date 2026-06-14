import { Icon } from "#components/Icon";
import { buttonVariants } from "#components/ui/Button";
import { workspaceRoutes } from "#constants/routes";
import { cn } from "#lib/cn";

export default function Page() {
	return (
		<div className="flex min-h-100 flex-col items-center justify-center p-8">
			<h1 className="mb-8 text-2xl font-bold text-portal-blue drop-shadow-sm">
				Select Workspace
			</h1>
			<div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
				{workspaceRoutes.map((workspace) => (
					<a
						key={workspace.href}
						href={workspace.href}
						className={cn(
							buttonVariants({ variant: "default" }),
							"h-auto w-full items-start justify-start gap-3 px-4 py-4 text-left",
							"rounded-portal border border-portal-btn-border shadow-sm",
							"hover:border-portal-btn-border-hover hover:bg-[#fafafa]",
						)}
					>
						<div className="mt-0.5 rounded-full bg-blue-100 p-2">
							<Icon name={workspace.icon} postfix="32x32" />
						</div>
						<div className="min-w-0">
							<div className="text-sm font-bold text-portal-blue">
								{workspace.label}
							</div>
							<div className="mt-1 text-[11px] leading-snug text-slate-600">
								{workspace.description}
							</div>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}
