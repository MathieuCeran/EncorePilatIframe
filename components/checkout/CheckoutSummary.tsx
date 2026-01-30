import React from "react";
import Card from "@/components/card";
import { CourseSummary } from "./CourseSummary";
import { UserPackSummary } from "./UserPackSummary";
import { ReserveWithPackButton } from "./ReserveWithPackButton";
import { PaymentButtons } from "./PaymentButtons";
import { FormattedCourse } from "@/types/types";
import { Pack, UserPackData } from "@/types/checkout";
import { Input } from "@/components/ui/input";
import Button from "@/components/button";

interface CheckoutSummaryProps {
  course: FormattedCourse | null;
  selectedPack: Pack | null;
  userPack: UserPackData | null;
  onSitePayment: () => void;
  isMobile?: boolean;
  promoCode?: string;
  appliedPromo?: {
    code: string;
    discountAmount: number;
    discountedTotal: number;
    description?: string | null;
  } | null;
  onPromoInputChange?: (text: string) => void;
  onApplyPromo?: (code: string) => void;
  onClearPromo?: () => void;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  course,
  selectedPack,
  userPack,
  onSitePayment,
  isMobile = false,
  promoCode,
  appliedPromo,
  onPromoInputChange,
  onApplyPromo,
  onClearPromo,
}) => {
  const typePackFormatter = (typePack: string) => {
    if (typePack === "decouverte") return "Découverte";
    if (typePack === "mono_cours") return "Formule";
    if (typePack === "multi_cours") return "Pack";
    return typePack;
  };

  if (isMobile) {
    return (
      <div className="block md:hidden mb-6">
        <Card className="rounded-[24px] overflow-hidden">
          {course && <CourseSummary course={course} isMobile={true} />}

          <div className="p-6 space-y-6">
            {/* Pack Selection */}
            <div className="space-y-3">
              <h4 className="text-lg font-playfair text-marron font-semibold">
                {selectedPack
                  ? typePackFormatter(selectedPack.type_pack) +
                    "" +
                    " - " +
                    " " +
                    selectedPack.nom +
                    (selectedPack.nombre_cours_total
                      ? ` (${selectedPack.nombre_cours_total} cours)`
                      : "")
                  : "Pas de pack sélectionné"}
              </h4>

              {/* Selected pack summary */}
              {userPack && (
                <UserPackSummary userPack={userPack} isMobile={true} />
              )}
            </div>

            {/* Reserve with pack button */}
            {userPack && course && (
              <ReserveWithPackButton
                course={course}
                userPack={userPack}
                isMobile={true}
              />
            )}

            {/* Promo code input */}
            {!userPack && (
              <div className="pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Code promo"
                    value={promoCode ?? ""}
                    onChange={(e) => onPromoInputChange?.(e.target.value)}
                  />
                  <Button
                    size={"sm"}
                    variant="outlined"
                    borderColor="border-marron"
                    textColor="text-marron"
                    hoverBgColor="hover:bg-darkBeige2"
                    className="font-chillax bg-transparent"
                    shadow={false}
                    onClick={() => {
                      if (promoCode && onApplyPromo) onApplyPromo(promoCode);
                    }}
                  >
                    Appliquer
                  </Button>
                  {appliedPromo && (
                    <Button
                      size={"sm"}
                      variant="outlined"
                      borderColor="border-red-500"
                      textColor="text-red-600"
                      className="font-chillax bg-transparent"
                      shadow={false}
                      onClick={() => onClearPromo?.()}
                    >
                      Retirer
                    </Button>
                  )}
                </div>
                {appliedPromo && (
                  <div className="text-xs text-green-700 mt-1">
                    Code {appliedPromo.code} appliqué: -DHS{" "}
                    {appliedPromo.discountAmount.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Total - Only show if user doesn't have a pack */}
            {!userPack && (
              <div className="pt-4 border-t border-gray-200/50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">
                    Total :
                  </span>
                  <span className="text-xl font-chillax text-marron">
                    {selectedPack
                      ? `DHS ${(appliedPromo ? appliedPromo.discountedTotal : selectedPack.prix).toFixed(2)}`
                      : "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Payment buttons - Only show if user doesn't have a pack */}
            {!userPack && (
              <PaymentButtons onSitePayment={onSitePayment} isMobile={true} />
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="hidden md:block md:col-span-1">
      <Card className="space-y-4 sticky top-24 rounded-[24px]">
        {course && <CourseSummary course={course} isMobile={false} />}

        <div className="pl-6 pr-6 pb-6 rounded-[24px]">
          <div className="h-px bg-gray-200/50 my-3" />
          <h4 className="text-base font-playfair text-marron mb-2">
            {selectedPack
              ? typePackFormatter(selectedPack.type_pack) +
                "" +
                " - " +
                " " +
                selectedPack.nom +
                (selectedPack.nombre_cours_total
                  ? ` (${selectedPack.nombre_cours_total} cours)`
                  : "")
              : "Pas de pack sélectionné"}
          </h4>
          <div className="h-px bg-gray-200/50 my-3" />

          {/* Selected pack summary */}
          <div className="mb-2">
            {userPack && (
              <UserPackSummary userPack={userPack} isMobile={false} />
            )}
          </div>

          {/* Reserve with pack button */}
          {userPack && course && (
            <ReserveWithPackButton
              course={course}
              userPack={userPack}
              size="sm"
              isMobile={false}
            />
          )}

          {/* Promo code input */}
          {!userPack && (
            <div className="mb-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoCode ?? ""}
                  onChange={(e) => onPromoInputChange?.(e.target.value)}
                />
                <Button
                  size={"sm"}
                  variant="outlined"
                  borderColor="border-marron"
                  textColor="text-marron"
                  hoverBgColor="hover:bg-darkBeige2"
                  className="font-chillax bg-transparent"
                  shadow={false}
                  onClick={() => {
                    if (promoCode && onApplyPromo) onApplyPromo(promoCode);
                  }}
                >
                  Appliquer
                </Button>
                {appliedPromo && (
                  <Button
                    size={"sm"}
                    variant="outlined"
                    borderColor="border-red-500"
                    textColor="text-red-600"
                    className="font-chillax bg-transparent"
                    shadow={false}
                    onClick={() => onClearPromo?.()}
                  >
                    Retirer
                  </Button>
                )}
              </div>
              {appliedPromo && (
                <div className="text-xs text-green-700 mt-1">
                  Code {appliedPromo.code} appliqué: -DHS{" "}
                  {appliedPromo.discountAmount.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Total - Only show if user doesn't have a pack */}
          {!userPack && (
            <div className="mb-2">
              <div className="text-sm text-gray-700 mb-1">Total :</div>
              <div className="text-marron font-chillax text-lg">
                {selectedPack
                  ? `DHS ${(appliedPromo ? appliedPromo.discountedTotal : selectedPack.prix).toFixed(2)}`
                  : "—"}
              </div>
            </div>
          )}

          {/* Payment buttons - Only show if user doesn't have a pack */}
          {!userPack && (
            <PaymentButtons
              onSitePayment={onSitePayment}
              size="sm"
              isMobile={false}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
