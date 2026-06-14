import { LogicLexer, parser } from "./logicParser";
import type { ASTAccent, ASTNode, ASTOutputs, ASTStep } from "#types/ast";

const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

type ParseResult = { ast: ASTNode | null; error?: string };

class LogicToAstVisitor extends BaseCstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	expression(ctx: any): ASTNode {
		return this.visit(ctx.equivalence);
	}

	equivalence(ctx: any): ASTNode {
		const left = this.visit(ctx.lhs);
		if (ctx.rhs) {
			return { type: "EQ", left, right: this.visit(ctx.rhs) };
		}
		return left;
	}

	implication(ctx: any): ASTNode {
		const left = this.visit(ctx.lhs);
		if (ctx.rhs) {
			return { type: "IMPL", left, right: this.visit(ctx.rhs) };
		}
		return left;
	}

	orExpression(ctx: any): ASTNode {
		let left = this.visit(ctx.lhs);
		if (ctx.rhs) {
			ctx.rhs.forEach((rhsElem: any) => {
				left = { type: "OR", left, right: this.visit(rhsElem) };
			});
		}
		return left;
	}

	andExpression(ctx: any): ASTNode {
		let left = this.visit(ctx.lhs);
		if (ctx.rhs) {
			ctx.rhs.forEach((rhsElem: any) => {
				left = { type: "AND", left, right: this.visit(rhsElem) };
			});
		}
		return left;
	}

	notExpression(ctx: any): ASTNode {
		if (ctx.Not) {
			return { type: "NOT", right: this.visit(ctx.right) };
		}
		return this.visit(ctx.primary);
	}

	primary(ctx: any): ASTNode {
		if (ctx.Var) {
			return { type: "VAR", name: ctx.Var[0].image };
		}
		return this.visit(ctx.expression);
	}
}

const toAstVisitor = new LogicToAstVisitor();

export function parseLogic(text: string): ParseResult {
	const source = text.trim();
	if (!source) {
		return { ast: null, error: "Formula is empty." };
	}

	(parser as any).reset?.();
	const lexResult = LogicLexer.tokenize(source);
	if (lexResult.errors.length > 0) {
		return {
			ast: null,
			error: lexResult.errors[0]?.message ?? "Lexing error.",
		};
	}

	parser.input = lexResult.tokens;
	const cst = (parser as any).expression();

	if (parser.errors.length > 0 || !cst) {
		return {
			ast: null,
			error: parser.errors[0]?.message ?? "Invalid formula.",
		};
	}

	return { ast: toAstVisitor.visit(cst) };
}

function nodePrecedence(node?: ASTNode): number {
	if (!node) return -1;
	switch (node.type) {
		case "VAR":
			return 5;
		case "NOT":
			return 4;
		case "AND":
			return 3;
		case "OR":
			return 2;
		case "IMPL":
			return 1;
		case "EQ":
			return 0;
		default:
			return -1;
	}
}

export function astToString(node?: ASTNode, parentPrec = -1): string {
	if (!node) return "";
	if (node.type === "VAR") return node.name ?? "";

	if (node.type === "NOT") {
		const child = astToString(node.right, nodePrecedence(node));
		return `~${child}`;
	}

	const opMap: Record<Exclude<ASTNode["type"], "VAR" | "NOT">, string> = {
		AND: "&",
		OR: "|",
		IMPL: "->",
		EQ: "<->",
	};

	const prec = nodePrecedence(node);
	const left = astToString(node.left, prec);
	const right = astToString(node.right, prec - 0.1);
	const rendered = `${left} ${opMap[node.type]} ${right}`;
	return prec < parentPrec ? `(${rendered})` : rendered;
}

function cloneAst(node?: ASTNode): ASTNode | undefined {
	if (!node) return undefined;
	if (node.type === "VAR") return { type: "VAR", name: node.name };
	if (node.type === "NOT") return { type: "NOT", right: cloneAst(node.right) };
	return {
		type: node.type,
		left: cloneAst(node.left),
		right: cloneAst(node.right),
	};
}

function implFree(node?: ASTNode): ASTNode | undefined {
	if (!node || node.type === "VAR") return cloneAst(node);

	if (node.type === "NOT") {
		return { type: "NOT", right: implFree(node.right) };
	}

	const left = implFree(node.left);
	const right = implFree(node.right);

	if (node.type === "IMPL") {
		return {
			type: "OR",
			left: { type: "NOT", right: left },
			right,
		};
	}

	if (node.type === "EQ") {
		return {
			type: "AND",
			left: {
				type: "OR",
				left: { type: "NOT", right: cloneAst(left) },
				right: cloneAst(right),
			},
			right: {
				type: "OR",
				left: { type: "NOT", right: cloneAst(right) },
				right: cloneAst(left),
			},
		};
	}

	return { type: node.type, left, right };
}

