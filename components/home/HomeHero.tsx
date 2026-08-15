import { MapPin, Sparkles } from 'lucide-react'
import { DeferredBleepyThreeScene } from '@/components/home/DeferredBleepyThreeScene'
import { HomeHeroCtas } from '@/components/home/HomeHeroCtas'

/**
 * Server-rendered hero so the LCP headline is in the first HTML.
 * `bleepy-reveal-group-visible` is present from the start so mobile
 * does not wait on JS to un-hide the text.
 */
export function HomeHero() {
  return (
    <section className="relative min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 overflow-hidden -mt-16 pt-16">
      <DeferredBleepyThreeScene />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="bleepy-hero-orb absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="bleepy-hero-orb bleepy-hero-orb-delay absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex-1 flex items-center justify-center z-10 w-full">
        <div className="bleepy-reveal-group bleepy-reveal-group-visible max-w-4xl mx-auto w-full text-center px-2">
          <div className="bleepy-reveal-item">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-cyan-400/10 border border-cyan-400/20 text-white mb-10">
              <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
              Next-generation medical education platform
            </div>
          </div>

          <div className="bleepy-reveal-item">
            <h1 className="bleepy-hero-lcp font-display text-[1.85rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6rem] font-bold mb-10 leading-[1.08] sm:leading-[1.05] tracking-tight max-w-full px-1">
              <span className="block text-white sm:whitespace-nowrap bleepy-hero-line">Where medical minds</span>
              <span
                className="block bleepy-hero-gradient-line sm:whitespace-nowrap bleepy-hero-line bleepy-hero-line-delay"
                style={{
                  background: 'linear-gradient(90deg, #22d3ee 0%, #67e8f9 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: '#22d3ee',
                }}
              >
                come alive
              </span>
            </h1>
          </div>

          <div className="bleepy-reveal-item">
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Educators organise live teaching sessions. Students book, attend, and learn through AI patient simulations, SBA games, and automatic feedback — all in one immersive platform.
            </p>
          </div>

          <div className="bleepy-reveal-item">
            <HomeHeroCtas />
          </div>
        </div>
      </div>

      <div className="bleepy-reveal-group bleepy-reveal-group-visible relative z-10 pb-10 flex flex-col items-center gap-6 text-slate-500 text-sm">
        <div className="bleepy-reveal-item">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            <MapPin className="h-3 w-3 mr-2 text-cyan-400" />
            Basildon Hospital
          </div>
        </div>
        <div className="bleepy-reveal-item">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-slate-400 rounded-full animate-bounce" />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  )
}
