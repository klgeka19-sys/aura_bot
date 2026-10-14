import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  FolderTree,
  GitBranch,
  Send,
  Sparkles,
  ExternalLink,
  Terminal,
  RefreshCw,
  Search,
  Layers,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface ProjectFile {
  path: string;
  name: string;
  category: string;
  content: string;
  lines: number;
  size: number;
}

interface SourceCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeExportModal: React.FC<SourceCodeExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'bundle' | 'github'>('files');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fullBundle, setFullBundle] = useState<string>('');
  const [totalLines, setTotalLines] = useState<number>(0);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/App.tsx');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedBash, setCopiedBash] = useState<boolean>(false);

  // GitHub push form states
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [token, setToken] = useState<string>('');
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<{ success?: boolean; message?: string; output?: string; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/project-files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setFullBundle(data.fullBundle || '');
        setTotalLines(data.totalLines || 0);
        if (data.files && data.files.length > 0 && !selectedFilePath) {
          setSelectedFilePath(data.files[0].path);
        }
      }
    } catch (err) {
      console.warn('Failed to load project files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const filteredFiles = files.filter(
    (f) =>
      f.path.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyCurrentFile = async () => {
    if (!currentFile) return;
    const ok = await copyToClipboard(currentFile.content);
    if (ok) {
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2500);
    }
  };

  const handleCopyAllCode = async () => {
    if (!fullBundle) return;
    const ok = await copyToClipboard(fullBundle);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleDownloadCurrentFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    if (!fullBundle) return;
    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-full-source-code-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGitPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/git-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          branch: branch.trim() || 'main',
          token: token.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult({
          success: true,
          message: data.message || 'Успешно отправлено на GitHub!',
          output: data.output,
        });
      } else {
        setPushResult({
          success: false,
          error: data.error || 'Ошибка при отправке в Git репозиторий',
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err?.message || 'Сетевая ошибка при выполнении git push',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const bashCommands = `# 1. Добавить удаленный репозиторий:
git remote add origin ${repoUrl.trim() || 'https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git'}

# 2. Переименовать ветку в main:
git branch -M ${branch.trim() || 'main'}

# 3. Отправить все файлы приложения на GitHub:
git push -u origin ${branch.trim() || 'main'} --force`;

  const handleCopyBash = async () => {
    const ok = await copyToClipboard(bashCommands);
    if (ok) {
      setCopiedBash(true);
      setTimeout(() => setCopiedBash(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Экспорт исходного кода</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-rose-300 font-normal border border-slate-700">
                    {files.length} файлов • {totalLines.toLocaleString()} строк
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Скопируйте файлы приложения или отправьте их напрямую в свой репозиторий GitHub
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'files'
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-rose-400" />
                <span>По файлам ({files.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('bundle')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'bundle'
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Весь код одним текстом</span>
              </button>

              <button
                onClick={() => setActiveTab('github')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'github'
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-rose-400" />
                <span>Синхронизация с GitHub</span>
              </button>
            </div>

            {/* Quick Export All Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAllCode}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold border border-rose-400/40 shadow-lg shadow-rose-950/50 hover:shadow-rose-900/60 transition-all active:scale-95"
                title="Скопировать все файлы проекта одним кликом в буфер обмена"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-emerald-100 font-bold">Весь код скопирован!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Скопировать весь код проекта</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAllBundle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-all shadow-sm"
                title="Скачать все файлы проекта в виде текстового архива"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Скачать (.txt)</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Project Files Browser */}
          {activeTab === 'files' && (
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: File Tree Explorer */}
              <div className="w-full md:w-72 lg:w-80 border-r border-slate-800 bg-slate-950/40 flex flex-col shrink-0">
                {/* Search */}
                <div className="p-2.5 border-b border-slate-800/80">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск файла..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {isLoading ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                      <span>Загрузка файлов проекта...</span>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Файлы не найдены
                    </div>
                  ) : (
                    filteredFiles.map((f) => {
                      const isSelected = currentFile?.path === f.path;
                      return (
                        <button
                          key={f.path}
                          onClick={() => setSelectedFilePath(f.path)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-all ${
                            isSelected
                              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            <FileCode
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-rose-400' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{f.path}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-sans shrink-0">
                            {f.lines} л.
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Code Viewer */}
              <div className="flex-1 min-h-0 flex flex-col bg-slate-900/60 overflow-hidden">
                {currentFile ? (
                  <>
                    {/* File Bar */}
                    <div className="flex items-center justify-between gap-3 p-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-mono text-xs sm:text-sm font-semibold text-white truncate">
                          {currentFile.path}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline">
                          {currentFile.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">
                          • {currentFile.lines} строк • {(currentFile.size / 1024).toFixed(1)} КБ
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleCopyCurrentFile}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-all border border-slate-700 shadow-sm"
                        >
                          {copiedFile ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Скопировано!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-rose-400" />
                              <span>Копировать этот файл</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleDownloadCurrentFile}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Скачать файл"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Monospace Code Editor View */}
                    <div className="flex-1 overflow-auto p-4 bg-[#07090e] font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200 select-text scrollbar-thin">
                      <pre className="whitespace-pre">
                        <code>{currentFile.content}</code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 text-xs">
                    Выберите файл из списка слева для просмотра и копирования
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Full Project Unified Bundle View */}
          {activeTab === 'bundle' && (
            <div className="flex-1 min-h-0 flex flex-col bg-slate-900/60 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>Полный исходный код приложения</span>
                      <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-800 text-rose-300 border border-slate-700">
                        {files.length} файлов • {totalLines.toLocaleString()} строк
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 hidden sm:block">
                      Все файлы проекта объединены с аккуратными заголовками и готовы к копированию
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyAllCode}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-100 font-bold">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-white" />
                        <span>Скопировать весь код</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadAllBundle}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Скачать файл со всем кодом"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-[#07090e] font-mono text-xs leading-relaxed text-slate-200 select-text scrollbar-thin">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                    <span>Формирование полного исходного кода...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre">
                    <code>{fullBundle}</code>
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: GitHub Push Form & Manual Push Guide */}
          {activeTab === 'github' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Automated Git Push Form */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      Автоматическая отправка в ваш репозиторий GitHub
                    </h4>
                    <p className="text-xs text-slate-400">
                      Введите URL вашего репозитория, и сервер AI Studio отправит в него все файлы проекта через `git push`.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGitPush} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      URL GitHub репозитория <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/ваш-логин/ваш-репозиторий.git"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Ветка
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        GitHub Personal Access Token (PAT)
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (если требуется)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
                      />
                      <span className="text-[10px] text-slate-500">
                        Токен с разрешением `repo` для записи в GitHub.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="submit"
                      disabled={isPushing || !repoUrl.trim()}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                    >
                      {isPushing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Отправка файлов в репозиторий...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Выполнить git push origin {branch}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Push Status Feedback */}
                {pushResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      pushResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {pushResult.success ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {pushResult.success
                          ? pushResult.message
                          : `Ошибка отправки: ${pushResult.error}`}
                      </span>
                    </div>
                    {pushResult.output && (
                      <pre className="text-[11px] font-mono bg-black/40 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap text-slate-300">
                        {pushResult.output}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Terminal Guide */}
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      Или выполните команды вручную на вашем компьютере:
                    </h4>
                  </div>

                  <button
                    onClick={handleCopyBash}
                    className="flex items-center gap-1 text-xs text-rose-300 hover:text-white transition-colors"
                  >
                    {copiedBash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Команды скопированы!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать команды</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/60 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                  <pre className="whitespace-pre">{bashCommands}</pre>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>
                    💡 <strong>Подсказка:</strong> Если GitHub просит пароль при выполнении команды `git push`, используйте <strong>Personal Access Token</strong> вместо пароля от аккаунта (создается в GitHub: <em>Settings → Developer Settings → Personal access tokens → Tokens (classic)</em> с галочкой <code>repo</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-slate-400 text-[11px] sm:text-xs">
              Все файлы ({files.length} шт.) готовы к экспорту и копированию
            </span>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all text-xs"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
