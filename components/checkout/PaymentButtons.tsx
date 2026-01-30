import React from "react";
import Button from "@/components/button";

interface PaymentButtonsProps {
  onSitePayment: () => void;
  size?: "sm" | "md" | "lg";
  isMobile?: boolean;
}

export const PaymentButtons: React.FC<PaymentButtonsProps> = ({
  onSitePayment,
  size = "md",
  isMobile = false,
}) => {
  const buttonSize = isMobile ? "sm" : size;
  const containerClass = isMobile
    ? "mt-4 justify-center items-center flex flex-row"
    : "mt-4 flex justify-center";

  return (
    <div className={containerClass}>
      <Button
        size={buttonSize}
        variant="filled"
        bgColor="bg-encoregreen"
        textColor="text-white"
        hoverBgColor="hover:bg-encoregreen/80"
        shadow={false}
        className="font-chillax"
        onClick={onSitePayment}
      >
        Payer sur place
      </Button>
    </div>
  );
};
