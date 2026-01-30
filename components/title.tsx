import React from "react";

const Title = ({
  title,
  description,
  padding = "p-10",
  className = "",
  noBorder = false,
  noMargin = false,
}: {
  title: string;
  description?: string;
  padding?: string;
  className?: string;
  noBorder?: boolean;
  noMargin?: boolean;
}) => {
  return (
    <div className={`${padding} ${className}`}>
      <h1 className="text-xl font-playfair font-bold text-marron tracking-wide mb-4">
        {title}
      </h1>
      {!noBorder && (
        <div className={`h-px bg-gray-200/50 ${noMargin ? "mb-0" : "mb-4"}`} />
      )}
      {description && (
        <>
          <p className="text-sm md:text-[13px] text-marron font-ttdrugs leading-relaxed text-justify">
            {description}
          </p>
        </>
      )}
    </div>
  );
};

export default Title;
