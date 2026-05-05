"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

// --- MOCK BRAND DATA WITH LOGOS ---
const integrations = [
  { name: 'Google Sheets', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg' },
  { name: 'Slack', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg' },
  { name: 'Discord', logo: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d80db9971f10a9757c99_Symbol.svg' },
  { name: 'Airtable', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg' },
  { name: 'Notion', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png' },
  { name: 'Gmail', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' },
  { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
  { name: 'Shopify', logo: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7d63.svg' },
  { name: 'Typeform', logo: 'https://i.pinimg.com/736x/09/c4/80/09c4801ecdee56a94d8f13fae4a32f2b.jpg' }, // Replaced gray placeholder
  { name: 'Salesforce', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg' },
  { name: 'Hubspot', logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAzNDUuOCAzNTYiPgogIDwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyOS40LjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiAyLjEuMCBCdWlsZCAxNTIpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogI2ZmNDgwMDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGcgaWQ9Ikh1YlNwb3RfTG9nbyI+CiAgICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjYyLjgsMTE4di00MS44YzEwLjktNS4yLDE4LjYtMTYuMiwxOC42LTI5di0xYzAtMTcuNy0xNC41LTMyLjEtMzIuMS0zMi4xaC0xYy0xNy43LDAtMzIuMSwxNC41LTMyLjEsMzIuMXYxYzAsMTIuOCw3LjYsMjMuOCwxOC42LDI5djQxLjhjLTE2LjIsMi41LTMxLjEsOS4yLTQzLjMsMTkuMUw3Ni43LDQ3LjhjLjgtMi45LDEuMy01LjksMS4zLTksMC0yMC0xNi4yLTM2LjMtMzYuMi0zNi4zUzUuNSwxOC43LDUuNCwzOC43YzAsMjAsMTYuMiwzNi4zLDM2LjIsMzYuMyw2LjUsMCwxMi42LTEuOCwxNy44LTQuOGwxMTIuOSw4Ny44Yy05LjYsMTQuNS0xNS4yLDMxLjgtMTUuMiw1MC41czYuMiwzNy42LDE2LjYsNTIuNWwtMzQuMywzNC4zYy0yLjctLjgtNS41LTEuNC04LjUtMS40LTE2LjUsMC0yOS44LDEzLjMtMjkuOCwyOS44czEzLjMsMjkuOCwyOS44LDI5LjgsMjkuOC0xMy4zLDI5LjgtMjkuOC0uNi01LjgtMS40LTguNWwzNC0zNGMxNS40LDExLjgsMzQuNiwxOC44LDU1LjUsMTguOCw1MC42LDAsOTEuNi00MSw5MS42LTkxLjZzLTMzLjctODMuNy03Ny42LTkwLjRoMFpNMjQ4LjcsMjU1LjRjLTI1LjksMC00Ny0yMS00Ny00N3MyMS00Nyw0Ny00Nyw0NywyMSw0Nyw0Ny0yMSw0Ny00Nyw0N1oiLz4KICA8L2c+Cjwvc3ZnPg==' },
  { name: 'Jira', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg' },
  { name: 'Trello', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Trello-logo-blue.svg' },
  { name: 'Asana', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Asana_logo.svg' },
  { name: 'Zoom', logo: 'https://media.zoom.com/images/assets/logo-zoom%402x.png/Zz00MjQ0MDQzNmM2YWUxMWYwYjFmYzBlNzMxY2I1ZWM4YQ==' },
  { name: 'Figma', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg' },
  { name: 'Dropbox', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg' },
  { name: 'Zendesk', logo: 'https://www.svgrepo.com/show/354598/zendesk-icon.svg' },
  { name: 'PostgreSQL', logo: 'https://www.postgresql.org/media/img/about/press/elephant.png' },
  { name: 'MySQL', logo: 'https://i.pinimg.com/736x/88/1b/97/881b97bd6c8a5f4811d34cf713b4fe6c.jpg' },
  { name: 'Supabase', logo: 'https://flow-in-public.nimbuspop.com/flow-apps/supabase.png' },
  { name: 'Mailchimp', logo: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/mailchimp-icon.png' },
  { name: 'Gemini', logo: 'https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg' },

];

export default function IntegrationsMarquee({ onBrowseClick }: { onBrowseClick?: () => void }) {
  return (
    <section className="relative w-full py-32 overflow-hidden bg-[#020617] font-sans text-white border-y border-white/5">



      {/* --- BACKGROUND GLOWS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-indigo-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center">

        {/* --- HEADER --- */}
        <div className="mb-20">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-2xl">
            Plug AI into your own data & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
              over 500 integrations
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Connect seamlessly with your existing stack. Our platform acts as the glue between your AI models and your business data.
          </p>
        </div>

        {/* --- 3D MARQUEE CONTAINER --- */}
        <div className="relative h-[400px] marquee-perspective flex flex-col justify-center fade-mask">

          {/* Marquee Track */}
          <div className="marquee-track flex flex-col gap-6 opacity-100 transition-opacity duration-500">

            {/* ROW 1: Scrolling Left */}
            <div className="flex gap-4 w-max animate-scroll-left hover:[animation-play-state:paused]">
              {[...integrations, ...integrations, ...integrations, ...integrations].map((item, idx) => (
                <IntegrationCard key={`r1-${idx}`} item={item} />
              ))}
            </div>

            {/* ROW 2: Scrolling Right */}
            <div className="flex gap-4 w-max animate-scroll-right hover:[animation-play-state:paused]">
              {[...integrations, ...integrations, ...integrations, ...integrations].reverse().map((item, idx) => (
                <IntegrationCard key={`r2-${idx}`} item={item} />
              ))}
            </div>

          </div>
        </div>

        {/* --- CTA BUTTON --- */}
        <div className="mt-16 relative z-30">
          <button 
            onClick={onBrowseClick}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#5842c3] text-white font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(88,66,195,0.4)] hover:shadow-[0_0_60px_rgba(88,66,195,0.6)]"
          >
            <span className="relative z-10 text-sm md:text-base">Browse all integrations</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}

// --- CARD COMPONENT ---
function IntegrationCard({ item }: { item: any }) {
  return (
    <div className="group relative w-20 h-20 md:w-24 md:h-24 bg-white rounded-[22px] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] cursor-pointer border border-transparent hover:border-white/50">

      {/* 🚀 LOGO IMAGE */}
      <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
        <img
          src={item.logo}
          alt={item.name}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>

      {/* Tooltip Effect */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/90 border border-white/10 text-white text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap shadow-xl transform translate-y-2 group-hover:translate-y-0 z-50">
        {item.name}
      </div>
    </div>
  );
}