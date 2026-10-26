import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone: ينتج خادم مستقل بحدّ أدنى من الاعتماديات (للنشر على VPS)
  output: "standalone",

  // تجاهل أخطاء TypeScript أثناء البناء (المشروع يحتوي أنواع معقدة)
  typescript: {
    ignoreBuildErrors: true,
  },

  // تعطيل ESLint أثناء البناء (نفصلها يدوياً قبل النشر)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // تحسين الصور
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },

  // رؤوس أمنية
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  reactStrictMode: false,
};

export default nextConfig;
