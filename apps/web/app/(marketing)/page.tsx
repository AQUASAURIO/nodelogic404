"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Shield,
  GitBranch,
  Play,
  Users,
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  Brain,
  Target,
} from "lucide-react";
import { PRICING } from "@repo/shared/constants";

const stats = [
  { label: "Simulations Run", value: "10K+" },
  { label: "Digital Twins Created", value: "500+" },
  { label: "Retention Rate", value: "85%" },
];

const features = [
  {
    icon: Brain,
    title: "Digital Twin Simulation",
    description:
      "Create a living replica of your collaboration patterns, workflows, and decision-making processes. Test changes before they happen in the real world.",
  },
  {
    icon: Shield,
    title: "Trust-Verified Insights",
    description:
      "Every insight is backed by simulation data, not opinions. Know exactly which information sources are reliable and how decisions will play out.",
  },
  {
    icon: GitBranch,
    title: "Collaborative Testing",
    description:
      "Run team simulations together. See how different collaboration styles, communication patterns, and workflows affect outcomes before committing.",
  },
];

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Create your Digital Twin",
    description:
      "Import your work patterns, communication flows, and decision processes. Our AI builds a faithful replica of how you and your team actually collaborate.",
  },
  {
    number: "02",
    icon: Play,
    title: "Run Simulations",
    description:
      "Test scenarios, run what-if analyses, and stress-test your workflows. See projected outcomes with confidence scores before making real changes.",
  },
  {
    number: "03",
    icon: Target,
    title: "Act with Confidence",
    description:
      "Make decisions backed by simulation data. Share verified insights with your team and collaborators, knowing every recommendation is battle-tested.",
  },
];

const faqs = [
  {
    question: "What is a digital twin in this context?",
    answer:
      "A digital twin is a computational replica of your collaboration patterns, workflows, and decision-making processes. It learns from your actual work behavior to accurately simulate how changes would affect your team's productivity and outcomes.",
  },
  {
    question: "How does trust verification work?",
    answer:
      "Every piece of information and recommendation in Nodelogic404 goes through simulation validation. We run multiple scenario tests and assign confidence scores based on how consistently the insight holds up across different conditions, so you know exactly how much to trust each data point.",
  },
  {
    question: "Can I collaborate with my team on simulations?",
    answer:
      "Yes. On Pro and Team plans, you can invite collaborators to share digital twins and run simulations together. Team plans include a shared dashboard, admin controls, and unlimited collaborators for full organizational alignment.",
  },
  {
    question: "What happens after the 14-day free trial?",
    answer:
      "After your trial ends, you can choose to upgrade to Pro ($14.99/mo) or Team ($49.99/mo). Your digital twins and simulation history are preserved when you upgrade. You can also continue with limited access on the free tier.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. All data is encrypted at rest and in transit. We use enterprise-grade security with SOC 2 compliance, and your digital twin data is isolated to your account. We never share or sell your collaboration data to third parties.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        className="flex w-full items-center justify-between py-5 text-left font-medium text-foreground transition-colors hover:text-primary"
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm leading-relaxed text-muted-foreground animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="info" className="mb-6">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Digital Twins & Simulation Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Stop guessing.{" "}
              <span className="gradient-text">Start simulating.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Build digital twins of your collaboration patterns and run
              simulations to make trusted, data-backed decisions. Know who and
              what to trust before you act.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Trusted by professionals worldwide
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="warning" className="mb-4">
              The Problem
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The trust crisis in collaboration
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              In today&apos;s information-saturated workplace, professionals waste
              hours second-guessing data sources, debating which insights to
              trust, and navigating conflicting opinions. Without a way to verify
              information, teams default to the loudest voice in the room instead
              of the most reliable data.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              The result? Slow decisions, misaligned teams, and a constant
              feeling of operating in the dark. You don&apos;t need more data —
              you need <span className="font-semibold text-foreground">verified confidence</span> in the data you already have.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="info" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to{" "}
              <span className="gradient-text">collaborate with confidence</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three core capabilities that transform how your team makes
              decisions and shares information.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-0 bg-background shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="success" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From uncertainty to{" "}
              <span className="gradient-text">clarity in three steps</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Getting started with digital twin simulation is simple. No
              complex setup, no steep learning curve.
            </p>
          </div>
          <div className="relative mt-16">
            <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 md:block" />
            <div className="space-y-12 md:space-y-16">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-12"
                >
                  <div className="flex items-center gap-4 md:w-48 md:flex-col md:items-start">
                    <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="hidden text-sm font-semibold text-muted-foreground md:block">
                      Step {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent{" "}
              <span className="gradient-text">pricing</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you&apos;re ready for more power.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Free Tier */}
            <Card className="relative flex flex-col">
              <CardHeader>
                <CardDescription>{PRICING.free.name}</CardDescription>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">
                    /{PRICING.free.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 space-y-3">
                  {PRICING.free.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <Link href="/register">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative flex flex-col border-2 border-indigo-500 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3">
                  <Zap className="mr-1 h-3 w-3" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardDescription>{PRICING.pro.name}</CardDescription>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${PRICING.pro.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{PRICING.pro.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 space-y-3">
                  {PRICING.pro.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="gradient" className="mt-auto w-full" asChild>
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Team Tier */}
            <Card className="relative flex flex-col">
              <CardHeader>
                <CardDescription>{PRICING.team.name}</CardDescription>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${PRICING.team.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{PRICING.team.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 space-y-3">
                  {PRICING.team.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-auto w-full" asChild>
                  <Link href="/register">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2dyaWQpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-40" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform how you collaborate?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join thousands of professionals who stopped guessing and started
                simulating. Your free trial is one click away.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/#how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about Nodelogic404.
            </p>
          </div>
          <div className="mt-12 divide-y">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
