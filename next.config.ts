import type { NextConfig } from "next";

// Integración opcional con Workflow DevKit
// Usa un wrapper no-op si el paquete no está instalado
// para evitar romper el build local/CI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let withWorkflow: (config: NextConfig) => NextConfig = (config: NextConfig) => config;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  withWorkflow = require('workflow/next').withWorkflow;
} catch (_) {
  // Paquete no instalado: continuar sin workflow
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default withWorkflow(nextConfig);
