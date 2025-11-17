/**
 * Random Number Generator State
 * Maintains state for 4 different LCG algorithms
 */
export default class RandomGeneratorState {
    // Usage counters for each algorithm
    private counter0: number = 0;  // offset 0x00
    private counter1: number = 0;  // offset 0x04
    private counter2: number = 0;  // offset 0x08
    private counter3: number = 0;  // offset 0x0C

    // Current algorithm selector (0-3)
    private currentAlgorithm: number = 0;  // offset 0x10

    // CRT random seed (not used in our algorithms but part of structure)
    private crtSeed: number = 0;  // offset 0x14

    // Seeds for each LCG algorithm
    seed0: number = 0;  // offset 0x18 - Algorithm 0
    private seed1: number = 0;  // offset 0x1C - Algorithm 1
    private seed2: number = 0;  // offset 0x20 - Algorithm 2
    private seed3: number = 0;  // offset 0x14 - Algorithm 3 (shared with index 5)

    /**
     * Initialize the RNG state with a seed
     * @param seed Random seed (0 = use timestamp)
     */
    public initRandomGeneratorState(seed: number): void {
        // If seed is 0, use current timestamp (timeGetTime equivalent)
        if (seed === 0) {
            seed = Date.now() & 0xFFFFFFFF;
        }

        // Reset all counters
        this.counter0 = 0;
        this.counter1 = 0;
        this.counter2 = 0;
        this.counter3 = 0;

        // Set CRT seed
        this.crtSeed = seed >>> 0;

        // Initialize all algorithm seeds with the same value
        this.seed0 = seed >>> 0;
        this.seed1 = seed >>> 0;
        this.seed2 = seed >>> 0;
        this.seed3 = seed >>> 0;
    }

    /**
     * LCG Algorithm 0 (Borland C/C++ style)
     * Uses multiplier 0x8088405 (134775813) and increment 1
     * @returns 16-bit random value (0-65535)
     */
    public lcgAlgorithm0(): number {
        this.counter0++;

        // LCG formula: state = state * 0x8088405 + 1
        // Perform multiplication and addition with proper 32-bit wrapping
        this.seed0 = Math.imul(this.seed0, 0x8088405) + 1;
        this.seed0 = this.seed0 >>> 0; // Convert to unsigned 32-bit

        // Extract middle 16 bits (handles signed arithmetic from original)
        const value = this.seed0 | 0; // Convert to signed 32-bit
        const adjusted = value + ((value >> 31) & 0xFFFF);
        return (adjusted >> 16) & 0xFFFF;
    }

    /**
     * LCG Algorithm 1 (Modified POSIX style)
     * Uses formula: 0x3039 - (state * 0x3e39b193), masked to 31 bits
     * Returns full 31-bit value (masked to 0x7FFFFFFF)
     * @returns 31-bit random value
     */
    public lcgAlgorithm1(): number {
        this.counter1++;

        // LCG formula: state = (0x3039 - state * 0x3e39b193) & 0x7FFFFFFF
        // This is a subtraction-based LCG variant
        this.seed1 = (0x3039 - Math.imul(this.seed1, 0x3e39b193)) & 0x7FFFFFFF;

        return this.seed1;
    }

    /**
     * LCG Algorithm 2 (Microsoft Visual C++ style)
     * Uses multiplier 0x41C64E6D and increment 0x3039
     * @returns 16-bit random value (0-65535)
     */
    public lcgAlgorithm2(): number {
        this.counter2++;

        // LCG formula: state = state * 0x41C64E6D + 0x3039
        this.seed2 = (Math.imul(this.seed2, 0x41C64E6D) + 0x3039) >>> 0;

        // Extract middle 16 bits (same as Algorithm 0)
        const value = this.seed2 | 0;
        const adjusted = value + ((value >> 31) & 0xFFFF);
        return (adjusted >> 16) & 0xFFFF;
    }

    /**
     * LCG Algorithm 3 (BSD rand style)
     * Uses multiplier 0x343FD and increment 0x269EC3
     * Returns bits 16-30 (upper 15 bits of 31-bit value)
     * @returns 15-bit random value (0-32767)
     */
    public lcgAlgorithm3(): number {
        this.counter3++;

        // LCG formula: state = (state * 0x343FD + 0x269EC3) & 0x7FFFFFFF
        this.seed3 = (Math.imul(this.seed3, 0x343FD) + 0x269EC3) & 0x7FFFFFFF;

        // Extract middle 16 bits with signed arithmetic handling (same as algorithms 0 and 2)
        const value = this.seed3 | 0;
        const adjusted = value + ((value >> 31) & 0xFFFF);
        return (adjusted >> 16) & 0x7FFF;
    }
    /**
     * Set which RNG algorithm to use (0-3)
     * @param algorithm Algorithm index (0-3)
     */
    public setRNGAlgorithm(algorithm: number): void {
        this.currentAlgorithm = algorithm & 3; // Mask to 0-3
    }

    /**
     * Get next random value using the currently selected algorithm
     * @returns Random value based on current algorithm
     */
    public getNextRandomValue(): number {
        switch (this.currentAlgorithm) {
            case 0:
                return this.lcgAlgorithm0();
            case 1:
                return this.lcgAlgorithm1();
            case 2:
                return this.lcgAlgorithm2();
            case 3:
                return this.lcgAlgorithm3();
            default:
                return this.lcgAlgorithm0();
        }
    }
}