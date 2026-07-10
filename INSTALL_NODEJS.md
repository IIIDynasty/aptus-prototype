# Install Node.js for Aptus MVP

You need Node.js to run the Aptus MVP backend. Here's how to install it:

---

## Quick Installation (Recommended)

### Option 1: Official Node.js Installer (5 minutes)

1. **Download Node.js**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version
   - Choose "Windows Installer (.msi)" for 64-bit

2. **Run the Installer**
   - Double-click the downloaded `.msi` file
   - Click **"Next"** through all prompts
   - Accept the license agreement
   - Keep default installation path: `C:\Program Files\nodejs\`
   - Make sure "Add to PATH" is checked ✅
   - Click **"Install"**
   - Wait 2-3 minutes

3. **Verify Installation**
   - Close and reopen your terminal/PowerShell
   - Run these commands:
   ```bash
   node --version
   npm --version
   ```
   - You should see version numbers (e.g., `v20.11.0` and `10.2.4`)

---

## After Installing Node.js

Once Node.js is installed, come back and tell me:
**"Node.js is installed"**

Then I'll help you:
1. Install all Azure SDK dependencies
2. Test the Azure connection
3. Start the local development server
4. Verify everything works

---

## Troubleshooting

**"node is not recognized" after installation**
- Close all terminal windows
- Open a NEW PowerShell or terminal window
- Try `node --version` again

**"Need admin permissions"**
- Right-click PowerShell
- Select "Run as Administrator"
- Run the installer again

---

## What Gets Installed

- **Node.js**: JavaScript runtime (required for backend)
- **npm**: Package manager (installs Azure SDKs and dependencies)
- **npx**: Package runner (for running tools)

All free and required for the Aptus MVP to work!
