export type DFATransitions = {
	[state: string]: {
		[symbol: string]: string;
	};
};

export type DFAPreset = {
	start: string;
	accept: string[];
	symbols: string[];
	states: string[];
	transitions: DFATransitions;
	tests: string[];
};

export type DFAStepHistory = {
	index: number;
	currentState: string;
	char: string | null;
	nextState: string;
	msg: string;
	isReject: boolean;
	isFinal: boolean;
	accepted?: boolean;
};
