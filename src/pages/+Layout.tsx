import "#styles/globals.css";
import type { ReactNode } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Icon } from "#components/Icon";
import { ToastProvider } from "#components/Toast";
import { buttonVariants } from "#components/ui/Button";
import { cn } from "#lib/utils";

export default function Layout({ children }: { children: ReactNode }) {
	const pageContext = usePageContext();
	const url = pageContext.urlPathname || "/";

	return (
		<ToastProvider>
			<div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-2 py-2 sm:px-4 sm:py-6">
				<div className="portal-panel flex min-h-[37.5rem] grow flex-col overflow-hidden bg-white">
					<div className="portal-header flex flex-col gap-2 rounded-t-sm p-3 select-none sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
						<div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold sm:text-[14px]">
							{url !== "/" && (
								<a
									href="/"
									aria-label="Back"
									className={cn(buttonVariants({ variant: "icon" }), "mr-1")}
								>
									<Icon name="arrow_left" />
								</a>
							)}
							<Icon name="cog" />
							<span className="truncate">
								Automata &amp; Grammar Playground
							</span>
						</div>
						<span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 sm:text-right">
							Made for CS Theory course project
						</span>
					</div>

					<div className="grow overflow-auto p-3 sm:p-4">{children}</div>
				</div>

				<div className="mb-2 mt-4 px-2 text-center font-sans text-[10px] leading-relaxed text-slate-500 sm:mb-0 sm:text-xs">
					<p>&copy; 2026 Luka Mamukashvili</p>
					<div className="mt-1 flex flex-col items-center justify-center gap-1">
						<span className="max-w-4xl">
							The FatCow Icon set was created by{" "}
							<a
								href="https://github.com/gammasoft/fatcow"
								target="_blank"
								rel="noreferrer"
								className="text-[#0000ee] underline decoration-dotted underline-offset-[3px] hover:text-[#000088]"
							>
								FatCow Web Hosting
							</a>
							.
						</span>

						<span className="inline-flex flex-wrap items-center justify-center gap-1">
							It's licensed free of charge under the{" "}
							<a
								href="https://creativecommons.org/licenses/by/3.0/us/"
								target="_blank"
								rel="noreferrer"
								className={cn(
									"text-[#0000ee] underline decoration-dotted underline-offset-[3px] hover:text-[#000088]",
									"inline-flex items-center gap-0.5",
								)}
							>
								<Icon name="creative_commons" /> Creative Commons Attribution
								3.0 License
							</a>
							.
						</span>
					</div>
				</div>
			</div>
		</ToastProvider>
	);
}
