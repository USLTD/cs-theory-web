/**
 * @typedef DFAStepHistory {import("#types/dfa").DFAStepHistory}
 */

self.onmessage = (e) => {
	const data = e.data;
	if (data.type === "INITIALIZE_SIMULATION") {
		const {
			id,
			startState,
			testInputString,
			alphabet,
			transitions,
			acceptStates,
		} = data;

		try {
			const stringToTest = testInputString.trim();

			/** @type {DFAStepHistory[]} */
			const history = [];
			let currState = startState;

			history.push({
				index: -1,
				currentState: currState,
				char: null,
				nextState: currState,
				msg: `Initialized at start state: ${currState}`,
				isReject: false,
				isFinal: false,
			});

			let failed = false;

			for (let i = 0; i < stringToTest.length; i++) {
				const char = stringToTest[i];

				if (failed) {
					history.push({
						index: i,
						currentState: "REJECT",
						char,
						nextState: "REJECT",
						msg: `Symbol '${char}': Stuck in REJECT trap state.`,
						isReject: true,
						isFinal: false,
					});
					continue;
				}

				if (!alphabet.includes(char)) {
					history.push({
						index: i,
						currentState: currState,
						char,
						nextState: "REJECT",
						msg: `Symbol '${char}': Not in automaton alphabet!`,
						isReject: true,
						isFinal: false,
					});
					currState = "REJECT";
					failed = true;
					continue;
				}

				const tMap = transitions[currState];
				if (tMap && tMap[char] !== undefined && tMap[char] !== "REJECT") {
					const nextState = tMap[char];
					history.push({
						index: i,
						currentState: currState,
						char,
						nextState,
						msg: `Symbol '${char}': Transition [ ${currState} ] ➔ [ ${nextState} ]`,
						isReject: false,
						isFinal: false,
					});
					currState = nextState;
				} else {
					history.push({
						index: i,
						currentState: currState,
						char,
						nextState: "REJECT",
						msg: `Symbol '${char}': No rule found. Transitioning to [REJECT].`,
						isReject: true,
						isFinal: false,
					});
					currState = "REJECT";
					failed = true;
				}
			}

			const isAccepted = acceptStates.includes(currState);
			history.push({
				index: stringToTest.length,
				currentState: currState,
				char: null,
				nextState: currState,
				msg: isAccepted
					? `Finished processing in accept state: [ ${currState} ]`
					: `Halted in non-accepting state: [ ${currState} ]`,
				isReject: !isAccepted,
				isFinal: true,
				accepted: isAccepted,
			});

			self.postMessage({ id, result: history });
		} catch (err) {
			self.postMessage({
				id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	} else if (data.type === "CHECK_MOCK") {
		const { id, testStr, transitions, startState, acceptStates } = data;
		let curr = startState;
		let success = true;
		for (const char of testStr) {
			if (
				transitions[curr] &&
				transitions[curr][char] !== undefined &&
				transitions[curr][char] !== "REJECT"
			) {
				curr = transitions[curr][char];
			} else {
				success = false;
				break;
			}
		}
		if (success) {
			success = acceptStates.includes(curr);
		}
		self.postMessage({ id, result: success });
	}
};
