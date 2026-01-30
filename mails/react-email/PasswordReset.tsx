import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";

export interface PasswordResetProps {
  customerName: string;
  resetUrl: string;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({
  customerName,
  resetUrl,
}) => {
  return (
    <Html>
      <Head>
        <title>Réinitialisation de mot de passe - Encore Pilates</title>
        <meta
          name="description"
          content="Réinitialisez votre mot de passe Encore Pilates"
        />
      </Head>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://nvd02ath3xbdcmxu.public.blob.vercel-storage.com/prod/encore-nav.png"
              width="140"
              height="auto"
              alt="Encore Pilates Logo"
              style={logo}
            />
            <Hr style={divider} />
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={greeting}>Bonjour {customerName},</Heading>

            <Text style={messageLarge}>
              Vous avez demandé à réinitialiser votre mot de passe pour votre
              compte <span style={highlight}>Encore Pilates</span>.
            </Text>

            <Text style={message}>
              Pas de souci ! Cliquez sur le bouton ci-dessous pour créer un
              nouveau mot de passe sécurisé. Si vous n&apos;avez pas fait cette
              demande, vous pouvez ignorer cet email en toute sécurité.
            </Text>

            <Hr style={divider} />

            {/* Main CTA */}
            <Section style={ctaContainer}>
              <Heading style={ctaTitle}>
                🔐 Réinitialiser votre mot de passe
              </Heading>
              <Text style={ctaDescription}>
                Cliquez sur le bouton pour créer un nouveau mot de passe et
                retrouver l&apos;accès à votre compte.
              </Text>
              <Button href={resetUrl} style={ctaButton}>
                Changer mon mot de passe
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Security Info */}
            <Section style={securitySection}>
              <Heading style={securityTitle}>
                🔒 Conseils pour un mot de passe sécurisé
              </Heading>
              <Text style={securityText}>
                • Utilisez au moins 8 caractères
                <br />
                • Mélangez lettres majuscules et minuscules
                <br />
                • Incluez des chiffres et des caractères spéciaux
                <br />
                • Évitez les informations personnelles évidentes
                <br />• Ne réutilisez pas un mot de passe d&apos;un autre site
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Warning */}
            <Section style={warningSection}>
              <Heading style={warningTitle}>
                ⏰ Lien de réinitialisation
              </Heading>
              <Text style={warningText}>
                Pour votre sécurité, ce lien de réinitialisation expire dans{" "}
                <strong>1 heure</strong>. Si le lien a expiré, vous pouvez
                demander une nouvelle réinitialisation depuis la page de
                connexion.
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Alternative Access */}
            <Section style={infoSection}>
              <Heading style={infoTitle}>
                🤔 Vous n&apos;avez pas demandé cette réinitialisation ?
              </Heading>
              <Text style={infoText}>
                Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous
                pouvez ignorer cet email en toute sécurité. Votre mot de passe
                actuel reste inchangé et votre compte est sécurisé.
                <br />
                <br />
                Si vous pensez que quelqu&apos;un d&apos;autre essaie
                d&apos;accéder à votre compte, contactez-nous immédiatement.
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={message}>
              <strong>Besoin d&apos;aide ?</strong> Notre équipe est là pour
              vous accompagner. N&apos;hésitez pas à nous contacter directement.
              <br />
              <span style={signature}>L&apos;équipe Encore Pilates</span>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>Nos horaires</strong>
              <br />
              Lundi - Vendredi : 8h - 21h
              <br />
              Samedi - Dimanche : 9h - 12h45
              <br />
              <br />
              <strong>Contact</strong>
              <br />
              📧 encorepilate@gmail.com
              <br />
              📞 +212 626 279 917
              <br />
              📍 Angle Rue N1 et 3, Quartier de l&apos;Aviation, Residence
              magnolia, Bureau B5, RDC, Casablanca, Maroc
              <br />
              <br />
              <Hr style={footerDivider} />
              <span style={copyright}>
                @2025 Encore Pilate Tout droits réservés
                <br />
                Made By WeareHune
              </span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles (cohérents avec les autres templates)
