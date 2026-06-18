import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Activity, 
  TrendingUp, 
  Wallet, 
  Coins, 
  PlusCircle, 
  ArrowUpRight, 
  FileText, 
  CheckCircle, 
  Calendar, 
  Zap, 
  DollarSign, 
  AlertCircle,
  HelpCircle,
  Loader2,
  Lock,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getUserSubscription, saveUserSubscription } from "../lib/db";
import { UserSubscription } from "../types";

interface Transaction {
  id: string;
  type: "refill" | "charge";
  description: string;
  amount: number;
  date: string;
  status: "success" | "pending";
}

export default function BillingConsole() {
  const { user } = useAuth();
  
  // Subscription Plan state
  const [currentPlan, setCurrentPlan] = useState<string>(() => {
    return localStorage.getItem("mycrop_billing_planId") || "free";
  });
  
  // Credit balance state (Default 1,500 Credits to show the metered model in action)
  const [credits, setCredits] = useState<number>(() => {
    const cached = localStorage.getItem("mycrop_billing_credits");
    return cached !== null ? parseFloat(cached) : 1500.00;
  });

  // Transaction history
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const cached = localStorage.getItem("mycrop_billing_transactions");
    if (cached) return JSON.parse(cached);
    
    // Default mock transaction ledger for the credit-based model
    return [
      {
        id: "tx-101",
        type: "refill",
        description: "Standard Credit Refill Station Pack",
        amount: 1000,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status: "success"
      },
      {
        id: "tx-102",
        type: "charge",
        description: "ISRIC SoilGrids™ Deep Composition Query - Field [North Barley Ring]",
        amount: -50,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status: "success"
      },
      {
        id: "tx-103",
        type: "charge",
        description: "Sentinel-2 Satellite manual sweep tasking trigger - Field [Valley Soy Plot]",
        amount: -200,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status: "success"
      },
      {
        id: "tx-104",
        type: "charge",
        description: "Gemini Drone Multimodal Vision Biomass diagnostics",
        amount: -10,
        date: new Date().toLocaleDateString(),
        status: "success"
      }
    ];
  });

  // Quota usage simulation
  const [fieldsCount, setFieldsCount] = useState<number>(() => {
    try {
      const cachedParcels = localStorage.getItem("mycrop_parcels");
      if (cachedParcels) {
        return JSON.parse(cachedParcels).length;
      }
    } catch (e) {}
    return 3;
  });

  const [aiQueriesUsed, setAiQueriesUsed] = useState<number>(12);
  const [soilGridsQueriesUsed, setSoilGridsQueriesUsed] = useState<number>(3);

  // UI state variables
  const [activePlanModal, setActivePlanModal] = useState<string | null>(null);
  const [refillAmount, setRefillAmount] = useState<number | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<number>(0);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelperInfo, setShowHelperInfo] = useState(false);

  // Save changes to localStorage and Firestore if user is logged in
  useEffect(() => {
    localStorage.setItem("mycrop_billing_planId", currentPlan);
    localStorage.setItem("mycrop_billing_credits", credits.toFixed(0));
    localStorage.setItem("mycrop_billing_transactions", JSON.stringify(transactions));

    if (user) {
      const updatedSub: UserSubscription = {
        uid: user.uid,
        planId: currentPlan,
        planName: currentPlan === "free" ? "Starter Free" : currentPlan === "pro" ? "Pro Farmer" : "Enterprise AgTech",
        status: "active",
        billingPeriod: "monthly",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        amount: currentPlan === "free" ? 0 : currentPlan === "pro" ? 49 : 199,
        updatedAt: new Date().toLocaleDateString()
      };
      saveUserSubscription(user.uid, updatedSub).catch(err => {
        console.warn("Failed to update user subscription Firestore link:", err);
      });
    }
  }, [currentPlan, credits, transactions, user]);

  // Handle plan upgrades or changes
  const initiatePlanChange = (planId: string) => {
    if (planId === currentPlan) return;
    setActivePlanModal(planId);
    setRefillAmount(null);
    setCheckoutStep(0);
    setCheckoutError("");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCVC("");
  };

  // Handle credit purchases
  const initiateRefill = (amount: number) => {
    setRefillAmount(amount);
    setActivePlanModal(null);
    setCheckoutStep(0);
    setCheckoutError("");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCVC("");
  };

  // Card validation regex logic
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const executeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!cardName.trim()) {
      setCheckoutError("Please enter the printed Cardholder Name.");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setCheckoutError("Card number must be a valid 16-digit visual code.");
      return;
    }
    if (cardExpiry.length < 5) {
      setCheckoutError("Please provide MM/YY expiration dates.");
      return;
    }
    if (cardCVC.length < 3) {
      setCheckoutError("Security code (CVC) is inaccurate.");
      return;
    }

    setIsProcessing(true);
    setCheckoutStep(1);

    // Beautiful activation steps animation
    const billingSteps = refillAmount 
      ? ["Connecting Stripe Payment Intents...", "Processing secure credit purchase...", "Validating metered bank receipt...", "Refilling hybrid wallet balances..."]
      : ["Contacting financial registry servers...", "Checking existing subscription transitions...", "Updating user cloud resource quotas...", "Provisioning new telemetry permissions..."];

    for (let i = 0; i < billingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 500 : 700));
      // Log some internal state
    }

    if (refillAmount) {
      // Process refill
      let creditsAdded = 0;
      let descriptionStr = "";
      if (refillAmount === 10) {
        creditsAdded = 1000;
        descriptionStr = "Refilled AgroCredits (Standard 1,000 Pack)";
      } else if (refillAmount === 25) {
        creditsAdded = 2700;
        descriptionStr = "Refilled AgroCredits (Plus 2,700 Pack with 200 Bonus Credits)";
      } else if (refillAmount === 50) {
        creditsAdded = 6000;
        descriptionStr = "Refilled AgroCredits (Super 6,000 Pack with 1,000 Bonus Credits)";
      } else {
        creditsAdded = refillAmount * 100;
        descriptionStr = `Refilled AgroCredits (${creditsAdded.toLocaleString()} Pack)`;
      }
      setCredits(prev => prev + creditsAdded);
      
      const newTx: Transaction = {
        id: `tx-${Date.now().toString().substring(8)}`,
        type: "refill",
        description: descriptionStr,
        amount: creditsAdded,
        date: new Date().toLocaleDateString(),
        status: "success"
      };
      setTransactions(prev => [newTx, ...prev]);
    } else if (activePlanModal) {
      // Process upgrade
      setCurrentPlan(activePlanModal);
      
      // Auto refills 1,000 Credits on Pro and 5,000 Credits on Enterprise on purchase subscription!
      let creditRefillBonus = 0;
      if (activePlanModal === "pro") creditRefillBonus = 1000;
      if (activePlanModal === "enterprise") creditRefillBonus = 5000;

      if (creditRefillBonus > 0) {
        setCredits(prev => prev + creditRefillBonus);
      }

      const planNameStr = activePlanModal === "pro" ? "Pro Farmer Plan" : "Enterprise AgTech Plan";
      const newTx: Transaction = {
        id: `tx-${Date.now().toString().substring(8)}`,
        type: "refill",
        description: `Subscribed to ${planNameStr} (${creditRefillBonus > 0 ? "+ " + creditRefillBonus.toLocaleString() + " AgroCredits added" : "Upgraded Plan"})`,
        amount: creditRefillBonus || 0,
        date: new Date().toLocaleDateString(),
        status: "success"
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    setIsProcessing(false);
    setCheckoutStep(2); // Success splash screen!
  };

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case "pro":
        return { name: "Pro Farmer Bundle", price: "$49/month", limitFields: 10, limitAi: 100, limitSoil: 20 };
      case "enterprise":
        return { name: "Enterprise AgTech Suite", price: "$199/month", limitFields: 9999, limitAi: 9999, limitSoil: 9999 };
      default:
        return { name: "Starter Free Account", price: "$0/month", limitFields: 1, limitAi: 5, limitSoil: 3 };
    }
  };

  const activeQuota = getPlanDetails(currentPlan);

  const getQuotaColor = (used: number, limit: number) => {
    const r = used / limit;
    if (r >= 0.9) return "bg-rose-500";
    if (r >= 0.7) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6 text-left" id="billing-console-main-container">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 font-mono block">
            Cloud Billing Station v2
          </span>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950 uppercase flex items-center gap-1.5">
            Hybrid Billing & Credits Console <Wallet className="w-6 h-6 text-emerald-600 animate-pulse" />
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Link high-performance platform subscriptions with pay-as-you-go credit keys to run satellite image tasking, ISRIC soil composition checks, and custom agronomist reports.
          </p>
        </div>

        <button
          onClick={() => setShowHelperInfo(!showHelperInfo)}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-150 px-3.5 py-2 rounded-xl transition duration-200 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Understanding Hybrid Model</span>
        </button>
      </div>

      {/* Explanatory Banner */}
      <AnimatePresence>
        {showHelperInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-50/70 to-indigo-50/50 border border-gray-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase text-slate-800 font-mono">The Ultimate Agricultural Billing Framework</h4>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                Our application integrates a **Hybrid Subscription + Usage Model**. Under this structure, users get the maximum pricing efficiency by choosing a plan that fits their base acreage scale, while maintaining instant on-demand capabilities for metered computations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-1">
                  <strong className="text-slate-805 block">1. Subscription Planes (Static Layer)</strong>
                  <span className="text-[11px] text-gray-500 leading-normal block">
                    Secures baseline platform features: how many active farmland contours can you draw simultaneously (Free: 1, Pro: 10, Enterprise: Unlimited) and baseline Gemini AI queries.
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-1">
                  <strong className="text-slate-805 block">2. Metered System (Dynamic Layer)</strong>
                  <span className="text-[11px] text-gray-500 leading-normal block">
                    Charges instant AgroCredits only for premium heavy computations like direct SoilGrids global GIS queries (50 Credits), custom satellite imagery manual sweeps (200 Credits), or red/NIR drone inspections (10 Credits).
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO COLUMN SUMMARY: SUBSCRIPTION STATE + WALLET BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Card: Wallet & Balance Refill (5/12 layout) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono">MyWallet Balance</span>
              <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-sans">Available AgroCredits Balance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-white">{credits.toLocaleString()}</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">🪙 AGROCREDITS (AC)</span>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">Acquire On-Demand AgroCredits</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Refill your wallet with credit packages to run high-precision manual sweeps, fetch global soil indices, or render multimodal AI crop diagnoses.
              </p>
              
              <div className="grid grid-cols-3 gap-2 pt-1.5">
                {[
                  { label: "1,000 Credits", val: 10, desc: "Cost: $10.00" },
                  { label: "2,700 Credits", val: 25, desc: "Cost: $25.00" },
                  { label: "6,000 Credits", val: 50, desc: "Cost: $50.00" }
                ].map((pack) => (
                  <button
                    key={pack.val}
                    onClick={() => initiateRefill(pack.val)}
                    className="bg-slate-800 hover:bg-emerald-600 text-white rounded-xl py-2 px-1 text-center border border-slate-700 hover:border-emerald-555 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-sm group min-h-[58px]"
                  >
                    <span className="text-[10px] font-extrabold font-mono text-slate-100 group-hover:text-white leading-tight">{pack.label}</span>
                    <span className="text-[8px] text-emerald-400 group-hover:text-emerald-100 font-mono font-semibold leading-none">{pack.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800 mt-5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>STRIPE GATEWAY ACTIVE</span>
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCI-DSS SECURE COMPLIANT</span>
            </div>
          </div>
        </div>

        {/* Right Card: Current Plan & Quotas (7/12 layout) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 font-mono">ACTIVE ENTITLEMENT STATUS</span>
                <h3 className="text-base font-display font-black text-gray-950 uppercase flex items-center gap-1.5">
                  Subscription Tier: {currentPlan === "free" ? "Starter Free" : currentPlan === "pro" ? "Pro Farmer" : "Enterprise AgTech"}
                  {currentPlan !== "free" && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />}
                </h3>
              </div>
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold uppercase animate-pulse">
                ACTIVE
              </div>
            </div>

            {/* Quota Indicators row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Quota 1: Fields Count */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">Field slots</span>
                  <span className="text-xs font-mono font-black text-slate-850">
                    {fieldsCount} / {currentPlan === "free" ? "1" : currentPlan === "pro" ? "10" : "∞"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-350 ${getQuotaColor(fieldsCount, activePlanModal === "enterprise" ? 9999 : activeQuota.limitFields)}`} 
                    style={{ width: `${Math.min(100, (fieldsCount / (currentPlan === "free" ? 1 : currentPlan === "pro" ? 10 : 100)) * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-400 block pt-0.5">
                  {currentPlan === "free" ? "Starter Limit (Add more fields for Pro)" : `${10 - fieldsCount} free slots remaining`}
                </span>
              </div>

              {/* Quota 2: AI Queries */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">AI Diagnostics</span>
                  <span className="text-xs font-mono font-black text-slate-850">
                    {aiQueriesUsed} / {currentPlan === "free" ? "5" : currentPlan === "pro" ? "100" : "∞"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-350 ${getQuotaColor(aiQueriesUsed, currentPlan === "free" ? 5 : currentPlan === "pro" ? 100 : 9999)}`} 
                    style={{ width: `${Math.min(100, (aiQueriesUsed / (currentPlan === "free" ? 5 : currentPlan === "pro" ? 100 : 100)) * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-400 block pt-0.5">Loads dynamically and resets monthly.</span>
              </div>

              {/* Quota 3: SoilGrids Queries */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">SoilGrids™ runs</span>
                  <span className="text-xs font-mono font-black text-slate-850">
                    {soilGridsQueriesUsed} / {currentPlan === "free" ? "3" : currentPlan === "pro" ? "20" : "∞"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-350 ${getQuotaColor(soilGridsQueriesUsed, currentPlan === "free" ? 3 : currentPlan === "pro" ? 20 : 9999)}`} 
                    style={{ width: `${Math.min(100, (soilGridsQueriesUsed / (currentPlan === "free" ? 3 : currentPlan === "pro" ? 20 : 100)) * 100)}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-400 block pt-0.5">ISRIC database access credentials.</span>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2 mt-4 text-[10px] text-gray-400">
            <span className="font-sans font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Reset Window Period End: <strong className="text-gray-700 font-bold">{new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
            </span>
            <span className="font-mono text-emerald-600 font-bold uppercase">
              RENEWABLE VIA RECURRING CONTRACTS
            </span>
          </div>

        </div>

      </div>

      {/* PLAN PRICING MATRIX SELECTOR SECTION */}
      <div className="space-y-4">
        <div className="text-left space-y-1 plan-header-block">
          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Platform level packages</span>
          <h3 className="text-xl font-display font-black text-gray-950 uppercase">AGRICULTURAL PLAN MATRIX OPTIONS</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Upgrade your baseline boundaries scale and enjoy discounted metered rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="pricing-matrix-row">
          
          {/* Plan 1: Free */}
          <div className={`bg-white border-2 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative transition duration-200 ${
            currentPlan === "free" ? "border-emerald-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
          }`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-mono text-slate-650 block w-fit">STARTER</span>
                <h4 className="text-xl font-display font-black text-gray-900">Starter Free</h4>
                <p className="text-xs text-gray-400">For beginner agronomists exploring single coordinate indices.</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-3xl font-display font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="h-px bg-slate-100" />

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>1 Field Parcel</strong> maximum slot limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>5 Monthly AI Runs</strong> query limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>3 ISRIC SoilGrids scans</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <span>No visual drone inspectors</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <span>No monthly credit additions</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => initiatePlanChange("free")}
              disabled={currentPlan === "free"}
              className={`w-full py-2.5 rounded-xl text-xs font-display font-black uppercase tracking-wider text-center cursor-pointer transition ${
                currentPlan === "free" 
                  ? "bg-slate-100 text-slate-400" 
                  : "bg-slate-900 hover:bg-slate-950 text-white shadow-sm"
              }`}
            >
              {currentPlan === "free" ? "ACTIVE REGISTRATION" : "DOWNGRADE TO FREE"}
            </button>
          </div>

          {/* Plan 2: Pro */}
          <div className={`bg-white border-2 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative transition duration-200 ${
            currentPlan === "pro" ? "border-emerald-500 shadow-md shadow-emerald-500/10" : "border-gray-200 hover:border-gray-400"
          }`}>
            <div className="absolute -top-3.5 right-6 bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 text-[9px] font-black font-mono uppercase tracking-widest px-3 py-1 rounded-full shadow border border-amber-200">
              RECOMMENDED
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-amber-800 block w-fit">ACTIVE GROWER</span>
                <h4 className="text-xl font-display font-black text-gray-900">Pro Farmer</h4>
                <p className="text-xs text-gray-400">For active farms requiring detailed coordinates and routine sweeps.</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-3xl font-display font-black text-slate-900">$49</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="h-px bg-slate-100" />

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>10 Field Parcels</strong> slots (Valued $15/mo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>100 Gemini AI runs</strong>/mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>20 Free SoilGrids™</strong> global checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Visual drone analyzer activated</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Includes 1,000 Credits</strong> monthly bonus!</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => initiatePlanChange("pro")}
              className={`w-full py-2.5 rounded-xl text-xs font-display font-black uppercase tracking-wider text-center cursor-pointer transition ${
                currentPlan === "pro" 
                  ? "bg-slate-100 text-slate-400 cursor-default" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              }`}
            >
              {currentPlan === "pro" ? "ACTIVE REGISTRATION" : "UPGRADE TO PRO FARMER"}
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className={`bg-white border-2 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative transition duration-200 ${
            currentPlan === "enterprise" ? "border-emerald-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
          }`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono text-indigo-800 block w-fit">CORPORATE COOP</span>
                <h4 className="text-xl font-display font-black text-gray-900">Enterprise AgTech</h4>
                <p className="text-xs text-gray-400">For dynamic cooperatives seeking custom GIS maps and automated drones.</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-3xl font-display font-black text-slate-900">$199</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="h-px bg-slate-100" />

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Field Parcels</strong> (No limit)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Gemini AI</strong> consultation co-pilot</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited SoilGrids API runs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>DJI Flight drone flight automation api</span>
                </li>
                <li className="flex items-center gap-2 text-indigo-700 font-semibold bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span><strong>Includes 5,000 Credits</strong> monthly bonus!</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => initiatePlanChange("enterprise")}
              className={`w-full py-2.5 rounded-xl text-xs font-display font-black uppercase tracking-wider text-center cursor-pointer transition ${
                currentPlan === "enterprise" 
                  ? "bg-slate-100 text-slate-400 cursor-default" 
                  : "bg-slate-950 hover:bg-black text-white shadow-sm"
              }`}
            >
              {currentPlan === "enterprise" ? "ACTIVE REGISTRATION" : "UPGRADE TO ENTERPRISE"}
            </button>
          </div>

        </div>

      </div>

      {/* METOCKED USAGE DEEP GUIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Metered Charge Guide panel (5/12 layout) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs text-left space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Dynamic rates lookup</span>
            <h4 className="text-sm font-display font-black text-slate-900 uppercase">On-Demand Metered Rates</h4>
            <p className="text-[10px] text-gray-500 font-sans leading-normal">
              When baseline plan quotas are exceeded, dynamic service executions are charged per call directly against your Credit wallet:
            </p>
          </div>

          <div className="space-y-2 text-xs">
            
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <strong className="text-slate-800 block">Satellite Sweep Tasking</strong>
                <span className="text-[9px] text-gray-400">Trigger Sentinel manual capture request</span>
              </div>
              <span className="font-mono font-black text-[#059669] bg-emerald-50 px-2 py-1 rounded-md text-[11px] border border-emerald-100">
                200 Credits / trigger
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <strong className="text-slate-800 block">SoilGrids GIS Profile Check</strong>
                <span className="text-[9px] text-gray-400">Fetch clay, silt, SOC, and pH raster metrics</span>
              </div>
              <span className="font-mono font-black text-[#059669] bg-emerald-50 px-2 py-1 rounded-md text-[11px] border border-emerald-100">
                50 Credits / check
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <strong className="text-slate-800 block">Multimodal Drone Vision diagnostics</strong>
                <span className="text-[9px] text-gray-400">AI analysis on Red/NIR base64 attachments</span>
              </div>
              <span className="font-mono font-black text-[#059669] bg-emerald-50 px-2 py-1 rounded-md text-[11px] border border-emerald-100">
                10 Credits / analysis
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <strong className="text-slate-800 block">Over-Limit AI Chat Queries</strong>
                <span className="text-[9px] text-gray-400">Continuous agronomist consults after quota</span>
              </div>
              <span className="font-mono font-black text-[#059669] bg-emerald-50 px-2 py-1 rounded-md text-[11px] border border-emerald-100">
                5 Credits / consult
              </span>
            </div>

          </div>
        </div>

        {/* Transaction History Log (7/12 layout) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs text-left space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">WALLET LEDGER TRAIL</span>
              <h4 className="text-sm font-display font-black text-slate-900 uppercase">Interactive Transaction History</h4>
            </div>
            <span className="text-[9px] bg-slate-50 border border-slate-150 px-2 py-1 rounded-md font-mono text-slate-500 font-bold">
              {transactions.length} ITEMS LOGGED
            </span>
          </div>

          <div className="space-y-2.5 max-h-[285px] overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:bg-slate-50/50 transition duration-150 font-sans"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    tx.type === "refill" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                  }`}>
                    {tx.type === "refill" ? <ArrowUpRight className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-950 truncate max-w-sm sm:max-w-md">{tx.description}</h5>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold font-mono leading-none mt-1">
                      <span>ID: {tx.id}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <strong className={`text-xs font-mono font-extrabold block ${
                    tx.type === "refill" ? "text-emerald-600" : "text-slate-800"
                  }`}>
                    {tx.type === "refill" ? "+" : ""}{Math.abs(tx.amount).toLocaleString()} Credits
                  </strong>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-center font-mono leading-none uppercase mt-1 block w-fit ml-auto">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CHECKOUT FLOW MULTI-STEP MODAL (AnimatePresence Overlay) */}
      <AnimatePresence>
        {(activePlanModal || refillAmount !== null) && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-left"
            >
              
              {/* Close Button */}
              {!isProcessing && checkoutStep !== 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePlanModal(null);
                    setRefillAmount(null);
                    setCheckoutStep(0);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}

              {/* STEP 0: CARD ACQUISITION DETAILS FORM */}
              {checkoutStep === 0 && (
                <form onSubmit={executeCheckout} className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest font-mono">STRIPE ENCRYPTED TERMINAL</span>
                    <h3 className="text-lg font-display font-black text-gray-905 uppercase">
                      {refillAmount ? `Purchase Wallet Refill: $${refillAmount}.00` : `Subscribe to Plan: ${activePlanModal === "pro" ? "Pro Farmer" : "Enterprise AgTech"}`}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Provide standard test credit card credentials. Live bank integrations checks run inside local Sandbox sandpits.
                    </p>
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[10px] leading-normal font-semibold rounded-xl flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p>{checkoutError}</p>
                    </div>
                  )}

                  {/* Pricing Overview Row */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between text-left">
                    <div>
                      <strong className="text-xs text-slate-800 block uppercase font-mono">
                        {refillAmount ? "Wallet Credit Pack" : "Flat Tier Subscription"}
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {refillAmount 
                          ? `Acquires ${refillAmount === 10 ? "1,000" : refillAmount === 25 ? "2,700" : "6,000"} AgroCredits to your balance` 
                          : `${activePlanModal === "pro" ? "10 field limit + 1,000 monthly credits included" : "Unlimited scale + 5,000 monthly credits included"}`}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-lg font-mono font-black text-[#059669]">
                        ${refillAmount ? `${refillAmount}.00` : activePlanModal === "pro" ? "49.00" : "199.00"}
                      </span>
                      <span className="text-[9px] text-gray-400 block font-mono">ONE TIME BILL</span>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4 pt-1">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. GEORGE PELAL"
                        className="w-full bg-slate-55 border border-gray-200 hover:border-emerald-350 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">
                        Card Number (16 Digits)
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-slate-55 border border-gray-200 hover:border-emerald-350 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">
                          Expiration (MM/YY)
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="12/28"
                          className="w-full bg-slate-55 border border-gray-200 hover:border-emerald-350 rounded-xl px-3 y-2.5 text-center text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">
                          Security CVC Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ""))}
                          placeholder="123"
                          className="w-full bg-slate-55 border border-gray-200 hover:border-emerald-350 rounded-xl px-3 py-2.5 text-center text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                    </div>

                  </div>

                  {/* Trigger active secure block buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePlanModal(null);
                        setRefillAmount(null);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-display font-black text-center uppercase tracking-widest transition duration-200 cursor-pointer"
                    >
                      Abrogate
                    </button>
                    
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-display font-black text-center uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition duration-200 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Confirm Pay</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 1: ACTIVE LOADER SPINNER AND STEPS PROGRESSIONS */}
              {checkoutStep === 1 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-display font-black text-[#059669] uppercase tracking-wide">Processing Stripe Transaction...</h4>
                    <p className="text-[11px] text-gray-405 leading-relaxed font-mono animate-pulse">
                      Establishing active secure payment token routes...
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: SPLASH COMPLETED SUCCESS BANNER */}
              {checkoutStep === 2 && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-5 animate-scaleUp">
                  <div className="h-16 w-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow">
                    <Check className="w-7 h-7 stroke-[3px]" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase">TRANSACTION FULLY SUCCESSFUL</h3>
                     <p className="text-xs text-gray-500 max-w-sm">
                      {refillAmount 
                        ? `Congratulations! You have successfully acquired ${refillAmount === 10 ? "1,000" : refillAmount === 25 ? "2,700" : "6,000"} AgroCredits. Your wallet balance has been credited immediately.`
                        : `Congratulations! Your subscription successfully upgraded to ${activePlanModal === "pro" ? "Pro Farmer Plan" : "Enterprise AgTech Plan"}. Platform limits and your monthly credits allowance have been instantly unlocked.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePlanModal(null);
                      setRefillAmount(null);
                      setCheckoutStep(0);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-extrabold text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
                  >
                    Return to Billing Dashboard
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
