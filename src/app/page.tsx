import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Link 
        href="/admin"
        className="transition-transform hover:scale-105 duration-300 ease-in-out"
      >
        <Image
          src="/logo.png"
          alt="GuindaVerify Logo"
          width={400}
          height={400}
          className="cursor-pointer drop-shadow-2xl"
          priority
        />
      </Link>
    </div>
  );
}
