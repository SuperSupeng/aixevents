import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  CheckCircle2,
  ImagePlus,
  Trash2,
  Copy,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  fetchSubmissionForEdit,
  submitEventForReview,
  updateSubmissionWithToken,
  uploadEventPoster,
} from '../api/submissions';
import {
  DEFAULT_ACTIVITY_TYPE,
  SUBMISSION_ACTIVITY_TYPES,
  getActivityTypeLabel,
  type ActivityType,
} from '../constants/activityTaxonomy';
import type { EventSubmissionInput } from '../types';

interface SubmitEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (message: string) => void;
  editToken?: string;
  initialActivityType?: ActivityType;
}

const initialForm = {
  title: '',
  summary: '',
  activityType: DEFAULT_ACTIVITY_TYPE,
  customTagsText: '',
  startTime: '',
  endTime: '',
  format: 'offline' as EventSubmissionInput['format'],
  city: '',
  address: '',
  organizersText: '',
  registrationUrl: '',
  contactName: '',
  contactInfo: '',
  notes: '',
};

function toDateTimeLocal(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function parseOrganizers(value: string): string[] {
  return value
    .split(/[，,、/；;\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCustomTags(value: string): string[] {
  const hashtagMatches = Array.from(value.matchAll(/#([^\s#，,、；;]+)/g)).map((match) => match[1]);
  const rawTags = hashtagMatches.length > 0
    ? hashtagMatches
    : value.split(/[\s，,、；;]+/g);

  return Array.from(
    new Set(
      rawTags
        .map((tag) => tag.replace(/^#/, '').trim())
        .filter(Boolean)
        .slice(0, 8)
    )
  );
}

const SubmitEventModal: React.FC<SubmitEventModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  editToken,
  initialActivityType = DEFAULT_ACTIVITY_TYPE,
}) => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedEditUrl, setSubmittedEditUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [existingPosterUrl, setExistingPosterUrl] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const isEditMode = Boolean(editToken);
  const resolvedCity = form.city.trim();
  const parsedOrganizers = useMemo(() => parseOrganizers(form.organizersText), [form.organizersText]);
  const parsedCustomTags = useMemo(() => parseCustomTags(form.customTagsText), [form.customTagsText]);
  const posterDisplayUrl = posterPreview || existingPosterUrl;
  const submittedDestination = form.activityType === 'hackathon'
    ? '公开日历、Hackathon 页面和订阅源'
    : '公开日历和订阅源';
  const activityTypeOptions = useMemo(() => {
    const hasCurrentType = SUBMISSION_ACTIVITY_TYPES.some((type) => type.value === form.activityType);
    if (hasCurrentType) return SUBMISSION_ACTIVITY_TYPES;

    return [
      ...SUBMISSION_ACTIVITY_TYPES,
      {
        value: form.activityType,
        label: getActivityTypeLabel(form.activityType),
        hint: '这是当前活动已有分类；不确定时可以保留。',
      },
    ];
  }, [form.activityType]);

  const requiredMissing = useMemo(() => {
    const missingLocation = form.format !== 'online' && !resolvedCity;
    return (
      !form.title.trim() ||
      !form.summary.trim() ||
      !form.activityType ||
      !form.startTime ||
      !form.endTime ||
      missingLocation ||
      parsedOrganizers.length === 0 ||
      !form.contactName.trim() ||
      !form.contactInfo.trim()
    );
  }, [form, parsedOrganizers.length, resolvedCity]);

  useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

  useEffect(() => {
    if (!isOpen || editToken) return;
    setForm((current) => ({ ...current, activityType: initialActivityType }));
  }, [editToken, initialActivityType, isOpen]);

  useEffect(() => {
    if (!isOpen || !editToken) return;

    let cancelled = false;
    const loadEditableSubmission = async () => {
      setIsLoadingSubmission(true);
      setError('');
      setSubmitted(false);
      setSubmittedEditUrl('');

      try {
        const submission = await fetchSubmissionForEdit(editToken);
        if (cancelled) return;

        if (!submission) {
          setError('编辑链接无效，或这条活动信息不存在。');
          return;
        }

        setForm({
          title: submission.title,
          summary: submission.summary,
          activityType: (submission.activityType || DEFAULT_ACTIVITY_TYPE) as ActivityType,
          customTagsText: submission.customTags.map((tag) => `#${tag}`).join(' '),
          startTime: toDateTimeLocal(submission.startTime),
          endTime: toDateTimeLocal(submission.endTime),
          format: submission.format,
          city: submission.city || '',
          address: submission.address || '',
          organizersText: submission.organizers.join(' / '),
          registrationUrl: submission.registrationUrl || '',
          contactName: submission.contactName,
          contactInfo: submission.contactInfo,
          notes: submission.notes || '',
        });
        setExistingPosterUrl(submission.posterUrl || '');
        setPosterFile(null);
        setPosterPreview((current) => {
          if (current) URL.revokeObjectURL(current);
          return '';
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '读取活动信息失败。');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSubmission(false);
        }
      }
    };

    loadEditableSubmission();

    return () => {
      cancelled = true;
    };
  }, [editToken, isOpen]);

  const updateField = <Key extends keyof typeof initialForm>(key: Key, value: (typeof initialForm)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setError('');
    setSubmitted(false);
    setSubmittedEditUrl('');
    setIsSubmitting(false);
    setIsLoadingSubmission(false);
    setExistingPosterUrl('');
    setImagePreviewUrl('');
    setPosterFile(null);
    setPosterPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    onClose();
  };

  const handlePosterChange = (file?: File) => {
    setError('');
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('海报仅支持 JPG、PNG 或 WebP 图片。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('海报图片不能超过 5MB。');
      return;
    }

    setPosterFile(file);
    setExistingPosterUrl('');
    setPosterPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const clearPoster = () => {
    setPosterFile(null);
    setExistingPosterUrl('');
    setPosterPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
  };

  const copyEditUrl = async () => {
    if (!submittedEditUrl) return;
    try {
      await navigator.clipboard.writeText(submittedEditUrl);
      onSubmitted?.('编辑链接已复制');
    } catch {
      setError('复制失败，可以手动复制编辑链接。');
    }
  };

  const buildPayload = async (): Promise<EventSubmissionInput> => {
    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    let posterUrl = existingPosterUrl;
    if (posterFile) {
      posterUrl = await uploadEventPoster(posterFile);
    }

    return {
      title: form.title.trim(),
      summary: form.summary.trim(),
      activityType: form.activityType,
      customTags: parsedCustomTags,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      format: form.format,
      city: form.format === 'online' ? undefined : resolvedCity,
      address: form.format === 'online' ? undefined : form.address.trim() || undefined,
      organizer: {
        name: parsedOrganizers.join(' / '),
      },
      organizers: parsedOrganizers,
      links: {
        registration: form.registrationUrl.trim() || undefined,
        poster: posterUrl || undefined,
      },
      submitter: {
        name: form.contactName.trim(),
        contact: form.contactInfo.trim(),
      },
      notes: form.notes.trim() || undefined,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (requiredMissing) {
      setError('请补充活动名称、类型、简介、时间、城市、组织方和联系人信息。');
      return;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('请确认活动结束时间晚于开始时间。');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = await buildPayload();

      if (isEditMode && editToken) {
        await updateSubmissionWithToken(editToken, payload);
        setSubmitted(true);
        onSubmitted?.('修改已提交，等待确认');
        return;
      }

      const result = await submitEventForReview(payload);
      setSubmittedEditUrl(result.editUrl);
      setSubmitted(true);
      onSubmitted?.('活动已提交，请保存编辑链接');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '活动提交失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 28 }}
          className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border-2 border-black bg-white shadow-[8px_8px_0_rgba(5,5,5,0.92)]"
        >
          <button
            onClick={resetAndClose}
            className="absolute right-5 top-5 z-20 border-2 border-black bg-white p-2 text-black transition-colors hover:bg-primary"
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          {submitted ? (
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center border-2 border-black bg-primary text-black">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="mb-4 max-w-xl text-3xl font-black leading-tight text-black sm:text-4xl">
                {isEditMode ? '修改已提交，等待确认。' : '已提交，等待确认。'}
              </h2>
              <p className="mb-6 max-w-xl text-sm font-bold leading-7 text-black/70 sm:text-base">
                {isEditMode
                  ? '如果这条活动已经公开，修改内容会先进入确认，确认通过后再更新到公开日历。'
                  : `活动信息已进入待确认列表。确认真实、完整、适合公开后，同一条记录会自动出现在 ${submittedDestination} 中。`}
              </p>

              {!isEditMode && submittedEditUrl && (
                <div className="mb-7 rounded-md border-2 border-black/12 bg-black/[0.03] p-4">
                  <p className="text-xs font-black text-black/50">后续修改链接</p>
                  <p className="mt-2 break-all text-sm font-black leading-6 text-accent">{submittedEditUrl}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-black/55">
                    这个链接只显示一次。后续需要补充海报、改时间或改城市时，可以用它提交修改。
                  </p>
                  <button type="button" onClick={copyEditUrl} className="btn-secondary mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs">
                    <Copy size={15} />
                    复制编辑链接
                  </button>
                </div>
              )}

              <button onClick={resetAndClose} className="btn-primary px-6 py-3 text-sm">
                知道了
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              <div className="mb-6 inline-flex items-center gap-2 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide">
                <span className="block h-2 w-2 bg-primary" />
                {isEditMode ? '活动修改' : '活动提交'}
              </div>

              <h2 className="mb-4 max-w-xl text-3xl font-black leading-tight text-black sm:text-4xl">
                {isEditMode ? '修改活动信息。' : '提交活动共建生态。'}
              </h2>
              <p className="mb-6 max-w-xl text-sm font-bold leading-7 text-black/70 sm:text-base">
                仅保留必要信息。联系人信息只用于确认沟通，不会公开展示；海报和报名链接都可以选填。
              </p>

              {isLoadingSubmission ? (
                <div className="flex items-center gap-3 rounded-md border border-black/10 bg-black/[0.03] p-5 text-sm font-black text-black/60">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  正在读取活动信息...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="submit-label">活动名称 *</span>
                      <input className="submit-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="例如：主题分享、工作坊或社区聚会" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="submit-label">活动简介 *</span>
                      <textarea className="submit-input min-h-24 resize-y" value={form.summary} onChange={(event) => updateField('summary', event.target.value)} placeholder="用 1-3 句话说明活动主题、面向人群和参与收获。" />
                    </label>
                    <label>
                      <span className="submit-label">活动类型 *</span>
                      <select className="submit-input" value={form.activityType} onChange={(event) => updateField('activityType', event.target.value as ActivityType)}>
                        {activityTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[11px] font-bold leading-5 text-black/45">
                        {activityTypeOptions.find((type) => type.value === form.activityType)?.hint || '拿不准可以选其他/不确定。'}
                      </span>
                    </label>
                    <label>
                      <span className="submit-label">活动形式 *</span>
                      <select className="submit-input" value={form.format} onChange={(event) => updateField('format', event.target.value as EventSubmissionInput['format'])}>
                        <option value="offline">线下</option>
                        <option value="online">线上</option>
                        <option value="hybrid">混合</option>
                      </select>
                    </label>
                    <label>
                      <span className="submit-label">开始时间 *</span>
                      <input
                        className="submit-input"
                        type="datetime-local"
                        value={form.startTime}
                        onInput={(event) => updateField('startTime', event.currentTarget.value)}
                        onChange={(event) => updateField('startTime', event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="submit-label">结束时间 *</span>
                      <input
                        className="submit-input"
                        type="datetime-local"
                        value={form.endTime}
                        onInput={(event) => updateField('endTime', event.currentTarget.value)}
                        onChange={(event) => updateField('endTime', event.target.value)}
                      />
                    </label>

                    {form.format !== 'online' ? (
                      <>
                        <label>
                          <span className="submit-label">城市 *</span>
                          <input
                            className="submit-input"
                            value={form.city}
                            onChange={(event) => updateField('city', event.target.value)}
                            placeholder="例如：上海、杭州、宁波"
                            autoComplete="address-level2"
                          />
                          <span className="mt-1 block text-[11px] font-bold leading-5 text-black/45">
                            直接填写活动主要发生的城市；如果是多城市巡回，可填写首站或主要城市。
                          </span>
                        </label>
                        <label>
                          <span className="submit-label">具体地点（选填）</span>
                          <input className="submit-input" value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="例如：区县、园区、楼宇或会议室地址" />
                        </label>
                      </>
                    ) : (
                      <div className="sm:col-span-2 rounded-md border border-black/10 bg-black/[0.03] px-4 py-3 text-xs font-bold leading-5 text-black/55">
                        线上活动无需填写城市。需要展示线下同步点时，可选择“混合”。
                      </div>
                    )}

                    <label className="sm:col-span-2">
                      <span className="submit-label">主办/组织方 *</span>
                      <input className="submit-input" value={form.organizersText} onChange={(event) => updateField('organizersText', event.target.value)} placeholder="多个组织方可用 /、逗号或顿号分隔" />
                    </label>
                    <label>
                      <span className="submit-label">报名/详情链接（选填）</span>
                      <input className="submit-input" type="url" value={form.registrationUrl} onChange={(event) => updateField('registrationUrl', event.target.value)} placeholder="https://..." />
                    </label>
                    <label>
                      <span className="submit-label">标签（选填）</span>
                      <input className="submit-input" value={form.customTagsText} onChange={(event) => updateField('customTagsText', event.target.value)} placeholder="#Agent #RAG #高校" />
                      <span className="mt-1 block text-[11px] font-bold leading-5 text-black/45">
                        可用 # 标签补充主题，最多保留 8 个。
                      </span>
                    </label>

                    <div className="sm:col-span-2">
                      <span className="submit-label">活动海报（选填）</span>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-black/20 bg-black/[0.03] px-4 py-5 text-center transition-all hover:border-accent hover:bg-primary/10">
                        <ImagePlus className="mb-2 text-accent" size={28} />
                        <span className="text-sm font-black text-black">上传海报图片</span>
                        <span className="mt-1 text-xs font-bold leading-5 text-black/45">支持 JPG / PNG / WebP，最大 5MB。报名二维码可以放在海报中。</span>
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => handlePosterChange(event.target.files?.[0])}
                        />
                      </label>

                      {posterDisplayUrl && (
                        <div className="mt-3 flex items-center gap-3 rounded-md border border-black/12 bg-white p-3">
                          <button type="button" onClick={() => setImagePreviewUrl(posterDisplayUrl)} className="group relative h-20 w-16 shrink-0 overflow-hidden rounded border border-black/15 bg-black/[0.03]">
                            <img src={posterDisplayUrl} alt="活动海报缩略图" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 hidden items-center justify-center bg-black/35 text-white group-hover:flex">
                              <Eye size={18} />
                            </span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-black">{posterFile ? posterFile.name : '已上传海报'}</p>
                            <p className="mt-1 text-xs font-bold leading-5 text-black/45">点击缩略图可放大查看。</p>
                          </div>
                          <button
                            type="button"
                            onClick={clearPoster}
                            className="inline-flex items-center gap-1 rounded-md border border-black bg-white px-3 py-2 text-xs font-black text-black shadow-[2px_2px_0_rgba(5,5,5,0.9)] transition-all hover:bg-primary"
                          >
                            <Trash2 size={13} />
                            移除
                          </button>
                        </div>
                      )}
                    </div>

                    <label>
                      <span className="submit-label">联系人 *</span>
                      <input className="submit-input" value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} />
                    </label>
                    <label>
                      <span className="submit-label">联系方式 *</span>
                      <input className="submit-input" value={form.contactInfo} onChange={(event) => updateField('contactInfo', event.target.value)} placeholder="微信 / 邮箱 / 手机" />
                    </label>
                  </div>

                  <label className="mt-5 block">
                    <span className="submit-label">补充说明</span>
                    <textarea className="submit-input min-h-20 resize-y" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="选填，比如需要协助宣发或有其他说明。" />
                  </label>
                </>
              )}

              {error && (
                <p className="mt-4 border border-red-500/30 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingSubmission}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {isSubmitting ? '提交中...' : isEditMode ? '提交修改' : '提交活动信息'}
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="btn-secondary flex flex-1 items-center justify-center gap-2 px-6 py-3 text-sm"
                >
                  先看看活动日历
                </button>
              </div>
              <p className="mt-4 text-xs font-bold leading-6 text-black/55">
                {isEditMode ? '修改也会先确认；确认通过前不会影响已公开的活动信息。' : '提交后会先确认信息，确认通过后才会展示到公开日历。'}
              </p>
            </form>
          )}
        </motion.div>

        {imagePreviewUrl && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={() => setImagePreviewUrl('')}>
            <button className="absolute right-5 top-5 border-2 border-white bg-black px-3 py-2 text-sm font-black text-white" aria-label="关闭海报预览">
              关闭
            </button>
            <img src={imagePreviewUrl} alt="活动海报预览大图" className="max-h-[90vh] max-w-[92vw] rounded-md bg-white object-contain" />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default SubmitEventModal;
