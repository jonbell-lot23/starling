export interface Persona {
  id: string;
  name: string;
  archetype: string;
  description: string;
  priorities: string[];
  frustrations: string[];
  memory: string[]; // accumulates across iterations
}

export function createDefaultPersonas(): Persona[] {
  return [
    {
      id: "sole-trader",
      name: "Sam",
      archetype: "Sole Trader",
      description: "Runs a small landscaping business solo. Does invoicing on Sunday nights. Wants to spend as little time as possible in accounting software.",
      priorities: ["Simplicity", "Speed", "Mobile-friendly"],
      frustrations: ["Too many options", "Jargon", "Anything that requires training"],
      memory: [],
    },
    {
      id: "bookkeeper",
      name: "Priya",
      archetype: "Bookkeeper",
      description: "Manages books for 15 small businesses. Power user who lives in Xero 8 hours a day. Knows every shortcut.",
      priorities: ["Efficiency", "Bulk operations", "Keyboard shortcuts"],
      frustrations: ["Slow workflows", "Missing power-user features", "UI changes that break muscle memory"],
      memory: [],
    },
    {
      id: "small-biz-owner",
      name: "Marcus",
      archetype: "Small Business Owner",
      description: "Owns a café with 6 staff. Checks Xero on his phone between customers. Needs to understand his numbers at a glance.",
      priorities: ["Clarity", "Dashboard summaries", "Quick answers"],
      frustrations: ["Information overload", "Having to dig for data", "Anything that takes more than 2 taps"],
      memory: [],
    },
    {
      id: "accountant",
      name: "Helen",
      archetype: "Accountant",
      description: "Works at a mid-size accounting firm. Needs audit trails, compliance features, and detailed reporting.",
      priorities: ["Accuracy", "Compliance", "Detailed reporting", "Audit trails"],
      frustrations: ["Missing data", "No export options", "Vague error messages"],
      memory: [],
    },
    {
      id: "new-user",
      name: "Jake",
      archetype: "New User",
      description: "Just started freelancing as a graphic designer. First time using any accounting software. Doesn't know debit from credit.",
      priorities: ["Guidance", "Plain language", "Not feeling stupid"],
      frustrations: ["Assumed knowledge", "No tooltips", "Overwhelming first experience"],
      memory: [],
    },
  ];
}
