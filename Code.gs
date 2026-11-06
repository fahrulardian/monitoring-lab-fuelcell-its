/**
 * ============================================================================
 *  SISTEM MONITORING LABORATORIUM R&D FUEL CELL ITS
 *  Backend Google Apps Script
 * ----------------------------------------------------------------------------
 *  Database: Google Sheets (dibuat otomatis saat pertama kali dijalankan)
 *  Penyimpanan foto: folder Google Drive (dibuat otomatis)
 *  Frontend: Index.html + Stylesheet.html + JavaScript.html (HtmlService)
 * ============================================================================
 */

/* ------------------------------------------------------------------ */
/*  KONFIGURASI                                                        */
/* ------------------------------------------------------------------ */
var APP_TITLE = 'Monitoring Lab R&D Fuel Cell ITS';
var PROP = PropertiesService.getScriptProperties();

// Nama tab (sheet) di spreadsheet database
var SHEETS = {
  peralatan: 'Peralatan',
  bahan:     'Bahan',
  komponen:  'Komponen',
  denah:     'Denah',
  config:    'Config',
  log:       'Log'
};

// Definisi kolom tiap tab. Urutan kolom = urutan di sheet.
var HEADERS = {
  log: ['id','waktu','tanggal','item_id','nama','jenis','jumlah_sebelum','jumlah_sesudah','selisih','satuan','keterangan'],
  peralatan: ['id','kode','nama','foto','jumlah','kondisi','lokasi','keterangan','last_update'],
  bahan:     ['id','kode','nama_indo','nama_iupac','formula','jumlah','satuan','lokasi','foto','keterangan','last_update','isi_kemasan'],
  komponen:  ['id','kode','nama','foto','jumlah','lokasi','keterangan','last_update'],
  // Zona denah: koordinat dalam PERSEN (0-100) agar responsif di semua layar
  denah:     ['id','nama_lokasi','x','y','w','h','warna','keterangan'],
  config:    ['key','value']
};

/* ------------------------------------------------------------------ */
/*  ENTRY POINT WEB APP                                                */
/* ------------------------------------------------------------------ */
function doGet(e) {
  ensureDatabase_();
  var t = HtmlService.createTemplateFromFile('Index');
  t.webAppUrl = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://ssl.gstatic.com/docs/script/images/favicon.png');
}

