export const AST_EXAMPLES = [
	{ label: "Nested negation", formula: "~(A & (B | ~C))" },
	{ label: "Implication chain", formula: "(A -> B) & (B -> C)" },
	{ label: "Equivalence rewrite", formula: "(P <-> Q) -> (~R | S)" },
	{ label: "De Morgan stress", formula: "~((A | B) & (~C | D))" },
	{ label: "Mixed operators", formula: "((A | B) & (~A | C)) -> D" },
	{ label: "Compact form", formula: "~(P -> (Q & R))" },
	{ label: "Double implication", formula: "(A -> B) -> (C -> D)" },
	{ label: "Nested equivalence", formula: "(A <-> B) <-> (C | D)" },
	{ label: "Negated implication", formula: "~(A -> (B | C))" },
	{ label: "Tautology guard", formula: "A | ~A" },
] as const;

export const RESOLUTION_EXAMPLES = [
	{ label: "Unsat core", clausesInput: "P|Q, ~P|R, ~Q|R, ~R" },
	{ label: "Direct contradiction", clausesInput: "A, ~A" },
	{ label: "Triangle proof", clausesInput: "P|Q, ~P|R, ~Q|R, ~R|S, ~S" },
	{ label: "Horn-style set", clausesInput: "~P|Q, ~Q|R, P, ~R" },
	{ label: "Tautology filtered", clausesInput: "P|~P, Q|R, ~Q" },
	{ label: "Longer chain", clausesInput: "A|B, ~A|C, ~C|D, ~D" },
	{ label: "Unit chain", clausesInput: "A, ~A|B, ~B|C, ~C" },
	{ label: "Duplicate cleanup", clausesInput: "P|Q, Q|P, ~Q|R, ~R" },
	{ label: "Three-step refutation", clausesInput: "A|B, ~A|C, ~C, ~B|D, ~D" },
	{ label: "Mixed tautology", clausesInput: "X|~X, Y|Z, ~Y|Z, ~Z" },
] as const;
