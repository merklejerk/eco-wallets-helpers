import axios from 'axios';
const ethers = require('ethers');

interface SimulateOpts {
    networkId: number;
    owner: string;
    entryPoint: string;
    runtimeCode: string;
    value: string;
    gas: number;
    walletSalt: string;
    abis?: any[],
    auth: {
        user: string;
        project: string;
        accessKey: string;
    }
}

export interface DecodedLog {
    address: string;
    name: string;
    args: { [name: string | number]: string | number | bigint };
}

export interface BalanceDiff {
    address: string;
    start:  string;
    end: string;
}

export interface SimulateResults {
    logs: DecodedLog[];
    balanceDiffs: BalanceDiff;
}

class RevertError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

interface RawLog {
    address: string;
    topics: string[] | null;
    data: string;
}

export async function simulate(opts: SimulateOpts): Promise<SimulateResults> {
    const url = `https://api.tenderly.co/api/v1/account/${opts.auth.user}/project/${opts.auth.project}/simulate`;
    const { data } = await axios.post(
        url,
        {
            save: false,
            save_if_fails: false,
            simulation_type: 'quick',
            network_id: `${opts.networkId}`,
            from: opts.owner,
            to: opts.entryPoint,
            input: encodeExecCall(opts.runtimeCode, opts.walletSalt),
            value: `${opts.value}`,
            gas: opts.gas,
            gas_price: 0,
        },
        {
            headers: { 'X-Access-Key': opts.auth.accessKey },
        },
    );
    const tx = data.transaction;
    if (tx.error_message) {
        throw new RevertError(tx.error_message);
    }
    const txInfo = tx.transaction_info;
    const rawLogs = (txInfo.logs || []).map((l: any) => l.raw) as RawLog[];
    return {
        logs: decodeLogs(rawLogs, opts.abis || []),
        balanceDiffs: (txInfo.balance_diff || []).map((d: any) => ({
            address: d.address,
            start: BigInt(d.original),
            end: BigInt(d.dirty),
        })),
    };
}

function decodeLogs(rawLogs: RawLog[], abis: any[][]): DecodedLog[] {
    const iface = ethers.Interface.from(abis.map(a => a.filter(e => e.type === 'event')).flat());
    const logs: DecodedLog[] = [];
    for (const raw of rawLogs) {
        if (raw.topics === null) {
            logs.push({
                address: raw.address,
                name: null,
                args: { ['0']: raw.data },
            });
            continue;
        }
        const decoded = iface.parseLog({ data: raw.data, topics: raw.topics || [] });
        if (decoded) {
            logs.push({
                address: raw.address,
                args: decoded.args,
                name: decoded.name,
            });
        }
    }
    return logs;
}

const EP_IFACE = ethers.Interface.from([
    {
        type: 'function',
        name: 'exec',
        inputs: [
            { name: 'runtimeCode', type: 'bytes' },
            { name: 'callData', type: 'bytes' },
            { name: 'walletSalt', type: 'uint256' },
        ],
    },
]);

function encodeExecCall(runtimeCode: string, walletSalt: string): string {
    return EP_IFACE.encodeFunctionData(
        'exec',
        [ runtimeCode, '0x', walletSalt ],
    );
}
