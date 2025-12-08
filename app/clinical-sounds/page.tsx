'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Play, Pause, Download, Eye, EyeOff, Grid3x3, List, Shuffle } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Sound Player Component
function SoundPlayer({ 
  audioFile, 
  audioName, 
  hideTitle, 
  audioPath,
  colorScheme = 'purple',
  isPlaying,
  onPlay,
  onStop,
  audioRefsMap,
  uniqueId
}: { 
  audioFile: string; 
  audioName: string; 
  hideTitle?: boolean;
  audioPath: string;
  colorScheme?: 'purple' | 'red';
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  audioRefsMap: React.MutableRefObject<Map<string, HTMLAudioElement>>;
  uniqueId: string;
}) {
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Validate inputs
    if (!audioPath || !audioFile) {
      return;
    }
    
    // Only create audio in browser
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check if audio already exists for this uniqueId
    if (audioRefsMap.current.has(uniqueId)) {
      const existingAudio = audioRefsMap.current.get(uniqueId);
      if (existingAudio) {
        setAudioRef(existingAudio);
        return;
      }
    }
    
    // Construct the full URL path - ensure it starts with /
    // Remove any trailing slashes from path and leading slashes from file
    const cleanPath = audioPath.replace(/\/+$/, '').replace(/^\/?/, '/');
    const cleanFile = audioFile.replace(/^\/+/, '');
    // Use absolute URL for Audio constructor
    const audioUrl = `${window.location.origin}${cleanPath}/${cleanFile}`;
    
    let audio: HTMLAudioElement | null = null;
    
    try {
      audio = new Audio();
      
      const handleEnded = () => {
        onStop();
      };
      const handleError = (e: ErrorEvent | Event) => {
        // Silently handle errors - don't log to console to reduce noise
        onStop();
      };
      
      // Set up event listeners before setting src
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Set the source
      audio.src = audioUrl;
      audio.preload = 'auto';
      
      setAudioRef(audio);
      
      // Register audio in the map
      audioRefsMap.current.set(uniqueId, audio);
      
      return () => {
        if (audio) {
          // Remove event listeners first
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          
          // Pause and reset
          if (!audio.paused) {
            audio.pause();
          }
          audio.currentTime = 0;
          
          // Don't clear src - just pause and reset, which is sufficient for cleanup
          // Clearing src causes "Invalid URI" errors, and it's not necessary
          
          // Remove from map
          audioRefsMap.current.delete(uniqueId);
        }
      };
    } catch (error) {
      // Silently handle creation errors
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile, audioPath, uniqueId]); // Removed onStop and audioRefsMap from dependencies to prevent re-creation

  // Stop audio when isPlaying becomes false externally (when another sound starts or buttons are clicked)
  useEffect(() => {
    if (audioRef && !isPlaying && !audioRef.paused) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
  }, [isPlaying, audioRef]);

  const togglePlay = () => {
    if (!audioRef) {
      return;
    }
    
    if (isPlaying) {
      // Currently playing - pause it
      audioRef.pause();
      audioRef.currentTime = 0;
      onStop();
    } else {
      // Not playing - stop others first, then play this one
      // Stop other sounds first (excluding this one)
      onPlay();
      
      // Play this audio immediately
      // The audioRef is already created and should be ready
      audioRef.play().catch(error => {
        console.error('Error playing audio:', error, audioFile);
        onStop();
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${audioPath}/${audioFile}`;
    link.download = audioFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colorClasses = colorScheme === 'red' 
    ? {
        border: 'hover:border-red-300',
        gradient: 'from-red-500 to-red-600',
        button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        outline: 'border-red-300 hover:bg-red-50 text-red-700 hover:text-red-800'
      }
    : {
        border: 'hover:border-purple-300',
        gradient: 'from-purple-500 to-purple-600',
        button: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
        outline: 'border-purple-300 hover:bg-purple-50 text-purple-700 hover:text-purple-800'
      };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-2 ${colorClasses.border} bg-gradient-to-br from-white to-gray-50/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 bg-gradient-to-br ${colorClasses.gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Volume2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold text-gray-900 break-words">
              {hideTitle ? (
                <span className="text-gray-400 italic">Click play to listen...</span>
              ) : (
                audioName
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={togglePlay}
            className={`flex-1 bg-gradient-to-r ${colorClasses.button} text-white shadow-md hover:shadow-lg transition-all`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className={colorClasses.outline}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClinicalSoundsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hideLungSoundTitles, setHideLungSoundTitles] = useState(false);
  const [hideHeartSoundTitles, setHideHeartSoundTitles] = useState(false);
  const [activeTab, setActiveTab] = useState<'lung' | 'heart'>('lung');
  
  // Track currently playing sound
  const [playingLungSound, setPlayingLungSound] = useState<string | null>(null);
  const [playingHeartSound, setPlayingHeartSound] = useState<string | null>(null);
  
  // Store audio refs to stop them
  const lungAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const heartAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  // Stop all sounds function (but don't reset state - let the caller do that)
  const stopAllLungSounds = (resetState = true, excludeId?: string) => {
    if (resetState) {
      setPlayingLungSound(null);
    }
    // Stop all lung audio elements except the one we're about to play
    lungAudioRefs.current.forEach((audio, id) => {
      if (id !== excludeId) {
        if (!audio.paused) {
          audio.pause();
        }
        if (audio.currentTime > 0) {
          audio.currentTime = 0;
        }
      }
    });
  };

  const stopAllHeartSounds = (resetState = true, excludeId?: string) => {
    if (resetState) {
      setPlayingHeartSound(null);
    }
    // Stop all heart audio elements except the one we're about to play
    heartAudioRefs.current.forEach((audio, id) => {
      if (id !== excludeId) {
        if (!audio.paused) {
          audio.pause();
        }
        if (audio.currentTime > 0) {
          audio.currentTime = 0;
        }
      }
    });
  };
  
  // Audio lists
  const lungSounds = [
    { file: 'Lung-NormalVesicular.mp3', name: 'Normal Vesicular Breathing' },
    { file: 'Lung-Wheezing.mp3', name: 'Wheezing' },
    { file: 'AsthmaWheezing.mp3', name: 'Asthma Wheezing' },
    { file: 'Lung-CoarseCrackles.mp3', name: 'Coarse Crackles' },
    { file: 'Compressed_Audacity_Crackles-and-Wheezes_Bronchiectasis-in-Cystic-Fibrosis_the-SimTech.mp3', name: 'Crackles and Wheezes (Bronchiectasis in Cystic Fibrosis)' },
    { file: 'Lung-InspiratoryStridor.mp3', name: 'Inspiratory Stridor' },
    { file: 'Lung-PleuralFriction.mp3', name: 'Pleural Friction Rub' },
    { file: 'BreathingVent.mp3', name: 'Ventilator Breathing' },
    { file: 'AgonalBreathing.mp3', name: 'Agonal Breathing' },
    { file: 'DeathRattle.mp3', name: 'Death Rattle' },
    { file: 'WheezingCough.mp3', name: 'Wheezing Cough' },
  ];

  const heartSounds = [
    { file: 'Heart-NormalSplitS1.mp3', name: 'Normal Split S1' },
    { file: 'Heart-NormalSplitSecondSound.mp3', name: 'Normal Split Second Sound' },
    { file: 'Heart-S3.mp3', name: 'S3 Gallop' },
    { file: 'Heart-S4.mp3', name: 'S4 Gallop' },
    { file: 'Heart-EjectionClick.mp3', name: 'Ejection Click' },
    { file: 'Heart-OpeningSnap.mp3', name: 'Opening Snap' },
    { file: 'Heart-EarlySystolicMurmur.mp3', name: 'Early Systolic Murmur' },
    { file: 'Heart-LateSystolicMurmur.mp3', name: 'Late Systolic Murmur' },
    { file: 'Heart-PansystolicMurmur.mp3', name: 'Pansystolic Murmur' },
    { file: 'Heart-DiastolicRumble.mp3', name: 'Diastolic Rumble' },
  ];

  // Randomized order states
  const [lungSoundsOrder, setLungSoundsOrder] = useState<number[]>(lungSounds.map((_, i) => i));
  const [heartSoundsOrder, setHeartSoundsOrder] = useState<number[]>(heartSounds.map((_, i) => i));

  // Shuffle function (Fisher-Yates algorithm)
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const randomizeLungSounds = () => {
    stopAllLungSounds();
    setLungSoundsOrder(shuffleArray(lungSounds.map((_, i) => i)));
  };

  const randomizeHeartSounds = () => {
    stopAllHeartSounds();
    setHeartSoundsOrder(shuffleArray(heartSounds.map((_, i) => i)));
  };

  const handleLungTitleToggle = () => {
    stopAllLungSounds();
    setHideLungSoundTitles(!hideLungSoundTitles);
  };

  const handleHeartTitleToggle = () => {
    stopAllHeartSounds();
    setHideHeartSoundTitles(!hideHeartSoundTitles);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <LoadingScreen message="Loading Clinical Sound Database..." />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Volume2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Clinical Sound Database</h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              Listen to different clinical sounds and practice your auscultation skills
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('lung')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'lung'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              <span>Lung Sounds</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('heart')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'heart'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span>Heart Sounds</span>
            </div>
          </button>
        </div>
      </div>

      {/* Lung Sounds Section */}
      {activeTab === 'lung' && (
      <div>
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lung Sounds</h2>
              <p className="text-sm text-gray-600 mt-1">Listen to different lung sounds and respiratory conditions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLungTitleToggle}
                className="border-purple-300 hover:bg-purple-50 text-purple-700 hover:text-purple-800"
              >
                {hideLungSoundTitles ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Titles
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Titles
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={randomizeLungSounds}
                className="border-purple-300 hover:bg-purple-50 text-purple-700 hover:text-purple-800"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Randomise Sounds
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lungSoundsOrder.map((index) => {
            const audio = lungSounds[index];
            const uniqueId = `lung-${audio.file}`;
            return (
              <SoundPlayer 
                key={`${audio.file}-${index}`} 
                audioFile={audio.file} 
                audioName={audio.name} 
                hideTitle={hideLungSoundTitles}
                audioPath="/audio/respiratory"
                colorScheme="purple"
                isPlaying={playingLungSound === uniqueId}
                onPlay={() => {
                  stopAllLungSounds(false, uniqueId); // Stop others (excluding this one) but don't reset state yet
                  setPlayingLungSound(uniqueId);
                }}
                onStop={() => setPlayingLungSound(null)}
                audioRefsMap={lungAudioRefs}
                uniqueId={uniqueId}
              />
            );
          })}
        </div>
      </div>
      )}

      {/* Heart Sounds Section */}
      {activeTab === 'heart' && (
      <div>
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Heart Sounds</h2>
              <p className="text-sm text-gray-600 mt-1">Listen to different heart sounds and cardiac conditions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleHeartTitleToggle}
                className="border-red-300 hover:bg-red-50 text-red-700 hover:text-red-800"
              >
                {hideHeartSoundTitles ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Titles
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Titles
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={randomizeHeartSounds}
                className="border-red-300 hover:bg-red-50 text-red-700 hover:text-red-800"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Randomise Sounds
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heartSoundsOrder.map((index) => {
            const audio = heartSounds[index];
            const uniqueId = `heart-${audio.file}`;
            return (
              <SoundPlayer 
                key={`${audio.file}-${index}`} 
                audioFile={audio.file} 
                audioName={audio.name} 
                hideTitle={hideHeartSoundTitles}
                audioPath="/audio/cardiovascular"
                colorScheme="red"
                isPlaying={playingHeartSound === uniqueId}
                onPlay={() => {
                  stopAllHeartSounds(false, uniqueId); // Stop others (excluding this one) but don't reset state yet
                  setPlayingHeartSound(uniqueId);
                }}
                onStop={() => setPlayingHeartSound(null)}
                audioRefsMap={heartAudioRefs}
                uniqueId={uniqueId}
              />
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

