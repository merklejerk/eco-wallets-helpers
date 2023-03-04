import dotenv from 'dotenv';
import {env as ENV} from 'process';
import 'mocha';
import {expect} from 'chai';
import {simulate} from '../ts/tenderly';
import {createCompilerInput, parseCompilerOutput} from '../ts/solc';
import {
    abis as builtinAbis,
    outerDefs as builtinOuterDefs,
    innerDefs as builtinInnerDefs,
} from '../ts/builtins';
import solc from 'solc';

dotenv.config();

describe('lib tests', () => {
    let abis: any[][] = builtinAbis.slice();
    let runtimeCode: string;

    before(async () => {
        const output = parseCompilerOutput(JSON.parse(solc.compile(JSON.stringify(createCompilerInput({
            fragment: `
                emit Foo(msg.value);
                payable(address(this)).transfer(msg.value);
                assembly { return(0x00, 0x20) }
            `,
            version: /^\d+\.\d+\.\d+/.exec(solc.version())[0],
            extraInnerDefs: [
                'event Foo(uint256 x);',
                ...builtinInnerDefs,
            ],
            extraOuterDefs: builtinOuterDefs,
        })))));
        abis.push(output.abi);
        runtimeCode = '0x' + output.runtimeCode;
    });

    it('can simulate', async () => {
        const r = await simulate({
            auth: {
                user: ENV.TENDERLY_USER,
                project: ENV.TENDERLY_PROJECT,
                accessKey: ENV.TENDERLY_ACCESS_KEY,
            },
            gas: 500e3,
            value: '1',
            networkId: 5,
            entryPoint: '0x82b035B4405Dd60b449b054894004FeE80566655',
            owner: '0x4D5175EA204954a2CA9Ca06fe766764b196CEDa5',
            runtimeCode,
            walletSalt: '0',
            abis,
        });
        expect(r.logs).to.be.length(2);
        expect(r.balanceDiffs).to.be.length(2);
    });
});
