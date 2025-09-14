import { notFound } from "next/navigation";
import NewStation from "@/components/NewStation";

interface StationPageProps {
  params: {
    stationId: string;
  };
}

// Station configurations
const stationConfigs: Record<string, any> = {
  'chest-pain': {
    id: 'chest-pain',
    title: 'Chest Pain Assessment',
    description: 'A 58-year-old man presents with chest pain. Conduct a thorough consultation.',
    patientProfile: 'David Brown, 58, delivery driver. Presents with chest tightness on exertion that started 3 months ago, getting more frequent recently. Has hypertension, type 2 diabetes, smokes ~10 cigarettes/day (~20 pack-years), father had heart attack at 54. Takes ramipril 10mg OD, metformin 1g BD, atorvastatin 40mg nocte.'
  },
  'shortness-breath': {
    id: 'shortness-breath',
    title: 'Shortness of Breath Assessment',
    description: 'A 30-year-old asthmatic patient presents with increasing dyspnea.',
    patientProfile: 'Ms. Jane Smith, 30, female. Presents with sudden onset shortness of breath. Known history of asthma, uses inhaler intermittently. Reports feeling tight in chest and has been wheezing. Appears distressed and is using accessory muscles to breathe.'
  }
};

export default async function NewStationPage({ params }: StationPageProps) {
  const stationConfig = stationConfigs[params.stationId];

  if (!stationConfig) {
    notFound();
  }

  return <NewStation stationConfig={stationConfig} />;
}
