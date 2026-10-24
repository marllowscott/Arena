"use client";

import * as React from "react";
import { LifeBuoy } from "lucide-react";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/section-heading";
import { ProbeRequestForm } from "@/components/dev/probe-request-form";

export function ProbeView() {
  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Problem reports"
        title="Report a problem"
        description="Post what you are actually stuck on, including the error. The instructor reads it and turns the useful ones into assignments. No XP — just a heads-up."
      />
      <PageSection>
        <ProbeRequestForm />
      </PageSection>
    </PageContainer>
  );
}