import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  UserPlus, 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Code
} from 'lucide-react';

export default function HelpCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight">User Guide</h1>
        <p className="text-white/40 mt-1">Everything you need to know about using and setting up InstaFlow.</p>
      </header>

      {/* Preparation Step */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-white">Before You Start</h2>
        </div>
        
        <div className="glass bg-gradient-to-br from-pink-500/10 to-indigo-500/10 p-8 rounded-[2.5rem] border border-white/10">
          <p className="text-white/80 mb-6">
            InstaFlow uses the premium <strong>Instagram Graph API</strong>. To connect, your account must meet two simple requirements:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-pink-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-xs">Requirement 1</span>
                </div>
                <h4 className="text-lg font-bold text-white">Professional Account</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                    Personal accounts are restricted by Instagram. Switch to a <strong>Business</strong> or <strong>Creator</strong> account in your Instagram app settings (it's free!).
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-xs">Requirement 2</span>
                </div>
                <h4 className="text-lg font-bold text-white">Linked Facebook Page</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                    Your Instagram profile must be connected to a Facebook Page. This is a security requirement from Meta to allow third-party automation.
                </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Regular Users */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-white">For Regular Users</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-indigo-400">1</div>
            <h3 className="font-bold">Login & Connect</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Click the "Connect" button. A secure Facebook popup will appear. Login with your regular account.
            </p>
          </div>
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-indigo-400">2</div>
            <h3 className="font-bold">Grant Permissions</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Allow InstaFlow to read your comments and post media. We use the official Instagram Graph API for total security.
            </p>
          </div>
          <div className="glass p-6 rounded-3xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-indigo-400">3</div>
            <h3 className="font-bold">Automate</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              That's it! Your account is now linked. You can set up automation rules or schedule posts immediately.
            </p>
          </div>
        </div>
      </section>

      {/* For the App Owner (Developer Setup) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
            <Code className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-white">One-Time Developer Setup</h2>
        </div>
        
        <div className="glass-darker border-indigo-500/30 p-8 rounded-[2.5rem] space-y-8">
          <p className="text-white/60">
            To allow "Regular People" to connect, you must register this app with Meta. <strong>Users will never see these steps.</strong>
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold">01</div>
              <div>
                <h4 className="font-bold text-white mb-1">Create Meta Developer Account</h4>
                <p className="text-sm text-white/40">Register at <a href="https://developers.facebook.com" target="_blank" className="text-indigo-400 hover:underline inline-flex items-center gap-1">Meta for Developers <ExternalLink className="w-3 h-3" /></a>. You'll need to verify your identity with a phone number.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold">02</div>
              <div>
                <h4 className="font-bold text-white mb-1">Create a "Business" App</h4>
                <p className="text-sm text-white/40">Click "Create App" and choose the **Business** type. Give it a name like "InstaFlow Automation" and your contact email.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold">03</div>
              <div>
                <h4 className="font-bold text-white mb-1">Add Required Products</h4>
                <p className="text-sm text-white/40">In your dashboard, click "Set Up" on **Instagram Graph API** and **Facebook Login for Business**. These are essential for automation.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold">04</div>
              <div>
                <h4 className="font-bold text-white mb-1">Configure Redirect URIs</h4>
                <p className="text-sm text-white/40">Under **Facebook Login** &gt; **Settings**, add your app's callback URI to "Valid OAuth Redirect URIs":<br/>
                <code className="bg-black/40 px-2 py-1 rounded mt-2 inline-block text-indigo-300">https://[your-app-url]/auth/instagram/callback</code></p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs font-bold">05</div>
              <div>
                <h4 className="font-bold text-white mb-1">Sync Credentials</h4>
                <p className="text-sm text-white/40">Copy your **App ID** and **App Secret** (found in App Settings &gt; Basic) into the AI Studio environment variables.</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <h4 className="text-indigo-300 font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Privacy & Security
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">
              When a user connects, we never store their password. We only receive a secure "Token" from Meta that expires automatically unless refreshed. You can revoke access at any time in the Security Sanctum.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: "Do users need a Business account?", a: "Yes, the Instagram Graph API requires an Instagram Business or Creator account linked to a Facebook Page." },
            { q: "Can I connect multiple accounts?", a: "The current version supports one primary connected account per session." },
            { q: "Is my data shared?", a: "No. Your data is strictly encrypted and used only for your specific automation rules." },
            { q: "How do I disconnect?", a: "Go to Security & Privacy and click 'Activate Zero-Trust Purge' to immediately revoke all tokens." }
          ].map((faq, i) => (
            <div key={i} className="glass p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-2">{faq.q}</h4>
              <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
