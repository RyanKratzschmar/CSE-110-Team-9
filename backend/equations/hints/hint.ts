import {
    assertWholeNumber,
    capitalize,
    digitsLeastFirst,
    PLACE_NAMES,
    placeName,
    plural,
} from '../equationUtils';
import type { OperationKind } from '../equationUtils';

// Re-export shared utilities for convenience
export {
    assertWholeNumber,
    capitalize,
    digitsLeastFirst,
    PLACE_NAMES,
    placeName,
    plural,
};
export type { OperationKind };

/**
 * A single step of text guidance/hint for solving a problem.
 */
export interface HintStep {
    readonly stepNumber: number;
    readonly title: string;
    readonly description: string;
    readonly details: readonly string[];
    readonly tip?: string;
}

/**
 * Complete set of hints for an equation.
 */
export interface HintData {
    readonly operation: OperationKind;
    readonly operands: readonly [number, number];
    readonly operatorSymbol: '×' | '÷';
    readonly problemText: string;
    readonly steps: readonly HintStep[];
}

export interface HintProvider {
    getHint(): HintData;
}

/**
 * Base class for hint generators with result caching.
 */
export abstract class BaseHint implements HintProvider {
    abstract readonly operation: OperationKind;
    abstract readonly operands: readonly [number, number];
    abstract readonly operatorSymbol: '×' | '÷';

    private cached: HintData | null = null;

    getHint(): HintData {
        if (this.cached) {
            return this.cached;
        }
        const [left, right] = this.operands;
        this.cached = {
            operation: this.operation,
            operands: this.operands,
            operatorSymbol: this.operatorSymbol,
            problemText: `${left} ${this.operatorSymbol} ${right}`,
            steps: this.buildSteps(),
        };
        return this.cached;
    }

    protected abstract buildSteps(): HintStep[];
}
