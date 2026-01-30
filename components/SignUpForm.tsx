import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FormData } from "../hooks/useSignUpForm";
import { SignInLink } from "./SignInLink";
import { ErrorMessage } from "./ErrorMessage";
import { PasswordInput } from "./PasswordInput";
import { SubmitButton } from "./SubmitButton";

interface SignUpFormProps {
  step: number;
  formData: FormData;
  loading: boolean;
  error: string | null;
  onInputChange: (field: keyof FormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignUpForm({
  step,
  formData,
  loading,
  error,
  onInputChange,
  onSubmit,
}: SignUpFormProps) {
  return (
    <div className="relative w-full flex flex-col justify-center">
      {/* Step 1: First Name, Last Name */}
      <div
        className={`absolute w-full top-0 left-0 transition-all duration-500 flex flex-col justify-center ${
          step === 1
            ? "opacity-100 translate-x-0 z-10"
            : step > 1
              ? "opacity-0 -translate-x-10 pointer-events-none z-0"
              : "opacity-0 translate-x-10 pointer-events-none z-0"
        }`}
      >
        <div className="flex-1 space-y-4 md:space-y-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-lg md:text-xl mb-2 md:mb-3 font-[400] tracking-wide font-aboreto text-marron"
            >
              Prénom ?
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => onInputChange("firstName", e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-4 rounded-full border border-marron/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-encoregreen text-base md:text-lg font-chillax placeholder-gray-400"
              placeholder="Votre prénom"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-lg md:text-xl mb-2 md:mb-3 font-[400] tracking-wide font-aboreto text-marron"
            >
              Nom ?
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => onInputChange("lastName", e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-4 rounded-full border border-marron/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-encoregreen text-base md:text-lg font-chillax placeholder-gray-400"
              placeholder="Votre nom"
            />
          </div>
        </div>

        <ErrorMessage error={error} />
        <SignInLink />
      </div>

      {/* Step 2: Email, Phone */}
      <div
        className={`absolute w-full top-0 left-0 transition-all duration-500 flex flex-col justify-center ${
          step === 2
            ? "opacity-100 translate-x-0 z-10"
            : step > 2
              ? "opacity-0 -translate-x-10 pointer-events-none z-0"
              : "opacity-0 translate-x-10 pointer-events-none z-0"
        }`}
      >
        <div className="flex-1 space-y-4 md:space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-lg md:text-xl mb-2 md:mb-3 font-[400] tracking-wide font-aboreto text-marron"
            >
              email ?
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-4 rounded-full border border-marron/50 bg-transparent focus:outline-none focus:ring-2 focus:ring-encoregreen text-base md:text-lg font-chillax placeholder-gray-400"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-lg md:text-xl mb-2 md:mb-3 font-[400] tracking-wide font-aboreto text-marron"
            >
              téléphone ?
            </label>
            <div className="flex w-full gap-2 px-4 md:px-6 py-3 md:py-4 rounded-full border border-marron/50 bg-transparent focus-within:ring-2 focus-within:ring-encoregreen">
              <div className="w-20 md:w-24 flex items-center">
                <div className="pr-8">
                  <PhoneInput
                    country={"ma"}
                    value={formData.countryCode}
                    onChange={(_value, data: CountryData) => {
                      onInputChange("countryCode", data.dialCode);
                    }}
                    inputProps={{
                      readOnly: true,
                      style: { display: "none" },
                    }}
                    buttonStyle={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      height: "100%",
                      padding: 0,
                      margin: 0,
                    }}
                    containerStyle={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                    }}
                    dropdownStyle={{
                      zIndex: 1000,
                    }}
                    specialLabel=""
                  />
                </div>
                <span className="text-base md:text-lg font-chillax text-gray-700 select-none">
                  +{formData.countryCode}
                </span>
              </div>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 9);
                  onInputChange("phone", val);
                }}
                className="flex-1 bg-transparent outline-none border-none text-base md:text-lg font-chillax placeholder-gray-400 p-0 m-0 focus:ring-0 focus:outline-none"
                placeholder="000000000"
                pattern="[5-7][0-9]{8}"
                maxLength={9}
                aria-label="téléphone ?"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        <ErrorMessage error={error} />
        <SignInLink />
      </div>

      {/* Step 3: Passwords */}
      <div
        className={`absolute w-full top-0 left-0 transition-all duration-500 flex flex-col justify-center ${
          step === 3
            ? "opacity-100 translate-x-0 z-10"
            : "opacity-0 translate-x-10 pointer-events-none z-0"
        }`}
      >
        <form onSubmit={onSubmit} className="flex flex-col justify-center">
          <div className="flex-1 space-y-4 md:space-y-6">
            <PasswordInput
              id="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChange={(value: string) => onInputChange("password", value)}
              showPasswordLabel="Afficher le mot de passe"
              hidePasswordLabel="Masquer le mot de passe"
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(value: string) =>
                onInputChange("confirmPassword", value)
              }
              showPasswordLabel="Afficher le mot de passe"
              hidePasswordLabel="Masquer le mot de passe"
            />
          </div>

          <ErrorMessage error={error} />
          <SubmitButton loading={loading} />
          <SignInLink />
        </form>
      </div>
    </div>
  );
}
