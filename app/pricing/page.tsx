"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Video, Palette, Download } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ChatVideo",
    features: [
      "Create unlimited chat scripts",
      "720p video exports",
      "Basic themes",
      "Watermarked videos",
      "Up to 5 saved scripts",
    ],
    limitations: ["Watermarked videos", "Limited themes", "720p quality only"],
    cta: "Get Started",
    popular: false,
    href: "/auth/signup",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "month",
    description: "For creators who want the best quality",
    features: [
      "Everything in Free",
      "1080p HD video exports",
      "No watermarks",
      "Premium themes & styles",
      "Unlimited saved scripts",
      "Priority support",
      "Custom avatars",
      "Advanced animations",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    href: "/auth/signup?plan=pro",
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Start free and upgrade when you're ready for professional features
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <span className={`mr-3 ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`ml-3 ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly
            <Badge variant="secondary" className="ml-2">
              Save 20%
            </Badge>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">Most Popular</Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.name === "Pro" && isYearly ? "$7.99" : plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-muted-foreground">/{isYearly ? "month" : plan.period}</span>
                  )}
                  {plan.name === "Pro" && isYearly && (
                    <div className="text-sm text-muted-foreground mt-1">Billed annually ($95.88/year)</div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Video className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Video Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
                  <span className="text-muted-foreground">720p</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
                  <span className="text-primary font-semibold">1080p HD</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Palette className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Themes & Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
                  <span className="text-muted-foreground">3 basic themes</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
                  <span className="text-primary font-semibold">20+ premium themes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Exports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
                  <span className="text-muted-foreground">With watermark</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
                  <span className="text-primary font-semibold">No watermark</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your Pro subscription at any time. You'll continue to have access to Pro features
                  until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my videos if I downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All videos you've already created will remain yours forever. However, new videos will include
                  watermarks and be limited to 720p quality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you're not satisfied with ChatVideo Pro, contact us for a
                  full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
