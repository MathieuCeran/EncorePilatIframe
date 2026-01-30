"use client";

import React from "react";
import Card from "./card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Title from "./title";

const Faq = () => {
  return (
    <div className="p-10 w-full font-chillax mb-50">
      <Card>
        <Title title="FAQ / QUESTIONS FRÉQUENTES" />
        <Accordion type="single" collapsible className="w-full px-10 pb-10">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-chillax text-marron">
              Faut-il apporter son propre tapis ou du matériel ?
            </AccordionTrigger>
            <AccordionContent className="font-chillaxlight">
              Non, tout le matériel nécessaire est fourni par le studio.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-chillax text-marron">
              Combien de temps dure un cours ?
            </AccordionTrigger>
            <AccordionContent className="font-chillaxlight">
              La majorité de nos cours durent entre 50 et 55 minutes. La durée
              exacte est indiquée lors de la réservation selon le type de
              session choisie.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="font-chillax text-marron">
              Puis-je annuler ou modifier une réservation ?
            </AccordionTrigger>
            <AccordionContent className="font-chillaxlight">
              Oui, toute modification ou annulation est possible jusqu&apos;à
              12h avant le début du cours. Passé ce délai, le cours sera
              décompté.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="font-chillax text-marron">
              Le studio dispose-t-il de vestiaires et de douches ?
            </AccordionTrigger>
            <AccordionContent className="font-chillaxlight">
              Oui, des casiers sécurisés avec cadenas à clé sont à votre
              disposition, ainsi qu&apos;une douche.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="font-chillax text-marron">
              Dois-je avoir de l&apos;expérience pour participer à un cours ?
            </AccordionTrigger>
            <AccordionContent className="font-chillaxlight">
              Pas du tout ! Nos cours sont accessibles à tous les niveaux. Nos
              coachs adaptent les exercices pour que chacun.e évolue à son
              rythme.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};

export default Faq;
