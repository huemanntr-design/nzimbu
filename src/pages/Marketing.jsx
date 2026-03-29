import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart2 } from 'lucide-react';

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'from-pink-500/20 to-orange-500/20 border-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: '📘', color: 'from-blue-500/20 to-blue-700/20 border-blue-500' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-gray-500/20 to-gray-700/20 border-gray-400' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'from-blue-600/20 to-blue-800/20 border-blue-600' },
];

const templates = [
  { name: 'Promotion', desc: 'Créer un post promo pour produit', icon: '🔥' },
  { name: 'Nouveau Stock', desc: 'Annonce de réapprovisionnement', icon: '📦' },
  { name: 'Témoignage', desc: 'Partager retour client VIP', icon: '⭐' },
  { name: 'Offre Spéciale', desc: 'Offre limitée dans le temps', icon: '🎉' },
  { name: 'Résultats', desc: 'Résultats mensuels business', icon: '📊' },
  { name: 'Tutoriel', desc: 'Comment utiliser un produit', icon: '🎓' },
];

const TABS = ['AI Content', 'Calendrier & Timeline', 'Posts', 'Campagnes', 'Meta Analytics'];

const MONTH_DAYS = (() => {
  const d = new Date(2025, 2, 1); // March 2025
  const startDay = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
  const daysInMonth = new Date(2025, 3, 0).getDate();
  return { startDay, daysInMonth };
})();

const samplePosts = [
  { day: 3, title: 'Promo Eau Miné ✨', platform: 'instagram', isAI: true },
  { day: 5, title: 'Promotion Eau', platform: 'facebook', isAI: false },
  { day: 5, title: 'Stock Riz Arri ✨', platform: 'facebook', isAI: true },
  { day: 7, title: 'Démo Savon M... ✨', platform: 'tiktok', isAI: true },
  { day: 10, title: '⚠ Stock Bas: ✨', platform: 'instagram', isAI: true },
  { day: 14, title: 'Promo Weekend ✨', platform: 'facebook', isAI: true },
];

const platformColors = {
  instagram: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  tiktok: 'bg-gray-500/20 text-gray-300 border border-gray-400/30',
  linkedin: 'bg-blue-700/20 text-blue-200 border border-blue-600/30',
};

