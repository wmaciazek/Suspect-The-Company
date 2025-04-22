/** @type {import('next').NextConfig} */
const nextConfig = {
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