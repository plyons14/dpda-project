class PDAStack {
    constructor(initialSymbol) {
        this.stack = [initialSymbol];
        console.log(`Stack initialized with: ${initialSymbol}`);
    }

    top() {
        let top = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
        console.log(`Top of stack: ${top}`);
        return top;
    }

    push(symbol) {
        this.stack.push(symbol);
        console.log(`Pushed onto stack: ${symbol}, Stack now: ${this.stack.join(',')}`);
    }
    
    pop() {
        if (this.stack[this.stack.length - 1] !== 'Z') {
            let popped = this.stack.pop();
            console.log(`Popped from stack: ${popped}, Stack now: ${this.stack.join(',')}`);
            return popped;
        } else {
            console.log(`Attempt to pop initial symbol Z from stack. Ignored.`);
            // Don't actually pop 'Z', just log an attempt to pop
            return 'Z';
        }
    }

    isEmpty() {
        let isEmpty = this.stack.length === 0;
        console.log(`Stack is empty: ${isEmpty}`);
        return isEmpty;
    }
}

class PDAConfiguration {
    constructor(state, input, stack, error = null, deltaRule = '', rRule = '') {
        this.state = state;
        this.remainingInput = input;
        this.stack = stack;
        this.error = error;
        this.deltaRule = deltaRule;
        this.rRule = rRule;
    }
}

export default class DPDA {
    constructor(states, inputSymbols, stackSymbols, transitions, initialState, initialStackSymbol, finalStates) {
        this.states = states;
        this.inputSymbols = inputSymbols;
        this.stackSymbols = stackSymbols;
        this.transitions = transitions;
        this.initialState = initialState;
        this.initialStackSymbol = initialStackSymbol;
        this.finalStates = Array.from(finalStates);
        console.log(`DPDA initialized with initial state: ${initialState} and initial stack symbol: ${initialStackSymbol}`);
    }

    *readInputStepwise(inputStr) {
        let currentConfig = new PDAConfiguration(this.initialState, inputStr, new PDAStack(this.initialStackSymbol));
        console.log(`Starting configuration: State=${currentConfig.state}, Input=${inputStr}, Stack top=${currentConfig.stack.top()}`);
        yield currentConfig;
    
        while (currentConfig.remainingInput.length > 0) {
            console.log(`Processing: State=${currentConfig.state}, Input=${currentConfig.remainingInput}, Stack top=${currentConfig.stack.top()}`);
            let nextConfig = this.getNextConfiguration(currentConfig);
    
            // If there's an error, log it, yield the error configuration, and break
            if (nextConfig.error) {
                console.error(nextConfig.error);
                yield nextConfig; // Yield the error state
                break; // Break the loop after yielding the error state
            }
    
            currentConfig = nextConfig;
            yield currentConfig;
    
            if (currentConfig.remainingInput.length === 0 && !this.hasAccepted(currentConfig)) {
                currentConfig.error = "Input not properly terminated or conditions not met for acceptance.";
                console.error(currentConfig.error);
                yield currentConfig;
                break; // Ensure to break after yielding the final state with error
            }
        }
    
        if (this.hasAccepted(currentConfig)) {
            console.log("Input accepted.");
        } else if (!currentConfig.error) { // Check if the error hasn't been handled yet
            console.log("Input rejected.");
            currentConfig.error = "Input rejected.";
            yield currentConfig; // Yield the rejected state
        }
    }    
    
    getNextConfiguration(config) {
        let inputSymbol = config.remainingInput[0] || 'ε'; // Handle empty input symbol
        let stackTop = config.stack.top();
        let key = `${inputSymbol}_${stackTop}`;
    
        console.log(`Attempting transition for State=${config.state}, Input='${inputSymbol}', Stack top='${stackTop}'`);
    
        if (!this.transitions[config.state] || !this.transitions[config.state][key]) {
            console.warn(`No valid transition found for state: ${config.state}, input: '${inputSymbol}', stack top: '${stackTop}'`);
            return new PDAConfiguration(config.state, config.remainingInput, config.stack, "Rejected due to invalid or incomplete input.");
        }
    
        let transition = this.transitions[config.state][key];
        let deltaRule = `(${config.state}, ${inputSymbol}, ${stackTop}) → (${transition.newState}, [${transition.stackPushSymbols.join(', ')}])`;
        let rRule;
    
        if (transition) {
            if (transition.stackPushSymbols.length > 0) {
                rRule = `PUSH ${transition.stackPushSymbols.join('')}`;
                transition.stackPushSymbols.forEach(symbol => config.stack.push(symbol));
            } else {
                if (stackTop !== 'Z') {
                    rRule = `POP ${stackTop}`;
                    config.stack.pop();
                } else {
                    rRule = `NO OP`;  // No operation performed on the stack
                }
            }
            config.state = transition.newState;
            if (inputSymbol !== 'ε') {
                config.remainingInput = config.remainingInput.slice(1);
            }
        }
    
        return new PDAConfiguration(config.state, config.remainingInput, config.stack, null, deltaRule, rRule);
    }      
    
    hasAccepted(config) {
        return config.state === 'f' && config.stack.stack.join('') === 'Z' && config.remainingInput.length === 0;
    }

    hasLambdaTransition(state, stackSymbol) {
        let key = `_${stackSymbol}`;
        return this.transitions[state] && this.transitions[state][key];
    }
}
