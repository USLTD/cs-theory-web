import type icon from "./icons-32x32";

export type WorkspaceRoute = {
	href: "/dfa" | "/cfg" | "/res" | "/ast";
	label: string;
	icon: keyof typeof icon;
	description: string;
};

export const workspaceRoutes: WorkspaceRoute[] = [
	{
		href: "/dfa",
		label: "DFA",
		icon: "wrench",
		description:
			"Deterministic finite automaton visualizer and simulation tools.",
	},
	{
		href: "/cfg",
		label: "CFG",
		icon: "page_white_text",
		description: "Context-free grammar derivations and parsing workspace.",
	},
	{
		href: "/res",
		label: "Resolution",
		icon: "sitemap",
		description: "Propositional logic resolution tools and proof generation.",
	},
	{
		href: "/ast",
		label: "AST Forms",
		icon: "arrow_switch",
		description: "Normal forms representation and syntax tree evaluation.",
	},
];
