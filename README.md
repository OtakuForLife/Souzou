# 🌿 Souzou – The Calm, Powerful Life Management System

<img src="https://github.com/OtakuForLife/Souzou/blob/main/frontend/public/screenshots/Dashboard.png" height="400">

**Souzou** is your personal digital sanctuary — a powerful yet serene knowledge and life management tool inspired by the best of Obsidian and Notion, but without the clutter and overwhelm.

Whether you're building a second brain, tracking personal goals, managing tasks, or journaling your thoughts, Souzou provides an intuitive, unified environment to help you stay grounded and organized — all while growing your own life knowledge base.

---

## 🚀 Why Souzou?

The word **Souzou (創造)** in Japanese means *creation* or *imagination*. That core idea is at the heart of this project. Souzou isn’t just another tool to organize your thoughts — it’s a space designed to empower your capacity to **create**, **grow**, and **evolve** with clarity.

Most personal knowledge management (PKM) tools are either too simple or overwhelming or (most importantly!) not open source. Souzou bridges that gap, providing a powerful feature set wrapped in a minimalist, calming interface. It's more than just a second brain — it's a **life management platform** built to help you live and think more intentionally.

---

## My Vision
I envision Souzou as a platform that is not another jumble of notes, but that is a living, breathing system that actively helps you manage your life, from simple notes, tasks, calendar events, to complex thoughts and ideas. It's a place where you can grow yourself without getting lost in the details and infrastructure. A tool that is not just a tool, but a companion throughout your daily life.

---

## 🚀 Features

 - Simple Markdown Editor with Note linking
 - Themes
 - Notes-inside-Notes Hierarchy
 - 3 Entity Types
    - Markdown Notes
    - Views
    - AI Chat History (for now only Ollama provider supported)
 - familiar Layout
 - Build Customizable Dashboards (Views) with Widgets (Graph Widget, Note Widget, AI Chat Widget)

---

## 🛠️ Technology Stack

*Souzou is built with the following technologies:*

- **Frontend**
  - TypeScript
  - Vite
  - React
  - Tailwind CSS
  - Shadcn UI
  - Vitest
  - CodeMirror

- **Backend**
  - Python
  - Django
  - Django REST Framework
  - Pytest

- **Database**
  - PostgreSQL

- **CI/CD**
  - GitHub Actions
  - Docker
  - Docker Compose

---

## 🏗️ How to Build

*Coming soon...*

### Desktop Windows

```bash
# Install dependencies
npm install

# rebuild native modules
npx electron-rebuild -f -w better-sqlite3

# Build the Vite app
npm run build

# Create the Electron executable
npm run forge:make

# Run the Electron executable
# On Windows
./out/production/Souzou-win32-x64/Souzou.exe
```

### Android

For Development:

```bash
# Install dependencies
npm install

# Build the Vite app
npm run build

# Sync the Capacitor app
npx cap sync android

# Run the Capacitor app
npx cap run android
```

For Production:

⚠️ Change  androidScheme back to 'https' (or remove it to use default)
⚠️ Remove or restrict the cleartext traffic permissions

```bash
# Install dependencies
npm install

# Build the Vite app
npm run build

# Build the Capacitor app
npx cap build --keystorepath <path> --keystorepass <keystore-password> --keystorealias <alias> --keystorealiaspass <alias-password> android
```

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).

You are free to use, modify, and distribute the software, provided any derivative work is also open-sourced under the same license.


---

> *Souzou – Calm your mind. Capture your world. Build your future.*
