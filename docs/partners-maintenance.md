# 生态伙伴维护说明

这个文档用于维护首页生态伙伴 logo 墙的数据，包括 logo、名称、分类和内部备注。

生态伙伴独立页面暂未开放；点击导航或首页的生态伙伴入口会显示“即将上线”，直接访问 `/partners` 会回到首页并显示同样提示。[src/pages/Partners.tsx](../src/pages/Partners.tsx) 保留了尚未开放的分类展示组件。

首页 logo 墙实际读取的数据源是 [src/data/partners.json](../src/data/partners.json)。修改这个 JSON 文件即可更新 logo 墙中的伙伴数据。

[src/data/partners.ts](../src/data/partners.ts) 负责读取 JSON 并转换成前端组件需要的数据结构，一般不需要修改。

首页 logo 墙展示 logo，并用伙伴名称作为图片替代文本；分类和“内部备注 / 原说明”用于数据组织与维护，不展示在 logo 墙中。

## 分类结构

`partners.json` 现在是按分类分组的结构。分类名称只写在分组的 `name` 上，这个分组下的所有伙伴都会自动归到这个分类。

```json
{
  "categories": [
    {
      "name": "AI 模型与开发平台",
      "partners": [
        {
          "logoFile": "image14.png",
          "name": "Kimi",
          "note": "AI 助手与模型服务"
        }
      ]
    }
  ]
}
```

如果要重命名一个分类，只改分组上的 `name` 即可；这一组下面所有伙伴会自动对应到新的分类名称。

## 修改方式

修改名称、分类或内部备注时，编辑 `src/data/partners.json`。

单个伙伴对象的格式是：

```json
{
  "logoFile": "image14.png",
  "name": "Kimi",
  "note": "AI 助手与模型服务"
}
```

字段含义：

- `logoFile`：logo 文件名
- `name`：伙伴名称，用作 logo 的图片替代文本
- `note`：内部备注 / 原说明，不会展示在页面上

logo 文件放在：

```txt
public/partners/edu-alliance/
```

新增伙伴时，把 logo 放进这个目录，然后在目标分类的 `partners` 数组里新增一项。删除伙伴时，删除对应 JSON 对象即可。

调整分类的数据顺序时，移动 `categories` 数组里的整个分类对象。

移动伙伴分类时，把对应伙伴对象剪切到另一个分类的 `partners` 数组里。

## 当前伙伴索引

