import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle } from 'lucide-react';

export default function Messagerie() {
  const qc = useQueryClient();
  const [activeClient, setActiveClient] = useState(null);
  const [input, setInput] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['waMessages'],
    queryFn: () => base44.entities.WaMessage.list('-timestamp', 200),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.WaMessage.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waMessages'] }); setInput(''); },
  });

  // Group by client
  const threads = messages.reduce((acc, m) => {
    const key = m.client_name || 'Inconnu';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const clientList = Object.keys(threads);
  const activeMessages = activeClient ? (threads[activeClient] || []).slice().reverse() : [];

  const handleSend = () => {
    if (!input.trim() || !activeClient) return;
    const clientMsg = messages.find(m => m.client_name === activeClient);
    sendMutation.mutate({
      direction: 'outbound',
      client_name: activeClient,
      client_phone: clientMsg?.client_phone || '',
      body: input.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    });
  };

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="WhatsApp & communications" />

      {isLoading ? <LoadingSkeleton rows={4} /> : clientList.length === 0 ? (
        <EmptyState icon="💬" title="Aucun message" description="Les messages WhatsApp apparaîtront ici." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Thread list */}
          <div className="space-y-2">
            {clientList.map(name => {
              const last = threads[name][0];
              return (
                <button key={name} onClick={() => setActiveClient(name)}
                  className={`w-full text-left bg-card border rounded-xl p-3 transition-colors ${activeClient === name ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{last?.body}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 bg-card border border-border rounded-xl flex flex-col h-[500px]">
            {!activeClient ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-border">
                  <p className="font-semibold text-sm">{activeClient}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {activeMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs ${m.direction === 'outbound' ? 'bg-green-600 text-white' : 'bg-secondary text-foreground'}`}>
                        <p>{m.body}</p>
                        {m.is_payment_code && <p className="text-[10px] opacity-70 mt-1">💳 Code: {m.reference_code}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Écrire un message…"
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none" />
                  <Button size="icon" className="bg-green-600 hover:bg-green-700 border-0 h-9 w-9" onClick={handleSend}>
                    <Send size={14} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}