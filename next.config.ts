import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default do Next.js é 1MB — a Requisição de Compra aceita upload de
      // foto (input type="file" sem redimensionamento no cliente), e uma
      // foto de celular passa de 1MB fácil. Sem isso, o envio quebra com
      // "Error: Body exceeded 1 MB limit" (413) assim que uma foto maior é
      // anexada — foi o que causou o erro de servidor reportado em /solicitar.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
