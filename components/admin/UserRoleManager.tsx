import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface UserRoleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
  onRoleUpdated: (newRole: string) => void;
}

const ROLES = [
  {
    value: "client",
    label: "Client",
    description: "Utilisateur standard avec accès aux réservations",
    icon: Users,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "hostess",
    label: "Hôtesse",
    description: "Accès limité à l'administration (gestion des réservations)",
    icon: UserCheck,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    value: "admin",
    label: "Administrateur",
    description: "Accès complet à toutes les fonctionnalités",
    icon: Crown,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  currentRole,
  onRoleUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedRole === currentRole) {
      toast.info("Aucun changement détecté");
      return;
    }

    if (selectedRole === "admin") {
      // Confirmation spéciale pour les promotions admin
      const confirmed = window.confirm(
        `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de promouvoir "${userName}" (${userEmail}) en ADMINISTRATEUR.\n\nCet utilisateur aura accès à TOUTES les fonctionnalités admin, y compris la gestion des autres utilisateurs.\n\nÊtes-vous absolument certain de vouloir continuer ?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_name: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la mise à jour du rôle");
      }

      toast.success(
        `Rôle mis à jour avec succès ! ${userName} est maintenant ${ROLES.find(r => r.value === selectedRole)?.label?.toLowerCase()}.`
      );
      
      onRoleUpdated(selectedRole);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de la mise à jour du rôle"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedRole(currentRole);
    onClose();
  };

  const currentRoleInfo = ROLES.find(r => r.value === currentRole);
  const selectedRoleInfo = ROLES.find(r => r.value === selectedRole);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des rôles utilisateur
          </DialogTitle>
          <DialogDescription>
            Modifier le rôle de <strong>{userName}</strong> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rôle actuel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rôle actuel</label>
            {currentRoleInfo && (
              <div className={`p-3 rounded-lg border-2 ${currentRoleInfo.color}`}>
                <div className="flex items-center gap-2">
                  <currentRoleInfo.icon className="h-4 w-4" />
                  <span className="font-medium">{currentRoleInfo.label}</span>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {currentRoleInfo.description}
                </p>
              </div>
            )}
          </div>

          {/* Sélection nouveau rôle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau rôle</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4" />
                      <span>{role.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aperçu du nouveau rôle */}
          {selectedRoleInfo && selectedRole !== currentRole && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Aperçu du nouveau rôle</label>
              <div className={`p-3 rounded-lg border-2 ${selectedRoleInfo.color}`}>
                <div className="flex items-center gap-2">
                  <selectedRoleInfo.icon className="h-4 w-4" />
                  <span className="font-medium">{selectedRoleInfo.label}</span>
                  <Badge variant="outline" className="ml-auto">
                    Nouveau
                  </Badge>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {selectedRoleInfo.description}
                </p>
              </div>
            </div>
          )}

          {/* Avertissement pour admin */}
          {selectedRole === "admin" && currentRole !== "admin" && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Crown className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-playfair font-medium text-yellow-800">
                    Promotion Administrateur
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Cette action donnera à l&apos;utilisateur un accès complet à toutes les 
                    fonctionnalités administratives. Assurez-vous que cette personne 
                    est de confiance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedRole === currentRole}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Mise à jour..." : "Mettre à jour le rôle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleManager;
