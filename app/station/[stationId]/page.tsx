import { getStationConfig } from "@/utils/stationConfigs";
import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StationInterface from "@/components/StationInterface";

interface StationPageProps {
  params: {
    stationId: string;
  };
}

export default async function StationPage({ params }: StationPageProps) {
  // Check authentication first
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    // Redirect to sign-in page with return URL
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/station/${params.stationId}`)}`);
  }

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
