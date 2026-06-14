import { CstParser, createToken, Lexer } from "chevrotain";

const Not = createToken({ name: "Not", pattern: /~/ });
const And = createToken({ name: "And", pattern: /&/ });
const Or = createToken({ name: "Or", pattern: /\|/ });
const Impl = createToken({ name: "Impl", pattern: /->/ });
const Eq = createToken({ name: "Eq", pattern: /<->/ });
const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Var = createToken({ name: "Var", pattern: /[A-Z][A-Z0-9_]*/ });
const WhiteSpace = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
});

const allTokens = [WhiteSpace, Not, And, Or, Eq, Impl, LParen, RParen, Var];

export const LogicLexer = new Lexer(allTokens);

class LogicParser extends CstParser {
	constructor() {
		super(allTokens, { maxLookahead: 2 });

		// biome-ignore lint/suspicious/noExplicitAny: This is for type-safety
		const $ = this as any;

		$.RULE("expression", () => {
			$.SUBRULE($.equivalence);
		});

		$.RULE("equivalence", () => {
			$.SUBRULE($.implication, { LABEL: "lhs" });
			$.OPTION(() => {
				$.CONSUME(Eq);
				$.SUBRULE2($.equivalence, { LABEL: "rhs" });
			});
		});

		$.RULE("implication", () => {
			$.SUBRULE($.orExpression, { LABEL: "lhs" });
			$.OPTION(() => {
				$.CONSUME(Impl);
				$.SUBRULE2($.implication, { LABEL: "rhs" });
			});
		});

		$.RULE("orExpression", () => {
			$.SUBRULE($.andExpression, { LABEL: "lhs" });
			$.MANY(() => {
				$.CONSUME(Or);
				$.SUBRULE2($.andExpression, { LABEL: "rhs" });
			});
		});

		$.RULE("andExpression", () => {
			$.SUBRULE($.notExpression, { LABEL: "lhs" });
			$.MANY(() => {
				$.CONSUME(And);
				$.SUBRULE2($.notExpression, { LABEL: "rhs" });
			});
		});

		$.RULE("notExpression", () => {
			$.OR([
				{
					ALT: () => {
						$.CONSUME(Not);
						$.SUBRULE($.notExpression, { LABEL: "right" });
					},
				},
				{
					ALT: () => {
						$.SUBRULE($.primary);
					},
				},
			]);
		});

		$.RULE("primary", () => {
			$.OR([
				{
					ALT: () => {
						$.CONSUME(LParen);
						$.SUBRULE($.expression);
						$.CONSUME(RParen);
					},
				},
				{
					ALT: () => {
						$.CONSUME(Var);
					},
				},
			]);
		});

		this.performSelfAnalysis();
	}
}

export const parser = new LogicParser();
