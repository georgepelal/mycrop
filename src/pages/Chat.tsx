import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Sprout, 
  Bot, 
  User, 
  Loader2, 
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Compass
} from "lucide-react";
import Markdown from "react-markdown";
import { Parcel } from "../types";
import FieldPaymentLock from "../components/FieldPaymentLock";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  activeParcel: Parcel;
  onUpdateParcel: (updated: Parcel) => void;
}

const SUGGESTED_PROMPTS = [
  "How should I fix our soil pH level?",
  "Are my crops experiencing water stress?",
  "What fertilizer should I apply given our NPK logs?",
  "Can you explain our satellite NDVI spectrum?"
];

export default function Chat({ activeParcel, onUpdateParcel }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `### 👋 Welcome to MyCrop AI Agronomist Advisor!
      
I am your interactive precision agronomist co-pilot. I have connected directly to the micro-sensor telemetry for your active focus field: **${activeParcel.name}** containing **${activeParcel.cropType}**.

I keep all spectral Sentinel indices (NDVI: **${activeParcel.ndviValue}**, NDWI: **${activeParcel.ndwiValue}**) and soil testing parameters (pH: **${activeParcel.soilPH}**, Nitrogen: **${activeParcel.nitrogen}**, Moisture: **${activeParcel.soilMoisture}%**) in memory to formulate hyper-localized crop guides.

**Ask me anything, or choose a diagnostic query below:**`
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleActivateTelemetry = async (cycle: "monthly" | "yearly", amount: number) => {
    onUpdateParcel({
      ...activeParcel,
      billingStatus: "active",
      billingCycle: cycle,
      billingAmount: amount,
      billingExpiration: new Date(Date.now() + (cycle === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000).toLocaleDateString()
    });
  };

  const isPremiumLocked = activeParcel.billingStatus !== "active";

  if (isPremiumLocked) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-gray-900 tracking-tight">
            MyCrop AI Agronomist Chat
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Consult our regional AI model about custom soil tests, crop defense protocols, and chlorophyll indices.
          </p>
        </div>
        <FieldPaymentLock 
          parcel={activeParcel}
          onActivate={handleActivateTelemetry}
          title="Agronomist Chat Diagnostics Locked"
          description="In order to generate hyper-localized answers referencing Sentinel indices, water stress indexes, and crop parameters, activate premium telemetry streaming for this individual field."
        />
      </div>
    );
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          activeParcel
        }),
      });

      if (!response.ok) {
        throw new Error("Chat feedback error from agronomist node");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "⚠️ **Agronomist Communication Fault**: I could not retrieve calculations from our regional AI model. Please verify your connection or refresh. " 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `### Welcome back!

Reset successful. Ready to analyze **${activeParcel.name}** (**${activeParcel.cropType}**). What agricultural queries do you have?`
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[550px]">
      
      {/* LEFT COLUMN: Context & Active telemetry overview */}
      <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          
          <div className="pb-3 border-b border-gray-150">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-green" />
              <h3 className="font-display font-extrabold text-base text-gray-900">
                AI Advisor Context
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              We send the variables below to ground AI reports into genuine parcel parameters.
            </p>
          </div>

          {/* Active Field Telemetry Panel */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Active Focus Target
            </span>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-brand-green" />
                  {activeParcel.name}
                </span>
                <span className="font-mono text-[10px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded">
                  {activeParcel.cropType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight pt-1 border-t border-gray-150">
                <div>
                  <span className="text-gray-400 block uppercase">Area size:</span>
                  <strong className="text-text-dark">{activeParcel.farmSize} Hectares</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">Soil Class:</span>
                  <strong className="text-text-dark">{activeParcel.soilType}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-sans">NDVI Chlorophyll:</span>
                  <strong className="text-brand-green">{activeParcel.ndviValue}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-sans">Moisture Stress:</span>
                  <strong className="text-blue-600">{activeParcel.ndwiValue} ndwi</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">Soil pH balance:</span>
                  <strong className="text-amber-700">{activeParcel.soilPH} pH</strong>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase">NPK Nitrogen:</span>
                  <strong className="text-emerald-700">{activeParcel.nitrogen}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines box */}
          <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 text-xs space-y-2 text-gray-700 leading-relaxed font-semibold">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Sparkles className="w-4.5 h-4.5" />
              <span>Context Grounding active</span>
            </div>
            <p className="text-[11px] font-medium font-sans">
              Whenever you change your active focused parcel in the My Crops list, the Agronomist AI reboots to absorb the new parcel metadata dynamically!
            </p>
          </div>

        </div>

        {/* Clear chat button */}
        <button
          onClick={clearChat}
          className="w-full text-center text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-155 rounded-xl py-2 cursor-pointer mt-4 transition-colors"
        >
          Reset Discussion History
        </button>
      </div>

      {/* RIGHT COLUMN: Messaging Screen */}
      <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
        
        {/* Scroll Box messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 scrollbar-thin">
          {messages.map((m, idx) => {
            const isBot = m.role === "assistant";
            return (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-[85%] ${
                  isBot ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"
                }`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 h-9 w-9 rounded-xl shrink-0 flex items-center justify-center border ${
                  isBot 
                    ? "bg-brand-green/10 text-brand-green border-brand-green/20" 
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }`}>
                  {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Bubble content */}
                <div className={`rounded-3xl p-4 font-semibold ${
                  isBot 
                    ? "bg-gray-50 border border-gray-200 text-gray-800" 
                    : "bg-brand-green text-white"
                }`}>
                  {isBot ? (
                    <div className="markdown-body prose prose-sm leading-relaxed max-w-none text-xs break-words">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3.5 max-w-[85%] mr-auto text-left">
              <div className="p-2 h-9 w-9 rounded-xl shrink-0 flex items-center justify-center border bg-brand-green/10 text-brand-green border-brand-green/20">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono italic">AI Agronomist is inspecting multispectral indices...</span>
              </div>
            </div>
          )}

          {/* Scroll bottom helper */}
          <div ref={scrollRef} />
        </div>

        {/* Inputs and Prompts toolbar */}
        <div className="pt-4 border-t border-gray-150 space-y-3">
          
          {/* Quick suggestions if chat is short */}
          {messages.length < 4 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-text-dark select-none cursor-pointer text-left py-1.5"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Main typing bar */}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSendMessage(input);
                }
              }}
              placeholder={`Query MyCrop AI about soil pH, nitrogen deficit, or moisture in ${activeParcel.name}...`}
              className="flex-1 text-xs font-semibold border border-gray-200 hover:border-gray-300 focus:border-brand-green focus:outline-none bg-gray-50 p-3 px-4 rounded-xl text-text-dark"
              disabled={loading}
            />
            
            <button
              id="chat-send-btn"
              onClick={() => handleSendMessage(input)}
              disabled={loading || !input.trim()}
              className="bg-brand-green hover:bg-brand-green-hover disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-all text-white p-3 px-4.5 rounded-xl shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
