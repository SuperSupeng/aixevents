export type PartnerCategory =
  | '社区'
  | '高校'
  | '科技企业'
  | '媒体'
  | '政府/园区'
  | '投资机构'
  | '在地社区';

export interface EcosystemPartner {
  id: string;
  name: string;
  category: PartnerCategory;
  logo: string;
}

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  '社区',
  '高校',
  '科技企业',
  '媒体',
  '政府/园区',
  '投资机构',
  '在地社区',
];

const logoFiles = [
  ...Array.from({ length: 74 }, (_, index) => `image${index + 9}.png`),
  'image83.jpeg',
  ...Array.from({ length: 5 }, (_, index) => `image${index + 84}.png`),
  ...Array.from({ length: 2 }, (_, index) => `image${index + 91}.png`),
  ...Array.from({ length: 6 }, (_, index) => `image${index + 94}.png`),
  'image100.jpeg',
  'image101.jpeg',
  ...Array.from({ length: 4 }, (_, index) => `image${index + 102}.png`),
];

function getCategory(index: number): PartnerCategory {
  if (index < 22) return '社区';
  if (index < 42) return '高校';
  if (index < 58) return '科技企业';
  if (index < 70) return '媒体';
  if (index < 78) return '政府/园区';
  if (index < 86) return '投资机构';
  return '在地社区';
}

export const ecosystemPartners: EcosystemPartner[] = logoFiles.map((file, index) => ({
  id: `partner-${String(index + 1).padStart(3, '0')}`,
  name: `生态伙伴 ${String(index + 1).padStart(2, '0')}`,
  category: getCategory(index),
  logo: `/partners/edu-alliance/${file}`,
}));

export function getPartnersByCategory(category: PartnerCategory): EcosystemPartner[] {
  return ecosystemPartners.filter((partner) => partner.category === category);
}
