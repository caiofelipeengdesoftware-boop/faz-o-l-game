import { useState } from 'react';

const PIX_KEY = '67152258000184';

export function DonationDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setCopied(false); }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="donation-dialog" role="dialog" aria-modal="true" aria-labelledby="donation-title">
      <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
      <div className="eyebrow">APOIE O DESENVOLVIMENTO</div>
      <h2 id="donation-title">Ajude esta cidade<br /><em>a ganhar vida.</em></h2>
      <p>Se quiser apoiar o desenvolvimento de <strong>FAZ O L</strong>, você pode contribuir por Pix. Qualquer valor ajuda.</p>
      <img className="pix-qr" src="/pix-qrcode.png" alt="QR Code Pix para apoiar o desenvolvimento do jogo" />
      <div className="pix-label">CHAVE PIX · CNPJ</div>
      <div className="pix-key">67.152.258/0001-84</div>
      <button className="primary copy-key" onClick={copyKey}>{copied ? 'Chave copiada!' : 'Copiar chave Pix'} <span>{copied ? '✓' : '▢'}</span></button>
      <small className="pix-help">No app do banco, escaneie o QR Code ou cole a chave acima.</small>
    </section>
  </div>;
}
