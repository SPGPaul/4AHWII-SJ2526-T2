
<template>
	<div class="upload-area">
		<div
			class="drop-zone"
			@dragover.prevent="onDragOver"
			@dragleave.prevent="onDragLeave"
			@drop.prevent="onDrop"
			:class="{ 'is-dragging': dragging }"
		>
			<input
				ref="fileInput"
				type="file"
				accept="image/*,application/pdf"
				multiple
				@change="onFilesSelected"
				style="display:none"
			/>
			<div class="drop-content">
				<p>Drag & drop images or PDFs here, or</p>
				<v-btn color="primary" @click="() => $refs.fileInput.click()">Select files</v-btn>
				<p class="hint">Files will be uploaded and named as (user.email-YYYYMMDD_HHMMSS)</p>
			</div>
		</div>

		<div v-if="files.length" class="previews">
			<div v-for="(f, idx) in files" :key="idx" class="preview-item">
				<div class="thumb" v-if="f.type.startsWith('image/')">
					<img :src="f.preview" alt="preview" />
				</div>
				<div class="thumb pdf" v-else>
					<span>PDF</span>
				</div>
				<div class="meta">
					<div class="name">{{ f.name }}</div>
					<div class="actions">
						<v-btn icon small color="red" @click="removeFile(idx)">
							<v-icon>mdi-delete</v-icon>
						</v-btn>
					</div>
				</div>
			</div>
		</div>

		<div class="actions-row">
			<v-btn :disabled="!files.length || uploading" color="success" @click="uploadAll">
				Upload {{ files.length }} file(s)
			</v-btn>
			<v-progress-linear v-if="uploading" indeterminate color="primary" />
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { loadUserData } from '@/utils/loadUser';

const files = reactive([]);
const dragging = ref(false);
const uploading = ref(false);
const userEmail = ref('user');

onMounted(async () => {
	try {
		const user = await loadUserData();
		if (user?.email) userEmail.value = user.email.replace(/\s+/g, '_');
	} catch (e) {
		console.warn('Could not load user email for uploads', e);
	}
});

function onDragOver() {
	dragging.value = true;
}
function onDragLeave() {
	dragging.value = false;
}
function onDrop(e) {
	dragging.value = false;
	const dtFiles = Array.from(e.dataTransfer.files || []);
	addFiles(dtFiles);
}

function onFilesSelected(e) {
	const inputFiles = Array.from(e.target.files || []);
	addFiles(inputFiles);
	e.target.value = null;
}

function addFiles(list) {
	for (const f of list) {
		if (!f.type.startsWith('image/') && f.type !== 'application/pdf') continue;
		const item = {
			file: f,
			name: f.name,
			type: f.type,
			preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
		};
		files.push(item);
	}
}

function removeFile(i) {
	const f = files[i];
	if (f?.preview) URL.revokeObjectURL(f.preview);
	files.splice(i, 1);
}

function timestampString() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	const hh = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	const ss = String(d.getSeconds()).padStart(2, '0');
	return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

async function uploadFile(item) {
	const token = localStorage.getItem('token');
	const form = new FormData();
	const ext = (item.name.match(/\.([^.]+)$/) || [])[1] || '';
	const safeEmail = userEmail.value.replace(/[^a-zA-Z0-9@._-]/g, '_');
	const filename = `${safeEmail}-${timestampString()}${ext ? '.' + ext : ''}`;
	form.append('files', item.file, filename);

	const uploadUrl = 'https://elegant-eggs-b247740f2b.strapiapp.com/api/upload';
	const headers = {};
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(uploadUrl, {
		method: 'POST',
		headers,
		body: form,
	});
	if (!res.ok) {
		const body = await res.text().catch(() => null);
		throw new Error(`Upload failed: ${res.status} ${res.statusText} ${body || ''}`);
	}
	return await res.json();
}

async function uploadAll() {
	if (!files.length) return;
	uploading.value = true;
	try {
		const results = [];
		for (const f of [...files]) {
			const r = await uploadFile(f);
			results.push(r);
		}
		// cleanup previews and list
		for (const f of files) if (f.preview) URL.revokeObjectURL(f.preview);
		files.splice(0, files.length);
		console.log('Uploaded:', results);
		// Optionally show a success toast (left to app integration)
	} catch (e) {
		console.error('Upload error', e);
		alert('Upload failed: ' + (e.message || e));
	} finally {
		uploading.value = false;
	}
}
</script>

<style scoped>
.upload-area { max-width: 900px; margin: 12px auto; }
.drop-zone { border: 2px dashed #cfd8dc; border-radius: 8px; padding: 28px; text-align: center; background: #fff; }
.drop-zone.is-dragging { border-color: #4caf50; background: #f0fff4; }
.drop-content p { margin: 8px 0; }
.previews { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.preview-item { display:flex; gap:8px; align-items:center; border:1px solid #eee; padding:8px; border-radius:6px; width: 220px; }
.thumb { width:64px; height:64px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.thumb img { width:100%; height:100%; object-fit:cover; }
.thumb.pdf { background:#f8f8f8; color:#444; font-weight:700; }
.meta { flex:1; display:flex; flex-direction:column; }
.name { font-size:0.9rem; color:#222; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.actions-row { margin-top:12px; display:flex; gap:12px; align-items:center; }
</style>
