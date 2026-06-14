import { DFAPreset, CFGPreset } from '../types';

export const DFA_PRESETS: Record<string, DFAPreset> = {
    ends_11: {
        start: 'q0',
        accept: ['q2'],
        symbols: ['0', '1'],
        states: ['q0', 'q1', 'q2'],
        transitions: {
            "q0": { "0": "q0", "1": "q1" },
            "q1": { "0": "q0", "1": "q2" },
            "q2": { "0": "q0", "1": "q2" }
        },
        tests: ['11', '1011', '110', '0000', '1111', '011', '01011', '101011', '1110', '0011']
    },
    even_zeros: {
        start: 'qEven',
        accept: ['qEven'],
        symbols: ['0', '1'],
        states: ['qEven', 'qOdd'],
        transitions: {
            "qEven": { "0": "qOdd", "1": "qEven" },
            "qOdd": { "0": "qEven", "1": "qOdd" }
        },
        tests: ['00', '111', '010', '10101', '0', '0000', '1', '01010', '001100', '101']
    },
    ab_pattern: {
        start: 'q0',
        accept: ['q2'],
        symbols: ['a', 'b'],
        states: ['q0', 'q1', 'q2'],
        transitions: {
            "q0": { "a": "q1", "b": "q0" },
            "q1": { "a": "q1", "b": "q2" },
            "q2": { "a": "q2", "b": "q2" }
        },
        tests: ['ab', 'aab', 'bba', 'babab', 'ba', 'bbab', 'aaab', 'bbbaba', 'ababab', 'b']
    }
};

export const CFG_PRESETS: Record<string, CFGPreset> = {
    anbn: {
        start: 'S',
        rules: [
            { id: '1', nt: 'S', prods: 'a S b | e' }
        ]
    },
    brackets: {
        start: 'S',
        rules: [
            { id: '1', nt: 'S', prods: '( S ) | S S | e' }
        ]
    },
    english_struct: {
        start: 'S',
        rules: [
            { id: '1', nt: 'S', prods: 'N V' },
            { id: '2', nt: 'N', prods: 'cat | dog | child' },
            { id: '3', nt: 'V', prods: 'runs | sleeps | plays' }
        ]
    }
};
