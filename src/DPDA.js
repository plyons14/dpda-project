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
            return 'Z';  // return 'Z' to indicate that it is the bottom and was not popped
        }
    }      

    // Returns true if the stack is empty, false otherwise

    isEmpty() {
        let isEmpty = this.stack.length === 0;
        console.log(`Stack is empty: ${isEmpty}`);
        return isEmpty;
    }
}

class PDAConfiguration {
    constructor(state, input, stack, error = null) {
        this.state = state;
        this.remainingInput = input;
        this.stack = stack;
        this.error = error;
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
            currentConfig = this.getNextConfiguration(currentConfig);
            yield currentConfig;
            if (currentConfig.remainingInput.length === 0 && !this.hasAccepted(currentConfig)) {
                currentConfig.error = "Input not properly terminated or conditions not met for acceptance.";
                yield currentConfig;
                return;
            }
        }
    
        if (this.hasAccepted(currentConfig)) {
            console.log("Input accepted.");
        } else {
            console.log("Input rejected.");
        }
    }    

    getNextConfiguration(config) {
        let inputSymbol = config.remainingInput[0] || 'λ'; // Use 'λ' for empty input symbol
        let stackTop = config.stack.top();
        let key = `${inputSymbol}_${stackTop}`;
    
        console.log(`Attempting transition for State=${config.state}, Input='${inputSymbol}', Stack top='${stackTop}'`);
    
        if (!this.transitions[config.state] || !this.transitions[config.state][key]) {
            console.warn(`No valid transition found for state: ${config.state}, input: '${inputSymbol}', stack top: '${stackTop}'`);
            return new PDAConfiguration(config.state, config.remainingInput, config.stack, "Rejected due to invalid or incomplete input.");
        }        
    
        let transition = this.transitions[config.state][key];
        if (transition) {
            if (transition.stackPushSymbols.length > 0) {
                transition.stackPushSymbols.forEach(symbol => {
                    config.stack.push(symbol);
                });
            } else {
                if (stackTop !== 'Z') {  // Ensure 'Z' is not popped
                    config.stack.pop();  // Pop only if allowed
                }
            }
            config.state = transition.newState;
            if (inputSymbol !== 'λ') {
                config.remainingInput = config.remainingInput.slice(1); // Consume one input symbol
            }
        }
    
        console.log(`Transitioned to State=${config.state}, Stack now: ${config.stack.stack.join(',')}`);
        return config;
    }      
    
    hasAccepted(config) {
        return config.state === 'f' && config.stack.stack.join('') === 'Z' && config.remainingInput.length === 0;
    }

    hasLambdaTransition(state, stackSymbol) {
        let key = `_${stackSymbol}`;
        return this.transitions[state] && this.transitions[state][key];
    }
}
