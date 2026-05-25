/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

   async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'https://ticket-management-ern8.onrender.com/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
