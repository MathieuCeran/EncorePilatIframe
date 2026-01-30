import Link from "next/link";

export function SignInLink() {
  return (
    <div className="text-center text-gray-500 italic text-xs md:text-sm font-inter-extralight-italic pb-4">
      Vous avez déjà un compte ? &nbsp;
      <Link
        href="/signin"
        className="underline hover:text-[#23432b] transition-colors duration-200"
      >
        Connectez-vous !
      </Link>
    </div>
  );
}
