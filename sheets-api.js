function doGet(e) {
    var action = e.parameter.action;
    var callback = e.parameter.callback || null;

    try {
        if (action === "ping") return jsonpResponse(callback, { ok: true });
        if (action === "load") return jsonpResponse(callback, loadAll());

        // ── Transactions ──
        if (action === "addTx") {
            var tx = JSON.parse(e.parameter.tx);
            addTransaction(tx);
            return jsonpResponse(callback, { ok: true });
        }
        if (action === "updateTx") {
            var tx = JSON.parse(e.parameter.tx);
            updateTransaction(tx);
            return jsonpResponse(callback, { ok: true });
        }
        if (action === "deleteTx") {
            deleteTxById(Number(e.parameter.id));
            return jsonpResponse(callback, { ok: true });
        }

        // ── Categories ──
        if (action === "saveCategories") {
            var cats = JSON.parse(e.parameter.categories);
            saveCategories(cats);
            return jsonpResponse(callback, { ok: true });
        }

        // ── Budgets ──
        if (action === "saveBudgets") {
            var budgets = JSON.parse(e.parameter.budgets);
            saveBudgets(budgets);
            return jsonpResponse(callback, { ok: true });
        }

        // ── Settings (rollover + budgetStart) ──
        if (action === "saveSettings") {
            var settings = JSON.parse(e.parameter.settings);
            saveSettings(settings);
            return jsonpResponse(callback, { ok: true });
        }

        return jsonpResponse(callback, { error: "Unknown action: " + action });
    } catch (err) {
        return jsonpResponse(callback, { error: err.toString() });
    }
}

function jsonpResponse(callback, data) {
    var json = JSON.stringify(data);
    if (callback) {
        return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name, headers) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        if (headers && headers.length > 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
            sheet.setFrozenRows(1);
        }
    }
    return sheet;
}

function loadAll() {
    var settings = loadSettings();
    return {
        transactions: loadTransactions(),
        categories: loadCategories(),
        budgets: loadBudgets(),
        rollover: settings.rollover || {},
        budgetStart: settings.budgetStart || {},
    };
}

function loadTransactions() {
    var sheet = getOrCreateSheet("Transactions", ["id", "amount", "description", "category", "date"]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
        if (!data[i][0] && data[i][0] !== 0) continue;
        var dateVal = data[i][4];
        var dateStr = dateVal instanceof Date ? Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(dateVal);
        rows.push({
            id: Number(data[i][0]),
            amount: Number(data[i][1]),
            description: String(data[i][2]),
            category: String(data[i][3]),
            date: dateStr,
        });
    }
    return rows;
}

function loadCategories() {
    var sheet = getOrCreateSheet("Categories", ["id", "label", "icon", "color", "sort_order"]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        rows.push({
            id: String(data[i][0]),
            label: String(data[i][1]),
            icon: String(data[i][2]),
            color: String(data[i][3]),
        });
    }
    return rows;
}

function loadBudgets() {
    var sheet = getOrCreateSheet("Budgets", ["category_id", "amount"]);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return {};
    var budgets = {};
    for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        budgets[String(data[i][0])] = Number(data[i][1]);
    }
    return budgets;
}

function loadSettings() {
    var sheet = getOrCreateSheet("Settings", ["key", "value"]);
    var data = sheet.getDataRange().getValues();
    var settings = {};
    for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        try {
            settings[String(data[i][0])] = JSON.parse(String(data[i][1]));
        } catch (e) {
            settings[String(data[i][0])] = String(data[i][1]);
        }
    }
    return settings;
}

// ── Per-record transaction helpers ──

function addTransaction(tx) {
    var sheet = getOrCreateSheet("Transactions", ["id", "amount", "description", "category", "date"]);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 5).setNumberFormat("@");
    sheet.getRange(lastRow + 1, 1, 1, 5).setValues([[tx.id, tx.amount, tx.description, tx.category, tx.date]]);
}

function updateTransaction(tx) {
    var sheet = getOrCreateSheet("Transactions", ["id", "amount", "description", "category", "date"]);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (Number(data[i][0]) === Number(tx.id)) {
            sheet.getRange(i + 1, 5).setNumberFormat("@");
            sheet.getRange(i + 1, 1, 1, 5).setValues([[tx.id, tx.amount, tx.description, tx.category, tx.date]]);
            return;
        }
    }
    // Not found — append as new
    addTransaction(tx);
}

function deleteTxById(id) {
    var sheet = getOrCreateSheet("Transactions", ["id", "amount", "description", "category", "date"]);
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
        if (Number(data[i][0]) === id) {
            sheet.deleteRow(i + 1);
            return;
        }
    }
}

// ── Full-replace helpers (categories/budgets/settings are small) ──

function saveCategories(categories) {
    var sheet = getOrCreateSheet("Categories", ["id", "label", "icon", "color", "sort_order"]);
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clear();
    if (categories.length === 0) return;
    var rows = categories.map(function (c, i) {
        return [c.id, c.label, c.icon, c.color, i];
    });
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function saveBudgets(budgets) {
    var sheet = getOrCreateSheet("Budgets", ["category_id", "amount"]);
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clear();
    var keys = Object.keys(budgets);
    if (keys.length === 0) return;
    var rows = keys.map(function (k) {
        return [k, budgets[k]];
    });
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function saveSettings(settings) {
    var sheet = getOrCreateSheet("Settings", ["key", "value"]);
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clear();
    var keys = Object.keys(settings);
    if (keys.length === 0) return;
    var rows = keys.map(function (k) {
        return [k, JSON.stringify(settings[k])];
    });
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}
