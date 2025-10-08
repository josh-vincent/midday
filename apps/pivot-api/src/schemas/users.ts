import { z } from "@hono/zod-openapi";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(32).optional().openapi({
    description: "Full name of the user. Must be between 2 and 32 characters",
    example: "Jane Doe",
  }),
  email: z.string().email().optional().openapi({
    description: "Email address of the user",
    example: "jane.doe@acme.com",
  }),
  avatarUrl: z.string().url().optional().openapi({
    description: "URL to the user's avatar image",
    example: "https://cdn.midday.ai/avatars/jane-doe.jpg",
  }),
  locale: z.string().optional().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  timezone: z.string().optional().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timeFormat: z.number().optional().openapi({
    description:
      "User's preferred time format: 12 for 12-hour format, 24 for 24-hour format",
    example: 24,
  }),
  dateFormat: z
    .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
    .optional()
    .openapi({
      description:
        "User's preferred date format. Available options: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'",
      example: "yyyy-MM-dd",
      "x-speakeasy-enums": [
        "ddSlashMMSlashyyyy",
        "MMSlashddSlashyyyy",
        "yyyyDashMMDashdd",
        "ddDotMMDotyyyy",
      ],
    }),
});

export const userSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  fullName: z.string().nullable().openapi({
    description: "Full name of the user",
    example: "Jane Doe",
  }),
  email: z.string().email().openapi({
    description: "Email address of the user",
    example: "jane.doe@acme.com",
  }),
  avatarUrl: z.string().url().nullable().openapi({
    description: "URL to the user's avatar image",
    example: "https://cdn.midday.ai/avatars/jane-doe.jpg",
  }),
  locale: z.string().nullable().openapi({
    description:
      "User's preferred locale for internationalization (language and region)",
    example: "en-US",
  }),
  timezone: z.string().nullable().openapi({
    description: "User's timezone identifier in IANA Time Zone Database format",
    example: "America/New_York",
  }),
  timeFormat: z.number().nullable().openapi({
    description:
      "User's preferred time format: 12 for 12-hour format, 24 for 24-hour format",
    example: 24,
  }),
  dateFormat: z.string().nullable().openapi({
    description:
      "User's preferred date format. Available options: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd.MM.yyyy'",
    example: "yyyy-MM-dd",
  }),
  teamId: z.string().uuid().nullable().openapi({
    description: "ID of the user's current team",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  team: z
    .object({
      id: z.string().uuid().openapi({
        description: "Unique identifier of the team",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      name: z.string().openapi({
        description: "Name of the team or organization",
        example: "Acme Corporation",
      }),
      logoUrl: z.string().url().nullable().openapi({
        description: "URL to the team's logo image",
        example: "https://cdn.midday.ai/logos/acme-corp.png",
      }),
      plan: z.string().openapi({
        description: "Current subscription plan of the team",
        example: "pro",
      }),
    })
    .nullable()
    .openapi({
      description: "Team information that the user belongs to",
    }),
});