/** Memasukkan file HTML lain (CSS/JS) ke dalam Index.html */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ------------------------------------------------------------------ */
/*  INISIALISASI DATABASE (SPREADSHEET + DRIVE FOLDER)                 */
/* ------------------------------------------------------------------ */
function getDb_() {
  var id = PROP.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (err) { /* buat ulang */ }
  }
  var ss = SpreadsheetApp.create('DB ' + APP_TITLE);
  PROP.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getPhotoFolder_() {
  var id = PROP.getProperty('PHOTO_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* buat ulang */ }
  }
  var folder = DriveApp.createFolder('Foto ' + APP_TITLE);
  // Agar foto bisa ditampilkan di web app oleh siapa pun yang punya link
  try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  PROP.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

/** Membuat seluruh tab + header jika belum ada. Idempotent. */
function ensureDatabase_() {
  var ss = getDb_();
  Object.keys(SHEETS).forEach(function (key) {
    var name = SHEETS[key];
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    // Pastikan header ada
    var head = HEADERS[key];
    // Migrasi: tambah kolom baru di akhir header untuk sheet lama
    if (sh.getMaxColumns() < head.length) sh.insertColumnsAfter(sh.getMaxColumns(), head.length - sh.getMaxColumns());
    var firstRow = sh.getRange(1, 1, 1, head.length).getValues()[0];
    var empty = firstRow.every(function (c) { return c === '' || c === null; });
    if (!empty) {
      head.forEach(function (h, i) {
        if (h && (firstRow[i] === '' || firstRow[i] === null)) sh.getRange(1, i + 1).setValue(h).setFontWeight('bold');
      });
    }
    if (empty) {
      sh.getRange(1, 1, 1, head.length).setValues([head]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold');
    }
  });
  // Hapus sheet default "Sheet1" bila kosong
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() <= 1) {
    try { ss.deleteSheet(def); } catch (e) {}
  }
  // Isi data contoh denah bila masih kosong
  seedDenahIfEmpty_(ss);
  return ss;
}

/** Zona denah contoh (bisa diubah lewat menu admin / langsung di sheet). */
function seedDenahIfEmpty_(ss) {
  var sh = ss.getSheetByName(SHEETS.denah);
  if (sh.getLastRow() > 1) return;
  var sample = [
    ['Z01','Meja Besi 1 & 2',1.95,23.12,32.2,16.43,'#2563eb',''],
    ['Z02','Lemari Besi 2',51.95,22.77,31.1,4.67,'#2563eb',''],
    ['Z03','Lemari Besi 3 & 4',1.59,39.76,9.02,15.53,'#2563eb',''],
    ['Z04','Meja Besi 3',34.88,32.66,40.61,13.51,'#0891b2',''],
    ['Z05','Alat Spray Coating',81.22,32.52,18.29,18.38,'#d97706',''],
    ['Z06','Rak Lemari',1.34,58.5,9.39,10.86,'#2563eb',''],
    ['Z07','Lemari Kaca',1.22,69.15,9.39,5.92,'#2563eb',''],
    ['Z08','Meja Panjang',27.32,55.15,62.07,15.88,'#0891b2',''],
    ['Z09','Lemari Kayu 1-4',23.54,78.41,75.49,4.46,'#7c3aed',''],
    ['Z10','Wastafel',2.07,2.79,7.56,2.65,'#059669',''],
    ['Z11','Lemari Kayu 5 & 6',10.73,2.58,39.15,4.39,'#7c3aed',''],
    ['Z12','Lemari Besi 1',1.95,8.64,6.34,8.91,'#2563eb',''],
    ['Z13','Meja Kayu',10.12,8.43,25.24,9.33,'#0891b2',''],
    ['Z14','Meja Besi 4',2.07,18.18,32.56,4.11,'#2563eb',''],
    ['Z15','Lemari Asam',41.59,7.17,8.54,9.4,'#dc2626',''],
    ['Z16','Meja Keramik Oven',29.39,83.43,10.12,4.18,'#d97706',''],
    ['Z17','Meja Kayu Doctor Blade',40.12,83.57,12.93,4.87,'#0891b2',''],
    ['Z18','Meja Kayu 3D Print',53.29,83.5,26.46,5.29,'#0891b2',''],
    ['Z19','Meja Kayu',87.2,83.7,10.73,7.87,'#0891b2',''],
    ['Z20','Furnace Tubular',53.41,93.38,16.22,4.87,'#dc2626','']
  ];
  sh.getRange(2, 1, sample.length, sample[0].length).setValues(sample);
}

/* ------------------------------------------------------------------ */
/*  HELPER: KONVERSI ROW <-> OBJEK                                     */
/* ------------------------------------------------------------------ */
function sheetToObjects_(key) {
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS[key]);
  if (!sh || sh.getLastRow() < 2) return [];
  var head = HEADERS[key];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues();
  var out = [];
  values.forEach(function (row, i) {
    if (row.every(function (c) { return c === '' || c === null; })) return;
    var obj = { _row: i + 2 };
    head.forEach(function (h, c) {
      var v = row[c];
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      obj[h] = v;
    });
    out.push(obj);
  });
  return out;
}

