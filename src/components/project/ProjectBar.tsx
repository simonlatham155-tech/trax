import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Save,
  FolderOpen,
  FilePlus,
  Download,
  Upload,
  Trash2,
  X,
  Check,
  Loader2,
  FileMusic,
  Clock,
  AudioLines,
} from 'lucide-react';
import { useProjectStore } from '@/store/project-store';
import { cn } from '@/utils/cn';

// ─── Project name editor ─────────────────────────────────────────────────────

function ProjectNameEditor() {
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);
  const setProjectName = useProjectStore((s) => s.setProjectName);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(projectName);
  }, [projectName, editing]);

  const commit = useCallback(() => {
    const name = value.trim() || 'Untitled Project';
    setProjectName(name);
    setValue(name);
    setEditing(false);
  }, [value, setProjectName]);

  return (
    <div className="flex items-center gap-1 min-w-0">
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          className="bg-[#1a1a24] border border-[#6c63ff] rounded px-2 py-0.5 text-sm text-[#e8e8f0] outline-none w-44 font-medium"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setValue(projectName);
              setEditing(false);
            }
            e.stopPropagation();
          }}
          maxLength={80}
        />
      ) : (
        <button
          className="flex items-center gap-1.5 text-sm font-medium text-[#e8e8f0] hover:text-white truncate max-w-[180px]"
          onDoubleClick={() => setEditing(true)}
          title="Double-click to rename"
        >
          <FileMusic size={13} className="text-[#6c63ff] shrink-0" />
          <span className="truncate">{projectName}</span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" title="Unsaved changes" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Projects list modal ─────────────────────────────────────────────────────

interface ProjectsModalProps {
  onClose: () => void;
}

function ProjectsModal({ onClose }: ProjectsModalProps) {
  const savedProjects = useProjectStore((s) => s.savedProjects);
  const currentId = useProjectStore((s) => s.projectId);
  const load = useProjectStore((s) => s.load);
  const deleteProj = useProjectStore((s) => s.deleteProject);
  const refreshProjectList = useProjectStore((s) => s.refreshProjectList);
  const isLoading = useProjectStore((s) => s.isLoading);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    refreshProjectList();
  }, [refreshProjectList]);

  const handleLoad = useCallback(
    async (id: string) => {
      await load(id);
      onClose();
    },
    [load, onClose]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteProj(id);
      setConfirmDelete(null);
    },
    [deleteProj]
  );

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-[#111118] border border-[#2a2a38] rounded-lg shadow-2xl w-[480px] max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a38]">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#6c63ff]" />
            <span className="font-semibold text-[#e8e8f0]">Open Project</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#55557a] hover:text-[#e8e8f0] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[#55557a]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : savedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FileMusic size={28} className="text-[#2a2a38]" />
              <span className="text-sm text-[#55557a]">No saved projects yet</span>
              <span className="text-[11px] text-[#3a3a50]">
                Save a project to see it here
              </span>
            </div>
          ) : (
            <ul className="py-1">
              {savedProjects.map((proj) => (
                <li
                  key={proj.id}
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 hover:bg-[#1a1a24] transition-colors group cursor-pointer',
                    proj.id === currentId && 'bg-[#1a1a24]'
                  )}
                  onClick={() => handleLoad(proj.id)}
                >
                  <FileMusic
                    size={14}
                    className={cn(
                      'shrink-0',
                      proj.id === currentId ? 'text-[#6c63ff]' : 'text-[#55557a]'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#e8e8f0] truncate">
                        {proj.name}
                      </span>
                      {proj.id === currentId && (
                        <span className="text-[9px] bg-[#6c63ff33] text-[#6c63ff] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} className="text-[#3a3a50]" />
                      <span className="text-[10px] text-[#55557a]">
                        {formatDate(proj.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {confirmDelete === proj.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#ef444422] text-[#ef4444] hover:bg-[#ef444444] transition-colors"
                          title="Confirm delete"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] transition-colors"
                          title="Cancel"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(proj.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded text-[#55557a] hover:text-[#ef4444] transition-colors"
                        title="Delete project"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Save-as dialog ──────────────────────────────────────────────────────────

interface SaveAsDialogProps {
  onClose: () => void;
}

function SaveAsDialog({ onClose }: SaveAsDialogProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const saveAs = useProjectStore((s) => s.saveAs);
  const [name, setName] = useState(projectName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await saveAs(name.trim());
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111118] border border-[#2a2a38] rounded-lg shadow-2xl w-80 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#e8e8f0]">Save Project As</span>
          <button onClick={onClose} className="text-[#55557a] hover:text-[#e8e8f0]">
            <X size={14} />
          </button>
        </div>
        <input
          autoFocus
          className="bg-[#1a1a24] border border-[#2a2a38] focus:border-[#6c63ff] rounded px-3 py-2 text-sm text-[#e8e8f0] outline-none w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onClose();
            e.stopPropagation();
          }}
          placeholder="Project name"
          maxLength={80}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-sm text-[#8888aa] hover:text-[#e8e8f0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-1.5 rounded bg-[#6c63ff] text-white text-sm font-medium hover:bg-[#7a72ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProjectBar ──────────────────────────────────────────────────────────

export function ProjectBar() {
  const isDirty = useProjectStore((s) => s.isDirty);
  const isSaving = useProjectStore((s) => s.isSaving);
  const isLoading = useProjectStore((s) => s.isLoading);
  const projectId = useProjectStore((s) => s.projectId);
  const savedProjects = useProjectStore((s) => s.savedProjects);
  const error = useProjectStore((s) => s.error);

  const save = useProjectStore((s) => s.save);
  const newProject = useProjectStore((s) => s.newProject);
  const refreshProjectList = useProjectStore((s) => s.refreshProjectList);
  const exportTraxFile = useProjectStore((s) => s.exportTraxFile);
  const exportMixToWav = useProjectStore((s) => s.exportMixToWav);
  const importTraxFile = useProjectStore((s) => s.importTraxFile);

  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const isNewProject = !savedProjects.some((p) => p.id === projectId);

  // Load project list on mount
  useEffect(() => {
    refreshProjectList();
  }, [refreshProjectList]);

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const { savedProjects, projectId } = useProjectStore.getState();
        const exists = savedProjects.some((p) => p.id === projectId);
        if (exists) {
          save();
        } else {
          setShowSaveAs(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const handleSaveClick = () => {
    const { savedProjects: list, projectId: pid } = useProjectStore.getState();
    const exists = list.some((p) => p.id === pid);
    if (exists) {
      save();
    } else {
      setShowSaveAs(true);
    }
  };

  const handleNewProject = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Start a new project anyway?')) return;
    }
    newProject();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      await importTraxFile(file);
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Project name */}
        <ProjectNameEditor />

        <div className="w-px h-5 bg-[#2a2a38]" />

        {/* Save */}
        <button
          onClick={handleSaveClick}
          disabled={isSaving || isLoading}
          title="Save project (Ctrl+S)"
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors',
            isDirty
              ? 'text-[#f59e0b] hover:bg-[#f59e0b22]'
              : 'text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e]'
          )}
        >
          {isSaving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
        </button>

        {/* Open */}
        <button
          onClick={() => setShowProjectsModal(true)}
          title="Open project"
          className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
        >
          <FolderOpen size={13} />
        </button>

        {/* New */}
        <button
          onClick={handleNewProject}
          title="New project"
          className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
        >
          <FilePlus size={13} />
        </button>

        {/* Export mix WAV */}
        <button
          onClick={() => exportMixToWav()}
          disabled={isLoading}
          title="Export mix to WAV"
          className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors disabled:opacity-50"
        >
          <AudioLines size={13} />
        </button>

        {/* Export .trax file */}
        <button
          onClick={exportTraxFile}
          title="Export .trax project file"
          className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
        >
          <Download size={13} />
        </button>

        {/* Import .trax file */}
        <button
          onClick={() => importRef.current?.click()}
          title="Import .trax project file"
          className="w-7 h-7 flex items-center justify-center rounded text-[#55557a] hover:text-[#e8e8f0] hover:bg-[#22222e] transition-colors"
        >
          <Upload size={13} />
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".trax,application/json"
          className="hidden"
          onChange={handleImport}
        />

        {/* Error indicator */}
        {error && (
          <span
            className="text-[10px] text-[#ef4444] max-w-32 truncate"
            title={error}
          >
            {error}
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <Loader2 size={12} className="animate-spin text-[#6c63ff]" />
        )}
      </div>

      {/* Modals */}
      {showProjectsModal && (
        <ProjectsModal onClose={() => setShowProjectsModal(false)} />
      )}
      {showSaveAs && (
        <SaveAsDialog onClose={() => setShowSaveAs(false)} />
      )}
    </>
  );
}