| Logo 文件 | 页面名称 | 当前分类 | 内部备注 / 原说明 |
|---|---|---|---|
| image12.png | 蚂蚁百灵 | AI 模型与开发平台 | 企业智能体与大模型应用 |
| image13.png | 零一万物 | AI 模型与开发平台 | 大模型与 AI 应用 |
| image14.png | Kimi | AI 模型与开发平台 | AI 助手与模型服务 |
| image15.png | Qwen Code | AI 模型与开发平台 | AI 编程智能体 |
| image17.png | 讯飞开放平台 | AI 模型与开发平台 | 语音与认知智能平台 |
| image19.png | 百川智能 | AI 模型与开发平台 | 大模型研发与应用 |
| image27.png | Dify | AI 模型与开发平台 | LLM 应用开发平台 |
| image30.png | 无问芯穹 | AI 模型与开发平台 | AI Infra 与模型服务 |
| image33.png | 商汤科技 | AI 模型与开发平台 | 人工智能平台与应用 |
| image38.png | MiniMax | AI 模型与开发平台 | 多模态大模型 |
| image40.png | 阶跃星辰 | AI 模型与开发平台 | 通用大模型 |
| image78.png | 算泥 | AI 模型与开发平台 | AI 算力与模型工具 |
| image91.png | 文心大模型 | AI 模型与开发平台 | 大模型与 AI 应用 |
| image101.jpeg | 通义 | AI 模型与开发平台 | 大模型与智能体平台 |
| image85.png | Google | AI 模型与开发平台 | AI、云与开发者生态 |
| image16.png | NoCode | AI 应用与效率工具 | 无代码 AI 创作工具 |
| image21.png | 秒哒 | AI 应用与效率工具 | AI 应用搭建工具 |
| image22.png | Second Me | AI 应用与效率工具 | 个人 AI 与数字分身 |
| image23.png | 金山办公 | AI 应用与效率工具 | 办公软件与 AI 办公 |
| image32.png | 沐言智语 | AI 应用与效率工具 | AI 应用与智能服务 |
| image35.png | 小云 | AI 应用与效率工具 | AI 云端应用 |
| image36.png | POLI Interactive Tech | AI 应用与效率工具 | 交互技术服务 |
| image37.png | Buda | AI 应用与效率工具 | AI 产品与工具 |
| image50.png | MONOLITH | AI 应用与效率工具 | AI 产品与工程平台 |
| image72.png | FluxVerse | AI 应用与效率工具 | AI 创意工具 |
| image94.png | YouMind | AI 应用与效率工具 | AI 知识与内容工具 |
| image95.png | Mo | AI 应用与效率工具 | AI 产品与工具 |
| image100.jpeg | WPS Office | AI 应用与效率工具 | 办公软件与 AI 办公 |
| image10.png | AMD | 算力与芯片 | AI 芯片与算力硬件 |
| image29.png | 亚马逊云科技 | 算力与芯片 | 云计算与 AI 基础设施 |
| image81.png | MINISFORUM 铭凡 | 算力与芯片 | 迷你主机与边缘算力 |
| image84.png | NVIDIA | 算力与芯片 | GPU 与加速计算 |
| image80.png | 首界科技 First AR PC | 算力与芯片 | AR PC 与智能终端 |
| image99.png | 智元机器人 | 智能硬件与具身智能 | 具身智能与机器人 |
| image9.png | ModelScope 魔搭社区 | 开源与社区 | AI 模型开源社区 |
| image20.png | 达摩开发者矩阵 | 开源与社区 | 开发者生态 |
| image25.png | OpenI 启智社区 | 开源与社区 | AI 开源协作平台 |
| image31.png | OpenBMB | 开源与社区 | 大模型开源社区 |
| image34.png | 字见席开源社区 | 开源与社区 | 开源社区 |
| image83.jpeg | 开放原子开源基金会 | 开源与社区 | 开源基金会 |
| image92.png | 飞桨星河社区 | 开源与社区 | AI 开源学习社区 |
| image97.png | AI 大学堂 | 开源与社区 | AI 学习社区 |
| image104.png | WaytoAGI | 开源与社区 | AI 知识社区 |
| image11.png | 去探索 | 开源与社区 | 探索活动与内容社区 |
| image26.png | TIC | 开源与社区 | 科技活动社区 |
| image60.png | K2 Lab | 开源与社区 | AI 创作者社区 |
| image65.png | TGO 鲲鹏会 | 开源与社区 | 技术管理者社群 |
| image70.png | XTion | 开源与社区 | 创作者与活动社区 |
| image71.png | ADVENTURE X | 开源与社区 | 创新活动社区 |
| image73.png | 深客松 | 开源与社区 | Hackathon 社区 |
| image75.png | Bonjour! | 开源与社区 | 创作者社区 |
| image77.png | 生姜青年 Ginger Crew | 开源与社区 | 青年创作者社区 |
| image103.png | 观猹 | 开源与社区 | 科技内容与研究社区 |
| image61.png | 小红书科技 | 科技媒体与出版 | 内容社区与生活方式平台 |
| image62.png | 知乎 | 科技媒体与出版 | 问答社区与内容平台 |
| image63.png | InfoQ 极客邦传媒 | 科技媒体与出版 | 技术媒体与开发者内容 |
| image66.png | 十字路口 | 科技媒体与出版 | 在地社区与创作者活动 |
| image69.png | elsewhere | 科技媒体与出版 | 科技内容与创作者媒体 |
| image74.png | Hackathon Weekly | 科技媒体与出版 | Hackathon 内容媒体 |
| image76.png | 硅星人 | 科技媒体与出版 | 科技媒体 |
| image88.png | 人民邮电出版社 | 科技媒体与出版 | 科技出版 |
| image102.png | 异步社区 | 科技媒体与出版 | 技术出版与学习社区 |
| image105.png | SegmentFault 思否 | 科技媒体与出版 | 开发者社区与科技媒体 |
| image28.png | 栖西聚才 | 投资孵化与产业空间 | 人才与产业服务 |
| image41.png | 真格基金 | 投资孵化与产业空间 | 早期投资 |
| image42.png | 蓝驰创投 | 投资孵化与产业空间 | 风险投资 |
| image43.png | 创新工场 | 投资孵化与产业空间 | 科技投资与孵化 |
| image44.png | 绿洲 | 投资孵化与产业空间 | 产业投资与孵化 |
| image45.png | 九合创投 | 投资孵化与产业空间 | 早期风险投资 |
| image46.png | 源码资本 | 投资孵化与产业空间 | 科技风险投资 |
| image47.png | Delta X | 投资孵化与产业空间 | 科技创新投资 |
| image48.png | 西湖创投 | 投资孵化与产业空间 | 区域创投 |
| image49.png | SparkAI 星火启源 AI 众创空间 | 投资孵化与产业空间 | AI 众创空间 |
| image51.png | Alphaist | 投资孵化与产业空间 | 科技投资 |
| image52.png | 华旦天使 | 投资孵化与产业空间 | 天使投资 |
| image53.png | BOT PARK 机器人基地（宁波） | 投资孵化与产业空间 | 机器人产业基地 |
| image54.png | 线性资本 | 投资孵化与产业空间 | 前沿科技投资 |
| image55.png | 明月湖国际智能产业科创基地 | 投资孵化与产业空间 | 智能产业科创空间 |
| image56.png | 耀途资本 | 投资孵化与产业空间 | 硬科技风险投资 |
| image57.png | 东南基金 | 投资孵化与产业空间 | 产业基金 |
| image58.png | 邦盛资本 | 投资孵化与产业空间 | 产业投资 |
| image59.png | 图灵创投 | 投资孵化与产业空间 | 科技风险投资 |
| image64.png | 博力工场 | 投资孵化与产业空间 | 创新孵化与活动空间 |
| image68.png | AGI Villa | 投资孵化与产业空间 | AI 创作者社区 |
| image79.png | 模速空间 | 投资孵化与产业空间 | 大模型产业创新空间 |
| image86.png | 云启资本 | 投资孵化与产业空间 | 科技风险投资 |
| image18.png | CBi 桥中 | 产业与公共机构 | 创新咨询与产业共创 |
| image24.png | 每日互动 | 产业与公共机构 | 数据智能服务 |
| image39.png | 南京市红山森林动物园 | 产业与公共机构 | 公共文化与科普机构 |
| image67.png | 传播大脑 | 产业与公共机构 | 媒体科技与传播服务 |
| image82.png | 武当山 | 产业与公共机构 | 文旅与公共文化场景 |
| image87.png | 中国中车 CRRC | 产业与公共机构 | 轨道交通与智能制造 |
| image96.png | 天元智能科学研究院 | 产业与公共机构 | 智能科学研究机构 |
| image98.png | 滴滴出行 | 产业与公共机构 | 出行科技平台 |
