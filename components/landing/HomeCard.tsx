"use client"

import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

type Props = {
  title: string
  description: string
  href: string
  gradient: string // tailwind gradient classes
  icon: ReactNode
  imageSrc?: string
}

export function HomeCard({ title, description, href, gradient, icon, imageSrc }: Props) {
  return (
    <Link href={href} className="group block">
      <motion.div
        className={`relative overflow-hidden rounded-3xl border border-border/50 ${gradient} p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center gap-6">
          <motion.div 
            className="rounded-2xl bg-white/90 backdrop-blur-sm p-3 text-foreground shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {icon}
          </motion.div>
          <div className="flex-1">
            <motion.h3 
              className="text-xl md:text-2xl font-bold text-foreground mb-2"
              initial={{ opacity: 0.9 }}
              whileHover={{ opacity: 1 }}
            >
              {title}
            </motion.h3>
            <p className="text-sm md:text-base text-foreground/70 leading-relaxed max-w-xl">
              {description}
            </p>
            <motion.div 
              className="flex items-center gap-2 mt-3 text-primary font-medium"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
            >
              <span className="text-sm">Get started</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>
          {imageSrc && (
            <div className="hidden sm:block relative">
              <motion.div 
                className="relative rounded-2xl shadow-2xl overflow-hidden w-32 h-24 md:w-36 md:h-28"
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  rotateX: 5,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ 
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <Image src={imageSrc} alt={title} fill className="object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-2xl" />
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Subtle hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
      </motion.div>
    </Link>
  )
}
