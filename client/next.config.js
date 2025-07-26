/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'images.pexels.com',
            port: "",
            pathname: '/**',
        },
        {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            port: "",
            pathname: '/**',
        }],
    }
};
module.exports = {
    eslint: {
        ignoreDuringBuilds: true,
    }
}
module.exports = nextConfig;