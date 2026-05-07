"use client";

import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import axios from 'axios';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/shared-components/ui/carousel";
import { Card, CardContent } from "@/shared-components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared-components/ui/avatar";
import Autoplay from "embla-carousel-autoplay";

interface Testimonial {
  _id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  rating: number;
  authorAvatar?: string | null;
}

import { BACKEND_URL as API_URL } from '@/lib/constants';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TestimonialCarousel({ onViewAll }: { onViewAll?: () => void }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await axios.get(`${API_URL}/api/feedback/public/testimonials?limit=12`);
        setTestimonials(res.data.testimonials || []);
      } catch {
        // Silently fail — section simply won't render
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);



  if (loading || testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-[#020617] relative overflow-hidden border-t border-white/5">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What our users say
          </h2>
          <p className="text-slate-400 max-w-3xl mx-auto">
            Real feedback from students and organization admins using Praedico every day.
          </p>
          {onViewAll && (
            <div className="mt-6">
              <button
                onClick={onViewAll}
                className="px-6 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 backdrop-blur-md"
              >
                View All Feedbacks
              </button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div className="px-4">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 2000,
                stopOnInteraction: false,
              }) as any
            ]}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className={testimonials.length < 3 ? "justify-center" : ""}>
              {testimonials.map((t, index) => (
                <CarouselItem key={t._id || index} className="md:basis-1/2 lg:basis-1/3 p-4">
                  <Card className="bg-white/[0.03] border-white/10 rounded-3xl h-full flex flex-col justify-between hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 backdrop-blur-sm border shadow-none">
                    <CardContent className="p-7 h-full flex flex-col justify-between">
                      <div>
                        <Quote className="w-9 h-9 text-indigo-500/30 mb-4" />
                        <p className="text-slate-300 leading-relaxed text-sm italic line-clamp-5">
                          "{t.content}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 shadow-lg">
                            <AvatarImage src={t.authorAvatar || undefined} alt={t.authorName} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white text-xs font-bold">
                              {getInitials(t.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-white">{t.authorName}</p>
                            <p className="text-xs text-slate-500">Verified User</p>
                          </div>
                        </div>
                        <StarRating rating={t.rating} />
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {testimonials.length > 1 && (
              <>
                <CarouselPrevious className="border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all -left-4 md:-left-12" />
                <CarouselNext className="border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all -right-4 md:-right-12" />
              </>
            )}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
