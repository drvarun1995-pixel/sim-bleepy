import { getStationConfig } from "@/utils/stationConfigs";
import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import { notFound } from "next/navigation";
import StationInterface from "@/components/StationInterface";

interface StationPageProps {
  params: {
    stationId: string;
  };
}

export default async function StationPage({ params }: StationPageProps) {
  const stationConfig = getStationConfig(params.stationId);

  if (!stationConfig) {
    notFound();
  }

  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  return <StationInterface stationConfig={stationConfig} accessToken={accessToken} />;
}
