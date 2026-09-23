# QuizMaster - Standalone Plain HTML + JS Edition

This folder contains a **100% pure HTML, Vanilla JavaScript, and CDN-linked** version of the QuizMaster Question Bank.

---

## 🌟 Why this exists

- **No Node.js or npm required**: You do not need to install packages or run any terminal commands.
- **No Build Steps**: No TypeScript compilation (`tsc`), no Vite bundler, no webpack.
- **Directly Editable**: You can open `index.html` and `app.js` in Notepad, VS Code, or directly edit on GitHub.com and commit changes immediately.
- **CDN Powered**:
  - **Tailwind CSS**: Linked via `https://cdn.tailwindcss.com`
  - **Lucide Icons**: Linked via `https://unpkg.com/lucide@latest`
  - **Google Firebase**: Modular Web SDK loaded directly from Google's official CDN (`https://www.gstatic.com/firebasejs/10.8.0/...`)

---

## 📁 Files in this folder

| File | Description |
|---|---|
| `index.html` | Clean single-page application structure with modals and responsive Tailwind layout. |
| `app.js` | Plain vanilla modern JavaScript (ES Modules) handling Firebase Auth, Firestore real-time sync, practice quiz, and export. |

---

## 🚀 How to Run Locally

Because modern browsers require an HTTP server for ES Modules (`import ... from '...'`), you can run it locally in any of these ways:

### Option 1: VS Code Live Server (Easiest)
1. Open this folder in VS Code.
2. Install the **"Live Server"** extension (by Ritwick Dey).
3. Right-click `index.html` and click **"Open with Live Server"**.

### Option 2: Python (Built into Mac & Windows)
Open terminal/command prompt in this folder and run:
```bash
python3 -m http.server 8000
```
Then visit: `http://localhost:8000`

---

## 🌐 How to deploy this Plain HTML version to your GitHub Pages

If you want your GitHub Pages website (`https://panditalap.github.io/My-Quiz-Question-Bank/`) to serve this plain HTML version directly:

1. Copy `plain-html/index.html` to `docs/index.html`
2. Copy `plain-html/app.js` to `docs/app.js`
3. Also copy `docs/index.html` to `docs/404.html`
4. Commit and push to GitHub:
   ```bash
   git add docs/
   git commit -m "Switch GitHub Pages to plain HTML and JS version"
   git push
   ```

That's it! GitHub Pages will immediately serve the pure HTML and JS version. You can then edit `docs/index.html` and `docs/app.js` anytime in the future without any build step.
