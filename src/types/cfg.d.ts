export type CFGRule = {
	id: string;
	nt: string;
	prods: string;
};

export type CFGPreset = {
	start: string;
	rules: CFGRule[];
};
