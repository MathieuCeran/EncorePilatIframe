"use client";

import React from "react";
import Card from "./card";
import Image from "next/image";
import Title from "./title";
import Button from "./button";
import Link from "next/link";

const About = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <div className="pl-10 pr-10 w-full">
      <Card className="pb-16 md:pb-20 overflow-hidden">
        <Title
          title="QUI SOMMES-NOUS ?"
          description="Chez Encore, nous croyons que le mouvement est une clé puissante pour le bien-être du corps et de l’esprit.
Notre studio est né d’un désir simple mais profond : offrir un espace bienveillant, inspirant et accessible à tous. Encore Studio a été conçu avec intention : bien plus qu’un lieu d’entraînement, nous voulons qu’il devienne un lieu de rencontre, de partage, une véritable communauté.

Nous sommes une équipe passionnée, qui propose une approche personnalisée, respectueuse du rythme de chacun. Notre mission, c’est de vous accompagner avec expertise et bienveillance pour que vous puissiez retrouver le plaisir de bouger et vous sentir pleinement en harmonie avec votre corps.

"
        />

        <div className="mt-2">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center px-6 md:px-10">
            {/* Left: Image with enhanced styling */}
            <div className="relative">
              <div className="relative">
                <Image
                  src="/img/profil.JPG"
                  alt="encore"
                  className="rounded-2xl object-cover h-[400px] md:h-[500px]"
                  width={800}
                  height={500}
                />
              </div>
            </div>

            {/* Right: Enhanced text content */}
            <div className="mt-4 md:mt-0">
              <div className="md:-ml-14">
                <div className="w-full">
                  <ul className="space-y-4 md:ml-10 list-disc list-inside">
                    <li className="text-marron font-chillaxlight text-lg leading-relaxed">
                      Un encadrement personnalisé avec des cours en petits
                      groupes pour un suivi optimal.
                    </li>
                    <li className="text-marron font-chillaxlight text-lg leading-relaxed">
                      Une communauté bienveillante et dynamique, enrichie par
                      des événements réguliers.
                    </li>
                    <li className="text-marron font-chillaxlight text-lg leading-relaxed">
                      Un espace inspirant et apaisant, parfaitement situé au
                      cœur de la ville.
                    </li>
                  </ul>
                </div>
              </div>

              {!isLoggedIn && (
                <>
                  <div className="mt-6 p-6 text-center">
                    <Link href="/signup">
                      <Button
                        variant="filled"
                        size="lg"
                        bgColor="bg-encoregreen"
                        textColor="text-white"
                        className="font-chillax"
                        shadow={false}
                        hoverBgColor="hover:bg-encoregreen/80"
                      >
                        Rejoignez-nous
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default About;
