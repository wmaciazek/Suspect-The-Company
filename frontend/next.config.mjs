/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['jspdf', 'jspdf-autotable'],
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'icon.horse',
          port: '',
          pathname: '/icon/**',
        }
      ],
    },
  };
  
  export default nextConfig;