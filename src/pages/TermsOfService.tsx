import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="poster-app min-h-screen text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>返回首页</span>
        </button>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl md:text-5xl font-black mb-4">服务条款</h1>
          <p className="text-white/50 mb-8">最后更新：2026年5月28日</p>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">1. 服务说明</h2>
            <p className="text-white/70 leading-relaxed">
              Datawhale AI+X 活动日历用于收录和展示 AI+X 生态活动，包括工作坊、黑客松、开发者活动、高校活动、产业活动、创业活动和 OPC 相关活动。
              我们提供活动浏览、搜索筛选、日历订阅、Hackathon 收录和活动提交通道。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">2. 使用规则</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>你可以浏览、筛选、收藏和分享活动信息。</li>
              <li>提交活动时，请确保信息真实、合法，并确认你有权公开活动介绍、海报、二维码或相关链接。</li>
              <li>提交内容会先进入确认，确认通过后才会出现在公开日历中；我们可以拒绝、修改或下架不适合收录的内容。</li>
              <li>请不要提交恶意链接、垃圾信息、误导性活动、侵权内容或与 AI+X 生态无关的内容。</li>
              <li>请不要大量抓取、转售或滥用平台数据。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">3. 信息准确性</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-4">
              <p className="text-amber-700 font-black mb-2">重要提示</p>
              <p className="text-white/70">
                Datawhale AI+X 活动日历会尽力提供准确、及时的信息，但活动信息来自多个公开来源，我们无法保证每一项信息始终完整、实时和无误。
              </p>
            </div>
            <p className="text-white/70 leading-relaxed">
              参加或报名活动前，请以主办方官方页面、报名页面或海报二维码中的信息为准，包括时间、城市、场地、票务、费用和取消政策。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">4. API 与数据使用</h2>
            <p className="text-white/70 leading-relaxed">
              如果你使用 Datawhale AI+X 活动日历的数据或订阅链接，请保留必要署名，并避免对服务造成异常压力。
              批量同步、商业化复用或二次分发请提前取得授权。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">5. 免责声明</h2>
            <p className="text-white/70 leading-relaxed">
              Datawhale AI+X 活动日历按现状提供服务。我们不对活动取消、改期、报名失败、第三方网站内容、海报二维码失效或你参加活动后的体验承担责任。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-black mb-4">6. 联系我们</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white/70">
                邮箱：<a href="mailto:legal@datawhale.club" className="text-primary hover:underline">legal@datawhale.club</a>
              </p>
              <p className="text-white/70 mt-2">
                AI+X 活动群：可在首页点击“加入 AI+X 活动群”扫码加入。
              </p>
            </div>
          </section>

          <div className="bg-primary/20 border border-primary/40 rounded-lg p-6 mt-12">
            <p className="text-primary font-black mb-2">感谢使用 Datawhale AI+X 活动日历</p>
            <p className="text-white/70 text-sm">
              我们希望和生态伙伴一起，把它做成 AI+X 活动持续发生、持续被看见的公共入口。
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default TermsOfService;
