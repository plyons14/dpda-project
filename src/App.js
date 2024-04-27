import React, { useState } from 'react';
import DPDA from './DPDA';

const App = () => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState([]);
    const [appendDollar, setAppendDollar] = useState(false);  // State to track the checkbox

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleCheckboxChange = () => {
        setAppendDollar(!appendDollar);  // Toggle the checkbox state
    };

    const handleProcessInput = () => {
        let processedInput = appendDollar ? input + '$' : input;  // Append '$' if checkbox is checked
        const dpda = new DPDA(
            new Set(['p', 'q', 'f', 'r']),
            new Set(['a', 'b', '$']),
            new Set(['A', 'Z']),
            {
                'p': {
                    'a_Z': {newState: 'p', stackPushSymbols: ['A']},
                    'a_A': {newState: 'p', stackPushSymbols: ['A']},
                    'b_A': {newState: 'q', stackPushSymbols: []},
                    '$_Z': {newState: 'f', stackPushSymbols: []},
                },
                'q': {
                    'b_A': {newState: 'q', stackPushSymbols: []},
                    '$_Z': {newState: 'f', stackPushSymbols: []},
                    'b_Z': {newState: 'r', stackPushSymbols: []},
                },
                'r': {},
            },
            'p',
            'Z',
            new Set(['f'])
        );

        let configurations = [];
        let errorOccurred = false;
        for (const config of dpda.readInputStepwise(processedInput)) {
            if (config.error) {
                errorOccurred = true;
                alert(config.error);
                break;
            }
            configurations.push({
                state: config.state,
                stack: config.stack.stack.join(''),
                remainingInput: config.remainingInput
            });
        }
        if (!errorOccurred) {
            setResults(configurations);
        }
    };

    return (
        <div>
            <h1>DPDA Simulator</h1>
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter a string to simulate"
            />
            <button onClick={handleProcessInput}>
                Process String
            </button>
            <label>
                <input
                    type="checkbox"
                    checked={appendDollar}
                    onChange={handleCheckboxChange}
                />
                Append '$' automatically
            </label>
            <div>
                <h2>Results:</h2>
                {results.map((result, index) => (
                    <div key={index}>
                        Step {index}: State: {result.state}, Stack: {result.stack}, Remaining Input: {result.remainingInput}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
