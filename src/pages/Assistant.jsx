import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Plus, Trash2 } from 'lucide-react';
import MessageBubble from '../components/chat/MessageBubble';

export default function Assistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.agents.listConversations({ agent_name: 'nzimbu_assistant' }).then(setConversations);
  }, []);

  useEffect(() => {
    if (activeConv) {
      base44.agents.getConversation(activeConv.id).then(conv => setMessages(conv.messages || []));
      const unsubscribe = base44.agents.subscribeToConversation(activeConv.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'nzimbu_assistant',
      metadata: { name: `Conversation ${conversations.length + 1}` }
    });
    setConversations([conv, ...conversations]);
    setActiveConv(conv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return;
    setSending(true);
    const msg = input;
    setInput('');
    await base44.agents.addMessage(activeConv, { role: 'user', content: msg });
    setSending(false);
  };

  const whatsappUrl = base44.agents.getWhatsAppConnectURL('nzimbu_assistant');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">🤖 Assistant IA Nzimbu</h2>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <MessageCircle className="w-4 h-4" /> Connecter WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations list */}
        <div className="bg-card border border-border rounded-xl p-4 overflow-y-auto">
          <Button onClick={createConversation} className="w-full mb-4 bg-primary"><Plus className="w-4 h-4 mr-2" /> Nouvelle conversation</Button>
          <div className="space-y-2">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${activeConv?.id === conv.id ? 'bg-primary/10 text-primary' : 'bg-secondary hover:bg-secondary/80'}`}>
                <p className="font-medium truncate">{conv.metadata?.name || 'Conversation'}</p>
                <p className="text-xs text-muted-foreground">{new Date(conv.created_date).toLocaleDateString('fr-FR')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl flex flex-col">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-sm">{activeConv.metadata?.name || 'Conversation'}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Tapez votre message..."
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} className="bg-secondary" />
                <Button onClick={sendMessage} disabled={sending || !input.trim()} className="bg-primary">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-4">🤖</p>
                <h3 className="text-lg font-semibold mb-2">Bienvenue sur l'Assistant Nzimbu</h3>
                <p className="text-sm text-muted-foreground mb-4">Créez une conversation ou connectez WhatsApp</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={createConversation}><Plus className="w-4 h-4 mr-2" /> Nouvelle conversation</Button>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-500 hover:bg-green-600"><MessageCircle className="w-4 h-4 mr-2" /> WhatsApp</Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}