const contract = "0xe1b5d2cf63c43103455abd802b6b241b959a530c";
const settlement = "https://robinhoodchain.blockscout.com/tx/0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12";
const sourcify = "https://repo.sourcify.dev/4663/0xe1B5d2cF63C43103455ABD802B6B241b959a530c";

export function MainnetProof() {
  return (
    <section className="mainnet-proof" id="mainnet-proof" aria-labelledby="mainnet-proof-title">
      <div className="receipt-heading">
        <h2 id="mainnet-proof-title">Mainnet payment proof</h2>
        <span className="badge success"><span aria-hidden="true">✓</span> Settled</span>
      </div>
      <div className="receipt-total"><span>Room 1 · Robinhood 4663</span><p>0.11 <span>USDG funded</span></p></div>
      <div className="allocation-bar" aria-hidden="true"><span /><span /></div>
      <dl className="receipt-split">
        <div><dt>Paid to payee</dt><dd>0.10 <span>USDG</span></dd></div>
        <div><dt>Paid to caller</dt><dd>0.01 <span>USDG</span></dd></div>
      </dl>
      <div className="receipt-status"><span>Room closed · Nothing remaining</span><span>Block 75738431</span></div>
      <a className="mainnet-proof-address" href={`https://robinhoodchain.blockscout.com/address/${contract}`} target="_blank" rel="noreferrer">
        <span>Deployed contract ↗</span><code>{contract}</code>
      </a>
      <div className="mainnet-proof-links">
        <a href={settlement} target="_blank" rel="noreferrer">Settlement transaction ↗</a>
        <a href={sourcify} target="_blank" rel="noreferrer">Sourcify exact match ↗</a>
      </div>
      <p className="mainnet-proof-note">The sender settled this room. The call is permissionless.<br />Blockscout verification is incomplete.</p>
    </section>
  );
}
