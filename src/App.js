import React, { useState, useEffect } from 'react';
import DPDA from './DPDA';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, Button, Box, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

const App = () => {
    const [input, setInput] = useState('');
    const [nValue, setNValue] = useState('');
    const [inputMode, setInputMode] = useState('text');
    const [results, setResults] = useState([]);
    const [error, setError] = useState(false);
    const [helperText, setHelperText] = useState('');

    useEffect(() => {
        if (typeof window?.MathJax !== "undefined") {
            window.MathJax.typeset()
        }
    }, [])

    const validateInput = (input) => {
        const regex = /^[ab]*\$?$/;
        return regex.test(input);
    };

    const handleModeChange = (event) => {
        setInputMode(event.target.value);
        // Reset states
        setInput('');
        setNValue('');
        setError(false);
        setHelperText('');
    };

    const handleInputChange = (event) => {
        const value = event.target.value;
        if (validateInput(value)) {
            setInput(value);
            setError(false);
            setHelperText('');
        } else {
            setError(true);
            setHelperText('Incorrect entry. Use only "a", "b", or "$".');
        }
    };

    const handleNChange = (event) => {
        const n = event.target.value;
        setNValue(n);
        if (/^\d*$/.test(n)) { // Ensure it's a non-negative integer
            setInput('a'.repeat(n) + 'b'.repeat(n));
            setError(false);
            setHelperText('');
        } else {
            setError(true);
            setHelperText('n must be a non-negative integer.');
        }
    };

    const handleProcessInput = () => {
        if (inputMode === 'text' && !validateInput(input)) {
            setError(true);
            setHelperText('Input contains invalid characters.');
            return;
        }

        if (inputMode === 'exponent' && (error || !nValue)) {
            setError(true);
            setHelperText('Please enter a valid exponent n.');
            return;
        }

        let processedInput = (inputMode === 'exponent' ? 'a'.repeat(nValue) + 'b'.repeat(nValue) : input.trim().replace(/\$+$/, '')) + '$';

        const dpda = new DPDA(
            new Set(['p', 'qa', 'qb', 'q$']),
            new Set(['a', 'b', '$']),
            new Set(['A', 'S']),
            {
                'p': {
                    'e_Z': { newState: 'q', stackPushSymbols: ['S'], ruleDescription: '' },
                },
                'q': {
                    'a_e': { newState: 'qa', stackPushSymbols: [], ruleDescription: '' },
                    'b_e': { newState: 'qb', stackPushSymbols: [], ruleDescription: '' },
                    '$_Z': { newState: 'q$', stackPushSymbols: ['pop'], ruleDescription: '' },
                },
                'qa': {
                    'e_a': { newState: 'q', stackPushSymbols: ['pop'], ruleDescription: '' },
                    'e_S': { newState: 'qa', stackPushSymbols: ['pop', 'b', 'S', 'a'], ruleDescription: 'S -> aSb' },
                },
                'qb': {
                    'e_b': { newState: 'q', stackPushSymbols: ['pop'], ruleDescription: '' },
                    'e_S': { newState: 'qb', stackPushSymbols: ['pop'], ruleDescription: 'S -> e' },
                },
                'q$': {
                    // No transitions out of the final state, q$ is a halting state
                }
            },
            'p',
            new Set(['q$'])
        );
        let configurations = [];
        let index = 0;

        for (const config of dpda.readInputStepwise(processedInput)) {
            configurations.push({
                step: index++,
                state: config.state,
                unreadInput: config.remainingInput,
                stack: config.stack.stack.join(''),
                deltaUsed: config.deltaRule,
                rUsed: config.rRule,
                error: config.error
            });
            if (config.error) {
                break; // Stop processing on first error
            }
        }

        if (configurations.length === 0 || configurations[configurations.length - 1].error) {
            configurations.push({ message: "Language not accepted or no valid configurations found." });
        }

        setResults(configurations);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 750, mx: 'auto', my: 4 }}>
            <Typography variant="h3" component="h1" textAlign="center" mb={2}>
                Deterministic Pushdown Automaton Implementation
            </Typography>

            <Typography variant="h5" component="div" textAlign="center" mb={4}>
                <span dangerouslySetInnerHTML={{ __html: 'L = \\( a^n b^n \\mid n \\geq 0 \\)' }} />
            </Typography>

            <FormControl fullWidth margin="normal">
                <InputLabel id="input-mode-select-label">Input Mode</InputLabel>
                <Select
                    labelId="input-mode-select-label"
                    id="input-mode-select"
                    value={inputMode}
                    label="Input Mode"
                    onChange={handleModeChange}
                >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="exponent">Exponent n</MenuItem>
                </Select>
            </FormControl>

            {inputMode === 'text' ? (
                <TextField
                    fullWidth
                    error={error}
                    id="outlined-input"
                    label="Enter string"
                    value={input}
                    onChange={handleInputChange}
                    helperText={helperText}
                    margin="normal"
                />
            ) : (
                <TextField
                    fullWidth
                    error={error}
                    id="outlined-n-value"
                    label="Enter exponent n"
                    type="number"
                    value={nValue}
                    onChange={handleNChange}
                    helperText={helperText}
                    margin="normal"
                />
            )}

            <Button variant="contained" onClick={handleProcessInput} disabled={error} margin="normal">
                Process String
            </Button>

            <TableContainer component={Paper} elevation={3} sx={{ marginTop: 3 }}>
                <Table aria-label="DPDA Results" sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Step</TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>Unread Input</TableCell>
                            <TableCell>Stack</TableCell>
                            <TableCell>Δ Used</TableCell>
                            <TableCell>R Used</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.length === 0 && (
                            <TableRow>
                                <TableCell align="center" colSpan={6}>
                                    <Typography variant="subtitle1" component="div" style={{ color: 'red' }}>
                                        No configurations processed.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {results.map((result, index) => (
                            <React.Fragment key={index}> {/* Use React.Fragment to wrap each group of rows */}
                                <TableRow style={result.error ? { backgroundColor: 'lightcoral' } : {}}>
                                    <TableCell>{result.step}</TableCell>
                                    <TableCell>{result.state}</TableCell>
                                    <TableCell>{result.unreadInput}</TableCell>
                                    <TableCell>{result.stack}</TableCell>
                                    <TableCell>{result.deltaUsed}</TableCell>
                                    <TableCell>{result.rUsed}</TableCell>
                                </TableRow>
                                {result.error && (
                                    // This row is only for the error message
                                    <TableRow style={{ backgroundColor: 'lightcoral' }}>
                                        <TableCell colSpan={6} style={{ color: 'darkred' }}>
                                            Error: {result.error}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default App;
