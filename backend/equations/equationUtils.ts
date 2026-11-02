/**
 * Mathematical utilities and shared types for equations,
 * step-by-step explanations, and hints.
 */

export type OperationKind = 'long-multiplication' | 'long-division';

export const PLACE_NAMES: readonly string[] = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands',
    'millions',
    'ten-millions',
    'hundred-millions',
    'billions',
    'ten-billions',
    'hundred-billions',
    'trillions',
    'ten-trillions',
    'hundred-trillions',
    'quadrillions',
];

/**
 * Returns the place value name for 10^power (e.g. 0 -> "ones", 1 -> "tens", 2 -> "hundreds").
 */
export function placeName(power: number): string {
    return PLACE_NAMES[power] ?? `10^${power}`;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Returns formatted count and noun with correct pluralization (e.g. "1 digit", "2 digits").
 */
export function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Throws a RangeError if value is not a safe, non-negative whole integer.
 */
export function assertWholeNumber(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a whole number (0 or more), got ${value}.`);
    }
}

/**
 * Splits a whole number into its digits, starting from the ones place (least significant digit first).
 */
export function digitsLeastFirst(n: number): number[] {
    return String(n).split('').reverse().map(Number);
}

