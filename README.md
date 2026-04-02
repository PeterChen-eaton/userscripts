# userscripts

A collection of Tampermonkey userscripts.

---

## What is Tampermonkey?

[Tampermonkey](https://www.tampermonkey.net/) is a popular browser extension that allows you to run custom JavaScript snippets (called **userscripts**) on any web page. Userscripts can modify the appearance or behavior of websites to suit your needs — all without changing the website's source code.

### What can userscripts do?

- **Customize UI** — Hide, restyle, or rearrange elements on a page.
- **Automate tasks** — Auto-click buttons, auto-fill forms, or skip repetitive steps.
- **Add features** — Inject new buttons, shortcuts, or widgets that the original site doesn't provide.
- **Fix annoyances** — Remove ads, pop-ups, or other unwanted content.

### How to install and set up Tampermonkey

1. **Install the Tampermonkey extension**
   - **Chrome**: Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) and click **Add to Chrome**.
   - **Edge**: Visit the [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) and click **Get**.

2. **Enable Developer Mode (Chrome / Edge)**
   - Navigate to `chrome://extensions` (or `edge://extensions`).
   - Toggle **Developer mode** on (top-right corner).
   - This is required for Tampermonkey to have full script injection capabilities.

3. **Add a userscript**
   - Click the Tampermonkey icon in your browser toolbar, then select **Create a new script**.
   - Paste the contents of the `.user.js` file you want to use, then press **Ctrl + S** (or **Cmd + S**) to save.
   - Alternatively, open a raw `.user.js` URL directly in your browser — Tampermonkey will automatically prompt you to install it.

4. **Manage scripts**
   - Click the Tampermonkey icon → **Dashboard** to enable, disable, edit, or delete installed scripts.

---

## Scripts

| Script | Description |
|--------|-------------|
| [GitHub Custom Tools](github-custom-tools/script.user.js) | Customizations for GitHub — wider sidebar, auto SSO follow, and more. |
| [Show Copilot Usage](show-copilot-usage/script.user.js) | Display Copilot quota in a compact top-right overlay on GitHub pages, refreshing every 5 minutes. |
