import partnersData from './partners.json';

export type PartnerCategory = string;

export interface EcosystemPartner {
  id: string;
  name: string;
  category: PartnerCategory;
  logo: string;
  note?: string;
}

interface PartnerJsonItem {
  logoFile: string;
  name: string;
  note?: string;
}

interface PartnerJsonCategory {
  name: PartnerCategory;
  partners: PartnerJsonItem[];
}

interface PartnerJson {
  categories: PartnerJsonCategory[];
}

const data = partnersData as PartnerJson;

export const PARTNER_CATEGORIES: PartnerCategory[] = data.categories.map((category) => category.name);

export const ecosystemPartners: EcosystemPartner[] = data.categories.flatMap((category) =>
  category.partners.map((partner) => ({
    id: partner.logoFile.replace(/\.[^.]+$/, ''),
    name: partner.name,
    category: category.name,
    note: partner.note,
    logo: `/partners/edu-alliance/${partner.logoFile}`,
  }))
);

export function getPartnersByCategory(category: PartnerCategory): EcosystemPartner[] {
  return ecosystemPartners.filter((partnerItem) => partnerItem.category === category);
}
