/**
 * Core Type Definitions for Construction, Finishes & Steel Estimator
 * Grounded in Egyptian Code & Market Construction Standards
 */

export type CurrencyCode = 'EGP' | 'SAR' | 'AED' | 'KWD' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToEgp: number;
}

export type FinishingTier = 'custom' | 'economic' | 'medium' | 'lux' | 'super_lux' | 'ultra_lux';

export interface ApartmentSpecs {
  totalArea: number; // m2
  roomsCount: number;
  bathroomsCount: number;
  kitchensCount: number;
  balconiesCount: number;
  ceilingHeight: number; // meters (usually 2.8 - 3.2m)
  tier: FinishingTier;
  currency: CurrencyCode;
  // Masonry construction parameters for full new building:
  masonryMode: 'full_new_building' | 'partitions_only';
  externalWallThickness: '25' | '12' | 'double_isolated';
  internalWallThickness: '12' | '10';
  brickType: 'clay_25_12_6' | 'clay_25_12_12' | 'cement_solid' | 'aac_lightweight';
  customWallFactor?: number; // default ~2.7 - 3.0
  flooringType: 'ceramic' | 'porcelain' | 'hpl_parquet' | 'marble' | 'custom';
  ceilingType: 'simple_plaster' | 'gypsum_perimeter' | 'gypsum_full' | 'custom';
  aluminumType: 'economic_bs' | 'medium_jumbo' | 'premium_upvc' | 'custom';
  doorQuality: 'semi_finished_wood' | 'oak_veneer' | 'solid_beech' | 'custom';
}

export interface UserPriceOverride {
  material?: number | null;
  labor?: number | null;
}

export interface FinishingItemCalculation {
  id: string;
  category: string;
  title: string;
  unit: string;
  quantity: number;
  calculatedQuantity: number; // original untouched engineering quantity
  isQuantityOverridden?: boolean; // true if modified by user
  materialUnitCost: number; // 0 if unpriced
  laborUnitCost: number; // 0 if unpriced
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
  isPriced?: boolean;
  details: string[];
  tips: string;
}

export interface CustomFinishingItem {
  id: string;
  categoryName: string;
  title: string;
  unit: string;
  quantity: number;
  materialUnitCost: number;
  laborUnitCost: number;
  details?: string;
}

export interface FinishingCategoryResult {
  categoryId: string;
  categoryName: string;
  iconName: string;
  description: string;
  items: FinishingItemCalculation[];
  totalCost: number;
  materialCost: number;
  laborCost: number;
  unpricedItemsCount?: number;
}

export interface ConcreteElement {
  id: string;
  name: string;
  type: 'slab' | 'beam' | 'column' | 'footing' | 'wall';
  dimsDesc: string;
  count: number;
  volume: number;
  wetVolume: number;
  cementBags: number;
  cementKg: number;
  sandM3: number;
  gravelM3: number;
  waterLiters: number;
  cost?: number;
}

export interface ConcretePriceConfig {
  cementBagPrice: number;
  sandM3Price: number;
  gravelM3Price: number;
  laborM3Price: number;
}

export interface ConcreteMixOptions {
  cement: number;
  sand: number;
  gravel: number;
  wastePercent: number;
  dryVolumeFactor: number;
  cementDensity: number;
  bagWeight: number;
  waterCementRatio: number;
}

export type StructuralSystem = 'solid_slab' | 'flat_slab' | 'hollow_block' | 'custom';

export interface SteelEstimateResult {
  slabArea: number;
  floorsCount: number;
  system: StructuralSystem;
  concreteVolumeEst: number; // m3
  steelPerM2: number; // kg/m2
  steelPerM3: number; // kg/m3
  slabSteelKg: number;
  columnsSteelKg: number;
  footingsSteelKg: number;
  totalSteelKg: number;
  totalSteelTons: number;
  tieWireKg: number;
  steelPricePerTon: number;
  totalCost: number;
  diameters: {
    diameter: number; // 8, 10, 12, 16, 18 mm
    usage: string;
    percentage: number;
    weightTons: number;
    weightKg: number;
    meterWeight: number; // kg/m = d^2 / 162
    approxBarsCount: number; // 12m length
  }[];
}

export type AccountType = 'individual' | 'company';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string; // مهندس معماري / مهندس إنشائي / مالك عقار / مقاول / أخرى
  accountType?: AccountType; // أفراد أو شركات
  companyName?: string; // اسم الشركة أو المكتب الهندسي
  taxOrRegNumber?: string; // السجل التجاري / رقم القيد النقابي
  createdAt: string;
}

export interface CustomProjectField {
  id: string;
  label: string;
  value: string;
}

export interface SavedProject {
  id: string;
  userId?: string;
  projectName: string; // اسم المشروع
  reportName: string; // اسم التقرير
  ownerName: string; // اسم مالك المشروع
  location: string; // مكان المشروع
  date: string; // تاريخ التقرير
  customFields: CustomProjectField[]; // خانات إضافية حسب اختيار المستخدم
  currency: CurrencyCode;
  finishesTotal: number;
  finishesMaterials: number;
  finishesLabor: number;
  finishesItemsCount: number;
  steelTons: number;
  steelCost: number;
  concreteVolume: number;
  concreteCementBags: number;
  concreteCost: number;
  contingencyRate: number;
  grandTotal: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
