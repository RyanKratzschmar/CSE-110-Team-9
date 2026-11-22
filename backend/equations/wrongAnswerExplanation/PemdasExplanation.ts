import type { TextExplanation } from './wrongAnswerExplanation';

export const PEMDAS_EXPLANATION: TextExplanation = {
    kind: 'text',
    title: 'Order of Operations',
    body: [
        'Remember The Order Of Operations',
        'For This Problem:',
        '',
        'P: Parentheses',
        'E: Exponents',
        'M: Multiplication',
        'D: Division',
        'A: Addition',
        'S: Subtraction',
    ].join('\n'),
};
