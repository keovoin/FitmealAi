// Minimal ambient declaration for the `bakong-khqr` npm package so
// `tsc --noEmit` succeeds before the dependency lands in node_modules.
// We import it lazily and cast to `any` at the call site, so the public
// surface here is intentionally tiny — tighten it up once the real
// types ship.

declare module "bakong-khqr" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any;
  export default mod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const BakongKHQR: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const MerchantInfo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const IndividualInfo: any;
}