function toNNF(node?: ASTNode): ASTNode | undefined {
	if (!node) return undefined;
	if (node.type === "VAR") return cloneAst(node);

	if (node.type === "NOT") {
		const right = node.right;
		if (!right) return { type: "NOT", right: undefined };
		if (right.type === "VAR") return { type: "NOT", right: cloneAst(right) };
		if (right.type === "NOT") return toNNF(right.right);
		if (right.type === "AND") {
			return {
				type: "OR",
				left: toNNF({ type: "NOT", right: right.left }),
				right: toNNF({ type: "NOT", right: right.right }),
			};
		}
		if (right.type === "OR") {
			return {
				type: "AND",
				left: toNNF({ type: "NOT", right: right.left }),
				right: toNNF({ type: "NOT", right: right.right }),
			};
		}
		return { type: "NOT", right: toNNF(right) };
	}

	return {
		type: node.type,
		left: toNNF(node.left),
		right: toNNF(node.right),
	};
}

function distOr(left?: ASTNode, right?: ASTNode): ASTNode | undefined {
	if (!left) return right;
	if (!right) return left;

	if (left.type === "AND") {
		return {
			type: "AND",
			left: distOr(left.left, right),
			right: distOr(left.right, right),
		};
	}

	if (right.type === "AND") {
		return {
			type: "AND",
			left: distOr(left, right.left),
			right: distOr(left, right.right),
		};
	}

	return { type: "OR", left, right };
}

function distAnd(left?: ASTNode, right?: ASTNode): ASTNode | undefined {
	if (!left) return right;
	if (!right) return left;

	if (left.type === "OR") {
		return {
			type: "OR",
			left: distAnd(left.left, right),
			right: distAnd(left.right, right),
		};
	}

	if (right.type === "OR") {
		return {
			type: "OR",
			left: distAnd(left, right.left),
			right: distAnd(left, right.right),
		};
	}

	return { type: "AND", left, right };
}

function toCNF(node?: ASTNode): ASTNode | undefined {
	if (!node) return undefined;
	if (node.type === "VAR" || node.type === "NOT") return cloneAst(node);
	if (node.type === "AND") {
		return { type: "AND", left: toCNF(node.left), right: toCNF(node.right) };
	}
	if (node.type === "OR") {
		return distOr(toCNF(node.left), toCNF(node.right));
	}
	return cloneAst(node);
}

function toDNF(node?: ASTNode): ASTNode | undefined {
	if (!node) return undefined;
	if (node.type === "VAR" || node.type === "NOT") return cloneAst(node);
	if (node.type === "OR") {
		return { type: "OR", left: toDNF(node.left), right: toDNF(node.right) };
	}
	if (node.type === "AND") {
		return distAnd(toDNF(node.left), toDNF(node.right));
	}
	return cloneAst(node);
}

function makeStep(
	stage: ASTStep["stage"],
	title: string,
	description: string,
	expression: string,
	accent: ASTAccent,
): ASTStep {
	return { stage, title, description, expression, accent };
}

export function transformLogicFormula(formula: string): ASTOutputs {
	const { ast, error } = parseLogic(formula);
	if (!ast) {
		throw new Error(error ?? "Parse error");
	}

	const eliminated = implFree(ast);
	const nnfAst = toNNF(eliminated);
	const cnfAst = toCNF(nnfAst);
	const dnfAst = toDNF(nnfAst);

	return {
		parsed: astToString(ast),
		nnf: astToString(nnfAst),
		cnf: astToString(cnfAst),
		dnf: astToString(dnfAst),
		steps: [
			makeStep(
				"parsed",
				"Parse into AST",
				"Chevrotain tokenizes the formula and builds a precedence-aware syntax tree.",
				astToString(ast),
				"input",
			),
			makeStep(
				"simplified",
				"Eliminate → and ↔",
				"Implications and equivalences are rewritten into only ¬, ∧, and ∨ before any normal-form conversion.",
				astToString(eliminated),
				"rewrite",
			),
			makeStep(
				"nnf",
				"Negation normal form",
				"Double negations are removed and De Morgan’s laws are applied until negations touch only variables.",
				astToString(nnfAst),
				"normalize",
			),
			makeStep(
				"cnf",
				"Conjunctive normal form",
				"OR is distributed over AND to produce an AND of OR-clauses.",
				astToString(cnfAst),
				"cnf",
			),
			makeStep(
				"dnf",
				"Disjunctive normal form",
				"AND is distributed over OR to produce an OR of AND-terms.",
				astToString(dnfAst),
				"dnf",
			),
		],
	};
}
