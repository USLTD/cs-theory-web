export type ASTNode = {
	type: "VAR" | "NOT" | "AND" | "OR" | "IMPL" | "EQ";
	name?: string;
	left?: ASTNode;
	right?: ASTNode;
};

export type ASTAccent =
	| "input"
	| "rewrite"
	| "normalize"
	| "cnf"
	| "dnf";

export type ASTStep = {
	stage: "parsed" | "simplified" | "nnf" | "cnf" | "dnf";
	title: string;
	description: string;
	expression: string;
	accent: ASTAccent;
};

export type ASTOutputs = {
	parsed: string;
	nnf: string;
	cnf: string;
	dnf: string;
	steps: ASTStep[];
};