function findRowById_(sh, head, id) {
  var idCol = head.indexOf('id');
  if (sh.getLastRow() < 2) return -1;
  var ids = sh.getRange(2, idCol + 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function newId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyMMdd') + '-' +
    Math.random().toString(36).substr(2, 5).toUpperCase();
}

function nowStr_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

/* ------------------------------------------------------------------ */
/*  API DIPANGGIL DARI FRONTEND (google.script.run)                    */
/* ------------------------------------------------------------------ */

/** Ambil semua data sekaligus untuk inisialisasi aplikasi. */
function getAllData() {
  ensureDatabase_();
  return {
    peralatan: sheetToObjects_('peralatan'),
    bahan:     sheetToObjects_('bahan'),
    komponen:  sheetToObjects_('komponen'),
    denah:     sheetToObjects_('denah'),
    denahImageUrl: getConfig_('DENAH_IMAGE_URL') || '',
    serverTime: nowStr_(),
    dbUrl: getDb_().getUrl()
  };
}

function getList(key) {
  return sheetToObjects_(key);
}

/**
 * Tambah data baru.
 * @param {string} key  'peralatan' | 'bahan' | 'komponen'
 * @param {Object} data field sesuai HEADERS (tanpa id/last_update)
 */
function addItem(key, data) {
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS[key]);
  var head = HEADERS[key];
  var prefix = { peralatan: 'ALT', bahan: 'BHN', komponen: 'KMP' }[key] || 'ITM';

  data = data || {};
  if (!data.id)    data.id = newId_(prefix);
  if (!data.kode)  data.kode = data.id;      // kode QR default = id
  data.last_update = nowStr_();

  var row = head.map(function (h) { return (data[h] !== undefined && data[h] !== null) ? data[h] : ''; });
  sh.appendRow(row);
  if (key === 'bahan' && Number(data.jumlah) > 0) logPerubahanStok_(data.id, data.nama_indo, 0, Number(data.jumlah) || 0, data.satuan, 'Stok awal');
  return { ok: true, id: data.id, kode: data.kode };
}

/** Catat perubahan stok bahan ke tab Log (hanya bila jumlah berubah). */
function logPerubahanStok_(itemId, nama, sebelum, sesudah, satuan, keterangan) {
  var selisih = Math.round((sesudah - sebelum) * 1000) / 1000;
  if (selisih === 0 && keterangan !== 'Stok awal') return;
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS.log);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.log);
    sh.getRange(1, 1, 1, HEADERS.log.length).setValues([HEADERS.log]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var jenis = keterangan === 'Stok awal' ? 'Stok awal' : (selisih < 0 ? 'Pengurangan' : 'Penambahan');
  sh.appendRow([newId_('LOG'), nowStr_(), Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    itemId, nama || '', jenis, sebelum, sesudah, selisih, satuan || '', keterangan]);
}

/** Ambil log stok bahan dalam rentang tanggal (yyyy-MM-dd). */
function getLogBahan(dari, sampai) {
  return sheetToObjects_('log').filter(function (r) {
    var t = String(r.tanggal).slice(0, 10);
    return (!dari || t >= dari) && (!sampai || t <= sampai);
  }).map(function (r) {
    return { tanggal: String(r.tanggal).slice(0, 10), waktu: r.waktu, item_id: r.item_id, nama: r.nama, jenis: r.jenis,
      sebelum: Number(r.jumlah_sebelum) || 0, sesudah: Number(r.jumlah_sesudah) || 0,
      selisih: Number(r.selisih) || 0, satuan: r.satuan, keterangan: r.keterangan };
  });
}

/** Update data berdasarkan id. */
function updateItem(key, data) {
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS[key]);
  var head = HEADERS[key];
  var r = findRowById_(sh, head, data.id);
  if (r < 0) return { ok: false, error: 'Data tidak ditemukan: ' + data.id };

  var current = sh.getRange(r, 1, 1, head.length).getValues()[0];
  data.last_update = nowStr_();
  var row = head.map(function (h, c) {
    return (data[h] !== undefined) ? data[h] : current[c];
  });
  sh.getRange(r, 1, 1, head.length).setValues([row]);
  if (key === 'bahan') {
    var iJ = head.indexOf('jumlah');
    logPerubahanStok_(data.id, row[head.indexOf('nama_indo')], Number(current[iJ]) || 0, Number(row[iJ]) || 0, row[head.indexOf('satuan')], 'Edit stok');
  }
  return { ok: true, id: data.id };
}