export default function Marketing() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('AI Content');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [postForm, setPostForm] = useState({ title: '', content: '', platform: 'instagram', scheduled_date: '' });
  const [generating, setGenerating] = useState(false);
  const [calView, setCalView] = useState('Calendrier');

  const { data: posts = [] } = useQuery({ queryKey: ['posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date', 50) });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingPost.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts'] }); setPostForm({ title: '', content: '', platform: selectedPlatform, scheduled_date: '' }); },
  });

  const publishedCount = posts.filter(p => p.status === 'published').length;
  const aiCount = posts.filter(p => p.template).length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  const generateContent = async (template) => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert marketing pour une PME en RDC Kinshasa. Génère un post ${selectedPlatform} de type "${template}". Post engageant en français, avec emojis. Maximum 200 caractères.`,
      response_json_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } } }
    });
    setPostForm(f => ({ ...f, title: result.title || template, content: result.content || '' }));
    setGenerating(false);
    setTab('AI Content');
  };

  // Build calendar grid
  const { startDay, daysInMonth } = MONTH_DAYS;
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

  return (
    <div className="space-y-4">
      {/* Engagement Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Engagement Marketing</p>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-bold">45 likes</h2>
            <p className="text-sm text-muted-foreground mt-1">{posts.length} posts · {aiCount} propositions IA</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">↗ +45%</span>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <BarChart2 size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '📝', value: posts.length, label: 'Posts', color: 'text-foreground' },
          { icon: '✅', value: publishedCount, label: 'Publiés', color: 'text-green-400' },
          { icon: '✨', value: aiCount, label: 'IA', color: 'text-yellow-400' },
          { icon: '🔄', value: 12, label: 'Partages', color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl mb-2">{k.icon}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-card border border-border rounded-xl p-3 text-xs text-muted-foreground">
        📣 Le Marketing, c'est comment vous faites connaître vos produits. Ici, l'IA vous aide à créer des publications pour Facebook, Instagram et TikTok. Vous pouvez programmer à l'avance et l'IA propose les meilleurs moments pour publier.
      </div>

      {/* Marketing Hub header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">⊙ Marketing Hub</h2>
        <Button className="bg-primary hover:bg-primary/90 border-0 h-9 text-sm">
          <BarChart2 size={14} /> Analytics
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-none text-xs px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'AI Content' ? '🤖 ' : t === 'Calendrier & Timeline' ? '📅 ' : t === 'Posts' ? '📋 ' : t === 'Campagnes' ? '🚀 ' : '📊 '}{t}
          </button>
        ))}
      </div>

      {/* AI CONTENT TAB */}
      {tab === 'AI Content' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left panel */}
          <div className="space-y-4">
            {/* Templates */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h4 className="font-semibold text-sm mb-3">🤖 Templates IA</h4>
              <div className="space-y-2">
                {templates.map(t => (
                  <button key={t.name} onClick={() => generateContent(t.name)}
                    className="w-full text-left bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            {/* Platforms */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h4 className="font-semibold text-sm mb-3">📱 Plateformes</h4>
              <div className="space-y-2">
                {platforms.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </div>
                    <span className="text-[10px] text-green-400 font-medium">● Connecté</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold mb-4">✍️ Compositeur</h4>

            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Plateforme</p>
              <div className="grid grid-cols-4 gap-2">
                {platforms.map(p => (
                  <button key={p.id} onClick={() => { setSelectedPlatform(p.id); setPostForm(f => ({ ...f, platform: p.id })); }}
                    className={`p-3 rounded-xl text-center transition-all bg-gradient-to-b border-2 ${selectedPlatform === p.id ? p.color : 'from-transparent to-transparent border-transparent bg-muted/40'}`}>
                    <p className="text-xl mb-1">{p.icon}</p>
                    <p className="text-xs font-medium">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Titre</p>
                <input value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Titre du post..."
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Contenu</p>
                <div className="relative">
                  <textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Rédigez votre post..."
                    rows={5}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                  <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{postForm.content.length}/2200✏</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Programmer pour</p>
                <input type="datetime-local" value={postForm.scheduled_date} onChange={e => setPostForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={() => createPostMutation.mutate({ ...postForm, status: 'draft', template: 'ai' })}
                  className="flex-1 bg-primary hover:bg-primary/90 border-0">
                  📝 Brouillon
                </Button>
                <Button onClick={() => createPostMutation.mutate({ ...postForm, status: postForm.scheduled_date ? 'scheduled' : 'published', template: 'ai' })}
                  className="bg-yellow-500 hover:bg-yellow-600 border-0 text-black font-semibold px-5">
                  🚀 Publier
                </Button>
                <button className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg shrink-0">●</button>
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

      {/* CALENDRIER TAB */}
      {tab === 'Calendrier & Timeline' && (
        <div className="space-y-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">‹</button>
              <h3 className="font-bold">Mars 2025</h3>
              <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">›</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-muted rounded-xl p-1">
                {['Calendrier', 'Timeline'].map(v => (
                  <button key={v} onClick={() => setCalView(v)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${calView === v ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                    {v === 'Calendrier' ? '📅 ' : '⏱ '}{v}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold">{scheduledCount}<br /><span className="text-[9px] text-muted-foreground">PROGRAMMÉS</span></span>
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg font-bold">5<br /><span className="text-[9px] text-muted-foreground">IA EN ATTENTE</span></span>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg font-bold">{publishedCount}<br /><span className="text-[9px] text-muted-foreground">PUBLIÉS</span></span>
              </div>
            </div>
          </div>

          {/* AI proposal banner */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
            <p className="text-xs">🤖 <strong>5 propositions IA</strong> — survolez les ✨ pour valider</p>
            <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 border-0 text-black font-semibold">✅ Tout valider</Button>
          </div>

          {/* Platform legend */}
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
            {platforms.map(p => <span key={p.id}>{p.icon} {p.label}</span>)}
            <span>✨ Proposition IA</span>
          </div>

          {/* Calendar grid */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className="px-3 py-2 text-[10px] text-muted-foreground uppercase text-center font-medium">{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
                {week.map((day, di) => {
                  const dayPosts = samplePosts.filter(p => p.day === day);
                  return (
                    <div key={di} className="min-h-[80px] p-2 border-r border-border last:border-0 relative">
                      {day && (
                        <>
                          <span className="text-xs text-muted-foreground font-medium">{day}</span>
                          {dayPosts.length > 0 && <span className="text-xs text-muted-foreground ml-1">✨</span>}
                          <div className="mt-1 space-y-1">
                            {dayPosts.map((p, idx) => (
                              <div key={idx} className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate ${platformColors[p.platform]}`}>
                                {p.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POSTS TAB */}
      {tab === 'Posts' && (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{platforms.find(pl => pl.id === p.platform)?.icon || '📝'}</span>
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
                </div>
              </div>
              <Badge className={p.status === 'published' ? 'bg-green-500/10 text-green-400' : p.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}>
                {p.status === 'published' ? 'Publié' : p.status === 'scheduled' ? 'Programmé' : 'Brouillon'}
              </Badge>
            </div>
          ))}
          {posts.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Aucun post créé</p>}
        </div>
      )}

      {/* CAMPAGNES TAB */}
      {tab === 'Campagnes' && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🚀</p>
          <h3 className="font-bold text-lg mb-2">Campagnes Marketing</h3>
          <p className="text-sm text-muted-foreground mb-4">Créez et gérez vos campagnes multi-plateformes</p>
          <Button className="bg-primary hover:bg-primary/90 border-0">+ Nouvelle Campagne</Button>
        </div>
      )}

      {/* META ANALYTICS TAB */}
      {tab === 'Meta Analytics' && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">📊</p>
          <h3 className="font-bold text-lg mb-2">Meta Analytics</h3>
          <p className="text-sm text-muted-foreground">Connectez vos comptes Meta pour voir les statistiques</p>
        </div>
      )}
    </div>
  );
}