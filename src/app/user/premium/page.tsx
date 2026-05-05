"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Crown, Shield, Rocket, Sparkles, Clock, ArrowRight, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import Premium3DBackground from "../_components/Premium3DBackground";
import { authApi } from "@/lib/api";
import { paymentApi, referralApi } from "@/lib/api/payment.api";
import CheckoutModal from "./_components/CheckoutModal";
import PostPaymentModal from "./_components/PostPaymentModal";
import MemberView from "./_components/MemberView";
import {
  PLAN_PRICES,
  DURATION_LABELS,
  DURATION_SAVINGS,
  PlanName,
  Duration,
} from "@/config/pricing.config";

const DURATIONS: Duration[] = [1, 3, 6];

export default function PremiumPage() {
  const [duration, setDuration] = useState<Duration>(1);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // page-level loading guard
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [isOrgStudent, setIsOrgStudent] = useState(false);
  const [orgName, setOrgName] = useState("");

  // Referral Code States
  const [referralCode, setReferralCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<{code: string, discountPercent: number} | null>(null);
  const [referralStatus, setReferralStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [referralMessage, setReferralMessage] = useState("");

  // Extra user data for member view
  const [userName, setUserName] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  // Checkout modal
  const [checkoutPlan, setCheckoutPlan] = useState<PlanName | null>(null);
  const isCheckoutOpen = checkoutPlan !== null;

  // Post-payment invoice modal
  const [postPayment, setPostPayment] = useState<{
    planName: PlanName; duration: Duration;
    amountPaid: number; paymentId: string; expiresAt: string;
  } | null>(null);

  // Is the subscription currently active (paid) or on trial?
  const isPaidActive = currentPlan !== "Free" && subscriptionStatus === "active" && !isOnTrial;
  const isActivePlan = currentPlan !== "Free" || isOnTrial;
  const canSelfUpgrade = !isOrgStudent || currentPlan === "Free";

  // Show trial CTA only when user has NEVER used trial and has NO active plan
  const showTrialCTA = !hasUsedTrial && !isActivePlan;

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await authApi.getMe();
        if (data.success && data.user) {
          setCurrentPlan(data.user.currentPlan || "Free");
          setSubscriptionStatus(data.user.subscriptionStatus || "");
          setHasUsedTrial(data.user.hasUsedTrial || false);
          setIsOnTrial(data.user.isOnTrial || false);
          setIsOrgStudent(data.user.isOrgStudent || false);
          setOrgName(data.user.orgName || "");
          setUserName(data.user.name || "");
          if (data.user.subscriptionExpiry) {
            setExpiryDate(new Date(data.user.subscriptionExpiry).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric"
            }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch user plan", e);
      }
      try {
        const h = await paymentApi.getMyHistory();
        if (h.success) setPaymentHistory(h.data || []);
      } catch {}
      setIsLoading(false);
    };
    fetchSubscription();
  }, []);

  const handleValidateReferral = async () => {
    if (!referralCode.trim()) return;
    setReferralStatus("loading");
    setReferralMessage("");
    try {
      const data = await referralApi.validateCode(referralCode.trim());
      if (data.success) {
        setAppliedReferral({ code: referralCode.trim(), discountPercent: data.discountPercent });
        setReferralStatus("success");
        setReferralMessage(data.message);
      } else {
        setReferralStatus("error");
        setReferralMessage(data.message);
      }
    } catch (err: any) {
      setReferralStatus("error");
      setReferralMessage(err.response?.data?.message || "Invalid referral code");
    }
  };

  const handleClearReferral = () => {
    setReferralCode("");
    setAppliedReferral(null);
    setReferralStatus("idle");
    setReferralMessage("");
  };

  // ─── Load Razorpay SDK ───────────────────────────────
  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Opens the confirmation modal (does NOT call Razorpay yet)
  const handleSubscribeClick = (planName: PlanName) => {
    setCheckoutPlan(planName);
  };

  // Called when user confirms in the modal — THIS opens Razorpay
  const handleConfirmCheckout = async () => {
    setLoading(true);
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Check your internet.");
      setLoading(false);
      return;
    }
    const planName = checkoutPlan!;

    try {
      const data = await paymentApi.createOrder(planName, duration, appliedReferral?.code);
      if (!data.success) {
        alert("Order creation failed: " + data.message);
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        order_id: data.orderId,
        name: "Praedico Global Research",
        description: `${planName} Plan — ${DURATION_LABELS[duration]}`,
        image: "/logo.png",
        handler: async (response: any) => {
          try {
            const verifyRes = await paymentApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName,
              duration,
              referralCode: appliedReferral?.code,
            });
            if (verifyRes.success) {
              const exp = new Date();
              exp.setMonth(exp.getMonth() + duration);
              setPostPayment({
                planName, duration,
                amountPaid: data.amount / 100,
                paymentId: response.razorpay_payment_id,
                expiresAt: exp.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
              });
            } else {
              alert("Payment verification failed. Contact support.");
            }
          } catch (err) {
            console.error(err);
            alert("Verification failed. Contact support.");
          }
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setCheckoutPlan(null); // close modal when Razorpay opens
      setLoading(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Something went wrong.";
      alert(`Payment failed: ${msg}`);
      setLoading(false);
    }
  };

  // ─── Handle free trial ───────────────────────────────
  const handleTrial = async (planName: PlanName) => {
    setLoading(true);
    try {
      const data = await paymentApi.trial(planName);
      if (data.success) {
        alert("🎉 Trial activated! Enjoy 7 days of premium access.");
        window.location.reload();
      } else {
        alert(data.message || "Trial activation failed.");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Trial activation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Page-level loading guard — prevents flash of free page ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] dark:bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Subscribed (paid, not trial) → themed member view ──────
  if (isPaidActive) {
    return (
      <>
        <MemberView
          planName={currentPlan as PlanName}
          isOnTrial={false}
          expiryDate={expiryDate}
          userName={userName}
          paymentHistory={paymentHistory}
          onDownloadInvoice={() => {}}
          onUpgradeClick={() => {}}
        />
        {postPayment && (
          <PostPaymentModal
            isOpen={true}
            onClose={() => { setPostPayment(null); window.location.reload(); }}
            {...postPayment}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-background pt-24 md:pt-28 pb-20 font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Premium3DBackground />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* ── Trial expired banner ──────────────────────── */}
        {hasUsedTrial && !isOnTrial && currentPlan === "Free" && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-2xl mx-auto mb-12 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-rose-600 rounded-xl shadow-2xl border border-rose-400/30">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Shield className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    Trial Period Finished
                    <span className="flex h-2 w-2 rounded-full bg-white/50 animate-pulse" />
                  </p>
                  <p className="text-orange-50 text-xs mt-0.5 font-medium">Subscribe now to regain premium access</p>
                </div>
              </div>
              <button
                onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white text-rose-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
              >
                Pick a Plan
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Trial active banner ───────────────────────── */}
        {isOnTrial && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-2xl mx-auto mb-12 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-2xl border border-indigo-400/30">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {currentPlan} Trial Active
                    <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse ring-2 ring-white/20" />
                  </p>
                  <p className="text-indigo-100/80 text-xs mt-0.5 font-medium">Full premium access unlocked</p>
                </div>
              </div>
              <div className="text-right pl-4 border-l border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-0.5">Trial Ends</p>
                <p className="text-sm font-bold text-white tabular-nums">{expiryDate}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Header ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 cursor-default"
          >
            <Sparkles size={12} className="fill-indigo-500" />
            No recurring charges · Pay once · Access unlocked
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Pick Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient">
              Plan
            </span>
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium mb-8">
            One payment. Real access. No subscriptions, no auto-renewals, no surprises —
            just premium trading intelligence for as long as you need it.
          </p>

          {/* ── Referral Code Input ───────────────────── */}
          {canSelfUpgrade && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Referral Code?"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  disabled={appliedReferral !== null || referralStatus === "loading"}
                  className="w-full flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 uppercase"
                />
                {!appliedReferral ? (
                  <button
                    onClick={handleValidateReferral}
                    disabled={referralStatus === "loading" || !referralCode.trim()}
                    className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    {referralStatus === "loading" ? "Validating..." : "Apply"}
                  </button>
                ) : (
                  <button
                    onClick={handleClearReferral}
                    className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl bg-orange-100 text-orange-600 text-sm font-bold hover:bg-orange-200 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {referralMessage && (
                <p className={`text-xs font-bold mt-3 ${referralStatus === "success" ? "text-emerald-500" : "text-rose-500"}`}>
                  {referralMessage}
                </p>
              )}
            </motion.div>
          )}

          {/* ── 3-button duration toggle ────────────────── */}
          <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  duration === d
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {DURATION_LABELS[d]}
                {DURATION_SAVINGS[d] && duration !== d && (
                  <span className="absolute -top-2.5 -right-1 text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 px-1 py-0.5 rounded-full leading-none">
                    {DURATION_SAVINGS[d]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Current plan status card ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/50 dark:border-white/10 shadow-xl shadow-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-slate-900/5 dark:ring-white/10">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentPlan === "Free"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              }`}>
                {currentPlan === "Free" ? <Shield size={24} /> : <Crown size={24} className="fill-current" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Plan</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {currentPlan} Membership
                  {isOnTrial && <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">(Trial)</span>}
                  {isOrgStudent && (
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Managed by {orgName}
                    </span>
                  )}
                </h3>
              </div>
            </div>
            {expiryDate && currentPlan !== "Free" && (
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Until</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{expiryDate}</p>
              </div>
            )}
          </div>
        </motion.div>

        {isOrgStudent && currentPlan === "Free" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="max-w-4xl mx-auto mb-10 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-5 py-4 text-sm text-amber-900 shadow-sm backdrop-blur dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
          >
            {orgName
              ? `${orgName}'s organization plan is inactive or expired for your account. You can unlock premium again by purchasing your own plan below.`
              : "Your organization plan is inactive or expired for your account. You can unlock premium again by purchasing your own plan below."}
          </motion.div>
        )}

        {/* ── Pricing cards ─────────────────────────────── */}
        {canSelfUpgrade && (
          <div id="pricing-section" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              title="Silver"
              price={PLAN_PRICES.Silver[duration]}
              discountPercent={appliedReferral?.discountPercent}
              duration={duration}
              desc="Essential tools to start your trading journey."
              features={["Basic News & ETFs", "₹1 Lac Virtual Balance", "Basic Paper Trading", "Trading Level Badge", "No News Based AI Analysis", "No Certificate"]}
              icon={Zap}
              delay={0.4}
              currentPlan={currentPlan}
              showTrialCTA={showTrialCTA}
              loading={loading}
              onSubscribe={() => handleSubscribeClick("Silver")}
              onTrial={() => handleTrial("Silver")}
            />

            <PricingCard
              title="Gold"
              price={PLAN_PRICES.Gold[duration]}
              discountPercent={appliedReferral?.discountPercent}
              duration={duration}
              desc="Advanced insights for the serious trader."
              features={[
                'Premium News Feed',
                'Virtual Amount - 5 Lac', 
                'News Based AI analysis - 5 times/month', 
                'Certificate', 
                'Paper investment portal', 
                'ChatBot - token 10k', 
                'AI Based Analysis - 2 times in a month', 
                'News & Shares Price'
              ]}
              icon={Rocket}
              highlight
              delay={0.5}
              currentPlan={currentPlan}
              showTrialCTA={showTrialCTA}
              loading={loading}
              onSubscribe={() => handleSubscribeClick("Gold")}
              onTrial={() => handleTrial("Gold")}
            />

            <PricingCard
              title="Diamond"
              price={PLAN_PRICES.Diamond[duration]}
              discountPercent={appliedReferral?.discountPercent}
              duration={duration}
              desc="Full power for ambitious learners."
              features={[
                'Real-Time Data Feed', 
                'Virtual Amount - 10 Lac', 
                'News Based AI Analysis - 10/month', 
                'Certificate', 
                'Paper investment portal', 
                'ChatBot - token 20k', 
                'AI Based Analysis - 4 times in a month', 
                'News, Shares & ETF Price', 
                '1:1 doubt clearing session with experts - 2 times/month'
              ]}
              icon={Crown}
              delay={0.6}
              currentPlan={currentPlan}
              showTrialCTA={showTrialCTA}
              loading={loading}
              onSubscribe={() => handleSubscribeClick("Diamond")}
              onTrial={() => handleTrial("Diamond")}
            />
          </div>
        )}

        {/* ── Trust badges ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 dark:text-slate-500"
        >
          {[
            "Secured by Razorpay",
            "No auto-renewals",
            "Instant activation",
            "Cancel anytime during trial",
          ].map((text) => (
            <span key={text} className="flex items-center gap-1.5">
              <BadgeCheck size={14} className="text-emerald-500" />
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Checkout Confirmation Modal ───────────────── */}
      {checkoutPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setCheckoutPlan(null)}
          onConfirm={handleConfirmCheckout}
          planName={checkoutPlan}
          duration={duration}
          appliedReferral={appliedReferral}
          loading={loading}
        />
      )}

      {/* ── Post-payment invoice modal ────────────────── */}
      {postPayment && (
        <PostPaymentModal
          isOpen={true}
          onClose={() => { setPostPayment(null); window.location.reload(); }}
          {...postPayment}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
//  PricingCard Component
// ──────────────────────────────────────────────────────────
interface PricingCardProps {
  title: string;
  price: number;
  discountPercent?: number;
  duration: Duration;
  desc: string;
  features: string[];
  icon: any;
  highlight?: boolean;
  delay: number;
  currentPlan: string;
  showTrialCTA: boolean;
  loading: boolean;
  onSubscribe: () => void;
  onTrial: () => void;
}

function PricingCard({
  title, price, discountPercent, duration, desc, features, icon: Icon, highlight,
  delay, currentPlan, showTrialCTA, loading, onSubscribe, onTrial,
}: PricingCardProps) {
  const isCurrent = currentPlan === title;
  const finalPrice = discountPercent ? price - Math.floor((price * discountPercent) / 100) : price;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`relative bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-[32px] p-8 border group flex flex-col justify-between transition-shadow duration-300 hover:shadow-2xl ${
        highlight
          ? "border-indigo-500 shadow-2xl shadow-indigo-500/20 z-10"
          : "border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-indigo-500/10"
      }`}
    >
      <div>
        {highlight && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 ring-4 ring-[#F8F9FE] dark:ring-slate-900">
            Most Popular
          </div>
        )}

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ml-1 transition-colors duration-300 ${
          highlight
            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
        }`}>
          <Icon size={24} />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10">{desc}</p>

        {/* Price display */}
        <div className="flex items-baseline gap-1 mb-2">
          {discountPercent ? (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-400 line-through decoration-rose-500 decoration-2">₹{price.toLocaleString("en-IN")}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">₹{(price - Math.floor((price * discountPercent) / 100)).toLocaleString("en-IN")}</span>
                <span className="text-slate-400 font-medium">/{DURATION_LABELS[duration].toLowerCase()}</span>
              </div>
            </div>
          ) : (
            <>
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">₹{price.toLocaleString("en-IN")}</span>
              <span className="text-slate-400 font-medium">/{DURATION_LABELS[duration].toLowerCase()}</span>
            </>
          )}
        </div>

        {/* Per-month breakdown for longer plans */}
        {duration > 1 && (
          <p className="text-xs text-emerald-600 font-semibold mb-6">
            ₹{Math.round(finalPrice / duration).toLocaleString("en-IN")}/mo · {DURATION_SAVINGS[duration]}
          </p>
        )}
        {duration === 1 && <div className="mb-6" />}

        {/* ── CTA Buttons ───────────────────────── */}
        {isCurrent ? (
          <div className="w-full py-4 rounded-xl font-bold text-sm mb-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-center cursor-default flex items-center justify-center gap-2">
            <BadgeCheck size={16} />
            Current Plan
          </div>
        ) : showTrialCTA ? (
          /* New user — show ONLY trial button */
          <div className="mb-3">
            <motion.button
              onClick={onTrial}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                highlight
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/40 hover:brightness-110"
                  : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? "Activating…" : "Start Free Trial"}
              {!loading && <ArrowRight size={15} />}
            </motion.button>
            <p className="text-center text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Clock size={10} />
              7-day free trial · cancel anytime
            </p>
          </div>
        ) : (
          /* Returning / expired user — show subscription button */
          <motion.button
            onClick={onSubscribe}
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-bold text-sm mb-3 transition-all shadow-lg flex items-center justify-center gap-2 ${
              highlight
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/40 hover:brightness-110"
                : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? "Processing…" : `Get ${DURATION_LABELS[duration]}`}
            {!loading && <ArrowRight size={15} />}
          </motion.button>
        )}
      </div>

      {/* Feature list */}
      <div className="space-y-4 mt-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        {features.map((feat, i) => (
          <div
            key={i}
            className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
          >
            <div className="mt-0.5 p-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            {feat}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
