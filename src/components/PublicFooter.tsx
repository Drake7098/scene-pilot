import type { CSSProperties } from "react";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";

type Props = {
  compact?: boolean;
};

export default function PublicFooter({ compact = false }: Props) {
  return (
    <footer style={{ ...footerWrap, ...(compact ? footerWrapCompact : null) }}>
      <div style={footerLinks}>
        <a href="/terms" style={footerLink}>Terms</a>
        <a href="/privacy" style={footerLink}>Privacy</a>
        <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={footerLink}>Contact</a>
        <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.support}`} style={footerLink}>Email</a>
      </div>
      <div style={footerText}>support@scenepilotix.com</div>
    </footer>
  );
}

const footerWrap: CSSProperties = {
  marginTop: 22,
  borderTop: "1px solid var(--spx-border)",
  paddingTop: 14,
  display: "grid",
  gap: 8
};

const footerWrapCompact: CSSProperties = {
  marginTop: 16,
  paddingTop: 12
};

const footerLinks: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
};

const footerLink: CSSProperties = {
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600
};

const footerText: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 12.5
};
