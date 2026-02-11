
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, Trophy, ArrowRight, CheckCircle, Play, Globe, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-hero font-sans text-neutral-body selection:bg-primary/20 overflow-x-hidden">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-white/70 backdrop-blur-lg border-b border-white/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg text-white">
              <Trophy size={16} />
            </div>
            <span className="text-xl font-extrabold text-neutral-title tracking-tight">LingoFlow</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onLogin}
              className="px-4 py-2 text-sm font-bold text-neutral-light hover:text-primary transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={onGetStarted}
              className="px-5 py-2 bg-neutral-title text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-6 text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-white shadow-sm text-xs font-bold text-primary tracking-wide uppercase">
              <Sparkles size={12} />
              <span>AI-Powered Fluency</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-black text-neutral-title leading-[1.1] tracking-tight">
              Master English <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-pulse-slow">
                Speaking Naturally.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg text-neutral-light leading-relaxed max-w-lg mx-auto lg:mx-0">
              Stop typing, start talking. LingoFlow uses advanced AI to simulate real conversations, correct your pronunciation, and track your CEFR level in real-time.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-cta rounded-2xl text-white font-bold text-lg shadow-glow-green hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                Start Learning Free <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 bg-white/60 border border-white rounded-2xl text-neutral-title font-bold text-lg hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm">
                <Play size={18} fill="currentColor" className="opacity-80"/> Demo Video
              </button>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-neutral-light opacity-80">
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-primary"/> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-primary"/> AI Feedback</span>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
             {/* Glass Cards Composition */}
             <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-6 shadow-glass transform rotate-[-2deg] w-full max-w-md mx-auto">
                <div className="bg-white/80 rounded-2xl p-4 mb-4 shadow-sm border border-white">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary"><Brain size={16} /></div>
                      <div className="h-2 w-24 bg-neutral-200 rounded-full"></div>
                   </div>
                   <div className="h-2 w-full bg-neutral-100 rounded-full mb-2"></div>
                   <div className="h-2 w-2/3 bg-neutral-100 rounded-full"></div>
                </div>
                
                <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-4 text-white shadow-lg transform translate-x-4 scale-105">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase opacity-80">Assessment</span>
                      <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded">A2 → B1</span>
                   </div>
                   <div className="text-lg font-bold mb-1">Perfect Pronunciation!</div>
                   <div className="text-sm opacity-90">"You nailed the 'th' sound this time."</div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float">
                   <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-yellow-900 font-bold">XP</div>
                   <div>
                      <div className="text-xs text-gray-400 font-bold uppercase">Gained</div>
                      <div className="text-xl font-black text-neutral-title">+150</div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section className="py-24 px-6 relative bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <h2 className="text-3xl lg:text-4xl font-black text-neutral-title mb-4">Why LingoFlow?</h2>
             <p className="text-neutral-light text-lg">We combine pedagogical expertise with cutting-edge AI to create the most effective way to learn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic size={32} className="text-secondary" />,
                title: "Voice First",
                desc: "Don't just type. Speak. Our AI analyzes your intonation, rhythm, and pronunciation instantly."
              },
              {
                icon: <Brain size={32} className="text-primary" />,
                title: "Adaptive AI",
                desc: "The difficulty adjusts to you. On fire? We challenge you. Struggling? We offer hints."
              },
              {
                icon: <Globe size={32} className="text-accent" />,
                title: "Real Scenarios",
                desc: "Roleplay job interviews, travel situations, and casual chats. Practical usage, not just theory."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/60 backdrop-blur-md border border-white/60 p-8 rounded-3xl hover:shadow-glass hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-neutral-title mb-3">{feature.title}</h3>
                <p className="text-neutral-light leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-[3rem] p-10 lg:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]" />
            
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 relative z-10">
              Ready to speak with confidence?
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto relative z-10">
              Join thousands of learners mastering English 3x faster with LingoFlow AI.
            </p>
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-lg shadow-glow-green transition-all transform hover:scale-105 relative z-10"
            >
              Start Your Free Journey
            </button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-8 text-center text-sm text-neutral-light font-medium">
        <p>© 2024 LingoFlow AI. Crafted for fluency.</p>
      </footer>

    </div>
  );
};
