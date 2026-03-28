import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/fmt';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Messagerie() {
  const qc = useQueryClient();
  const [selectedClient, setSelectedClient] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [refCode, setRefCode] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['waMessages'],
    queryFn: () => base44.entities.WaMessage.list('-created_date', 200),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.WaMessage.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waMessages'] }); setNewMsg(''); },
  });

  const matchPayment = useMutation({
    mutationFn: async ({ invoiceId, refCode }) => {
      await base44.entities.Invoice.update(invoiceId, { status: 'paid' });
      await base44.entities.WaMessage.create({
        direction: 'outbound',
        client_id: invoices.find(i => i.id === invoiceId)?.client_id,
        client_name: invoices.find(i => i.id === invoiceId)?.client_name,
        body: `✅ Paiement reçu. Référence: ${refCode}. Merci!`,
        status: 'sent',
        reference_code: refCode,
        linked_invoice_id: invoiceId,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waMessages'] }); qc.invalidateQueries({ queryKey: ['invoices'] }); setRefCode(''); },
  });

  // Group messages by client
  const threads = messages.reduce((acc, m) => {
    const key = m.client_id || m.client_phone || 'unknown';
    if (!acc[key]) acc[key] = { client_name: m.client_name || m.client_phone || 'Inconnu', messages: [], unread: 0 };
    acc[key].messages.push(m);
    if (m.direction === 'inbound' && m.status !== 'read') acc[key].unread++;
    return acc;
  }, {});

  const threadList = Object.entries(threads).map(([key, val]) => ({ key, ...val }));
  const currentThread = selectedClient ? threads[selectedClient] : null;
  const openInvoices = invoices.filter(i => ['sent', 'viewed', 'partial'].includes(i.status));

  const quickReplies = [
    { label: 'Marquer payé', action: () => {} },
    { label: 'Envoyer rappel', action: () => setNewMsg(`Bonjour, un rappel concernant votre facture en attente. Merci de régulariser dès que possible.`) },
    { label: 'Prolonger crédit', action: () => setNewMsg(`Bonjour, nous vous accordons un délai supplémentaire pour le règlement de votre solde.`) },
  ];

  return (
    <div>
      {!selectedClient ? (
        <>
          <PageHeader title="Messagerie WA" subtitle={`${threadList.length} conversation${threadList.length !== 1 ? 's' : ''}`} />

          {/* Payment matcher */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-foreground mb-2">🔍 Matcher un paiement MoMo</p>
            <div className="flex gap-2">
              <input
                placeholder="Code référence (ex: QH12345)"
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {refCode && openInvoices.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Factures ouvertes:</p>
                {openInvoices.slice(0, 3).map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => matchPayment.mutate({ invoiceId: inv.id, refCode })}
                    className="w-full text-left bg-muted rounded-lg px-3 py-2 text-xs text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {inv.invoice_number} — {inv.client_name} — ${inv.subtotal_usd?.toFixed(2)}
                    <span className="text-green-400 ml-2">✓ Marquer payé</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? <LoadingSkeleton rows={4} /> : threadList.length === 0 ? (
            <EmptyState icon="💬" title="Aucun message" description="Vos conversations WhatsApp apparaîtront ici." />
          ) : (
            <div className="space-y-2">
              {threadList.map(({ key, client_name, messages: msgs, unread }) => {
                const last = msgs[0];
                return (
                  <motion.div
                    key={key}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedClient(key)}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                      <MessageCircle size={18} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{last?.body}</p>
                    </div>
                    <div className="text-right">
                      {unread > 0 && (
                        <span className="bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ml-auto mb-1">{unread}</span>
                      )}
                      <p className="text-[10px] text-muted-foreground">{fmtDate(last?.timestamp || last?.created_date)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Thread View */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSelectedClient(null)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
              <X size={16} />
            </button>
            <h2 className="font-playfair font-semibold flex-1">{currentThread?.client_name}</h2>
          </div>

          {/* Messages */}
          <div className="space-y-2 mb-4">
            {(currentThread?.messages || []).slice().reverse().map(m => (
              <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${m.direction === 'outbound' ? 'bg-green-700/30 text-green-50' : 'bg-card border border-border text-foreground'}`}>
                  <p className="text-sm">{m.body}</p>
                  {m.reference_code && <p className="text-[10px] text-amber-400 mt-1">Réf: {m.reference_code}</p>}
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <p className="text-[10px] text-muted-foreground">{fmtDate(m.timestamp || m.created_date)}</p>
                    {m.direction === 'outbound' && <CheckCheck size={10} className={m.status === 'read' ? 'text-blue-400' : 'text-muted-foreground'} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {quickReplies.map(r => (
              <button key={r.label} onClick={r.action}
                className="shrink-0 text-xs px-3 py-1.5 bg-card border border-border rounded-full text-muted-foreground hover:text-foreground">
                {r.label}
              </button>
            ))}
          </div>

          {/* Compose */}
          <div className="flex gap-2">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={e => {
                if (e.key === 'Enter' && newMsg.trim()) {
                  sendMutation.mutate({ direction: 'outbound', client_id: selectedClient, body: newMsg, status: 'sent', timestamp: new Date().toISOString() });
                }
              }}
            />
            <Button
              size="icon"
              className="gradient-primary border-0 w-10 h-10 shrink-0"
              onClick={() => newMsg.trim() && sendMutation.mutate({ direction: 'outbound', client_id: selectedClient, body: newMsg, status: 'sent', timestamp: new Date().toISOString() })}
              disabled={!newMsg.trim() || sendMutation.isPending}
            >
              <Send size={15} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}