import React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GripVertical,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import {
  AdminApiError,
  type AdminStatusFilter,
  type AdminSubmission,
  fetchAdminSubmissions,
  reorderAdminFeaturedEvents,
  reviewAdminSubmission,
  setAdminEventFeature,
  updateAdminEvent,
} from '../api/admin';
import SubmitEventModal from '../components/SubmitEventModal';
import type { EditableEventSubmission, EventSubmissionInput } from '../types';

const TOKEN_STORAGE_KEY = 'aixevents.adminToken';
const ACTOR_STORAGE_KEY = 'aixevents.adminActor';

const STATUS_TABS: Array<{ id: AdminStatusFilter; label: string }> = [
  { id: 'pending', label: '待处理' },
  { id: 'updates', label: '待更新' },
  { id: 'approved', label: '已发布' },
  { id: 'rejected', label: '已拒绝' },
  { id: 'featured', label: '推荐中' },
];

const panelClass = 'border-2 border-black bg-white/90 shadow-[6px_6px_0_rgba(5,5,5,0.88)]';
const softPanelClass = 'border-2 border-black/15 bg-white/75';
const fieldClass = 'rounded-md border-2 border-black bg-white px-3 text-sm font-bold text-black outline-none transition-colors placeholder:text-black/35 focus:border-accent';
const ghostButtonClass = 'inline-flex items-center justify-center gap-2 rounded-md border-2 border-black bg-white px-3 text-sm font-black text-accent shadow-[3px_3px_0_rgba(23,100,255,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-primary/15';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-md border-2 border-black bg-primary px-3 text-sm font-black text-black shadow-[4px_4px_0_rgba(5,5,5,0.9)] transition-transform hover:-translate-y-0.5 hover:bg-primary-light';

const UPDATE_DIFF_FIELDS = [
  { label: '标题', path: 'title' },
  { label: '摘要', path: 'summary' },
  { label: '开始时间', path: 'start_time' },
  { label: '结束时间', path: 'end_time' },
  { label: '形式', path: 'format' },
  { label: '活动类型', path: 'activity_type' },
  { label: '城市', path: 'location.city' },
  { label: '地址', path: 'location.address' },
  { label: '主办方', path: 'organizers' },
  { label: '报名链接', path: 'links.registration' },
  { label: '海报链接', path: 'links.poster' },
  { label: '自定义标签', path: 'custom_tags' },
  { label: '备注', path: 'notes' },
  { label: '联系人', path: 'submitter.name' },
  { label: '联系方式', path: 'submitter.contact' },
];

type Notice = {
  type: 'success' | 'error' | 'warning';
  message: string;
};

function readSessionValue(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeSessionValue(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session storage can be unavailable in strict privacy modes.
  }
}

