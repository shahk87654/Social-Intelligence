import PublicInfoPage from "@/components/PublicInfoPage";

export const metadata = { title: "Accessibility | Signal / Intel", description: "Signal / Intel accessibility commitment and contact." };

export default function AccessibilityPage() {
  return <PublicInfoPage eyebrow="Access for everyone" title="Accessibility" description="We want Signal / Intel to be usable by as many people as possible, across the public site and workspace console."><h2>Our commitment</h2><p>We work toward accessible structure, readable contrast, keyboard-friendly controls, responsive layouts, and clear status and error messages. Accessibility is part of our ongoing product work rather than a one-time checklist.</p><h2>Tell us what is blocking you</h2><p>If you encounter an accessibility barrier, email <a href="mailto:accessibility@signalintel.com">accessibility@signalintel.com</a> with the page, device or assistive technology, and what you were trying to do. We welcome requests for an alternative way to complete an important task.</p></PublicInfoPage>;
}