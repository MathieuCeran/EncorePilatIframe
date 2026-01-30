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

export interface CourseConfirmationProps {
  customerName: string;
  courseType: string;
  courseDate: string;
  courseTime: string;
  courseDuration: string;
  instructorName: string;
  packName: string;
  googleCalendarLink?: string;
}

export const CourseConfirmation: React.FC<CourseConfirmationProps> = ({
  customerName,
  courseType,
  courseDate,
  courseTime,
  courseDuration,
  instructorName,
  packName,
  googleCalendarLink,
}) => {
  return (
    <Html>
      <Head>
        <title>Confirmation de cours - Encore Pilates</title>
        <meta
          name="description"
          content="Confirmation de votre réservation de cours Encore Pilates"
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
              Parfait ! Votre réservation pour votre cours{" "}
              <span style={highlight}>Encore Pilates</span> a été confirmée avec
              succès.
            </Text>

            <Text style={message}>
              Nous sommes ravis de vous accueillir pour votre séance. Voici tous
              les détails de votre cours.
            </Text>

            <Hr style={divider} />

            {/* Course Details */}
            <Section style={courseDetails}>
              <Heading style={courseTitle}>📅 Détails de votre cours</Heading>

              <Row style={courseItem}>
                <Column style={itemName}>Type de cours :</Column>
                <Column style={itemValue}>{courseType}</Column>
              </Row>

              <Row style={courseItem}>
                <Column style={itemName}>Date :</Column>
                <Column style={itemValue}>{courseDate}</Column>
              </Row>

              <Row style={courseItem}>
                <Column style={itemName}>Heure :</Column>
                <Column style={itemValue}>{courseTime}</Column>
              </Row>

              <Row style={courseItem}>
                <Column style={itemName}>Durée :</Column>
                <Column style={itemValue}>{courseDuration}</Column>
              </Row>

              <Row style={courseItem}>
                <Column style={itemName}>Professeur :</Column>
                <Column style={itemValue}>{instructorName}</Column>
              </Row>

              <Row style={courseItem}>
                <Column style={itemName}>Pack utilisé :</Column>
                <Column style={itemValue}>{packName}</Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Address Info */}
            <Section style={infoSection}>
              <Heading style={infoTitle}>📍 Adresse du studio</Heading>
              <Text style={infoText}>
                Angle Rue N1 et 3, Quartier de l&apos;Aviation
                <br />
                Residence magnolia, Bureau B5, RDC
                <br />
                Casablanca, Maroc
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Important Info */}
            <Section style={warningSection}>
              <Heading style={warningTitle}>
                ⚠️ Informations importantes
              </Heading>
              <Text style={warningText}>
                • Arrivez 10 minutes avant le début du cours
                <br />
                • Apportez une bouteille d&apos;eau et une serviette
                <br />
                • Portez des vêtements confortables et adaptés au mouvement
                <br />• Annulation possible jusqu&apos;à 24h avant le cours
              </Text>
            </Section>

            <Hr style={divider} />

            {/* CTA Buttons */}
            <Section style={ctaContainer}>
              {googleCalendarLink && (
                <Button
                  href={googleCalendarLink}
                  style={calendarButton}
                  target="_blank"
                >
                  📅 Ajouter à Google Calendar
                </Button>
              )}
              <Button href="https://encorepilates.ma/account" style={ctaButton}>
                Voir mes réservations
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={message}>
              <strong>Besoin d&apos;annuler ou modifier ?</strong>{" "}
              Connectez-vous à votre compte ou contactez-nous directement.
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

const courseDetails = {
  backgroundColor: "#f3efe8",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  border: "1px solid #e3ded6",
};

const courseTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#629d7d",
  marginBottom: "16px",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
};

const courseItem = {
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

const ctaContainer = {
  textAlign: "center" as const,
  margin: "48px 0",
};

const calendarButton = {
  backgroundColor: "#ffffff",
  color: "#629d7d",
  textDecoration: "none",
  padding: "16px 60px",
  borderRadius: "12px",
  fontSize: "15px",
  fontWeight: "500",
  textAlign: "center" as const,
  border: "2px solid #629d7d",
  display: "inline-block",
  marginBottom: "16px",
  marginRight: "12px",
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

export default CourseConfirmation;
