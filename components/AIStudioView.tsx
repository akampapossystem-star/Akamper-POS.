import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, ImageIcon, Video as VideoIcon, Search, MapPin, 
  BrainCircuit, Zap, Upload, Wand2, PlayCircle, 
  MessageSquare, Loader2, Camera, Download, ExternalLink,
  ChevronRight, AspectRatio, AlertTriangle, Key, X, Mic, Volume2,
  FileText, Languages, Film
} from 'lucide-react';
import { 
  editImageWithAI, 
  generateImageWithAI, 
  analyzeMediaWithAI, 
  complexQueryWithThinking, 
  searchGroundingWithAI, 
  animateImageWithVeo,
  generateVideoWithVeo,
  fastResponseWithAI,
  generateSpeechWithAI,
  transcribeAudioWithAI,
  decodeBase64,
  decodeAudioData
} from '../services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

const AIStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'GROUNDING' | 'INTELLIGENCE' | 'VOICE'>('VISUAL');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedSize, setSelectedSize] = useState('1K');
  const [mediaFile, setMediaFile] = useState<{data: string, type: string} | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFile({ data: (reader.result as string).split(',')[1], type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const ensureApiKey = async () => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const playRawPcm = async (base64Data: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const bytes = decodeBase64(base64Data);
    const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  };

  const handleRunTask = async (task: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      await ensureApiKey();
      let res;
      switch(task) {
        case 'GEN_IMAGE':
          res = await generateImageWithAI(prompt, selectedRatio, selectedSize);
          setResult({ type: 'image', url: res });
          break;
        case 'EDIT_IMAGE':
          if (!mediaFile) throw new Error("Please upload an image first");
          res = await editImageWithAI(mediaFile.data, mediaFile.type, prompt);
          setResult({ type: 'image', url: res });
          break;
        case 'GEN_VIDEO':
          res = await generateVideoWithVeo(prompt, selectedRatio as any);
          setResult({ type: 'video', url: res });
          break;
        case 'ANIMATE':
          if (!mediaFile) throw new Error("Please upload an image first");
          res = await animateImageWithVeo(mediaFile.data, mediaFile.type, prompt, selectedRatio as any);
          setResult({ type: 'video', url: res });
          break;
        case 'ANALYZE':
          if (!mediaFile) throw new Error("Please upload media first");
          res = await analyzeMediaWithAI(mediaFile.data, mediaFile.type, prompt);
          setResult({ type: 'text', content: res });
          break;
        case 'SEARCH':
          res = await searchGroundingWithAI(prompt, false);
          setResult({ type: 'grounding', data: res });
          break;
        case 'MAPS':
          res = await searchGroundingWithAI(prompt, true);
          setResult({ type: 'grounding', data: res });
          break;
        case 'THINK':
          res = await complexQueryWithThinking(prompt);
          setResult({ type: 'text', content: res });
          break;
        case 'FAST':
          res = await fastResponseWithAI(prompt);
          setResult({ type: 'text', content: res });
          break;
        case 'TTS':
          res = await generateSpeechWithAI(prompt);
          if (res) await playRawPcm(res);
          setResult({ type: 'text', content: "Speech generated and playing..." });
          break;
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        await window.aistudio?.openSelectKey();
      }
      setResult({ type: 'error', message: err.message || "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const startTranscriptionRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                setIsLoading(true);
                try {
                    const text = await transcribeAudioWithAI(base64Audio, 'audio/webm');
                    setResult({ type: 'text', content: text });
                } catch (e: any) {
                    setResult({ type: 'error', message: e.message });
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsDataURL(audioBlob);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic Error:", err);
    }
  };

  const stopTranscriptionRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const startVoiceChat = async () => {
    setTranscription('Starting session...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: () => {
                    setTranscription('Mic Active. Speak now...');
                    const source = inputCtx.createMediaStreamSource(stream);
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                        const binary = String.fromCharCode(...new Uint8Array(int16.buffer));
                        sessionPromise.then(s => s.sendRealtimeInput({ 
                            media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } 
                        }));
                    };
                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                        await playRawPcm(msg.serverContent.modelTurn.parts[0].inlineData.data);
                    }
                    if (msg.serverContent?.outputTranscription) {
                        setTranscription(prev => prev + ' ' + msg.serverContent?.outputTranscription?.text);
                    }
                },
                onerror: (e) => console.error("Live Error", e),
                onclose: () => setTranscription('Session closed.')
            },
            config: {
                responseModalities: [Modality.AUDIO],
                outputAudioTranscription: {},
                systemInstruction: 'You are a helpful and friendly assistant.'
            }
        });
    } catch (e) {
        console.error("Mic Access Denied", e);
        setTranscription('Mic Access Error');
    }
  };

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">AI Innovation Lab</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Multi-Model Gemini Playground</p>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl shadow-inner">
          <button onClick={() => { setActiveTab('VISUAL'); setResult(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'VISUAL' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Visuals</button>
          <button onClick={() => { setActiveTab('GROUNDING'); setResult(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'GROUNDING' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Grounding</button>
          <button onClick={() => { setActiveTab('INTELLIGENCE'); setResult(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'INTELLIGENCE' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Logic</button>
          <button onClick={() => { setActiveTab('VOICE'); setResult(null); }} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'VOICE' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Voice</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-[450px] border-r border-slate-800 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          
          {activeTab !== 'VOICE' && (
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Prompt</label>
                <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want Gemini to create or solve..."
                className="w-full h-32 p-4 bg-slate-900 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm resize-none"
                />
            </div>
          )}

          {activeTab === 'VISUAL' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference Media (Required for Edit/Animate/Analyze)</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group ${mediaFile ? 'border-purple-500/50 bg-purple-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'}`}
                >
                    {mediaFile ? (
                    <div className="relative w-full h-full p-2">
                        {mediaFile.type.startsWith('video') ? (
                            <video src={`data:${mediaFile.type};base64,${mediaFile.data}`} className="w-full h-full object-contain rounded-2xl" />
                        ) : (
                            <img src={`data:${mediaFile.type};base64,${mediaFile.data}`} className="w-full h-full object-contain rounded-2xl" alt="Preview" />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setMediaFile(null); }} className="absolute top-4 right-4 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4"/></button>
                    </div>
                    ) : (
                    <>
                        <Upload className="w-10 h-10 text-slate-600 group-hover:text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300">Upload Photo or Video</span>
                    </>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp,.svg" onChange={handleFileUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aspect Ratio</label>
                  <select value={selectedRatio} onChange={(e) => setSelectedRatio(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-xs">
                    {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output Quality</label>
                  <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-xs">
                    {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'VOICE' && (
              <div className="flex-1 flex flex-col gap-6">
                  <div className="p-8 bg-blue-600/10 rounded-[3rem] border border-blue-500/20 text-center">
                    <Mic className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-black uppercase">Live Conversational AI</h3>
                    <p className="text-slate-500 text-xs mt-2">Zero-latency real-time voice chat powered by Gemini 2.5 Native Audio.</p>
                  </div>
                  <button onClick={startVoiceChat} className="w-full py-5 bg-blue-600 hover:bg-blue-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                     <PlayCircle className="w-6 h-6" /> Start Voice Chat
                  </button>

                  <div className="p-6 bg-purple-600/10 rounded-3xl border border-purple-500/20 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Languages className="w-4 h-4" /> Audio Transcription</h4>
                    <p className="text-slate-400 text-[10px]">Record a short clip and transcribe it instantly using Gemini 3 Flash.</p>
                    {!isRecording ? (
                        <button onClick={startTranscriptionRecording} className="w-full py-3 bg-purple-600 hover:bg-purple-50 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2">
                            <Mic className="w-4 h-4" /> Start Recording
                        </button>
                    ) : (
                        <button onClick={stopTranscriptionRecording} className="w-full py-3 bg-red-600 hover:bg-red-50 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 animate-pulse">
                            <X className="w-4 h-4" /> Stop & Transcribe
                        </button>
                    )}
                  </div>
              </div>
          )}

          <div className="flex flex-col gap-3 mt-auto">
            {activeTab === 'VISUAL' && (
              <>
                <button onClick={() => handleRunTask('GEN_IMAGE')} disabled={isLoading || !prompt} className="py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Wand2 className="w-5 h-5" /> Generate Image (Pro)
                </button>
                <button onClick={() => handleRunTask('EDIT_IMAGE')} disabled={isLoading || !prompt || !mediaFile} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <ImageIcon className="w-5 h-5 text-purple-400" /> Edit Uploaded Image
                </button>
                <button onClick={() => handleRunTask('GEN_VIDEO')} disabled={isLoading || !prompt} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Film className="w-5 h-5 text-orange-400" /> Prompt Video (Veo)
                </button>
                <button onClick={() => handleRunTask('ANIMATE')} disabled={isLoading || !mediaFile} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <PlayCircle className="w-5 h-5 text-blue-400" /> Animate Image (Veo)
                </button>
                <button onClick={() => handleRunTask('ANALYZE')} disabled={isLoading || !mediaFile} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Camera className="w-5 h-5 text-emerald-400" /> Media Understanding
                </button>
              </>
            )}

            {activeTab === 'GROUNDING' && (
              <>
                <button onClick={() => handleRunTask('SEARCH')} disabled={isLoading || !prompt} className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Search className="w-5 h-5" /> Live Search Grounding
                </button>
                <button onClick={() => handleRunTask('MAPS')} disabled={isLoading || !prompt} className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <MapPin className="w-5 h-5" /> Google Maps Grounding
                </button>
              </>
            )}

            {activeTab === 'INTELLIGENCE' && (
              <>
                <button onClick={() => handleRunTask('THINK')} disabled={isLoading || !prompt} className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <BrainCircuit className="w-5 h-5" /> Deep Thinking Logic
                </button>
                <button onClick={() => handleRunTask('FAST')} disabled={isLoading || !prompt} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Zap className="w-5 h-5 text-yellow-400" /> Low Latency Response
                </button>
                <button onClick={() => handleRunTask('TTS')} disabled={isLoading || !prompt} className="py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Volume2 className="w-5 h-5 text-green-400" /> Speech Generation
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="flex-1 bg-slate-900/30 p-8 flex flex-col items-center justify-center relative">
          
          {isLoading ? (
            <div className="flex flex-col items-center text-purple-400">
              <Loader2 className="w-16 h-16 animate-spin mb-6" />
              <h2 className="text-xl font-black uppercase tracking-tighter animate-pulse">Gemini is Reasoning</h2>
              <p className="text-xs mt-2 text-slate-500 font-bold uppercase tracking-widest">Processing complex multimodal data...</p>
            </div>
          ) : result ? (
            <div className="w-full h-full flex flex-col animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Output Node</h3>
                 <div className="flex gap-2">
                    {result.url && (
                        <a href={result.url} download="ai_output" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"><Download className="w-4 h-4"/></a>
                    )}
                    <button onClick={() => setResult(null)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"><X className="w-4 h-4"/></button>
                 </div>
              </div>

              <div className="flex-1 bg-black/40 rounded-[3rem] border border-slate-800 overflow-hidden flex items-center justify-center p-8 relative">
                 
                 {result.type === 'image' && (
                    <img src={result.url} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl" alt="AI Output" />
                 )}

                 {result.type === 'video' && (
                    <video src={result.url} className="max-w-full max-h-full shadow-2xl rounded-2xl" controls autoPlay loop />
                 )}

                 {result.type === 'text' && (
                    <div className="w-full h-full overflow-y-auto custom-scrollbar text-slate-200 font-medium leading-relaxed p-6 whitespace-pre-wrap text-lg">
                       {result.content}
                    </div>
                 )}

                 {result.type === 'grounding' && (
                    <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 space-y-8">
                        <div className="text-slate-100 text-xl leading-relaxed whitespace-pre-wrap font-semibold">{result.data.text}</div>
                        {result.data.grounding.length > 0 && (
                            <div className="pt-8 border-t border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Sources & Evidence</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.data.grounding.map((chunk: any, i: number) => {
                                        const web = chunk.web || chunk.maps;
                                        if (!web) return null;
                                        return (
                                            <a key={i} href={web.uri} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-blue-500/50 transition-all flex items-center justify-between group">
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-sm font-bold text-white truncate">{web.title || (chunk.maps ? 'Location Context' : 'Verified Source')}</p>
                                                    <p className="text-[10px] text-slate-500 truncate mt-1">{web.uri}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400 shrink-0" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                 )}

                 {result.type === 'error' && (
                    <div className="text-center p-8">
                       <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                       <h4 className="text-xl font-black uppercase text-red-400">System Interruption</h4>
                       <p className="text-slate-500 mt-2 font-medium">{result.message}</p>
                       <button onClick={() => window.aistudio?.openSelectKey()} className="mt-8 px-8 py-3 bg-red-600/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-red-600/20">
                           <Key className="w-4 h-4"/> Authenticate API Key
                       </button>
                    </div>
                 )}
              </div>
            </div>
          ) : activeTab === 'VOICE' ? (
              <div className="w-full h-full flex flex-col">
                  <div className="p-6 text-center border-b border-slate-800">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Real-time Multimodal Feed</h3>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto font-mono text-blue-400 leading-relaxed custom-scrollbar bg-black/20 rounded-b-3xl">
                      {transcription || "System idle. Initiate voice session to begin streaming intelligence..."}
                  </div>
              </div>
          ) : (
            <div className="flex flex-col items-center text-slate-700 max-w-sm text-center">
              <Sparkles className="w-20 h-20 mb-6 opacity-20 text-purple-500" />
              <h2 className="text-xl font-bold uppercase tracking-widest opacity-40">Intelligence Node Ready</h2>
              <p className="text-sm mt-4 leading-relaxed font-medium opacity-30 italic">Select a module on the left to leverage Gemini's world-class reasoning, generation, and multimodal understanding.</p>
            </div>
          )}

          {/* Key Notice */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
             <Key className="w-3 h-3" /> Dedicated Environment Node
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudioView;