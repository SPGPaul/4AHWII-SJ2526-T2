<template>
  <div class="dir-page">
    <!-- Page header with create-directory button -->
    <div class="dir-header-row">
      <h1>Ordner</h1>
      <v-btn color="primary" prepend-icon="mdi-folder-plus" @click="openCreateDialog">
        Neuer Ordner
      </v-btn>
    </div>

    <!-- Loading state -->
    <div v-if="loadingReceipts" class="dir-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
      <span class="ml-4">Belege werden geladen…</span>
    </div>

    <template v-else>
      <!-- Unassigned receipts pool — drag from here into a directory -->
      <v-card class="dir-pool mb-6" elevation="2">
        <div class="dir-pool-header">
          <v-icon class="mr-2">mdi-tray-full</v-icon>
          <span class="dir-pool-title">Nicht zugeordnete Belege</span>
          <v-chip size="small" class="ml-2">{{ unassignedReceipts.length }}</v-chip>
        </div>

        <div
          class="dir-drop-zone"
          :class="{ 'drop-active': dragOverPool }"
          @dragover.prevent="dragOverPool = true"
          @dragleave="dragOverPool = false"
          @drop.prevent="dropOnPool"
        >
          <div v-if="unassignedReceipts.length === 0" class="dir-empty-hint">
            Alle Belege sind einem Ordner zugeordnet.
          </div>
          <div class="dir-receipt-grid">
            <div
              v-for="receipt in unassignedReceipts"
              :key="receipt.documentId || receipt.id"
              class="dir-receipt-chip"
              draggable="true"
              @dragstart="startDrag($event, receipt)"
              @dragend="endDrag"
            >
              <v-icon size="18" class="mr-1">mdi-receipt-text-outline</v-icon>
              <span class="dir-chip-label">{{ receipt.transaktion || receipt.title || 'Beleg' }}</span>
              <span class="dir-chip-amount" v-if="receipt.amount !== null">
                {{ formatAmount(receipt.amount) }}
              </span>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Directory cards -->
      <div v-if="directories.length === 0" class="dir-no-dirs">
        <v-icon size="56" color="grey-lighten-1">mdi-folder-open-outline</v-icon>
        <p>Noch keine Ordner erstellt. Erstelle einen Ordner und ordne deine Belege zu.</p>
      </div>

      <v-row>
        <v-col
          v-for="dir in directories"
          :key="dir.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            class="dir-card"
            elevation="3"
            :style="{ '--dir-color': dir.color }"
            @dragover.prevent="dragOverDir = dir.id"
            @dragleave="dragOverDir = null"
            @drop.prevent="dropOnDirectory($event, dir)"
            :class="{ 'dir-drop-active': dragOverDir === dir.id }"
          >
            <!-- Directory header -->
            <div class="dir-card-header">
              <v-icon size="28" :color="dir.color">mdi-folder</v-icon>
              <span class="dir-card-name">{{ dir.name }}</span>
              <v-spacer />
              <v-chip size="x-small" :color="dir.color" variant="tonal">
                {{ receiptsInDir(dir.id).length }}
              </v-chip>
              <v-btn
                icon
                size="x-small"
                variant="text"
                class="ml-1"
                @click.stop="confirmDeleteDir(dir)"
                :title="`Ordner '${dir.name}' löschen`"
              >
                <v-icon size="16">mdi-delete-outline</v-icon>
              </v-btn>
            </div>

            <!-- Drop hint or receipt list -->
            <div class="dir-card-body">
              <div v-if="receiptsInDir(dir.id).length === 0" class="dir-drop-hint">
                <v-icon size="20" color="grey">mdi-drag</v-icon>
                Belege hierher ziehen
              </div>
              <div
                v-for="receipt in receiptsInDir(dir.id)"
                :key="receipt.documentId || receipt.id"
                class="dir-receipt-chip dir-receipt-chip--in-dir"
                draggable="true"
                @dragstart="startDrag($event, receipt)"
                @dragend="endDrag"
              >
                <v-icon size="16" class="mr-1">mdi-receipt-text-outline</v-icon>
                <span class="dir-chip-label">{{ receipt.transaktion || receipt.title || 'Beleg' }}</span>
                <span class="dir-chip-amount" v-if="receipt.amount !== null">
                  {{ formatAmount(receipt.amount) }}
                </span>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  class="dir-chip-remove"
                  :title="'Aus Ordner entfernen'"
                  @click.stop="removeFromDir(receipt)"
                >
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Create directory dialog -->
    <v-dialog v-model="createDialog" max-width="420">
      <v-card>
        <v-card-title>Neuer Ordner</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDirName"
            label="Ordnername"
            placeholder="z.B. Italien Reise 2026"
            variant="outlined"
            autofocus
            @keyup.enter="createDirectory"
          />
          <!-- Colour picker for the directory icon -->
          <div class="dir-color-row">
            <span class="text-caption mr-3">Farbe:</span>
            <button
              v-for="c in COLOR_PALETTE"
              :key="c"
              type="button"
              class="dir-color-swatch"
              :style="{ background: c }"
              :class="{ selected: newDirColor === c }"
              @click="newDirColor = c"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" :disabled="!newDirName.trim()" @click="createDirectory">
            Erstellen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="380">
      <v-card>
        <v-card-title>Ordner löschen?</v-card-title>
        <v-card-text>
          Soll der Ordner <strong>{{ deletingDir?.name }}</strong> wirklich gelöscht werden?
          Die Belege bleiben erhalten – sie werden nur aus dem Ordner entfernt.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" @click="deleteDirectory">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { loadUserData } from '@/utils/loadUser';
import { STRAPI_URL } from '@/utils/strapi';

// localStorage keys for persisting directories and assignments
const LS_DIRS_KEY = 'rechnungsradar-directories';
const LS_ASSIGNMENTS_KEY = 'rechnungsradar-dir-assignments';

// Available colours for directory icons
const COLOR_PALETTE = [
  '#4caf50', '#2196f3', '#ff9800', '#e91e63',
  '#9c27b0', '#00bcd4', '#ff5722', '#607d8b',
];

export default {
  name: 'DirectoryArea',

  data() {
    return {
      COLOR_PALETTE,
      loadingReceipts: true,
      receipts: [],

      // directories: [{ id, name, color, createdAt }]
      directories: [],

      // assignments: { receiptKey: directoryId }
      assignments: {},

      // drag state
      draggingReceipt: null,
      dragOverDir: null,
      dragOverPool: false,

      // create dialog
      createDialog: false,
      newDirName: '',
      newDirColor: COLOR_PALETTE[0],

      // delete dialog
      deleteDialog: false,
      deletingDir: null,
    };
  },

  computed: {
    /** Receipts that are not yet assigned to any directory. */
    unassignedReceipts() {
      return this.receipts.filter((r) => !this.assignments[this.receiptKey(r)]);
    },
  },

  methods: {
    /** Returns a stable string key for a receipt object. Falls back to a UUID for receipts missing all identifiers. */
    receiptKey(receipt) {
      return (
        receipt.documentId ||
        (receipt.id ? String(receipt.id) : null) ||
        (receipt.transaktion ? `title-${receipt.transaktion}` : null) ||
        crypto.randomUUID()
      );
    },

    /** Returns all receipts assigned to the given directory. */
    receiptsInDir(dirId) {
      return this.receipts.filter((r) => this.assignments[this.receiptKey(r)] === dirId);
    },

    /** Format a numeric amount as a Euro string. */
    formatAmount(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '';
      return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(n);
    },

    // ── Persistence ──────────────────────────────────────────────────────────

    loadFromStorage() {
      try {
        const dirs = localStorage.getItem(LS_DIRS_KEY);
        this.directories = dirs ? JSON.parse(dirs) : [];
      } catch {
        this.directories = [];
      }
      try {
        const asgn = localStorage.getItem(LS_ASSIGNMENTS_KEY);
        this.assignments = asgn ? JSON.parse(asgn) : {};
      } catch {
        this.assignments = {};
      }
    },

    saveDirectories() {
      localStorage.setItem(LS_DIRS_KEY, JSON.stringify(this.directories));
    },

    saveAssignments() {
      localStorage.setItem(LS_ASSIGNMENTS_KEY, JSON.stringify(this.assignments));
    },

    // ── Directory management ─────────────────────────────────────────────────

    openCreateDialog() {
      this.newDirName = '';
      this.newDirColor = COLOR_PALETTE[0];
      this.createDialog = true;
    },

    createDirectory() {
      const name = this.newDirName.trim();
      if (!name) return;
      const dir = {
        id: `dir-${Date.now()}`,
        name,
        color: this.newDirColor,
        createdAt: new Date().toISOString(),
      };
      this.directories.push(dir);
      this.saveDirectories();
      this.createDialog = false;
    },

    confirmDeleteDir(dir) {
      this.deletingDir = dir;
      this.deleteDialog = true;
    },

    deleteDirectory() {
      if (!this.deletingDir) return;
      const id = this.deletingDir.id;
      // Remove directory
      this.directories = this.directories.filter((d) => d.id !== id);
      // Unassign all receipts from this directory
      const updated = { ...this.assignments };
      for (const [key, val] of Object.entries(updated)) {
        if (val === id) delete updated[key];
      }
      this.assignments = updated;
      this.saveDirectories();
      this.saveAssignments();
      this.deleteDialog = false;
      this.deletingDir = null;
    },

    // ── Drag and drop ────────────────────────────────────────────────────────

    startDrag(event, receipt) {
      this.draggingReceipt = receipt;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this.receiptKey(receipt));
    },

    endDrag() {
      this.draggingReceipt = null;
      this.dragOverDir = null;
      this.dragOverPool = false;
    },

    /** Assign the dragged receipt to a directory. */
    dropOnDirectory(event, dir) {
      this.dragOverDir = null;
      const key = event.dataTransfer.getData('text/plain');
      const receipt = this.receipts.find((r) => this.receiptKey(r) === key);
      if (!receipt) return;
      this.assignments = { ...this.assignments, [key]: dir.id };
      this.saveAssignments();
    },

    /** Remove the dragged receipt from any directory (back to the pool). */
    dropOnPool() {
      this.dragOverPool = false;
      const receipt = this.draggingReceipt;
      if (!receipt) return;
      const key = this.receiptKey(receipt);
      const updated = { ...this.assignments };
      delete updated[key];
      this.assignments = updated;
      this.saveAssignments();
    },

    /** Remove a single receipt from its directory via the × button. */
    removeFromDir(receipt) {
      const key = this.receiptKey(receipt);
      const updated = { ...this.assignments };
      delete updated[key];
      this.assignments = updated;
      this.saveAssignments();
    },

    // ── Data loading ─────────────────────────────────────────────────────────

    normalizeReceipt(item) {
      const baseUrl = STRAPI_URL;
      let imgSrc = '';
      if (item.img) {
        if (typeof item.img === 'string') {
          imgSrc = item.img.startsWith('http') ? item.img : `${baseUrl}${item.img}`;
        } else if (typeof item.img === 'object' && item.img?.url) {
          imgSrc = item.img.url.startsWith('http') ? item.img.url : `${baseUrl}${item.img.url}`;
        }
      }
      const raw = item.summe ?? item.amount ?? item.total ?? null;
      const amount = raw !== null ? (Number.isFinite(Number(raw)) ? Number(raw) : null) : null;
      return {
        img: imgSrc,
        transaktion: item.transaktion || item.title || '',
        categoryLabel: item.categoryLabel || item.category_name || 'Sonstiges',
        documentId: item.documentId || null,
        id: item.id || null,
        date: item.date || item.createdAt || null,
        amount,
      };
    },

    async fetchReceipts() {
      this.loadingReceipts = true;
      try {
        const data = await loadUserData();
        let items = Array.isArray(data?.receipts) ? data.receipts : [];
        // Deduplicate by documentId
        const seen = new Set();
        items = items.filter((item) => {
          if (!item.documentId) return true;
          if (seen.has(item.documentId)) return false;
          seen.add(item.documentId);
          return true;
        });
        this.receipts = items.map(this.normalizeReceipt.bind(this));
      } catch (e) {
        console.error('DirectoryArea: Fehler beim Laden der Belege:', e);
      } finally {
        this.loadingReceipts = false;
      }
    },
  },

  async mounted() {
    this.loadFromStorage();
    await this.fetchReceipts();
  },
};
</script>

<style scoped>
/* ── Page layout ──────────────────────────────────────────────────────────── */
.dir-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.dir-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 4px solid #bcefc2;
}

.dir-header-row h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

/* ── Loading ──────────────────────────────────────────────────────────────── */
.dir-loading {
  display: flex;
  align-items: center;
  padding: 48px 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* ── Pool (unassigned receipts) ──────────────────────────────────────────── */
.dir-pool {
  border-radius: 12px;
  overflow: hidden;
}

.dir-pool-header {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f4fbf6, #e4f4e8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dir-pool-title {
  font-weight: 600;
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
}

/* ── Drop zone ────────────────────────────────────────────────────────────── */
.dir-drop-zone {
  min-height: 80px;
  padding: 12px 18px;
  transition: background 0.15s;
}

.dir-drop-zone.drop-active {
  background: rgba(76, 175, 80, 0.08);
  outline: 2px dashed #4caf50;
  outline-offset: -4px;
  border-radius: 8px;
}

.dir-empty-hint {
  text-align: center;
  padding: 16px 0;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 0.9rem;
}

/* ── Receipt chip ─────────────────────────────────────────────────────────── */
.dir-receipt-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dir-receipt-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: rgba(var(--v-theme-surface-variant, 255, 255, 255), 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.12s, transform 0.12s;
  color: rgb(var(--v-theme-on-surface));
}

.dir-receipt-chip:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.dir-receipt-chip:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}

