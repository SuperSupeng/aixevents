import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="poster-app min-h-screen text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="page-back-button"
        >
          <ArrowLeft size={20} />
          <span>返回首页</span>
        </button>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl md:text-5xl font-black mb-4">隐私政策</h1>
          <p className="text-white/50 mb-8">最后更新：2026年5月28日</p>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">我们收集哪些数据</h2>
            <p className="text-white/70 leading-relaxed">
              Datawhale AI+X 活动日历主要收录公开活动信息。提交活动时，我们会收集活动名称、分类、时间、城市、主办方、简介、报名/详情链接、海报图片，以及提交人的姓名和联系方式。
              联系人信息只用于确认沟通，不会展示在公开日历中。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">公开展示与确认</h2>
            <p className="text-white/70 leading-relaxed">
              活动提交后会先进入待确认状态。确认通过后，活动的公开字段会展示在日历、列表、订阅日历和相关页面中。
              待确认、未通过确认的信息，以及提交人的联系方式不会被公开读取。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">第三方服务</h2>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="font-black mb-2">Supabase</h3>
                <p className="text-white/60 text-sm">用于存储活动提交、确认状态、海报图片和公开日历数据。</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="font-black mb-2">Vercel</h3>
                <p className="text-white/60 text-sm">用于网站部署、托管、缓存和基础访问日志。</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">你的权利</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>你可以要求修改或删除自己提交的活动信息。</li>
              <li>你可以要求我们不再公开展示某个已收录活动。</li>
              <li>你可以通过浏览器设置清除本地偏好数据。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">联系我们</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/70">
                邮箱：<a href="mailto:privacy@datawhale.club" className="text-primary hover:underline">privacy@datawhale.club</a>
              </p>
              <p className="text-white/70 mt-2">
                AI+X 活动群：可在首页点击“加入 AI+X 活动群”扫码加入。
              </p>
            </div>
          </section>

          <div className="bg-primary/20 border border-primary/40 rounded-lg p-6 mt-12">
            <p className="text-primary font-black mb-2">隐私优先</p>
            <p className="text-white/70 text-sm">
              我们会尽量少收集、少打扰。活动提交所需的联系人信息用于确认和必要沟通，不作为公开展示内容。
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
