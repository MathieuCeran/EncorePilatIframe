"use client";

import React, { useState, useEffect } from "react";
import { Instagram, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type NavLink = {
  name: string;
  href: string;
};

const Navbar: React.FC = () => {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Nav links
  const navLinks: NavLink[] = [
    { name: "Accueil", href: "/" },
    { name: "Réservation", href: "/reservation" },
    { name: "Formules", href: "/formules" },
    { name: "Cours", href: "/cours" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const burger = (
    <svg
      width="24"
      height="18"
      viewBox="0 0 24 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1H23"
        stroke="#594B43"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 9H23"
        stroke="#594B43"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 17H23"
        stroke="#594B43"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-[1000] flex items-center justify-between px-5 py-3 font-ttdrugs tracking-[0.01em] transition-all duration-300 ${
        scrolled ? "md:bg-[#F9F7F3B8]/95" : "md:bg-[#F9F7F3B8]/50"
      } md:backdrop-blur`}
    >
      {/* Left: Encore Logo (hidden on mobile) */}
      <div className="flex-none flex items-center">
        <Link
          href="/"
          aria-label="Encore"
          className="hidden md:flex" // hide logo on mobile
        >
          <Image
            src="/img/encore-pilates-logo.png"
            alt="Encore"
            width={75}
            height={17}
          />
        </Link>
      </div>

      {/* Center: Desktop Nav */}
      <div className="navbar-links flex-1 flex justify-center gap-12 items-center">
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className={`navbar-link text-base font-normal transition-colors duration-200 no-underline ${
              pathname === link.href ? "text-[#222]" : "text-[#b0ada7]"
            } hidden md:flex`}
          >
            {link.name}
          </a>
        ))}
      </div>

      {/* Right: Burger (mobile) */}
      <div className="flex-none flex items-center gap-3 w-20 justify-end">
        <button
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden flex items-center bg-none border-none cursor-pointer p-0 m-0 pt-1"
        >
          {menuOpen ? <X size={22} stroke="#222" /> : burger}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu fixed top-0 left-0 w-screen h-screen bg-[#faf9f6]/90 flex flex-col justify-between items-center z-[2000] py-16 backdrop-blur-sm">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 bg-none border-none cursor-pointer z-[2100] p-0"
          >
            <X size={28} stroke="#222" />
          </button>

          {/* Logo Encore tout en haut */}
          <div className="flex-shrink-0">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <Image
                src="/img/encore-pilates-logo.png"
                alt="Encore"
                width={120}
                height={27}
              />
            </Link>
          </div>

          {/* Navigation links centrés */}
          <div className="flex-1 flex flex-col justify-center items-center space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-xl font-normal no-underline ${
                  pathname === link.href ? "text-[#222]" : "text-[#b0ada7]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Instagram icon tout en bas */}
          <div className="flex-shrink-0">
            <a
              href="https://www.instagram.com/encorepilates.ma/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              onClick={() => setMenuOpen(false)}
            >
              <Instagram size={28} stroke="#222" strokeWidth={1.2} />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
