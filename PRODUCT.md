# Product context

An independent manual-input companion to Investidor10 for an individual investor. The requested scope is a direct, uncomplicated calculator, not a market-data platform or a clone of paid reports.

The primary job is comparing Graham and dividend-yield model prices with a manually entered quote. Additional jobs are estimating dividend income requirements and compound growth. One administrator login protects the calculator, as explicitly requested by the user. There is no remote financial data, billing, recommendation engine or transactional investing.

The account name is `admin`; the password is configured only as a server-side scrypt hash. Signed sessions expire after eight hours. Public visitors see the sign-in screen. The calculator requires a verified session on the server, and signing out returns to sign-in. Credentials are never documented in source or sent to the client as configuration.

English interface and technical artifacts follow the user's project language policy. BRL formatting and labels for LPA/VPA support Brazilian source data. Examples must always be identified as hypothetical.

The interface is an Operate surface. Use a light, restrained workbench for a desktop browser beside Investidor10, with a stacked phone layout. Inputs and results must stay together; no onboarding or marketing hero.

Comparison snapshots are stored only on the device, with a 12-entry limit and CSV export. Storage failure must preserve current-session functionality. Missing or invalid values never produce a fabricated result.
