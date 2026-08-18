# Vercel Env Var Task State (Aug 18, 2026)

## User-provided values
- NEXT_PUBLIC_INSTAGRAM_USERNAME = recharza
- NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER = +916001921412 (user wrote "+91 6001921412")

## Key findings
- Vercel error on Save: "A variable with the name NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER already exists for the target preview:production on branch undefined". Both variables ALREADY EXIST on Vercel (with empty or wrong values) — must EDIT the existing entries, not add new ones.
- lib/support-config.ts gates: whatsapp available = Boolean(normalizePhone(NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER)); instagram available = Boolean(normalizeUsername(NEXT_PUBLIC_INSTAGRAM_USERNAME)); telegram available = Boolean(normalizeUsername(NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)) — this one is EMPTY on Vercel too (exists but blank), .env.example says =. Instagram fallback in mobile-nav-menu.tsx is "recharza" but support page channel uses env (empty -> unavailable).
- normalizePhone strips non-digits; +916001921412 is fine.
- Vercel MCP has NO env var tools; use browser at https://vercel.com/stand-still/recharza-platform/settings/environment-variables (signed in).
- To edit: click variable name in list -> edit fields -> Save (targets Production and Preview). Both vars exist; open each and update value, keep Production and Preview target.
- After Save: Vercel auto-redeploys production (env change triggers build). Then verify /support page WhatsApp & Instagram channels available.

## Progress
- Vercel MCP has NO env-var tools (only docs/deploy/projects/deployments/logs).
- Opened https://vercel.com/stand-still/recharza-platform/settings/environment-variables in browser.
- The env var list page loaded but the variable table area rendered empty in the saved screenshot (page content shows vars: EMAIL_DELIVERY_PROVIDER, GMAIL_SMTP_PASSWORD, GMAIL_SMTP_USER, GOOGLE_MAIL_FROM, GMAIL_SMTP_HOST, GMAIL_SMTP_PORT, GEMINI_MODEL, GEMINI_API_KEY, TELEGRAM_GROUP_BOT_USERNAME, TELEGRAM_GROUP_BOT_TOKEN, plus more below - need scroll).
- The "Add Environment Variable" button is present on page (find via browser_view elements list).

## Next steps
1. Click "Add Environment Variable", fill key NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER value 916001921412 (keep digits, wa.me accepts with/out +), Production target.
2. Add NEXT_PUBLIC_INSTAGRAM_USERNAME = recharza, Production target.
3. Submit; Vercel redeploys automatically (env change triggers build on main production).
4. Watch deployment -> Ready, then verify /support live shows WhatsApp + Instagram as available.

## Note
- Vercel project: stand-still/recharza-platform. Live production: https://recharza-platform-i9aiay0jf-stand-still.vercel.app (deployment 1f88e47, commit feat: support explainer).
- Vercel auto-redeploys when env vars change (for production). No code push needed.

## Update (14:18)
- Both variables confirmed present in list (scroll ~1666px down): NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (empty/blank value, Aug 7), NEXT_PUBLIC_INSTAGRAM_USERNAME (blank, Aug 6), NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER (blank, Aug 6). All three show "Click to reveal" buttons with dotted placeholder values.
- Clicking variable name did NOT open edit panel (single click on name does nothing). Need to use the "Menu" (...) button (menu-button-_r_1kh_ etc.) on each row -> probably Edit option; or double-click name row.
- Alternative: the earlier "Add Environment Variable" form showed existing var conflict, meaning Save in create-form with same name is blocked; must use row menu -> Edit.
- Values to set: WHATSAPP = +916001921412 ; INSTAGRAM = recharza. Optionally TELEGRAM_BOT_USERNAME = recharzaSupportbot (currently blank/exists).
- After editing: Vercel auto-redeploys; then verify https://recharza-platform-i9aiay0jf-stand-still.vercel.app/support shows WhatsApp + Instagram available.

## Update (14:21)
- Successfully opened the inline edit form for NEXT_PUBLIC_INSTAGRAM_USERNAME (via row Menu -> Edit). Form shows Key field value "NEXT_PUBLIC_INSTAGRAM_USERNAME", Value field "recharza", Environments "Production and Preview" selected. Save button at bottom-right of form (click ~x=807 y=654 in 893x768 viewport, page scroll 2772px).
- Just clicked Save for Instagram. Next: verify Instagram saved, then repeat for NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER (Row menu on element ~97 in list view -> Edit -> set value +916001921412 -> Save). Then optionally TELEGRAM_BOT_USERNAME = recharzaSupportbot.
- IMPORTANT: WhatsApp row's menu button is id "menu-button-_r_1kh_". Instagram is "menu-button-_r_1k7_". Telegram is "menu-button-_r_1jt_".
- After both saved: Vercel auto-redeploys. Verify at https://recharza-platform-i9aiay0jf-stand-still.vercel.app/support (both WhatsApp/Instagram "Open direct channel" buttons active) and health endpoint.

## Update (14:25)
Instagram variable saved successfully (blue toast "Updated Environment Variable" appeared; list resorted by Last Updated, DEPLOYMENT_ENV moved to top; NEXT_PUBLIC_INSTAGRAM_USERNAME no longer shows edit form). The working edit flow: (1) click the row's "Menu" button (WhatsApp row: id "menu-button-_r_1v0_"), (2) a popup menu appears with items Edit/Copy Value/Delete/View history, (3) click the JS item `document.querySelectorAll('[role="menuitem"]').find(el=>el.textContent.trim()==='Edit').click()` — an INLINE edit form expands directly below the row with Key input, Value textarea, Sensitive checkbox, Environments (Production/Preview checkboxes at bottom, both need to stay checked), and Cancel/Save buttons. Note: earlier a Cancel click accidentally saved the wrong state — verify with console JS which form is open via `document.querySelector('input[id^="edit-env-name"]').value`. The menu items have attribute role="menuitem" and text includes "Edit". WhatsApp row currently visible around y=393 in 893x768 viewport (page scroll ~2772). Target value for NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER: +916001921412. After saving both: Vercel auto-triggers redeployment; check deployments at https://vercel.com/stand-still/recharza-platform/deployments and verify https://recharza-platform-i9aiay0jf-stand-still.vercel.app/support shows WhatsApp/Instagram "Open direct channel" active.

## Update (14:33)
Both variables saved successfully (blue toast "Updated Environment Variable" for each). Values set: NEXT_PUBLIC_INSTAGRAM_USERNAME = recharza; NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER = +916001921412 (both Production and Preview). Clicked the banner "Redeploy" button and confirmed the Redeploy dialog (Production, current deployment source) by clicking its Redeploy button. Vercel is now redeploying production with new env values. Next: wait ~60s, check https://vercel.com/stand-still/recharza-platform/deployments for Ready, then verify live https://recharza-platform-i9aiay0jf-stand-still.vercel.app/support shows WhatsApp + Instagram channels as available (wa.me/916001921412 and instagram.com/recharza links).
