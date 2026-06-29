/**
 * PerfectPrompt — backend de planilha (Google Apps Script).
 *
 * COMO USAR (1 vez, ~2 minutos):
 * 1. Crie uma planilha nova no Google Sheets.
 * 2. Menu: Extensões → Apps Script.
 * 3. Apague o conteúdo e cole TODO este arquivo.
 * 4. (Opcional, recomendado) troque o valor de TOKEN abaixo por uma senha sua
 *    e coloque a MESMA senha em SHEETS_TOKEN no .env.local da aplicação.
 * 5. Clique em "Implantar" → "Nova implantação" → tipo "App da Web".
 *    - Executar como: Eu mesmo
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL do app da web e cole em SHEETS_WEBAPP_URL no .env.local.
 *
 * A planilha continua sendo uma planilha normal: você pode abrir, editar e
 * marcar favoritos à mão. A aba "Favoritos" é preenchida automaticamente.
 * A aba "Skills" guarda os comandos personalizados das skills (Configurações).
 */

// Se quiser proteger a URL, troque por uma senha. Deixe "" para não exigir.
var TOKEN = "";

var MAIN_SHEET = "Prompts";
var FAV_SHEET = "Favoritos";
var SKILLS_SHEET = "Skills";
var HEADERS = ["id", "createdAt", "type", "concept", "prompt", "favorite"];
var SKILLS_HEADERS = ["type", "system", "updatedAt"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (TOKEN && body.token !== TOKEN) {
      return json({ ok: false, error: "token inválido" });
    }

    switch (body.action) {
      case "save":
        return json(handleSave(body));
      case "list":
        return json(handleList());
      case "toggleFavorite":
        return json(handleToggleFavorite(body));
      case "delete":
        return json(handleDelete(body));
      case "saveSkill":
        return json(handleSaveSkill(body));
      case "listSkills":
        return json(handleListSkills());
      default:
        return json({ ok: false, error: "ação desconhecida" });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Útil para testar a URL no navegador (GET simples).
function doGet() {
  return json({ ok: true, message: "PerfectPrompt Sheets backend ativo" });
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function getSkillsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SKILLS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SKILLS_SHEET);
    sheet.appendRow(SKILLS_HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(SKILLS_HEADERS);
  }
  return sheet;
}

function handleSave(body) {
  var sheet = getSheet(MAIN_SHEET);
  sheet.appendRow([
    body.id,
    body.createdAt,
    body.type,
    body.concept,
    body.prompt,
    false,
  ]);
  return { ok: true, id: body.id };
}

function handleList() {
  var sheet = getSheet(MAIN_SHEET);
  var values = sheet.getDataRange().getValues();
  var entries = [];
  // pula o cabeçalho (linha 0)
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    entries.push({
      id: String(row[0]),
      createdAt: String(row[1]),
      type: String(row[2]),
      concept: String(row[3]),
      prompt: String(row[4]),
      favorite: row[5] === true || row[5] === "TRUE" || row[5] === "true",
    });
  }
  entries.reverse(); // mais recentes primeiro
  return { ok: true, entries: entries };
}

function handleToggleFavorite(body) {
  var sheet = getSheet(MAIN_SHEET);
  var values = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(body.id)) {
      sheet.getRange(i + 1, 6).setValue(body.favorite === true);
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, error: "id não encontrado" };
  rebuildFavorites();
  return { ok: true };
}

function handleDelete(body) {
  var sheet = getSheet(MAIN_SHEET);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(body.id)) {
      sheet.deleteRow(i + 1);
      rebuildFavorites();
      return { ok: true };
    }
  }
  return { ok: false, error: "id não encontrado" };
}

function handleSaveSkill(body) {
  var sheet = getSkillsSheet();
  var values = sheet.getDataRange().getValues();
  var system = body.system != null ? String(body.system) : "";
  var updatedAt = body.updatedAt || new Date().toISOString();
  var found = false;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(body.type)) {
      sheet.getRange(i + 1, 2).setValue(system);
      sheet.getRange(i + 1, 3).setValue(updatedAt);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([body.type, system, updatedAt]);
  }

  return { ok: true };
}

function handleListSkills() {
  var sheet = getSkillsSheet();
  var values = sheet.getDataRange().getValues();
  var overrides = {};

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] || !row[1]) continue;
    overrides[String(row[0])] = String(row[1]);
  }

  return { ok: true, overrides: overrides };
}

// Reconstrói a aba "Favoritos" a partir das linhas marcadas.
function rebuildFavorites() {
  var main = getSheet(MAIN_SHEET);
  var fav = getSheet(FAV_SHEET);
  fav.clear();
  fav.appendRow(HEADERS);
  var values = main.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isFav = row[5] === true || row[5] === "TRUE" || row[5] === "true";
    if (isFav) fav.appendRow(row);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
