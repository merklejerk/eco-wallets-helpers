import 'mocha';
import {expect} from 'chai';
import solc from 'solc';
import {createCompilerInput, parseCompilerOutput} from '../ts/solc';
import {outerDefs as builtinOuterDefs, innerDefs as builtinInnerDefs, innerDefs} from '../ts/builtins';

describe('lib tests', () => {
    it('can compile', async () => {
        const output = parseCompilerOutput(JSON.parse(solc.compile(JSON.stringify(createCompilerInput({
            fragment: `
                assembly { log0(0x00, 0x00) }
                emit Foo(123);
                selfdestruct(payable(tx.origin));
            `,
            version: /^\d+\.\d+\.\d+/.exec(solc.version())[0],
            extraInnerDefs: [
                'event Foo(uint256);',
                ...builtinInnerDefs,
            ],
            extraOuterDefs: [
                `interface IFoo {}`,
                ...builtinOuterDefs,
            ],
        })))));
        expect(output.abi).to.be.length(2 + builtinInnerDefs.length);
        expect(output.warnings).to.be.length(1);
        expect(output.runtimeCode.length).to.greaterThan(2);
    });
});
