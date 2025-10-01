"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Building2, ChevronDown, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

// Predefined company templates
const COMPANY_TEMPLATES = [
  {
    id: "tech-startup",
    name: "Tech Startup",
    icon: Building2,
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "TechCo Innovations Pty Ltd\nLevel 5, 123 Tech Hub\nMelbourne VIC 3000\nAustralia\n\nABN: 12 345 678 901\nEmail: billing@techco.com\nPhone: 1300 TECH CO",
            },
          ],
        },
      ],
    },
  },
  {
    id: "construction",
    name: "Construction Company",
    icon: Building2,
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "BuildRight Construction Pty Ltd\n45 Industrial Drive\nSydney NSW 2000\nAustralia\n\nABN: 98 765 432 109\nLicense: BC123456\nEmail: accounts@buildright.com.au\nPhone: (02) 9876 5432",
            },
          ],
        },
      ],
    },
  },
  {
    id: "consulting",
    name: "Consulting Firm",
    icon: Building2,
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Strategic Advisors Group\nSuite 1200, 88 Collins Street\nBrisbane QLD 4000\nAustralia\n\nABN: 55 123 456 789\nEmail: invoices@strategicadvisors.com\nPhone: (07) 3333 4444",
            },
          ],
        },
      ],
    },
  },
  {
    id: "creative-agency",
    name: "Creative Agency",
    icon: Building2,
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Creative Minds Studio\n78 Design Lane\nPerth WA 6000\nAustralia\n\nABN: 33 987 654 321\nEmail: hello@creativeminds.studio\nWeb: www.creativeminds.studio\nPhone: (08) 6555 7890",
            },
          ],
        },
      ],
    },
  },
  {
    id: "freelancer",
    name: "Freelancer/Sole Trader",
    icon: User,
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "John Smith\nFreelance Developer\n123 Home Office Street\nAdelaide SA 5000\nAustralia\n\nABN: 11 222 333 444\nEmail: john@freelancedev.com\nPhone: 0400 123 456",
            },
          ],
        },
      ],
    },
  },
  {
    id: "custom",
    name: "Custom Template",
    icon: Plus,
    fromDetails: null, // Will open editor for custom input
  },
];

type TemplateSelectorProps = {
  onTemplateSelect?: (template: any) => void;
  currentValue?: any;
};

export function TemplateSelector({ onTemplateSelect, currentValue }: TemplateSelectorProps) {
  const form = useFormContext();
  const router = useRouter();

  const handleTemplateSelect = (template: typeof COMPANY_TEMPLATES[0]) => {
    if (template.id === "custom") {
      // Navigate to settings page for custom setup
      router.push("/settings/invoice");
    } else {
      // Apply the template
      form.setValue("fromDetails", template.fromDetails);
      
      // If callback provided, call it
      if (onTemplateSelect) {
        onTemplateSelect(template.fromDetails);
      }
    }
  };

  const getCurrentTemplateName = () => {
    if (!currentValue) return "Select Template";
    
    // Try to match with predefined templates
    const currentText = extractTextFromContent(currentValue);
    const matchedTemplate = COMPANY_TEMPLATES.find(template => {
      if (!template.fromDetails) return false;
      const templateText = extractTextFromContent(template.fromDetails);
      return templateText.includes(currentText.substring(0, 30));
    });
    
    return matchedTemplate ? matchedTemplate.name : "Custom Template";
  };

  const extractTextFromContent = (content: any): string => {
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        return extractTextFromContent(parsed);
      } catch {
        return content;
      }
    }
    
    if (content?.type === "doc" && content?.content?.[0]?.content?.[0]?.text) {
      return content.content[0].content[0].text;
    }
    
    return "";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {getCurrentTemplateName()}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Company Templates</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COMPANY_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              {template.name}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/settings/invoice")}
          className="cursor-pointer text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Manage Templates
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}