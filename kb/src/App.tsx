import { useEffect } from 'react';
import { useKBStore } from '@/store/kb-store';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ArticleList } from '@/components/articles/ArticleList';
import { ArticleView } from '@/components/articles/ArticleView';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { TimelineView } from '@/components/timeline/TimelineView';

function LoadingScreen() {
  return (
    <div className="h-full flex items-center justify-center bg-[#0c0c14]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-600 animate-pulse" />
        <p className="text-sm text-[#3a3a5c]">Loading knowledge base…</p>
      </div>
    </div>
  );
}

function MainContent() {
  const view = useKBStore((s) => s.view);

  switch (view) {
    case 'article':
      return <ArticleView />;
    case 'editor':
      return <ArticleEditor />;
    case 'timeline':
      return <TimelineView />;
    default:
      return <ArticleList />;
  }
}

export default function App() {
  const init = useKBStore((s) => s.init);
  const isLoading = useKBStore((s) => s.isLoading);

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="h-full flex flex-col bg-[#0c0c14]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <MainContent />
        </main>
      </div>
    </div>
  );
}
