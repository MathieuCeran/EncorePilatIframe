import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Eye, EyeOff, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  showPassword,
  setShowPassword,
  label,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  label: string;
  autoComplete?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete || "off"}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-encoregreen focus:border-transparent pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  </div>
);

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  const supabase = createClient();

  if (!isOpen) return null;

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        "Le nouveau mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);

    try {
      // First, verify the current password by attempting to sign in
      const {
        data: { user },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || "",
        password: currentPassword,
      });

      if (signInError || !user) {
        toast.error("Mot de passe actuel incorrect");
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("Erreur lors de la mise à jour du mot de passe");
        console.error("Password update error:", updateError);
      } else {
        setStep("success");
        toast.success("Mot de passe mis à jour avec succès");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("form");
    onClose();
  };

  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Mot de passe mis à jour !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été modifié avec succès.
            </p>
            <Button
              onClick={handleClose}
              className="w-full bg-encoregreen hover:bg-encoregreen/80 text-white py-3 rounded-xl font-medium"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 border rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-encoregreen" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Réinitialiser le mot de passe
          </h2>
          <p className="text-gray-600">
            Entrez votre mot de passe actuel et votre nouveau mot de passe.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Mot de passe actuel"
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
            label="Mot de passe actuel"
            autoComplete="current-password"
          />

          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Nouveau mot de passe"
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            label="Nouveau mot de passe"
            autoComplete="new-password"
          />

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirmer le nouveau mot de passe"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            label="Confirmer le nouveau mot de passe"
            autoComplete="new-password"
          />
        </div>

        {/* Password requirements */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Exigences du mot de passe :</p>
              <ul className="space-y-1 text-xs">
                <li>• Au moins 6 caractères</li>
                <li>• Les mots de passe doivent correspondre</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleResetPassword}
            className="flex-1 py-3 bg-encoregreen text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={
              loading || !currentPassword || !newPassword || !confirmPassword
            }
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Mise à jour...
              </div>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
