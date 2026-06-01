import { TechEvent } from '../types';
import { getActivityTypeLabel } from '../constants/activityTaxonomy';

export interface EventTag {
  label: string;
  icon: string;
  color: string;
  category: 'type' | 'tech' | 'format';
}

// 从活动信息中智能识别标签
export const identifyTags = (event: TechEvent): EventTag[] => {
  const tags: EventTag[] = [];
  
  // 活动类型识别（基于标题和描述）
  const title = event.title.toLowerCase();
  const summary = event.summary.toLowerCase();
  const fullText = `${title} ${summary}`;
  
  if (event.activityType) {
    const typeColorMap: Record<string, string> = {
      meetup: 'green',
      workshop: 'purple',
      hackathon: 'yellow',
      talk: 'blue',
      training: 'cyan',
      demo_day: 'orange',
      conference: 'indigo',
      competition: 'yellow',
    };
    tags.push({
      label: getActivityTypeLabel(event.activityType),
      icon: event.activityType === 'hackathon' ? '🏆' : event.activityType === 'workshop' ? '🛠️' : '📌',
      color: typeColorMap[event.activityType] || 'blue',
      category: 'type',
    });
  } else if (fullText.includes('conference') || fullText.includes('conf ') || fullText.includes('大会') || fullText.includes('会议')) {
    tags.push({ label: '会议', icon: '🎤', color: 'blue', category: 'type' });
  } else if (fullText.includes('workshop') || fullText.includes('工作坊') || fullText.includes('实操')) {
    tags.push({ label: '工作坊', icon: '🛠️', color: 'purple', category: 'type' });
  } else if (fullText.includes('hackathon') || fullText.includes('黑客松') || fullText.includes('创造营')) {
    tags.push({ label: '黑客松', icon: '🏆', color: 'yellow', category: 'type' });
  } else if (fullText.includes('webinar') || fullText.includes('online') || fullText.includes('线上')) {
    tags.push({ label: '线上分享', icon: '💻', color: 'cyan', category: 'type' });
  } else if (fullText.includes('meetup') || fullText.includes('沙龙') || fullText.includes('交流')) {
    tags.push({ label: '社区活动', icon: '👥', color: 'green', category: 'type' });
  } else if (fullText.includes('summit') || fullText.includes('峰会')) {
    tags.push({ label: '峰会', icon: '⛰️', color: 'indigo', category: 'type' });
  }
  
  // 技术领域标签只基于用户补充标签，不用系统默认的 AI+X 或活动类型反推。
  const eventTags = (event.customTags || []).map(t => t.toLowerCase());
  
  if (eventTags.some(t => ['ai', 'ml', 'machine learning', 'deep learning', 'ai 实践'].includes(t))) {
    tags.push({ label: 'AI 实践', icon: '🤖', color: 'purple', category: 'tech' });
  }
  if (eventTags.some(t => ['黑客松', 'hackathon'].includes(t))) {
    tags.push({ label: '黑客松', icon: '🏁', color: 'yellow', category: 'tech' });
  }
  if (eventTags.some(t => ['开发者', 'developer'].includes(t))) {
    tags.push({ label: '开发者', icon: '⌘', color: 'cyan', category: 'tech' });
  }
  if (eventTags.some(t => ['高校', '校园', 'campus'].includes(t))) {
    tags.push({ label: '高校', icon: '🎓', color: 'blue', category: 'tech' });
  }
  if (eventTags.some(t => ['产业', '企业应用', 'industry'].includes(t))) {
    tags.push({ label: '产业场景', icon: '🏢', color: 'indigo', category: 'tech' });
  }
  
  // 格式标签
  if (event.format === 'online') {
    tags.push({ label: '线上', icon: '🌐', color: 'emerald', category: 'format' });
  } else if (event.format === 'hybrid') {
    tags.push({ label: '混合', icon: '🔄', color: 'purple', category: 'format' });
  }
  
  return tags;
};

// 获取标签颜色类
export const getTagColorClasses = (color: string): { bg: string; border: string; text: string } => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  };
  
  return colorMap[color] || { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60' };
};