/** Hapus data berdasarkan id. */
function deleteItem(key, id) {
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS[key]);
  var head = HEADERS[key];
  var r = findRowById_(sh, head, id);
  if (r < 0) return { ok: false, error: 'Data tidak ditemukan' };
  sh.deleteRow(r);
  return { ok: true };
}

/** Cari 1 item berdasarkan kode QR/barcode di semua kategori. */
function findByCode(code) {
  code = String(code || '').trim();
  if (!code) return { found: false };
  var keys = ['peralatan', 'bahan', 'komponen'];
  for (var k = 0; k < keys.length; k++) {
    var list = sheetToObjects_(keys[k]);
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].kode).trim() === code || String(list[i].id).trim() === code) {
        return { found: true, kategori: keys[k], item: list[i] };
      }
    }
  }
  return { found: false, code: code };
}

/**
 * Upload foto (base64) ke folder Drive, kembalikan URL yang bisa di-embed.
 * @param {string} base64   data URL atau base64 murni
 * @param {string} mimeType e.g. 'image/jpeg'
 * @param {string} filename
 */
function uploadPhoto(base64, mimeType, filename) {
  try {
    var folder = getPhotoFolder_();
    var pure = base64.indexOf(',') >= 0 ? base64.split(',')[1] : base64;
    var bytes = Utilities.base64Decode(pure);
    var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || ('foto_' + Date.now()));
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    var id = file.getId();
    // URL thumbnail/lh3 yang stabil untuk <img>
    return { ok: true, url: 'https://lh3.googleusercontent.com/d/' + id, fileId: id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ------------------------------------------------------------------ */
/*  DENAH (ZONA LOKASI)                                                */
/* ------------------------------------------------------------------ */
function getDenah() {
  return {
    zona: sheetToObjects_('denah'),
    imageUrl: getConfig_('DENAH_IMAGE_URL') || ''
  };
}

function saveDenahImageUrl(url) {
  setConfig_('DENAH_IMAGE_URL', url || '');
  return { ok: true };
}

function saveZona(data) {           // tambah / update satu zona
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS.denah);
  var head = HEADERS.denah;
  if (!data.id) data.id = newId_('Z');
  var r = findRowById_(sh, head, data.id);
  var row = head.map(function (h) { return (data[h] !== undefined && data[h] !== null) ? data[h] : ''; });
  if (r < 0) sh.appendRow(row);
  else sh.getRange(r, 1, 1, head.length).setValues([row]);
  return { ok: true, id: data.id };
}

function deleteZona(id) {
  var ss = getDb_();
  var sh = ss.getSheetByName(SHEETS.denah);
  var r = findRowById_(sh, HEADERS.denah, id);
  if (r > 0) sh.deleteRow(r);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  CONFIG KEY-VALUE                                                   */
/* ------------------------------------------------------------------ */
function getConfig_(key) {
  var sh = getDb_().getSheetByName(SHEETS.config);
  if (!sh || sh.getLastRow() < 2) return null;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < vals.length; i++) if (vals[i][0] === key) return vals[i][1];
  return null;
}
function setConfig_(key, value) {
  var sh = getDb_().getSheetByName(SHEETS.config);
  if (sh.getLastRow() >= 2) {
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (vals[i][0] === key) { sh.getRange(i + 2, 2).setValue(value); return; }
    }
  }
  sh.appendRow([key, value]);
}

/* ------------------------------------------------------------------ */
/*  UTILITAS SETUP MANUAL (jalankan sekali dari editor bila perlu)     */
/* ------------------------------------------------------------------ */
function setup() {
  ensureDatabase_();
  var ss = getDb_();
  Logger.log('Database siap: ' + ss.getUrl());
  Logger.log('Folder foto: ' + getPhotoFolder_().getUrl());
  return ss.getUrl();
}

/** Tautan cepat ke spreadsheet database. */
function getDbUrl() { return getDb_().getUrl(); }
