import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import KpiCard from '../components/dashboard/KpiCard';

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
];

const templates = [
  { name: 'Promotion', desc: 'Créer un post promo pour produit', icon: '🔥' },
  { name: 'Nouveau Stock', desc: 'Annonce de réapprovisionnement', icon: '📦' },
  { name: 'Témoignage', desc: 'Partager retour client VIP', icon: '⭐' },
  { name: 'Offre Spéciale', desc: 'Offre limitée dans le temps', icon: '🎯' },
  { name: 'Résultats', desc: 'Résultats mensuels business', icon: '📊' },
  { name: 'Tutoriel', desc: 'Comment utiliser un produit', icon: '🎓' },
];

export default function Marketing() {
  const [tab, setTab] = useState('content');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [postForm, setPostForm] = useState({ title: '', content: '', platform: 'instagram' });
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({ queryKey: ['posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date', 50) });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingPost.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts'] }); setPostForm({ title: '', content: '', platform: selectedPlatform }); },
  });

  const publishedCount = posts.filter(p => p.status === 'published').length;

  const generateContent = async (template) => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert marketing pour une petite entreprise en RDC. Génère un post ${selectedPlatform} utilisant le template "${template}". Le post doit être engageant, en français, avec des emojis. Maximum 200 caractères.`,
      response_json_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } } }
    });
    setPostForm({ title: result.title || template, content: result.content || '', platform: selectedPlatform });
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Engagement Marketing</p>
        <h2 className="text-3xl font-bold">{posts.length} posts</h2>
        <p className="text-sm text-muted-foreground mt-1">{publishedCount} publiés</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="📝" value={posts.length} label="Posts" />
        <KpiCard icon="✅" value={publishedCount} label="Publiés" />
        <KpiCard icon="✨" value={posts.filter(p => p.template).length} label="IA" />
        <KpiCard icon="📤" value={posts.filter(p => p.status === 'scheduled').length} label="Programmés" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Marketing Hub</h2>
        <Button variant="outline">📊 Analytics</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="content">✨ AI Content</TabsTrigger>
          <TabsTrigger value="posts">📋 Posts</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Templates */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold mb-3">🤖 Templates IA</h4>
            <div className="space-y-2">
              {templates.map(t => (
                <button key={t.name} onClick={() => generateContent(t.name)} className="w-full text-left bg-secondary hover:bg-secondary/80 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold mb-4">✍️ Compositeur</h4>
            
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase mb-2">Plateforme</p>
              <div className="grid grid-cols-4 gap-2">
                {platforms.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPlatform(p.id); setPostForm({ ...postForm, platform: p.id }); }}
                    className={`p-3 rounded-lg text-center transition-all ${selectedPlatform === p.id ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary border-2 border-transparent'}`}>
                    <p className="text-lg">{p.icon}</p>
                    <p className="text-xs mt-1">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Titre</p>
                <Input value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} placeholder="Titre du post..." className="bg-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Contenu</p>
                <Textarea value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} placeholder="Rédigez votre post..." className="bg-secondary min-h-[120px]" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createPostMutation.mutate({ ...postForm, status: 'draft', template: 'ai' })} variant="outline" className="flex-1">📝 Brouillon</Button>
                <Button onClick={() => createPostMutation.mutate({ ...postForm, status: 'published', template: 'ai' })} className="bg-green-500 hover:bg-green-600">🚀 Publier</Button>
              </div>
            </div>

            {generating && (
              <div className="mt-4 text-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">L'IA génère votre contenu...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{platforms.find(pl => pl.id === p.platform)?.icon || '📝'}</span>
                <div>
                  <h4 className="font-medium text-sm">{p.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
                </div>
              </div>
              <Badge className={p.status === 'published' ? 'bg-green-500/10 text-green-400' : p.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}>
                {p.status === 'published' ? 'Publié' : p.status === 'scheduled' ? 'Programmé' : 'Brouillon'}
              </Badge>
            </div>
          ))}
          {posts.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun post créé</p>}
        </div>
      )}
    </div>
  );
}