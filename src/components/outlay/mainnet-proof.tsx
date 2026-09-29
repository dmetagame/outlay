const contract = "0xe1b5d2cf63c43103455abd802b6b241b959a530c";
const settlement = "https://robinhoodchain.blockscout.com/tx/0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12";
const sourcify = "https://repo.sourcify.dev/4663/0xe1B5d2cF63C43103455ABD802B6B241b959a530c";

export function MainnetProof() {
  return (
    <section className="mainnet-proof" aria-labelledby="mainnet-proof-title">
      <div className="shell mainnet-proof-inner">
        <div className="mainnet-proof-copy">
          <h2 id="mainnet-proof-title">Robinhood 4663 · Mainnet payment proven</h2>
          <p>Payee +0.10 USDG · Caller +0.01 USDG · Room closed</p>
          <a className="mainnet-proof-address" href={`https://robinhoodchain.blockscout.com/address/${contract}`} target="_blank" rel="noreferrer">
            <span>Deployed contract </span><code>{contract}</code>
          </a>
          <p className="mainnet-proof-note">The sender settled this room; the call is permissionless. Blockscout verification is incomplete.</p>
        </div>
        <div className="mainnet-proof-links">
          <a href={settlement} target="_blank" rel="noreferrer">Settlement transaction ↗</a>
          <a href={sourcify} target="_blank" rel="noreferrer">Sourcify exact match ↗</a>
        </div>
      </div>
    </section>
  );
}
