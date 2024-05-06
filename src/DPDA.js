class PDAStack {
    constructor() {
        this.stack = ['Z'];
    }

    top() {
        // Return the top of the stack or 'e' if the stack is empty
        return this.stack.length > 0 ? this.stack[0] : 'e';
    }

    push(symbol) {
        // Push a symbol onto the stack unless it's 'e', which represents an empty action
        if (symbol !== 'e') {
            this.stack.unshift(symbol);
        }
    }

    pop() {
        // Pop and return the top symbol of the stack if it's not empty
        return this.stack.length > 0 ? this.stack.shift() : 'e';
    }

    isEmpty() {
        // Check if the stack is empty
        return this.stack.length === 0;
    }
}

class PDAConfiguration {
    constructor(state, remainingInput, stack) {
        this.state = state;
        this.remainingInput = remainingInput;
        this.stack = stack;
        this.error = null;
        this.deltaRule = '';
        this.rRule = '';
    }
}

export default class DPDA {
    constructor(states, inputSymbols, stackSymbols, transitions, initialState, finalStates) {
        console.log("DPDA initialized.");
        this.states = states;
        this.inputSymbols = inputSymbols;
        this.stackSymbols = stackSymbols;
        this.transitions = transitions;
        this.initialState = initialState;
        this.finalStates = finalStates;
    }

    *readInputStepwise(inputStr) {
        let currentConfig = new PDAConfiguration(this.initialState, inputStr, new PDAStack());
        console.log("Initial configuration:", currentConfig);

        yield currentConfig;

        while (currentConfig.remainingInput.length > 0 || this.hasLambdaTransition(currentConfig.state, currentConfig.stack.top())) {
            console.log("Processing configuration:", currentConfig);

            let nextConfig = this.getNextConfiguration(currentConfig);
            if (nextConfig.error) {
                console.error(nextConfig.error);
                yield nextConfig;
                break;
            }

            console.log("Configuration after transition:", nextConfig);
            yield nextConfig;
            currentConfig = nextConfig;
        }

        if (this.isAccepted(currentConfig)) {
            console.log("Input accepted.");
        } else {
            console.log("Input rejected.");
            currentConfig.error = "Input rejected.";
            yield currentConfig;
        }
    }

    applyStackAction(stack, stackPushSymbols) {
        if (stackPushSymbols.length > 0) {
            stackPushSymbols.forEach(symbol => {
                if (symbol === 'pop') {
                    stack.pop();
                } else {
                    stack.push(symbol);
                }
            });
        }
        // If stackPushSymbols is empty and doesn't include 'pop' or any symbol, do nothing
    }

    getNextConfiguration(config) {
        let inputSymbol = config.remainingInput.charAt(0) || 'e';  // 'e' represents empty/lambda
        let stackTop = config.stack.top() || 'e';  // Get top of stack or 'e' if empty
        let transitionsAvailable = this.transitions[config.state];

        // Handle explicit lambda transitions (without consuming input)
        let lambdaKey = `e_${stackTop}`;
        if (transitionsAvailable && transitionsAvailable[lambdaKey]) {
            // Lambda transition matching the actual stack top
            this.applyTransition(config, lambdaKey);
            // Do not consume any input symbol here
        } else {
            // Handle input-based transitions
            let inputKey = `${inputSymbol}_${stackTop}`;
            let genericKey = `${inputSymbol}_e`;
            if (transitionsAvailable && transitionsAvailable[inputKey]) {
                // Transition that matches both input and stack top
                this.applyTransition(config, inputKey);
                if (inputSymbol !== 'e') {  // Only advance input if it's not a lambda transition
                    config.remainingInput = config.remainingInput.substring(1);
                }
            } else if (transitionsAvailable && transitionsAvailable[genericKey]) {
                // Transition that matches input but does not care about stack top
                this.applyTransition(config, genericKey);
                if (inputSymbol !== 'e') {  // Only advance input if it's not a lambda transition
                    config.remainingInput = config.remainingInput.substring(1);
                }
            } else {
                config.error = "Input rejected.";
            }
        }
        return config;
    }

    formatTransition(x, y, z, m, n) {
        if (n.includes('pop')) { n = n.filter(x => x!== 'pop'); }
        if (n.length === 0) { n = ['e']; }

        return `(${x}, ${y}, ${z}) -> (${m}, ${n.reverse().join('')})`;
    }

    applyTransition(config, key) {
        let transition = this.transitions[config.state][key];
        config.deltaRule = this.formatTransition(config.state, key.split('_')[0], key.split('_')[1], transition.newState, transition.stackPushSymbols);
        config.rRule = transition.ruleDescription; // Description of the rule
        this.applyStackAction(config.stack, transition.stackPushSymbols);
        config.state = transition.newState;
    }

    isAccepted(config) {
        return this.finalStates.has(config.state) && config.stack.stack.length === 0 && config.remainingInput.length === 0;
    }

    hasLambdaTransition(state, stackTop) {
        let key = `e_${stackTop}`;
        return this.transitions[state] && this.transitions[state][key];
    }
}
