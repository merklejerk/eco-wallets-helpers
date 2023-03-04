import crypto from 'crypto';

export interface CompilerInput {
    language: string,
    sources: {
        [name: string]: {
            content: string;
        };
    };
    settings: {
        optimizer: {
            enabled: boolean;
            runs: number;
        };
        viaIR?: boolean;
        outputSelection: {
            [file: string]: {
                [contract: string]: string[];
            };
        };
    };
}

export interface CompilerOutput {
    errors?: Array<
        {
            sourceLocation: {
                file: string;
                start: number;
                end: number;
            };
            type: string;
            severity: 'error' | 'warning' | 'info';
            errorCode: number;
            message: string;
            formattedMessage: string;
        }
    >;
    contracts: {
        [file: string]: {
            [contract: string]: {
                abi: any[];
                evm: { deployedBytecode: { object: string; }; };            
            };
        };
    };
}

export interface CompilerInputOpts {
    version: string;
    fragment: string;
    extraOuterDefs?: string[];
    extraInnerDefs?: string[];
}

const DEFAULT_OUTPUT_SELECTION = ['evm.deployedBytecode.object', 'abi'];

export function createBrowserCompilerCode(opts: CompilerInputOpts): string {
    return `// SPDX-License-Identifier: UNLICENSED
        pragma solidity ${opts.version};

        ${(opts.extraOuterDefs || []).join('\n')}

        contract WalletOperation {

            ${(opts.extraInnerDefs || []).join('\n')}

            fallback() external payable {
                ${opts.fragment}
            }
        }
    `;
}

export function createCompilerInput(opts: CompilerInputOpts): CompilerInput {
    const name = getWalletOperationContractName(opts.fragment);
    const src = `// SPDX-License-Identifier: UNLICENSED
        pragma solidity ${opts.version};

        ${(opts.extraOuterDefs || []).join('\n')}

        contract ${name} {

            ${(opts.extraInnerDefs || []).join('\n')}

            fallback() external payable {
                ${opts.fragment}
            }
        }
    `;
    return {
        language: 'Solidity',
        sources: { 'main': { content: src } },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                'main': { [name]: DEFAULT_OUTPUT_SELECTION },
            },
        },
    };
}

function getWalletOperationContractName(fragment: string): string {
    return 'WalletOperation_' + crypto.createHash('sha256').update(fragment).digest().slice(0, 4).toString('hex');
}

export class CompilerError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export function parseCompilerOutput(output: CompilerOutput): { abi: any[], runtimeCode: string, warnings: string[] } {
    const errors = (output.errors || []).filter(e => e.severity === 'error');
    if (errors.length) {
        throw new CompilerError(errors.map(e => e.formattedMessage).join('\n'));
    }
    const art = Object.values(output.contracts?.['main'] || {})?.[0];
    return {
        abi: art.abi,
        runtimeCode: art.evm.deployedBytecode.object,
        warnings: (output.errors || []).filter(e => e.severity === 'warning').map(e => e.formattedMessage),
    };
}