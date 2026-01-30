import React from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "./card";
import Title from "./title";
import Button from "./button";

const CourseCard = ({
  image,
  title,
  className = "",
}: {
  image: string;
  title: string;
  className?: string;
}) => {
  return (
    <div
      className={`relative overflow-hidden group cursor-pointer ${className} `}
    >
      <div className="relative">
        <Image
          src={image}
          alt={title}
          className="w-full  object-cover transition-all duration-300  group-hover:brightness-75"
          width={1000}
          height={1000}
        />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/reservation?type=${encodeURIComponent(title)}`}
            className="p-4 transition-all duration-200"
          >
            <p className="text-white text-2xl font-inter-extralight underline">
              Réserver
            </p>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-4 left-4">
        <span className="text-white px-3 py-1 rounded-full text-2xl font-chillax backdrop-blur-sm">
          {title}
        </span>
      </div>
    </div>
  );
};

const noCours = () => {
  return (
    <div className="p-10 w-full">
      <Card>
        <Title
          title="Découvrez nos cours"
          description="Chez Encore, chaque pratique est une opportunité de se reconnecter à soi, de sculpter le corps, d’assouplir l’esprit et d’explorer l’équilibre entre force et douceur."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 px-10 pb-10 md:px-14">
          <CourseCard
            image="/img/porte 3.png"
            title="Barre"
          />
          <CourseCard
            image="/img/porte 2.png"
            title="Reformer"
          />
          <CourseCard
            image="/img/porte 1.png"
            title="Lagree MicroPro"
          />
        </div>

        {/* Bouton Voir plus de cours */}
        <div className="flex justify-center pb-10">
          <Link href="/cours">
            <Button
              variant="outlined"
              bgColor="bg-transparent"
              textColor="text-marron"
              borderColor="border-marron"
              className="font-ttdrugs px-8 py-3"
              hoverBgColor="hover:bg-marron"
              hoverTextColor="hover:text-white"
            >
              Voir plus de cours
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default noCours;
