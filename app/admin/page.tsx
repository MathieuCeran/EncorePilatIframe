"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  CreditCard,
  ArrowRight,
  Calendar,
  Users,
  User,
  Book,
  Gift,
} from "lucide-react";
import Link from "next/link";
import BackgroundWrapper from "@/components/BackgroundWrapper";

const AdminDashboard = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRole(data.role);
    };
    fetchRole();
  }, []);

  return (
    <BackgroundWrapper>
      <div className="container mx-auto p-6 mb-10 ">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-2">
            Dashboard Admin
          </h1>
          <p className="text-gray-600">
            Bienvenue dans votre espace d&apos;administration
          </p>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(role === "admin" || role === "hostess") && (
            <>
              <Link href="/admin/cours">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-50 to-red-100 border-l-4 border-orange-500 hover:border-orange-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-orange-900">
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      Gestion des cours
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Gérez vos réservations et les cours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-orange-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/commandes">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-100 border-l-4 border-green-500 hover:border-green-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-green-900">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                      Gestion des commandes
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Gérez les commandes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link href="/admin/packs">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-blue-500 hover:border-blue-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      Gestion des Packs
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Gérez vos packs et configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/users">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-violet-100 border-l-4 border-purple-500 hover:border-purple-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-purple-900">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      Gestion des utilisateurs
                    </CardTitle>
                    <CardDescription className="text-purple-700">
                      Gérez les utilisateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/profs">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-teal-50 to-cyan-100 border-l-4 border-teal-500 hover:border-teal-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-teal-900">
                      <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                        <User className="h-6 w-6 text-teal-600" />
                      </div>
                      Gestion des professeurs
                    </CardTitle>
                    <CardDescription className="text-teal-700">
                      Gérez les professeurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-teal-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/courses-type">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-amber-50 to-yellow-100 border-l-4 border-amber-500 hover:border-amber-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-amber-900">
                      <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                        <Book className="h-6 w-6 text-amber-600" />
                      </div>
                      Gestion des types de cours
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Gérez les types de cours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/promo">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-pink-50 to-rose-100 border-l-4 border-pink-500 hover:border-pink-600 hover:scale-105">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-pink-900">
                      <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                        <Gift className="h-6 w-6 text-pink-600" />
                      </div>
                      Gestion des codes promo
                    </CardTitle>
                    <CardDescription className="text-pink-700">
                      Gérez les codes promo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                        Gestion
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-pink-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default AdminDashboard;
