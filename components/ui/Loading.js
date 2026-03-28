'use client';

import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

export default function Loading({ message = "Loading headquarters..." }) {
    return (
        <div className="h-dvh w-full bg-[#F9F8F4] flex flex-col justify-center items-center font-sans overflow-hidden px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6 max-w-sm mx-auto"
            >
                {/* The Animated Emblem */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    {/* Outer spinning ring */}
                    <motion.div 
                        className="absolute inset-0 border-4 border-[#0A3622]/10 border-t-[#0A3622] rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Inner pulsing leaf */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#FFDE59] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transform rotate-3"
                    >
                        <Leaf className="w-5 h-5 md:w-6 md:h-6 text-[#0A3622]" />
                    </motion.div>
                </div>
                
                {/* Text */}
                <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[#0A3622] font-black tracking-widest uppercase text-[10px] md:text-sm text-center px-4"
                >
                    {message}
                </motion.p>
            </motion.div>
        </div>
    );
}