const main = {
  backgroundColor: "#fbfaf7",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const container = {
  maxWidth: "680px",
  margin: "0 auto",
  backgroundColor: "#fbfaf7",
  padding: "40px 20px",
};

const header = {
  textAlign: "center" as const,
  padding: "40px 50px 20px 50px",
  backgroundColor: "#fbfaf7",
  position: "relative" as const,
};

const logo = {
  margin: "0 auto 16px auto",
  filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.05))",
};

const divider = {
  height: "1px",
  background:
    "linear-gradient(90deg, transparent 0%, rgba(98, 157, 125, 0.2) 20%, rgba(98, 157, 125, 0.4) 50%, rgba(98, 157, 125, 0.2) 80%, transparent 100%)",
  margin: "48px 0",
  border: "none",
};

const content = {
  padding: "20px 50px 40px 50px",
};

const greeting = {
  fontSize: "20px",
  color: "#594b43",
  marginBottom: "24px",
  fontWeight: "400",
  letterSpacing: "-0.01em",
  margin: "0 0 24px 0",
};

const messageLarge = {
  fontSize: "16px",
  color: "#594b43",
  fontWeight: "500",
  marginBottom: "32px",
  lineHeight: "1.7",
  margin: "0 0 32px 0",
};

const message = {
  fontSize: "12px",
  color: "#594b43",
  lineHeight: "1.7",
  marginBottom: "32px",
  margin: "0 0 32px 0",
};

const highlight = {
  color: "#629d7d",
  fontWeight: "400",
};

const ctaContainer = {
  backgroundColor: "#f3efe8",
  borderRadius: "12px",
  padding: "32px 24px",
  margin: "32px 0",
  border: "1px solid #e3ded6",
  textAlign: "center" as const,
};

const ctaTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#629d7d",
  marginBottom: "12px",
  margin: "0 0 12px 0",
};

const ctaDescription = {
  fontSize: "14px",
  color: "#594b43",
  lineHeight: "1.6",
  marginBottom: "24px",
  margin: "0 0 24px 0",
};

const ctaButton = {
  backgroundColor: "#629d7d",
  color: "#fbfaf7",
  textDecoration: "none",
  padding: "18px 40px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "500",
  textAlign: "center" as const,
  border: "none",
  display: "inline-block",
};

const securitySection = {
  backgroundColor: "#e8f5e8",
  border: "1px solid #629d7d",
  borderRadius: "12px",
  padding: "20px",
  margin: "32px 0",
};

const securityTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#629d7d",
  marginBottom: "12px",
  margin: "0 0 12px 0",
};

const securityText = {
  fontSize: "14px",
  color: "#594b43",
  lineHeight: "1.6",
  margin: "0",
};

const infoSection = {
  backgroundColor: "#e8f5e8",
  border: "1px solid #629d7d",
  borderRadius: "12px",
  padding: "20px",
  margin: "32px 0",
};

const infoTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#629d7d",
  marginBottom: "12px",
  margin: "0 0 12px 0",
};

const infoText = {
  fontSize: "14px",
  color: "#594b43",
  lineHeight: "1.6",
  margin: "0",
};

const warningSection = {
  backgroundColor: "#fff5e6",
  border: "1px solid #e5c094",
  borderRadius: "12px",
  padding: "20px",
  margin: "32px 0",
};

const warningTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#d97706",
  marginBottom: "12px",
  margin: "0 0 12px 0",
};

const warningText = {
  fontSize: "14px",
  color: "#594b43",
  lineHeight: "1.6",
  margin: "0",
};

const signature = {
  fontStyle: "italic",
  color: "#629d7d",
  fontWeight: "500",
  marginTop: "12px",
};

const footer = {
  backgroundColor: "#2a2a2a",
  padding: "48px 50px",
  textAlign: "center" as const,
  borderTop: "1px solid #e3ded6",
};

const footerText = {
  fontSize: "14px",
  fontWeight: "200",
  color: "#fbfaf7",
  marginBottom: "20px",
  margin: "0 0 20px 0",
  lineHeight: "1.6",
};

const footerDivider = {
  height: "1px",
  background: "#fbfaf7",
  margin: "20px 0",
  border: "none",
};

const copyright = {
  fontSize: "12px",
  color: "#f3efe8a3",
  margin: "0",
};

export default PasswordReset;
