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
  Row,
  Column,
} from "@react-email/components";

export interface OrderConfirmationProps {
  customerName: string;
  orderNumber: string;
  packName: string;
  sessionsCount: string;
  unitPrice: string;
  paymentMethod: string;
  totalAmount: string;
  accountURL: string;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  customerName,
  orderNumber,
  packName,
  sessionsCount,
  unitPrice,
  paymentMethod,
  totalAmount,
  accountURL,
}) => {
  return (
    <Html>
      <Head>
        <title>Confirmation de commande - Encore Pilates</title>
        <meta
          name="description"
          content="Confirmation de votre commande Encore Pilates"
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
            <Heading style={greeting}>Bonjour {customerName} !</Heading>

            <Text style={messageLarge}>
              Merci pour votre commande ! Nous sommes ravis de vous confirmer
              que votre pack <span style={highlight}>Encore Pilates</span> a été
              commandé avec succès.
            </Text>

            <Text style={message}>
              Votre commande a été enregistrée et sera traitée dans les plus
              brefs délais. Vous recevrez bientôt un email avec les détails de
              votre pack et les instructions pour commencer vos séances.
            </Text>

            <Hr style={divider} />

            {/* Order Details */}
            <Section style={orderDetails}>
              <Heading style={orderTitle}>📋 Détails de votre commande</Heading>

              <Row style={orderItem}>
                <Column style={itemName}>Numéro de commande :</Column>
                <Column style={itemValue}>{orderNumber}</Column>
              </Row>

              <Row style={orderItem}>
                <Column style={itemName}>Pack commandé :</Column>
                <Column style={itemValue}>{packName}</Column>
              </Row>

              <Row style={orderItem}>
                <Column style={itemName}>Nombre de séances :</Column>
                <Column style={itemValue}>{sessionsCount}</Column>
              </Row>

              <Row style={orderItem}>
                <Column style={itemName}>Prix unitaire :</Column>
                <Column style={itemValue}>{unitPrice} MAD</Column>
              </Row>

              <Row style={orderItem}>
                <Column style={itemName}>Méthode de paiement :</Column>
                <Column style={itemValue}>{paymentMethod}</Column>
              </Row>

              <Row style={totalRow}>
                <Column style={totalLabel}>Total :</Column>
                <Column style={totalValue}>{totalAmount} MAD</Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Next Steps */}
            <Section style={infoSection}>
              <Heading style={infoTitle}>ℹ️ Prochaines étapes</Heading>
              <Text style={infoText}>
                • Votre pack sera activé dans votre compte directement après le
                paiement
                <br />
                • Vous pourrez alors réserver vos séances via votre espace
                client
                <br />• N&apos;hésitez pas à nous contacter pour toute question
              </Text>
            </Section>

            <Hr style={divider} />

            {/* CTA Button */}
            <Section style={ctaContainer}>
              <Button href={accountURL} style={ctaButton}>
                Accéder à mon compte
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={message}>
              <strong>Besoin d&apos;aide ?</strong> Notre équipe est là pour
              vous accompagner dans votre parcours Pilates.
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

// Styles
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

const orderDetails = {
  backgroundColor: "#f3efe8",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  border: "1px solid #e3ded6",
};

const orderTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#629d7d",
  marginBottom: "16px",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
};

const orderItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #e3ded6",
  margin: "0",
};

const itemName = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#594b43",
  margin: "0",
};

const itemValue = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#594b43",
  margin: "0",
  textAlign: "right" as const,
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderTop: "2px solid #629d7d",
  marginTop: "12px",
  margin: "12px 0 0 0",
};

const totalLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#629d7d",
  margin: "0",
};

const totalValue = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#629d7d",
  margin: "0",
  textAlign: "right" as const,
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

const ctaContainer = {
  textAlign: "center" as const,
  margin: "48px 0",
};

const ctaButton = {
  backgroundColor: "#629d7d",
  color: "#fbfaf7",
  textDecoration: "none",
  padding: "18px 80px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "500",
  textAlign: "center" as const,
  border: "none",
  display: "inline-block",
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

export default OrderConfirmation;
