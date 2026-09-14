import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Lock, 
  Loader2, 
  Check, 
  HelpCircle,
  TrendingUp,
  Layers,
  Calendar,
  Wallet,
  ArrowRight,
  Info
} from "lucide-react";
import { Parcel, calculateFieldRate } from "../types";

interface FieldPaymentLockProps {
  parcel: Parcel;
  onActivate: (billingCycle: "monthly" | "yearly", amount: number) => Promise<void>;
  title?: string;
  description?: string;
}

export default function FieldPaymentLock({ 
  parcel, 
  onActivate,
  title = "Unlock Premium Remote Sensing & AI Diagnostics",
  description = "Activate hyper-localized Sentinel-2 satellite indexes, NDVI crop vigor predictions, hydrological stress indicators, and interactive Agronomist AI co-pilot consultations calibrated for this custom parcel."
}: FieldPaymentLockProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Hybrid Model States loaded from local storage
  const [planId, setPlanId] = useState<string>("free");
  const [credits, setCredits] = useState<number>(15.00);

  useEffect(() => {
    const cachedPlan = localStorage.getItem("mycrop_billing_planId") || "free";
    const cachedCredits = localStorage.getItem("mycrop_billing_credits");
    setPlanId(cachedPlan);
    if (cachedCredits !== null) {
      setCredits(parseFloat(cachedCredits));
    }
  }, []);

  const rates = calculateFieldRate(parcel.farmSize);
  const currentPrice = billingCycle === "monthly" ? rates.monthly : rates.yearly;
  const cycleLabel = billingCycle === "monthly" ? "/month" : "/year";

  const isProOrEnterprise = planId === "pro" || planId === "enterprise";

  // Mock activation steps
  const activationSteps = [
    "Compiling geographical polygon bounds...",
    "Querying Satellite Sentinel-2 imagery nodes...",
    "Validating secure Stripe billing token...",
    "Activating high-precision biochemical algorithm...",
    "Establishing active satellite telemetry stream..."
  ];

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    const parts = [];

    for (let i = 0, len = val.length; i < len; i += 4) {
      parts.push(val.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(val);
    }
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

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 4) {
      setCardCVC(val);
    }
  };

  // 1. Instant Activation with Subscription Plan Quota! (Pro/Enterprise)
  const handleQuotaActivation = async () => {
    setIsProcessing(true);
    setCurrentStep(0);
    setErrorMsg("");

    for (let i = 0; i < activationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 300 : 500));
      setCurrentStep(i + 1);
    }

    try {
      // Free activation ($0 charge!)
      await onActivate(billingCycle, 0);
    } catch (err) {
      console.error(err);
      setErrorMsg("System failed to persist quota activation. Please try again.");
      setIsProcessing(false);
    }
  };

  // 2. Pay using Credit Balance from Waller Account
  const handleCreditBalanceActivation = async () => {
    setErrorMsg("");
    if (credits < currentPrice) {
      setErrorMsg(`Insufficient wallet credit. Needed: $${currentPrice.toFixed(2)}, Available: $${credits.toFixed(2)}. Please transfer more credits.`);
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    for (let i = 0; i < activationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 300 : 500));
      setCurrentStep(i + 1);
    }

    try {
      // Deduct credits and save
      const remainingCredits = credits - currentPrice;
      localStorage.setItem("mycrop_billing_credits", remainingCredits.toFixed(2));
      
      // Update transaction log
      const txCached = localStorage.getItem("mycrop_billing_transactions");
      let txList = [];
      if (txCached) {
        txList = JSON.parse(txCached);
      }
      txList.unshift({
        id: `tx-${Date.now().toString().substring(8)}`,
        type: "charge",
        description: `Unlocked premium telemetry on-demand for field: [${parcel.name}]`,
        amount: -currentPrice,
        date: new Date().toLocaleDateString(),
        status: "success"
      });
      localStorage.setItem("mycrop_billing_transactions", JSON.stringify(txList));

      // Trigger activation callback
      await onActivate(billingCycle, currentPrice);
    } catch (err) {
      console.error(err);
      setErrorMsg("System failed to deduct credit balances. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!cardName.trim()) {
      setErrorMsg("Please enter the name printed on your payment card.");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setErrorMsg("Please enter a valid 16-digit payment card number.");
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg("Please enter the card expiration date (MM/YY).");
      return;
    }
    if (cardCVC.length < 3) {
      setErrorMsg("Please enter the card security code (CVC).");
      return;
    }

    // Start simulated processing
    setIsProcessing(true);
    setCurrentStep(0);

    // Loop through steps with intervals to build gorgeous visual excitement
    for (let i = 0; i < activationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentStep(i + 1);
    }

    try {
      await onActivate(billingCycle, currentPrice);
    } catch (err) {
      console.error(err);
      setErrorMsg("System failed to persist billing update. Please verify configuration.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden max-w-2xl mx-auto text-left" id="parcel-payment-lock">
      {/* Background soft grids */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-green/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      {!isProcessing ? (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center animate-bounce mb-3">
              <Lock className="w-5 h-5" />
            </div>
            
            <h3 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
              {title}
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed max-w-lg mx-auto font-medium">
              {description}
            </p>
          </div>

          {/* Connected Field Summary Badge */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <MapPin className="w-4 h-4 text-brand-green" />
                <span>Field: {parcel.name} ({parcel.cropType})</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium font-mono">
                Polygon Bounds: {parcel.farmSize} Hectares • Location: {parcel.location}
              </p>
            </div>
            
            <div className="bg-amber-100/70 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 w-fit">
              🔒 Telemetry Offline
            </div>
          </div>

          {/* HYBRID MODEL METRIC NOTIFICATION BAR */}
          {isProOrEnterprise ? (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-300 animate-spin" />
                <strong className="text-xs font-black uppercase font-mono tracking-wide">
                  ✨ active Premium Subscription Detected ({planId === "pro" ? "Pro Farmer" : "Enterprise"})
                </strong>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-semibold">
                Your account is eligible for FREE interactive field unlocks as part of your membership quota tier! You don't need to specify any billing credit cards.
              </p>
              <button
                type="button"
                onClick={handleQuotaActivation}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-xs py-3 rounded-xl shadow transition duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <span>Unlock Field Instantaneously (Free quota slot)</span>
                <ArrowRight className="w-4 h-4 text-emerald-100" />
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/50 border border-amber-150 rounded-2xl p-4 text-[10px] text-amber-800 flex items-start gap-2 h-fit">
              <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans font-semibold">
                You are on the **Starter Free Account**. Free limits permit 1 active field slot. You can pay-per-hectare on demand using credits or checkout instantly; or **upgrade your subscription** to save on metered fees.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
            
            {/* PRICING PLANS */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                Choose Telemetry Pricing
              </span>

              {/* Monthly option */}
              <label 
                className={`block rounded-2xl border p-4.5 cursor-pointer transition-all relative ${
                  billingCycle === "monthly" 
                    ? "border-brand-green bg-brand-green/5 shadow-xs" 
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input 
                  type="radio" 
                  name="billingCycle" 
                  checked={billingCycle === "monthly"}
                  onChange={() => setBillingCycle("monthly")}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Monthly Stream Plan</span>
                    <span className="text-[10px] text-gray-500 font-medium leading-normal mt-0.5 block">
                      $1.50/Ha per month. Billed monthly. Cancels any time.
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-[17px] font-display font-extrabold text-brand-green">
                      ${rates.monthly}
                    </strong>
                    <span className="text-[10px] text-gray-400 font-semibold block">/month</span>
                  </div>
                </div>
              </label>

              {/* Yearly Option with 20% Discount */}
              <label 
                className={`block rounded-2xl border p-4.5 cursor-pointer transition-all relative ${
                  billingCycle === "yearly" 
                    ? "border-brand-green bg-brand-green/5 shadow-xs" 
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="absolute -top-2.5 right-4 bg-brand-green text-white font-mono font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-green-700">
                  🔥 Save 20%
                </div>
                
                <input 
                  type="radio" 
                  name="billingCycle" 
                  checked={billingCycle === "yearly"}
                  onChange={() => setBillingCycle("yearly")}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block flex items-center gap-1">
                      Yearly Stream Plan
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium leading-normal mt-0.5 block">
                      $1.20/Ha per month. Billed annually. Minimum $40.
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <strong className="text-[17px] font-display font-extrabold text-brand-green">
                      ${rates.yearly}
                    </strong>
                    <span className="text-[10px] text-gray-400 font-semibold block">/year</span>
                  </div>
                </div>
              </label>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-[11px] text-slate-700 flex items-start gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Prices are computed relative to field size ({parcel.farmSize} Ha). Telemetry stream is maintained via continuous Sentinel-2 satellite sweeps.
                </p>
              </div>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="space-y-4">
              
              {/* WALLET CREDIT BUTTON OPTION (Only display if not subscribed or if they select to pay individually) */}
              {!isProOrEnterprise && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Option A: Pay with Wallet Balance
                  </span>
                  
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Wallet credits:</span>
                      <strong className="text-xs text-slate-800 font-mono">${credits.toFixed(2)} USD AVAILABLE</strong>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCreditBalanceActivation}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-display font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Deduct ${currentPrice.toFixed(2)} from Credits</span>
                    </button>
                  </div>
                  
                  <div className="relative flex py-1 items-center text-[8px] text-gray-400 font-mono select-none">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-2 text-slate-400 uppercase">OR CHECKOUT DIRECT VIA CREDIT CARD</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                </div>
              )}

              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                {isProOrEnterprise ? "Backup Card Details (Optional)" : "Option B: Secure Bank Checkout"}
              </span>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {errorMsg && (
                  <p className="bg-red-50 border border-red-200 text-red-600 text-[10px] p-2.5 rounded-xl font-bold animate-pulse leading-normal">
                    {errorMsg}
                  </p>
                )}

                {/* Name on Card */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 block">Name on Card</label>
                  <input 
                    type="text" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="E.g. Johnathan Miller"
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl p-2.5 px-3 focus:outline-none focus:border-brand-green focus:bg-white text-gray-900"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 block">Card Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      className="w-full text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl p-2.5 px-3 pr-10 focus:outline-none focus:border-brand-green focus:bg-white text-gray-900"
                    />
                    <CreditCard className="w-4.5 h-4.5 text-gray-400 absolute right-3.5 top-2.5" />
                  </div>
                </div>

                {/* Grid with Expiration & CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Expiration Date</label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl p-2.5 px-3 text-center focus:outline-none focus:border-brand-green focus:bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">CVC / CVV</label>
                    <input 
                      type="password" 
                      value={cardCVC}
                      onChange={handleCVCChange}
                      placeholder="•••"
                      className="w-full text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl p-2.5 px-3 text-center focus:outline-none focus:border-brand-green focus:bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  id="btn-confirm-payment"
                  className="w-full bg-brand-green hover:bg-brand-green-hover active:scale-[0.98] transition-all text-white font-display font-extrabold text-xs py-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer pt-3 pb-3"
                >
                  <CreditCard className="w-4 h-4" />
                  Unlock Streaming for ${currentPrice}{cycleLabel}
                </button>
              </form>

            </div>
          </div>
        </div>
      ) : (
        /* SPINNER OR ACTIVE TIMELINE */
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
          <Loader2 className="w-12 h-12 text-brand-green animate-spin stroke-[1.5]" />
          
          <div className="space-y-1">
            <h4 className="font-display font-extrabold text-lg text-gray-900">
              Processing Secure Satellite Activation...
            </h4>
            <p className="text-xs text-gray-500 font-medium">
              Connecting stream nodes for {parcel.name} • {billingCycle === "monthly" ? "Monthly" : "Yearly"} subscription.
            </p>
          </div>

          {/* Stepped Timeline visual checkmarks */}
          <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left space-y-3.5 animate-fadeIn">
            {activationSteps.map((step, idx) => {
              const isDone = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 text-xs font-semibold select-none transition-opacity duration-300 ${
                    isDone ? "text-gray-900" : isCurrent ? "text-brand-green font-bold" : "text-gray-300"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isDone 
                      ? "bg-brand-green border-brand-green text-white" 
                      : isCurrent 
                      ? "border-brand-green text-brand-green animate-pulse" 
                      : "border-gray-200 bg-white"
                  }`}>
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-[9px] font-mono">{idx + 1}</span>
                    )}
                  </div>
                  <span className="font-sans leading-none">{step}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] font-mono text-gray-400">
            Powered by Secure Stripe Direct & European Space Agency API Gateway
          </p>
        </div>
      )}
    </div>
  );
}
