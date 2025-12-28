
import React, { useState, useEffect, useRef } from 'react';
import { VideoProject, AspectRatio, Resolution } from './types';
import { generateVideo } from './services/geminiService';
import { ASPECT_RATIOS, RESOLUTIONS, LOADING_MESSAGES } from './constants';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startImageInputRef = useRef<HTMLInputElement>(null);
  const endImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success per instructions
    } catch (e) {
      setError("Failed to open API key selector.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 6000);

    const newProject: VideoProject = {
      id: Math.random().toString(36).substr(2, 9),
      prompt,
      videoUrl: null,
      status: 'pending',
      timestamp: Date.now(),
      config: { aspectRatio, resolution }
    };

    setProjects(prev => [newProject, ...prev]);

    try {
      const videoUrl = await generateVideo(
        prompt,
        {
          aspectRatio,
          resolution,
          startImage: startImage || undefined,
          endImage: endImage || undefined
        },
        (status) => setLoadingMessage(status)
      );

      setProjects(prev => prev.map(p => 
        p.id === newProject.id ? { ...p, status: 'completed', videoUrl } : p
      ));
    } catch (err: any) {
      if (err.message === "API_KEY_ERROR") {
        setApiKeySelected(false);
        setError("API Session expired or invalid project. Please select a valid billing project.");
        await handleSelectKey();
      } else {
        setError(err.message || "Generation failed.");
      }
      setProjects(prev => prev.map(p => 
        p.id === newProject.id ? { ...p, status: 'failed', error: err.message } : p
      ));
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setPrompt('');
      setStartImage(null);
      setEndImage(null);
    }
  };

  if (isCheckingKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!apiKeySelected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-4xl font-bold mb-6 gradient-text">Welcome to Cinematic Veo</h1>
        <p className="text-slate-400 max-w-md mb-8">
          To generate professional-grade videos using Google's Veo model, you need to select a valid API key from a paid GCP project.
        </p>
        <div className="glass p-8 rounded-2xl max-w-md w-full">
          <button 
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Select Paid API Key
          </button>
          <p className="mt-4 text-xs text-slate-500">
            For more info, visit <a href="https://ai.google.dev/gemini-api/docs/billing" className="underline hover:text-blue-400" target="_blank" rel="noopener noreferrer">Billing Docs</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="font-bold text-white">V</span>
          </div>
          <h2 className="text-xl font-bold gradient-text">Veo Studio</h2>
        </div>
        <div className="flex gap-4">
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-medium text-slate-400 hover:text-white transition">New Video</button>
           <div className="h-6 w-px bg-white/10" />
           <button onClick={handleSelectKey} className="text-sm text-blue-400 hover:text-blue-300">Change Project</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <section className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">Create <span className="gradient-text">Anything</span>.</h1>
          <p className="text-slate-400 text-lg">High-fidelity video generation powered by Veo.</p>
        </section>

        <section className="glass rounded-3xl p-6 md:p-8 mb-12 shadow-2xl relative overflow-hidden">
          {isGenerating && (
            <div className="absolute inset-0 z-10 glass flex flex-col items-center justify-center bg-slate-900/80">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
              </div>
              <p className="text-xl font-medium animate-pulse">{loadingMessage}</p>
              <p className="text-sm text-slate-500 mt-2">Veo typically takes 1-3 minutes</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">PROMPT</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Cinematic drone shot of a futuristic neon city during a thunderstorm, hyper-realistic, 8k..."
                className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder-slate-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">ASPECT RATIO</label>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map(ar => (
                    <button 
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value as AspectRatio)}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                        aspectRatio === ar.value 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                        : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">RESOLUTION</label>
                <div className="flex gap-2">
                  {RESOLUTIONS.map(res => (
                    <button 
                      key={res.value}
                      onClick={() => setResolution(res.value as Resolution)}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border transition-all ${
                        resolution === res.value 
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                        : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">FIRST FRAME (OPTIONAL)</label>
                <div 
                  onClick={() => startImageInputRef.current?.click()}
                  className="group relative h-32 bg-slate-900/50 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden"
                >
                  {startImage ? (
                    <img src={startImage} className="w-full h-full object-cover" alt="Start" />
                  ) : (
                    <span className="text-slate-600 group-hover:text-blue-400 transition">Drop or click to upload</span>
                  )}
                  <input 
                    type="file" 
                    ref={startImageInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) setStartImage(await fileToBase64(file));
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">LAST FRAME (OPTIONAL)</label>
                <div 
                  onClick={() => endImageInputRef.current?.click()}
                  className="group relative h-32 bg-slate-900/50 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden"
                >
                  {endImage ? (
                    <img src={endImage} className="w-full h-full object-cover" alt="End" />
                  ) : (
                    <span className="text-slate-600 group-hover:text-purple-400 transition">Drop or click to upload</span>
                  )}
                  <input 
                    type="file" 
                    ref={endImageInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) setEndImage(await fileToBase64(file));
                    }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{isGenerating ? 'Processing...' : 'Generate Cinematic Video'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Your Generations</h3>
            <span className="text-slate-500 text-sm">{projects.length} creations</span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
              </div>
              <p className="text-slate-500">Your visual library is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map(project => (
                <div key={project.id} className="glass rounded-3xl overflow-hidden group border-white/5 hover:border-white/20 transition-all flex flex-col">
                  <div className="aspect-video bg-black relative">
                    {project.status === 'pending' ? (
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-blue-400">Rendering...</span>
                      </div>
                    ) : project.status === 'failed' ? (
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 p-4 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-red-400">{project.error || "Generation error"}</span>
                      </div>
                    ) : (
                      <video 
                        src={project.videoUrl!} 
                        controls 
                        className="w-full h-full object-cover"
                        poster={`https://picsum.photos/seed/${project.id}/800/450`}
                      />
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-slate-300 text-sm line-clamp-2 mb-4 font-medium italic">"{project.prompt}"</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-1 bg-slate-800 rounded uppercase font-bold tracking-widest text-slate-500">
                          {project.config.aspectRatio}
                        </span>
                        <span className="text-[10px] px-2 py-1 bg-slate-800 rounded uppercase font-bold tracking-widest text-slate-500">
                          {project.config.resolution}
                        </span>
                      </div>
                      {project.videoUrl && (
                        <a 
                          href={project.videoUrl} 
                          download={`veo-${project.id}.mp4`}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                        >
                          DOWNLOAD
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
              <span className="font-bold text-black text-xs">V</span>
            </div>
            <h2 className="text-sm font-bold">Veo Studio</h2>
          </div>
          <p className="text-slate-500 text-xs">© 2024 Cinematic Veo AI. Built for the future of visual storytelling.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white text-xs transition">Terms</a>
            <a href="#" className="text-slate-500 hover:text-white text-xs transition">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
