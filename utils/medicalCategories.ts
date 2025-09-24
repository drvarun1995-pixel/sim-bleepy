import { 
  Heart, 
  Wind, 
  Activity, 
  Brain, 
  Bone, 
  Droplets, 
  Zap, 
  Circle, 
  Shield, 
  Headphones, 
  Baby, 
  User, 
  Crosshair, 
  Bug 
} from 'lucide-react';

export interface MedicalCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  iconColor: string;
  stationIds: string[];
}

export const medicalCategories: MedicalCategory[] = [
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    description: 'Heart and circulatory system conditions',
    icon: Heart,
    color: 'red',
    gradient: 'from-red-100 to-pink-100',
    iconColor: 'text-red-600',
    stationIds: ['chest-pain', 'falls-assessment'] // Chest pain and falls both have cardiovascular aspects
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    description: 'Lungs and breathing conditions',
    icon: Wind,
    color: 'blue',
    gradient: 'from-blue-100 to-cyan-100',
    iconColor: 'text-blue-600',
    stationIds: ['shortness-of-breath']
  },
  {
    id: 'gastrointestinal',
    name: 'Gastrointestinal',
    description: 'Digestive system conditions',
    icon: Activity,
    color: 'green',
    gradient: 'from-green-100 to-emerald-100',
    iconColor: 'text-green-600',
    stationIds: []
  },
  {
    id: 'neurology',
    name: 'Neurology',
    description: 'Brain and nervous system conditions',
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-100 to-violet-100',
    iconColor: 'text-purple-600',
    stationIds: []
  },
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal & Rheumatology',
    description: 'Bones, joints, and muscle conditions',
    icon: Bone,
    color: 'orange',
    gradient: 'from-orange-100 to-amber-100',
    iconColor: 'text-orange-600',
    stationIds: ['psoriatic-arthritis']
  },
  {
    id: 'renal-urology',
    name: 'Renal & Urology',
    description: 'Kidney and urinary system conditions',
    icon: Droplets,
    color: 'teal',
    gradient: 'from-teal-100 to-cyan-100',
    iconColor: 'text-teal-600',
    stationIds: []
  },
  {
    id: 'endocrine-metabolic',
    name: 'Endocrine & Metabolic',
    description: 'Hormone and metabolism conditions',
    icon: Zap,
    color: 'yellow',
    gradient: 'from-yellow-100 to-orange-100',
    iconColor: 'text-yellow-600',
    stationIds: []
  },
  {
    id: 'haematology-oncology',
    name: 'Haematology & Oncology',
    description: 'Blood and cancer conditions',
    icon: Circle,
    color: 'pink',
    gradient: 'from-pink-100 to-rose-100',
    iconColor: 'text-pink-600',
    stationIds: []
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Skin conditions',
    icon: Shield,
    color: 'indigo',
    gradient: 'from-indigo-100 to-purple-100',
    iconColor: 'text-indigo-600',
    stationIds: []
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    description: 'Mental health conditions',
    icon: Headphones,
    color: 'emerald',
    gradient: 'from-emerald-100 to-green-100',
    iconColor: 'text-emerald-600',
    stationIds: []
  },
  {
    id: 'child-health',
    name: 'Child Health',
    description: 'Pediatric conditions',
    icon: Baby,
    color: 'lime',
    gradient: 'from-lime-100 to-green-100',
    iconColor: 'text-lime-600',
    stationIds: []
  },
  {
    id: 'obstetrics-gynaecology',
    name: 'Obstetrics & Gynaecology',
    description: 'Women\'s health conditions',
    icon: User,
    color: 'rose',
    gradient: 'from-rose-100 to-pink-100',
    iconColor: 'text-rose-600',
    stationIds: []
  },
  {
    id: 'general-cross-cutting',
    name: 'General / Cross-cutting',
    description: 'General medicine and cross-specialty conditions',
    icon: Crosshair,
    color: 'gray',
    gradient: 'from-gray-100 to-slate-100',
    iconColor: 'text-gray-600',
    stationIds: []
  },
  {
    id: 'infectious-diseases',
    name: 'Infectious Diseases',
    description: 'Infections and communicable diseases',
    icon: Bug,
    color: 'amber',
    gradient: 'from-amber-100 to-yellow-100',
    iconColor: 'text-amber-600',
    stationIds: []
  }
];

export const getCategoryById = (categoryId: string): MedicalCategory | null => {
  return medicalCategories.find(cat => cat.id === categoryId) || null;
};

export const getCategoryByStationId = (stationId: string): MedicalCategory | null => {
  return medicalCategories.find(cat => cat.stationIds.includes(stationId)) || null;
};

export const getCategoriesWithStations = (): MedicalCategory[] => {
  return medicalCategories.filter(cat => cat.stationIds.length > 0);
};

export const getStationsByCategory = (categoryId: string, stationConfigs: Record<string, any>): any[] => {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  
  return category.stationIds
    .map(stationId => stationConfigs[stationId])
    .filter(Boolean);
};
