self.onmessage = (e) => {
	const data = e.data;
	if (data.type === "GENERATE_CFG") {
		const { id, startSymbol, rules, maxLen } = data;

		try {
			const ruleMap: Record<string, string[]> = {};
			rules.forEach((r: any) => {
				const nt = r.nt.trim();
				const prods = r.prods
					.split("|")
					.map((s: string) => s.trim())
					.filter((s: string) => s.length > 0);
				if (nt && prods.length > 0) {
					if (!ruleMap[nt]) ruleMap[nt] = [];
					ruleMap[nt] = ruleMap[nt].concat(prods);
				}
			});

			if (!ruleMap[startSymbol]) {
				throw new Error("Start symbol has no productions defined.");
			}

			const queue: { sentence: string[]; history: string[] }[] = [
				{ sentence: [startSymbol], history: [startSymbol] },
			];
			const generatedStrings = new Set<string>();
			const validSolutions: { str: string; history: string[] }[] = [];

			let stepsLimit = 4000;

			while (queue.length > 0 && stepsLimit > 0) {
				stepsLimit--;
				const current = queue.shift();

				let firstNTIdx = -1;
				for (let i = 0; i < current.sentence.length; i++) {
					if (ruleMap[current.sentence[i]]) {
						firstNTIdx = i;
						break;
					}
				}

				if (firstNTIdx === -1) {
					const terminalStr = current.sentence.join("").replace(/e/g, "");
					if (
						terminalStr.length <= maxLen &&
						!generatedStrings.has(terminalStr)
					) {
						generatedStrings.add(terminalStr);
						validSolutions.push({
							str: terminalStr === "" ? "λ (empty)" : terminalStr,
							history: current.history,
						});
					}
					continue;
				}

				const terminalCount = current.sentence
					.filter((s: string) => !ruleMap[s])
					.join("")
					.replace(/e/g, "").length;
				if (terminalCount > maxLen) {
					continue;
				}

				const nt = current.sentence[firstNTIdx];
				const productions = ruleMap[nt];

				productions.forEach((prod: string) => {
					const newSentence = [...current.sentence];
					const prodSymbols =
						prod === "e"
							? []
							: prod.includes(" ")
								? prod.split(" ")
								: prod.split("");

					newSentence.splice(firstNTIdx, 1, ...prodSymbols);

					if (
						newSentence.filter((s: string) => !ruleMap[s]).join("").length <=
						maxLen + 2
					) {
						queue.push({
							sentence: newSentence,
							history: [...current.history, newSentence.join("")],
						});
					}
				});
			}

			validSolutions.sort((a, b) => a.str.length - b.str.length);
			self.postMessage({
				id,
				result: validSolutions,
				halted: stepsLimit === 0,
			});
		} catch (err) {
			self.postMessage({
				id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
};