.dir-receipt-chip--in-dir {
  background: rgba(var(--v-theme-surface-variant, 245, 255, 248), 0.9);
  border-color: rgba(76, 175, 80, 0.25);
}

.dir-chip-label {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dir-chip-amount {
  font-weight: 600;
  color: #3d915e;
  margin-left: 4px;
}

.dir-chip-remove {
  margin-left: 2px;
  opacity: 0.6;
}
.dir-chip-remove:hover {
  opacity: 1;
}

/* ── No directories placeholder ─────────────────────────────────────────── */
.dir-no-dirs {
  text-align: center;
  padding: 48px 16px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* ── Directory card ───────────────────────────────────────────────────────── */
.dir-card {
  border-radius: 12px;
  overflow: hidden;
  border-top: 4px solid var(--dir-color, #4caf50);
  transition: box-shadow 0.15s;
  min-height: 180px;
}

.dir-card.dir-drop-active {
  box-shadow: 0 0 0 3px var(--dir-color, #4caf50);
  background: rgba(76, 175, 80, 0.04);
}

.dir-card-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f9fff9, #f0faf2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  gap: 6px;
}

.dir-card-name {
  font-weight: 700;
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface));
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dir-card-body {
  padding: 12px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 80px;
  align-content: flex-start;
}

.dir-drop-hint {
  width: 100%;
  text-align: center;
  padding: 16px 0;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* ── Colour picker ────────────────────────────────────────────────────────── */
.dir-color-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dir-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
}

.dir-color-swatch:hover {
  transform: scale(1.15);
}

.dir-color-swatch.selected {
  border-color: rgba(0, 0, 0, 0.55);
  transform: scale(1.2);
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .dir-page {
    padding: 12px;
  }
  .dir-header-row h1 {
    font-size: 1.4rem;
  }
}
</style>
