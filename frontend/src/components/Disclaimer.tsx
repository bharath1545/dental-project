import { ShieldCheck } from "lucide-react";

export function Disclaimer({ text = "Preliminary diagnostic aid, not a replacement for clinical review." }: { text?: string }) {
  return <div className="disclaimer"><ShieldCheck size={16} /><span><strong>Clinical review required.</strong> {text}</span></div>;
}
