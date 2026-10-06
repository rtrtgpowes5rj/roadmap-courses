const isPages=process.env.GITHUB_PAGES==="true";
const basePath=isPages?(process.env.PAGES_BASE_PATH||""):"";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(isPages?{output:"export",basePath,assetPrefix:basePath,trailingSlash:true}:{}),
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
