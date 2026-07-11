// Shared chrome CSS for every public marketing page (home, /funkcje,
// /kontakt) — nav, footer, buttons, wrap/section scaffolding. Extracted out
// of app/page.tsx so new marketing pages don't have to duplicate the nav/
// footer styling by hand. Each page still owns its own content-specific
// styles in its own <style> block.
export const LANDING_BASE_STYLES = `
  .lp { background: #ffffff; color: #232b31; }
  .lp * { box-sizing: border-box; }
  .lp .wrap { max-width: 1120px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
  .lp .wrap--narrow { max-width: 760px; }
  .lp h1, .lp h2, .lp h3 { font-family: var(--font-sans), sans-serif; font-weight: 700; text-wrap: balance; margin: 0; }
  .lp p { margin: 0; }
  .lp a { color: inherit; }
  .mono-inline { font-family: var(--font-mono), monospace; font-size: 0.94em; }

  .lp-nav { position: sticky; top: 0; z-index: 40; background: rgba(35,43,49,0.96); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.08); }
  .lp-nav-row { display: flex; align-items: center; height: 68px; gap: 12px; }
  .lp-nav-links { display: flex; align-items: center; gap: 30px; margin-left: 40px; }
  .lp-nav-links a { font-size: 14px; font-weight: 500; text-decoration: none; color: #fff; }
  .lp-nav-links a:hover { color: rgba(255,255,255,0.8); }
  .lp-nav-cta { display: flex; align-items: center; gap: 18px; margin-left: auto; }
  .lp-nav-cta .login-link { font-size: 14px; font-weight: 600; text-decoration: none; color: #fff; white-space: nowrap; }
  .lp-nav-cta .btn--primary { background: #fffd73; color: #3a3800; }
  .lp-nav-cta .btn--primary:hover { box-shadow: 0 6px 20px -6px rgba(255,253,115,0.5); }
  .lp-nav .nav-cta-full { display: inline; }
  .lp-nav .nav-cta-short { display: none; }
  @media (max-width: 860px) { .lp-nav-links { display: none; } }
  @media (max-width: 480px) {
    .lp-nav-cta .login-link { display: none; }
    .lp-nav .nav-cta-full { display: none; }
    .lp-nav .nav-cta-short { display: inline; }
  }

  .lp-nav-hamburger {
    display: none; background: none; border: none; cursor: pointer;
    width: 26px; height: 20px; padding: 0; flex-direction: column; justify-content: space-between;
    flex-shrink: 0;
  }
  .lp-nav-hamburger span { display: block; width: 100%; height: 2px; background: #fff; border-radius: 2px; transition: transform 0.2s, opacity 0.2s; }
  @media (max-width: 860px) { .lp-nav-hamburger { display: flex; } }

  .lp-nav-mobile { display: none; }
  @media (max-width: 860px) {
    .lp-nav-mobile {
      display: flex; flex-direction: column;
      background: rgba(35,43,49,0.98); border-top: 1px solid rgba(255,255,255,0.08);
      padding: 4px 24px 20px;
    }
    .lp-nav-mobile a { font-size: 15px; font-weight: 500; color: #fff; text-decoration: none; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .lp-nav-mobile-cta { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .lp-nav-mobile-cta a { border-bottom: none; padding: 0; }
    .lp-nav-mobile-cta .btn--primary { justify-content: center; padding: 12px; }
  }

  .lp .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: var(--font-sans), sans-serif; font-weight: 600; font-size: 14.5px;
    padding: 13px 24px; border-radius: 8px; text-decoration: none; white-space: nowrap;
    border: 1.5px solid transparent; cursor: pointer; transition: box-shadow 0.15s;
  }
  .lp .btn--primary { background: #232b31; color: #fff; }
  .lp .btn--primary:hover { box-shadow: 0 6px 20px -6px rgba(35,43,49,0.55); }
  .lp .btn--ghost { background: transparent; color: #232b31; border-color: #e2e6e8; }
  .lp .btn--ghost:hover { border-color: #8b939a; }
  .lp .btn--sm { padding: 9px 16px; font-size: 13.5px; border-radius: 7px; }

  .lp section { padding: 64px 0; }
  .lp .section--dim { background: #f3f6f7; border-top: 1px solid #e2e6e8; border-bottom: 1px solid #e2e6e8; }
  .lp .section-head { max-width: 640px; margin-bottom: 40px; }
  .lp .section-head h2 { font-size: clamp(23px, 3vw, 28px); letter-spacing: -0.01em; }
  .lp .section-head p { color: #5b6570; font-size: 15.5px; margin-top: 10px; line-height: 1.6; }
  @media (max-width: 640px) { .lp section { padding: 44px 0; } }

  .lp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }

  /* Specificity note: plain ".lp-cta-band" (0,1,0) was silently losing to
     ".lp section" (0,1,1), since this class sits on an actual <section> —
     every previous padding bump here was a no-op. Scoping under ".lp"
     brings it to (0,2,0), which wins outright. */
  .lp .lp-cta-band { background: #232b31; color: #fff; text-align: center; padding: 58px 0 171px; position: relative; overflow: hidden; }
  .lp-cta-chart { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 117px; }
  .lp-cta-marker { position: absolute; left: 53.7%; bottom: 12px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; }
  @media (max-width: 640px) { .lp .lp-cta-band { padding: 40px 0 135px; } }
  .lp-cta-marker-dot { width: 9px; height: 9px; border-radius: 50%; background: #ff5a5a; position: relative; }
  .lp-cta-marker-dot::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; border: 1.5px solid #ff5a5a; opacity: 0.6; animation: lpCtaRing 1.6s ease-out infinite; }
  @keyframes lpCtaRing { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }
  .lp-cta-marker-label { font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 600; color: #ffcccc; background: rgba(255,90,90,0.15); border: 1px solid rgba(255,90,90,0.35); padding: 3px 9px; border-radius: 5px; white-space: nowrap; }
  .lp-cta-band h2 { font-size: clamp(21px, 3vw, 29px); margin-bottom: 12px; position: relative; }
  .lp-cta-band p { color: rgba(255,255,255,0.65); margin-bottom: 26px; font-size: 15px; position: relative; }
  .lp-cta-band .btn--primary { background: #fffd73; color: #3a3800; position: relative; }
  .lp-cta-band .btn--ghost { border-color: rgba(255,255,255,0.3); color: #fff; position: relative; }
  @media (prefers-reduced-motion: reduce) { .lp-cta-marker-dot::after { animation: none; } }

  .lp-footer { background: #232b31; color: rgba(255,255,255,0.72); }
  .lp-footer-body { padding: 48px 0 30px; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
  @media (max-width: 780px) { .lp-footer-body { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 480px) { .lp-footer-body { grid-template-columns: 1fr; } }
  .lp-footer-desc { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.6; max-width: 30ch; margin-top: 12px; }
  .lp-footer-addr { font-size: 12.5px; color: rgba(255,255,255,0.5); line-height: 1.7; margin-top: 14px; }
  .lp-footer-col h3 { font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 0 0 14px; }
  .lp-footer-col a { display: block; font-size: 13.5px; color: rgba(255,255,255,0.75); text-decoration: none; margin-bottom: 10px; }
  .lp-footer-col a:hover { color: #fff; }
  .lp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 0; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.45); }
  .lp-footer-bottom a { text-decoration: none; color: inherit; }
  .lp-footer-bottom a:hover { color: #fff; }
`
