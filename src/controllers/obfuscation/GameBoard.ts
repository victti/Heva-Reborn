import RandomGeneratorState from "./RandomGeneratorState";

/**
 * Game Board Structure
 * Contains the main game board data
 */
export default class GameBoard {
    // Array of 16 rows, each containing 2048 (0x800) 32-bit values
    private rows: number[][] = [];

    // Single array of 512 (0x200) 16-bit values (masked to 11 bits: 0-2047)
    private finalArray: number[] = [];

    private rng: RandomGeneratorState;

    constructor() {
        this.rng = new RandomGeneratorState();

        // Initialize 16 rows of 2048 elements each
        for (let i = 0; i < 16; i++) {
            this.rows[i] = new Array(2048);
        }

        // Initialize final array of 512 elements
        this.finalArray = new Array(512);
    }

    /**
     * Convert a 32-bit value to 4 bytes in little-endian order
     * Example: 0x1c4d6fc3 -> [0xc3, 0x6f, 0x4d, 0x1c]
     * @param value 32-bit value
     * @returns Array of 4 bytes
     */
    private valueToBytes32(value: number): number[] {
        return [
            value & 0xFF,           // Byte 0 (LSB) - 0xc3
            (value >>> 8) & 0xFF,   // Byte 1       - 0x6f
            (value >>> 16) & 0xFF,  // Byte 2       - 0x4d
            (value >>> 24) & 0xFF   // Byte 3 (MSB) - 0x1c
        ];
    }

    /**
     * Convert a 16-bit value to 2 bytes in little-endian order
     * Example: 0x07ff -> [0xff, 0x07]
     * @param value 16-bit value
     * @returns Array of 2 bytes
     */
    private valueToBytes16(value: number): number[] {
        return [
            value & 0xFF,           // Byte 0 (LSB)
            (value >>> 8) & 0xFF    // Byte 1 (MSB)
        ];
    }

    /**
     * Convert an array of 32-bit values to bytes
     * @param values Array of 32-bit values
     * @returns Array of bytes
     */
    private arrayToBytes32(values: number[]): number[] {
        const bytes: number[] = [];
        for (const value of values) {
            bytes.push(...this.valueToBytes32(value));
        }
        return bytes;
    }

    /**
     * Convert an array of 16-bit values to bytes
     * @param values Array of 16-bit values
     * @returns Array of bytes
     */
    private arrayToBytes16(values: number[]): number[] {
        const bytes: number[] = [];
        for (const value of values) {
            bytes.push(...this.valueToBytes16(value));
        }
        return bytes;
    }

    /**
     * Check if a value already exists in previous rows or current row up to position
     * @param value Value to check for duplicates
     * @param currentRow Current row index (0-15)
     * @param currentPos Current position in current row (0-2047)
     * @returns true if duplicate found, false otherwise
     */
    private checkForDuplicateInPrevRows(value: number, currentRow: number, currentPos: number): boolean {
        // Check all previous rows (rows 0 to currentRow-1)
        for (let row = 0; row < currentRow; row++) {
            for (let col = 0; col < 0x7FF; col++) { // Check up to 0x7FF (2047)
                if (this.rows[row][col] === value) {
                    return true;
                }
            }
        }

        // Check current row up to currentPos (exclusive)
        if (currentPos > 0) {
            for (let col = 0; col < currentPos; col++) {
                if (this.rows[currentRow][col] === value) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a value already exists in the final array up to position
     * @param value Value to check for duplicates
     * @param currentPos Current position in array (0-511)
     * @returns true if duplicate found, false otherwise
     */
    private checkForDuplicateInArray(value: number, currentPos: number): boolean {
        for (let i = 0; i < currentPos; i++) {
            if (this.finalArray[i] === value) {
                return true;
            }
        }
        return false;
    }

    /**
     * Initialize the game board with random unique values
     * @param seed Initial seed for RNG (0 = use timestamp)
     */
    public initializeGameBoard(seed: number): void {
        // Initialize RNG with seed
        this.rng.initRandomGeneratorState(seed);

        // Get a random value and re-seed with it
        const newSeed = this.rng.lcgAlgorithm2();
        this.rng.initRandomGeneratorState(newSeed);

        // Generate 17 random algorithm selectors (0-3)
        // Indices 0-15 for the 16 rows, index 16 for the final array
        // Note: The original code writes 17 bytes into a 16-byte array,
        // with the 17th byte overflowing into the next stack variable (local_c)
        // which is then used for the final array's algorithm selector
        const algorithmSelectors: number[] = [];
        for (let i = 0; i < 17; i++) {
            let selector = this.rng.lcgAlgorithm0();
            // Mask to 0-3 (handles negative modulo properly)
            selector = selector & 0x80000003;
            if (selector < 0) {
                selector = ((selector - 1) | 0xFFFFFFFC) + 1;
            }
            algorithmSelectors.push(selector & 3);
        }

        // Generate 16 rows of 2048 unique values each
        for (let row = 0; row < 16; row++) {
            // Set the RNG algorithm for this row
            this.rng.setRNGAlgorithm(algorithmSelectors[row]);

            // Generate 2048 unique values for this row
            for (let col = 0; col < 2048; col++) {
                let value: number;
                let isDuplicate: boolean = false;

                // Keep generating until we get a unique value
                do {
                    value = this.rng.getNextRandomValue();
                    isDuplicate = this.checkForDuplicateInPrevRows(value, 0, col); // this actually is a bug from the game where instead of checking each row for duplicates, it only checks for the row 0
                } while (isDuplicate);

                this.rows[row][col] = value;
            }
        }

        // Generate final array of 512 values (11-bit values: 0-2047)
        // The original C++ code stores THEN checks, so we replicate that behavior exactly
        this.rng.setRNGAlgorithm(algorithmSelectors[16]);

        for (let i = 0; i < 512; i++) {
            let value: number;
            let isDuplicate: boolean;

            // Keep generating until we get a unique value
            do {
                value = this.rng.getNextRandomValue(); // Mask to 11 bits (0-2047)
                value &= 0x7FF;

                // Store the value first (matching C++ behavior)
                this.finalArray[i] = value;
                // Then check if it's a duplicate of values at positions 0..i-1
                isDuplicate = this.checkForDuplicateInArray(value, i);
            } while (isDuplicate);

            // Value is already stored, no need to store again
        }
    }

    /**
     * Get the game board data
     * @returns Object containing rows and final array
     */
    public getData(): { rows: number[][], finalArray: number[] } {
        return {
            rows: this.rows.map(row => this.arrayToBytes32(row)), // Convert each row to bytes (4 bytes per value)
            finalArray: this.arrayToBytes16(this.finalArray) // Convert final array to bytes (2 bytes per value)
        };
    }

    /**
     * Get the rows array
     * @returns Array of 512 values
     */
    public getRows(): number[][] {
        return this.rows.map(row => this.arrayToBytes32(row));
    }

    /**
     * Get a specific row
     * @param rowIndex Row index (0-15)
     * @returns Array of 2048 values
     */
    public getRow(rowIndex: number): number[] {
        if (rowIndex < 0 || rowIndex >= 16) {
            throw new Error(`Row index out of range: ${rowIndex}`);
        }
        return this.arrayToBytes32(this.rows[rowIndex]);
    }

    /**
     * Get the final array
     * @returns Array of 512 values
     */
    public getFinalArray(): number[] {
        return this.arrayToBytes16(this.finalArray);
    }
}