function removeSessionValue(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return '未填写';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function isSubmissionActiveByEndTime(submission?: AdminSubmission | null): boolean {
  if (!submission?.end_time) return false;
  return new Date(submission.end_time).getTime() >= Date.now();
}

function getPayload(submission: AdminSubmission | null): Record<string, any> {
  if (!submission) return {};
  if (submission.update_status === 'pending' && submission.pending_update) return submission.pending_update;
  return submission as unknown as Record<string, any>;
}

function toEditableAdminSubmission(submission: AdminSubmission): EditableEventSubmission {
  const source = getPayload(submission);
  const submitter = source.submitter || submission.submitter || {};
  const links = source.links || submission.links || {};
  const organizers = Array.isArray(source.organizers) && source.organizers.length
    ? source.organizers
    : Array.isArray(submission.organizers) && submission.organizers.length
      ? submission.organizers
      : [source.organizer?.name || submission.organizer?.name].filter(Boolean);

  return {
    id: submission.id,
    title: source.title || submission.title || '',
    summary: source.summary || submission.summary || '',
    activityType: source.activity_type || submission.activity_type || 'meetup',
    customTags: Array.isArray(source.custom_tags) ? source.custom_tags : submission.custom_tags || [],
    startTime: source.start_time || submission.start_time || '',
    endTime: source.end_time || submission.end_time || '',
    format: source.format || submission.format || 'offline',
    city: source.location?.city || submission.location?.city || '',
    address: source.location?.address || submission.location?.address || '',
    organizers,
    registrationUrl: links.registration || '',
    posterUrl: links.poster || '',
    contactName: submitter.name || '',
    contactInfo: submitter.contact || '',
    notes: source.notes || submission.notes || '',
    reviewStatus: submission.review_status,
    reviewNote: submission.review_note,
    updateStatus: submission.update_status,
    updateNote: submission.update_note,
  };
}

function getOrganizerText(payload: Record<string, any>, fallback?: AdminSubmission): string {
  const organizers: string[] = Array.isArray(payload.organizers)
    ? payload.organizers
    : Array.isArray(fallback?.organizers)
      ? (fallback?.organizers || [])
      : [];
  if (organizers.length) return organizers.join(' / ');
  return payload.organizer?.name || fallback?.organizer?.name || '未填写';
}

function getLocationText(payload: Record<string, any>): string {
  const city = payload.location?.city;
  const address = payload.location?.address;
  return [city, address].filter(Boolean).join(' · ') || '未填写';
}

function getStatusText(submission: AdminSubmission): string {
  if (submission.update_status === 'pending') return '待更新确认';
  if (submission.review_status === 'pending') return '待审核';
  if (submission.review_status === 'approved') return '已发布';
  return '已拒绝';
}

function getStatusClass(submission: AdminSubmission): string {
  if (submission.update_status === 'pending') return 'border-black bg-primary text-black shadow-[2px_2px_0_rgba(5,5,5,0.8)]';
  if (submission.review_status === 'pending') return 'border-black bg-accent text-white shadow-[2px_2px_0_rgba(5,5,5,0.8)]';
  if (submission.review_status === 'approved') return 'border-black bg-[#dfffd4] text-black';
  return 'border-black bg-[#ffe4e6] text-black';
}

function getPathValue(source: Record<string, any>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function normalizeComparable(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => String(item).trim()).filter(Boolean));
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '未填写';
  if (Array.isArray(value)) return value.length ? value.join(' / ') : '未填写';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function buildDiffRows(submission: AdminSubmission) {
  if (submission.update_status !== 'pending' || !submission.pending_update) return [];
  const nextPayload = submission.pending_update;
  const currentPayload = submission as unknown as Record<string, any>;

  return UPDATE_DIFF_FIELDS
    .map((field) => {
      const before = getPathValue(currentPayload, field.path);
      const after = getPathValue(nextPayload, field.path);
      return {
        label: field.label,
        before,
        after,
        changed: normalizeComparable(before) !== normalizeComparable(after),
      };
    })
    .filter((row) => row.changed);
}

function getExternalUrl(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
}

const AdminDashboard: React.FC = () => {
  const [token, setToken] = React.useState(() => readSessionValue(TOKEN_STORAGE_KEY));
  const [actor, setActor] = React.useState(() => readSessionValue(ACTOR_STORAGE_KEY) || 'admin');
  const [tokenInput, setTokenInput] = React.useState('');
  const [actorInput, setActorInput] = React.useState(() => readSessionValue(ACTOR_STORAGE_KEY) || 'admin');
  const [status, setStatus] = React.useState<AdminStatusFilter>('pending');
  const [searchInput, setSearchInput] = React.useState('');
  const [submittedSearch, setSubmittedSearch] = React.useState('');
  const [submissions, setSubmissions] = React.useState<AdminSubmission[]>([]);
  const [selected, setSelected] = React.useState<AdminSubmission | null>(null);
  const [summary, setSummary] = React.useState({
    pendingSubmissions: 0,
    pendingUpdates: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
  });
  const [isLoading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState('');
  const [reloadKey, setReloadKey] = React.useState(0);
  const [reviewNote, setReviewNote] = React.useState('');
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [featureEnabled, setFeatureEnabled] = React.useState(false);
  const [featureRank, setFeatureRank] = React.useState('');
  const [draggedFeaturedId, setDraggedFeaturedId] = React.useState('');
  const [editingSubmission, setEditingSubmission] = React.useState<AdminSubmission | null>(null);

  const logout = React.useCallback(() => {
    removeSessionValue(TOKEN_STORAGE_KEY);
    removeSessionValue(ACTOR_STORAGE_KEY);
    setToken('');
    setActor('admin');
    setTokenInput('');
    setActorInput('admin');
    setSelected(null);
    setSubmissions([]);
    setEditingSubmission(null);
  }, []);

  React.useEffect(() => {
    if (!token) return;

    let isActive = true;
    setLoading(true);
    setNotice(null);

    fetchAdminSubmissions({
      token,
      actor,
      status,
      search: submittedSearch,
    })
      .then((result) => {
        if (!isActive) return;
        const nextSubmissions = Array.isArray(result.submissions) ? result.submissions : [];
        setSubmissions(nextSubmissions);
        setSummary(result.summary || {
          pendingSubmissions: 0,
          pendingUpdates: 0,
          approved: 0,
          rejected: 0,
          featured: 0,
        });
        setSelected((current) => {
          if (current) {
            const refreshed = nextSubmissions.find((item) => item.id === current.id);
            if (refreshed) return refreshed;
          }
          return nextSubmissions[0] || null;
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : '后台数据读取失败';
        setNotice({ type: 'error', message });
        if (error instanceof AdminApiError && error.status === 401) {
          logout();
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [actor, logout, reloadKey, status, submittedSearch, token]);

  React.useEffect(() => {
    setFeatureEnabled(Boolean(selected?.is_featured));
    setFeatureRank(selected?.featured_rank ? String(selected.featured_rank) : '');
    setReviewNote('');
  }, [selected?.id, selected?.featured_rank, selected?.is_featured]);

  const payload = React.useMemo(() => getPayload(selected), [selected]);
  const diffRows = React.useMemo(() => (selected ? buildDiffRows(selected) : []), [selected]);
  const hasPendingUpdate = selected?.update_status === 'pending' && Boolean(selected.pending_update);
  const canReview = Boolean(selected && (selected.review_status !== 'approved' || hasPendingUpdate));
  const isSelectedActive = isSubmissionActiveByEndTime(selected);
  const canSaveFeature = Boolean(selected && selected.review_status === 'approved' && (!featureEnabled || isSelectedActive));
  const registrationUrl = getExternalUrl(payload.links?.registration || payload.links?.officialSite);
  const posterUrl = getExternalUrl(payload.links?.poster);
  const editableAdminSubmission = React.useMemo(
    () => editingSubmission ? toEditableAdminSubmission(editingSubmission) : undefined,
    [editingSubmission],
  );

  const notify = (nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    const nextActor = actorInput.trim() || 'admin';
    if (!nextToken) {
      setNotice({ type: 'warning', message: '请输入管理 token。' });
      return;
    }
    writeSessionValue(TOKEN_STORAGE_KEY, nextToken);
    writeSessionValue(ACTOR_STORAGE_KEY, nextActor);
    setToken(nextToken);
    setActor(nextActor);
  };

  const refresh = () => setReloadKey((value) => value + 1);

  const runReviewAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setActionLoading(action);
    try {
      await reviewAdminSubmission({
        token,
        actor,
        submissionId: selected.id,
        action,
        reviewNote,
      });
      notify({ type: 'success', message: action === 'approve' ? '已通过。' : '已拒绝。' });
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      notify({ type: 'error', message });
    } finally {
      setActionLoading('');
    }
  };

  const saveFeature = async () => {
    if (!selected) return;
    setActionLoading('set_feature');
    try {
      await setAdminEventFeature({
        token,
        actor,
        eventId: selected.id,
        isFeatured: featureEnabled,
        featuredRank: featureRank ? Number(featureRank) : null,
      });
      notify({ type: 'success', message: '推荐位已更新。' });
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '推荐位更新失败';
      notify({ type: 'error', message });
    } finally {
      setActionLoading('');
    }
  };

  const saveAdminEdit = async (input: EventSubmissionInput) => {
    if (!editingSubmission) return;
    await updateAdminEvent({
      token,
      actor,
      eventId: editingSubmission.id,
      input,
    });
  };

  const closeAdminEditor = () => {
    setEditingSubmission(null);
    refresh();
  };

  const handleFeaturedDrop = async (targetId: string) => {
    if (status !== 'featured' || !draggedFeaturedId || draggedFeaturedId === targetId) {
      setDraggedFeaturedId('');
      return;
    }

    const fromIndex = submissions.findIndex((item) => item.id === draggedFeaturedId);
    const toIndex = submissions.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggedFeaturedId('');
      return;
    }

    const nextSubmissions = [...submissions];
    const [moved] = nextSubmissions.splice(fromIndex, 1);
    nextSubmissions.splice(toIndex, 0, moved);
    setDraggedFeaturedId('');
    setSubmissions(nextSubmissions);
    setSelected((current) => current ? nextSubmissions.find((item) => item.id === current.id) || current : nextSubmissions[0] || null);

    try {
      await reorderAdminFeaturedEvents({
        token,
        actor,
        eventIds: nextSubmissions.map((item) => item.id),
      });
      notify({ type: 'success', message: '推荐排序已保存。' });
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '推荐排序保存失败';
      notify({ type: 'error', message });
      refresh();
    }
  };

  if (!token) {
    return (
      <main className="poster-app min-h-screen px-4 py-10 text-black sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
          <form onSubmit={handleLogin} className={`w-full rounded-md p-6 ${panelClass}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.9)]">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Datawhale AI+X</p>
                <h1 className="text-xl font-black">后台管理</h1>
              </div>
            </div>

            {notice && (
              <div className="mt-5 rounded-md border-2 border-black bg-primary/20 px-3 py-2 text-sm font-black text-black">
                {notice.message}
              </div>
            )}

            <label className="mt-6 block text-sm font-black text-black/70" htmlFor="admin-actor">
              操作人
            </label>
            <input
              id="admin-actor"
              value={actorInput}
              onChange={(event) => setActorInput(event.target.value)}
              className={`mt-2 h-11 w-full ${fieldClass}`}
              autoComplete="username"
            />

            <label className="mt-4 block text-sm font-black text-black/70" htmlFor="admin-token">
              管理 Token
            </label>
            <input
              id="admin-token"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              className={`mt-2 h-11 w-full ${fieldClass}`}
              type="password"
              autoComplete="current-password"
            />

            <button
              type="submit"
              className={`mt-6 h-11 w-full ${primaryButtonClass}`}
            >
              <ShieldCheck size={18} />
              进入后台
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="poster-app min-h-screen text-black">
      <header className="relative z-10 border-b-2 border-black bg-white/90">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-primary text-black shadow-[3px_3px_0_rgba(5,5,5,0.9)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Datawhale AI+X</p>
              <h1 className="text-xl font-black">活动后台</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/"
              className={`h-10 ${ghostButtonClass}`}
            >
              <ExternalLink size={16} />
              返回前台
            </a>
            <button
              type="button"
              onClick={refresh}
              className={`h-10 ${ghostButtonClass}`}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              type="button"
              onClick={logout}
              className={`h-10 ${ghostButtonClass}`}
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1440px] gap-4 px-4 py-5 xl:grid-cols-[28rem_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-2">
            <Metric label="待处理" value={summary.pendingSubmissions} icon={<Clock3 size={16} />} />
            <Metric label="待更新" value={summary.pendingUpdates} icon={<AlertTriangle size={16} />} />
            <Metric label="已发布" value={summary.approved} icon={<CheckCircle2 size={16} />} />
            <Metric label="已拒绝" value={summary.rejected} icon={<XCircle size={16} />} />
            <Metric label="推荐中" value={summary.featured} icon={<Star size={16} />} />
          </div>

          <div className={`rounded-md p-3 ${panelClass}`}>
            <div className="grid grid-cols-5 gap-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatus(tab.id)}
                  className={`h-9 rounded-md border-2 text-xs font-black transition-transform hover:-translate-y-0.5 ${
                    status === tab.id
                      ? 'border-black bg-primary text-black shadow-[2px_2px_0_rgba(5,5,5,0.85)]'
                      : 'border-black/15 bg-white text-black/58 hover:border-black hover:bg-primary/15'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(searchInput);
              }}
              className="mt-3 flex gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className={`h-10 w-full pl-9 ${fieldClass}`}
                  placeholder="搜索标题、摘要、主办方"
                />
              </div>
              <button
                type="submit"
                className={`h-10 ${primaryButtonClass}`}
              >
                <Search size={16} />
                搜索
              </button>
            </form>
          </div>

          <div className={`rounded-md ${panelClass}`}>
            <div className="flex items-center justify-between border-b-2 border-black px-3 py-2">
              <span className="text-sm font-black">活动列表</span>
              <span className="text-xs font-black text-accent">
                {status === 'featured' && submissions.length > 1 ? '拖拽调整排序 · ' : ''}
                {submissions.length} 条
              </span>
            </div>

            <div className="max-h-[calc(100vh-21rem)] overflow-y-auto">
              {isLoading && submissions.length === 0 && (
                <div className="flex h-48 items-center justify-center text-sm font-black text-black/50">
                  <Loader2 size={18} className="mr-2 animate-spin text-accent" />
                  加载中
                </div>
              )}

              {!isLoading && submissions.length === 0 && (
                <div className="flex h-48 flex-col items-center justify-center gap-2 px-5 text-center">
                  <p className="text-sm font-black text-black/60">
                    当前分类暂无记录
                  </p>
                  <p className="max-w-xs text-xs font-bold leading-5 text-black/45">
                    可以切换到“待更新”“已发布”“已拒绝”或“推荐中”查看其他状态；如果所有分类都是 0，请检查本地环境变量是否指向同一个 Supabase 项目。
                  </p>
                </div>
              )}

              {submissions.map((submission) => {
                const itemPayload = getPayload(submission);
                return (
                  <button
                    key={submission.id}
                    type="button"
                    draggable={status === 'featured'}
                    onDragStart={(event) => {
                      if (status !== 'featured') return;
                      setDraggedFeaturedId(submission.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', submission.id);
                    }}
                    onDragOver={(event) => {
                      if (status === 'featured' && draggedFeaturedId) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleFeaturedDrop(submission.id);
                    }}
                    onDragEnd={() => setDraggedFeaturedId('')}
                    onClick={() => setSelected(submission)}
                    title={status === 'featured' ? '拖拽调整推荐排序' : undefined}
                    aria-grabbed={status === 'featured' ? draggedFeaturedId === submission.id : undefined}
                    className={`block w-full border-b-2 border-black/10 px-3 py-3 text-left transition-colors hover:bg-primary/10 ${
                      selected?.id === submission.id ? 'bg-primary/20' : 'bg-white/80'
                    } ${
                      draggedFeaturedId === submission.id ? 'opacity-45' : ''
                    } ${
                      status === 'featured' ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        {status === 'featured' && (
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-black/35" aria-hidden>
                            <GripVertical size={16} />
                          </span>
                        )}
                        <h2 className="min-w-0 flex-1 truncate text-sm font-black text-black">
                          {itemPayload.title || submission.title || '未命名活动'}
                        </h2>
                      </div>
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-black ${getStatusClass(submission)}`}>
                        {getStatusText(submission)}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs font-bold text-black/55">
                      <span className="truncate">{getOrganizerText(itemPayload, submission)}</span>
                      <span className="truncate">{formatDateTime(itemPayload.start_time || submission.start_time)} · {getLocationText(itemPayload)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`min-w-0 rounded-md ${panelClass}`}>
          {!selected ? (
            <div className="flex min-h-[32rem] items-center justify-center text-sm font-black text-black/50">
              选择一条活动记录
            </div>
          ) : (
            <div className="grid min-h-[32rem] lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0 border-b-2 border-black/15 lg:border-b-0 lg:border-r-2">
                <div className="border-b-2 border-black px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-black ${getStatusClass(selected)}`}>
                        {getStatusText(selected)}
                      </span>
                      {selected.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-md border-2 border-black bg-primary px-2 py-0.5 text-xs font-black text-black shadow-[2px_2px_0_rgba(5,5,5,0.75)]">
                          <Star size={13} />
                          推荐 {selected.featured_rank ?? ''}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSubmission(selected)}
                      className={`h-9 shrink-0 ${primaryButtonClass}`}
                    >
                      <Pencil size={15} />
                      编辑活动
                    </button>
                  </div>
                  <h2 className="mt-3 break-words text-2xl font-black leading-tight">{payload.title || selected.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-black/62">{payload.summary || selected.summary}</p>
                </div>

                <div className="grid gap-4 p-5">
                  {posterUrl && (
                    <div className="rounded-md border-2 border-black bg-white p-3 shadow-[4px_4px_0_rgba(5,5,5,0.84)]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-accent">Poster</p>
                        <a
                          href={posterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-black text-black/45 transition-colors hover:text-accent"
                        >
                          原图 <ExternalLink size={13} />
                        </a>
                      </div>
                      <img
                        src={posterUrl}
                        alt={`${payload.title || selected.title} 活动海报`}
                        className="max-h-[34rem] w-full rounded-md border border-black/10 bg-[#f7f8f1] object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoRow label="开始时间" value={formatDateTime(payload.start_time || selected.start_time)} />
                    <InfoRow label="结束时间" value={formatDateTime(payload.end_time || selected.end_time)} />
                    <InfoRow label="活动形式" value={payload.format || selected.format} />
                    <InfoRow label="活动类型" value={payload.activity_type || selected.activity_type || '未填写'} />
                    <InfoRow label="地点" value={getLocationText(payload)} />
                    <InfoRow label="主办方" value={getOrganizerText(payload, selected)} />
                    <InfoRow label="联系人" value={payload.submitter?.name || selected.submitter?.name || '未填写'} />
                    <InfoRow label="联系方式" value={payload.submitter?.contact || selected.submitter?.contact || '未填写'} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {registrationUrl && (
                      <a
                        href={registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`min-h-10 ${ghostButtonClass}`}
                      >
                        <ExternalLink size={16} />
                        报名链接
                      </a>
                    )}
                    {posterUrl && (
                      <a
                        href={posterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`min-h-10 ${ghostButtonClass}`}
                      >
                        <ExternalLink size={16} />
                        海报链接
                      </a>
                    )}
                  </div>

                  <InfoBlock label="自定义标签" value={valueToText(payload.custom_tags || selected.custom_tags)} />
                  <InfoBlock label="提交备注" value={valueToText(payload.notes || selected.notes)} />

                  {hasPendingUpdate && (
                    <div className="rounded-md border-2 border-black bg-primary/15">
                      <div className="border-b-2 border-black px-3 py-2 text-sm font-black text-black">
                        更新差异
                      </div>
                      <div className="divide-y-2 divide-black/15">
                        {diffRows.length === 0 ? (
                          <div className="px-3 py-3 text-sm font-bold text-black/60">未检测到字段差异。</div>
                        ) : (
                          diffRows.map((row) => (
                            <div key={row.label} className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
                              <div className="font-black text-black">{row.label}</div>
                              <pre className="whitespace-pre-wrap break-words rounded-md border border-black/10 bg-white/70 p-2 font-sans text-xs font-bold text-black/52">{valueToText(row.before)}</pre>
                              <pre className="whitespace-pre-wrap break-words rounded-md border-2 border-black bg-white p-2 font-sans text-xs font-bold text-black">{valueToText(row.after)}</pre>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-4 p-4">
                {notice && (
                  <div className={`rounded-md border-2 px-3 py-2 text-sm font-black ${
                    notice.type === 'success'
                      ? 'border-black bg-[#dfffd4] text-black'
                      : notice.type === 'warning'
                        ? 'border-black bg-primary/25 text-black'
                        : 'border-black bg-[#ffe4e6] text-black'
                  }`}>
                    {notice.message}
                  </div>
                )}

                <div className={`rounded-md p-3 ${softPanelClass}`}>
                  <h3 className="text-sm font-black">审核</h3>
                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    className={`mt-3 min-h-24 w-full p-2 ${fieldClass}`}
                    placeholder="审核备注"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => runReviewAction('approve')}
                      disabled={!canReview || Boolean(actionLoading)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-2 border-black bg-primary px-3 text-sm font-black text-black shadow-[3px_3px_0_rgba(5,5,5,0.85)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/35 disabled:shadow-none"
                    >
                      {actionLoading === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      通过
                    </button>
                    <button
                      type="button"
                      onClick={() => runReviewAction('reject')}
                      disabled={!canReview || Boolean(actionLoading)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-2 border-black bg-[#ffe4e6] px-3 text-sm font-black text-black shadow-[3px_3px_0_rgba(5,5,5,0.85)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/35 disabled:shadow-none"
                    >
                      {actionLoading === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      拒绝
                    </button>
                  </div>
                </div>

                <div className={`rounded-md p-3 ${softPanelClass}`}>
                  <h3 className="text-sm font-black">首页推荐</h3>
                  <label className="mt-3 flex items-center gap-2 text-sm font-black text-black/70">
                    <input
                      type="checkbox"
                      checked={featureEnabled}
                      onChange={(event) => setFeatureEnabled(event.target.checked)}
                      disabled={selected.review_status !== 'approved'}
                      className="h-4 w-4"
                    />
                    当前推荐
                  </label>
                  <p className="mt-2 text-xs font-bold leading-5 text-black/48">
                    首页最多展示 3 个当前有效推荐；活动结束后会自动从首页和“推荐中”分类消失。
                  </p>
                  <label className="mt-3 block text-sm font-black text-black/70" htmlFor="feature-rank">
                    排序
                  </label>
                  <input
                    id="feature-rank"
                    type="number"
                    min="1"
                    max="9999"
                    value={featureRank}
                    onChange={(event) => setFeatureRank(event.target.value)}
                    disabled={selected.review_status !== 'approved' || !featureEnabled || !isSelectedActive}
                    className={`mt-2 h-10 w-full disabled:bg-black/5 disabled:text-black/35 ${fieldClass}`}
                  />
                  {selected.review_status === 'approved' && !isSelectedActive && (
                    <p className="mt-2 text-xs font-bold leading-5 text-black/48">
                      这场活动已结束，不能再设为当前推荐；如果历史记录仍勾选推荐，可以取消勾选后保存。
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={saveFeature}
                    disabled={!canSaveFeature || Boolean(actionLoading)}
                    className={`mt-3 h-10 w-full disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/35 disabled:shadow-none ${primaryButtonClass}`}
                  >
                    {actionLoading === 'set_feature' ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    保存推荐
                  </button>
                </div>

                <div className="rounded-md border-2 border-black/15 bg-white/65 p-3 text-xs font-bold leading-6 text-black/55">
                  <div>ID: <span className="font-mono">{selected.id}</span></div>
                  <div>创建: {formatDateTime(selected.created_at)}</div>
                  <div>更新: {formatDateTime(selected.updated_at)}</div>
                  <div>发布: {formatDateTime(selected.published_at)}</div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>

      {editableAdminSubmission && (
        <SubmitEventModal
          isOpen
          adminSubmission={editableAdminSubmission}
          onAdminSave={saveAdminEdit}
          onClose={closeAdminEditor}
          onSubmitted={(message) => notify({ type: 'success', message })}
        />
      )}
    </main>
  );
};

const Metric: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-md border-2 border-black bg-white/90 p-3 shadow-[4px_4px_0_rgba(5,5,5,0.86)]">
    <div className="flex items-center justify-between text-accent">
      <span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span>
      {icon}
    </div>
    <div className="mt-2 text-2xl font-black text-black">{value}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border-2 border-black/15 bg-white/70 p-3">
    <div className="text-xs font-black uppercase tracking-[0.12em] text-accent">{label}</div>
    <div className="mt-1 break-words text-sm font-black text-black">{value}</div>
  </div>
);

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border-2 border-black/15 bg-white/70 p-3">
    <div className="text-xs font-black uppercase tracking-[0.12em] text-accent">{label}</div>
    <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm font-bold leading-6 text-black/65">{value}</pre>
  </div>
);

export default AdminDashboard;
