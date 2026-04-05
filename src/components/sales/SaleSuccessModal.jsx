import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatUSD, formatCDF } from '@/utils/currency';

export default function SaleSuccessModal({ items, total, paymentMethod, clientPhone, businessName, rate, onClose }) {
  const PAY_LABELS = {
    cash: '💵 Cash', mpesa: '💚 M-Pesa', airtel: '❤️ Airtel Money',
    orange: '🟠 Orange Money', mobile_money: '📱 Mobile Money', credit: '💳 Crédit', bank: '🏦 Banque',
  };

  const totalCents = Math.round((total || 0) * 100);

  const buildReceipt = () => {
    const lines = (items || []).map(i =>
      `• ${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`
    ).join('\n');
    return encodeURIComponent(
      `🧾 *Reçu Nzimbu*\n━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━\n*Total: ${formatUSD(totalCents)} / ${formatCDF(totalCents, rate)}*\nPaiement: ${PAY_LABELS[paymentMethod] || paymentMethod}\nDate: ${new Date().toLocaleDateString('fr-FR')}\n━━━━━━━━━━━━━━\nMerci! 🙏 ${businessName || 'Nzimbu'}`
    );
  };

  const sendWA = () => {
    const num = (clientPhone || '').replace(/\s+/g, '');
    if (num.length > 8) {
      window.open(`https://wa.me/${num}?text=${buildReceipt()}`, '_blank');
    } else {
      // No phone — open plain WA
      window.open(`https://wa.me/?text=${buildReceipt()}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 px-4 pb-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-5 text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <p className="font-bold text-xl text-green-400">Vente enregistrée! ✅</p>
          <p className="text-sm text-muted-foreground mt-1">Likambo ezali malamu!</p>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-1">
          {(items || []).map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.name} ×{item.qty}</span>
              <span className="font-mono font-medium">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="font-mono text-green-400">{formatUSD(totalCents)}</span>
          </div>
          <p className="text-xs text-muted-foreground text-right">{formatCDF(totalCents, rate)}</p>
        </div>

        {/* Actions */}
        <Button className="w-full bg-[#25D366] hover:bg-[#20b558] border-0 h-12 text-white font-bold text-base" onClick={sendWA}>
          📱 Envoyer reçu WhatsApp
        </Button>
        <Button variant="outline" className="w-full h-12" onClick={onClose}>
          🧾 Nouvelle vente
        </Button>
      </div>
    </div>
  );
}