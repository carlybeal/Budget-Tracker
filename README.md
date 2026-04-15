# Budget Tracker

A personal budget tracker that syncs to Google Sheets. Runs as a single HTML file.

## Features

- Track income and expenses by category
- Monthly budget limits with rollover support
- Custom categories with drag-and-drop reordering
- Auto-syncs to a Google Sheet you own
- Works on desktop and mobile
- Add to your iPhone home screen as an app

## Setup

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it whatever you like

### 2. Deploy the API

1. In your spreadsheet, go to **Extensions → Apps Script**
2. Delete any existing code and paste the contents of [`sheets-api.js`](sheets-api.js)
3. Save the project
4. Click **Deploy → New deployment**
5. Select type: **Web app**
6. Set "Execute as" to **Me**
7. Set "Who has access" to **Anyone**
8. Click **Deploy** and authorize when prompted
9. Copy the **Web App URL**

### 3. Open the App

**Use it directly:** [Open Budget Tracker](https://carlybeal.github.io/Budget-Tracker/budget-tracker)

Or **host your own copy:**
1. Fork this repo
2. Go to your fork's **Settings → Pages**
3. Set source to **Deploy from a branch**, select **main**, and save
4. Your app will be live at `https://YOUR_USERNAME.github.io/Budget-Tracker/budget-tracker`

On the setup screen, enter your name, pick an avatar color, and paste the Web App URL from step 2. Hit Connect.

### 4. Add to Home Screen (iPhone)

1. Open the app URL in **Safari** (not Chrome — iOS Chrome doesn't support this)
2. Tap the share button (square with arrow)
3. Tap **Add to Home Screen**
4. Name it and tap Add

## Usage

**Overview** — See income, spending, remaining balance, and budget progress at a glance.

**History** — Browse and filter transactions by category. Swipe the category chips to scroll. Tap a transaction to edit or delete.

**Budgets** — Set monthly limits per category. Toggle rollover to carry unspent amounts into future months.

**Categories** — Add, edit, reorder, or remove categories. Drag the ☰ handle to reorder.

**Profile** — Tap your avatar in the top left to change your name, color, reset data, or disconnect.

## How It Works

The app is a single HTML file with no external dependencies. All data lives in your Google Sheet across four tabs: Transactions, Categories, Budgets, and Settings.
git
Communication between the app and Google Sheets uses JSONP to bypass browser CORS restrictions. Reads load data via script tag injection. Writes encode the payload as base64 in a URL parameter.

The app caches data in `localStorage` for instant loading and syncs to the sheet with a 2-second debounce after each change.

## Updating the API

If you make changes to `sheets-api.js`, paste the updated code into Apps Script and redeploy:

1. Go to **Deploy → Manage deployments**
2. Click the pencil icon
3. Set version to **New version**
4. Click **Deploy**

Your Web App URL stays the same.