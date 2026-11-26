// Static metadata for the AI Product Studio wizard: upload slots, styles per category group,
// scene presets, and dropdown option sets. Values are stored as Indonesian display strings.

export interface SlotDef {
  key: string;
  label: string;
  hint: string;
}

export const CORE_SLOTS: SlotDef[] = [
  { key: "front", label: "Tampak Depan", hint: "Foto utama produk" },
  { key: "side", label: "Tampak Samping", hint: "Profil produk" },
  { key: "top", label: "Tampak Atas", hint: "Bereka dari atas" },
  { key: "bottom", label: "Tampak Bawah / Alas", hint: "Bagian bawah produk" },
  { key: "detail", label: "Detail / Close-up", hint: "Tekstur, label, jahitan" },
];

export const REF_SLOTS: SlotDef[] = [
  { key: "lighting_ref", label: "Referensi Pencahayaan", hint: "Contoh cahaya yang diinginkan" },
  { key: "background_ref", label: "Referensi Latar", hint: "Contoh latar belakang" },
  { key: "props_ref", label: "Referensi Props", hint: "Properti pendukung" },
  { key: "composition_ref", label: "Referensi Komposisi", hint: "Contoh tata letak" },
];

export type StyleKind = "model" | "mannequin" | "flatlay" | "ghost" | "studio" | "lifestyle" | "luxury" | "commercial";

export interface StyleOption {
  id: string;
  name: string;
  desc: string;
  kind: StyleKind;
}

export const STYLE_GROUPS: Record<string, StyleOption[]> = {
  clothing: [
    { id: "Human Model Photography", name: "Human Model", desc: "Dikenakan oleh model manusia", kind: "model" },
    { id: "Mannequin Photography", name: "Mannequin", desc: "Dipajang di manekin", kind: "mannequin" },
    { id: "Flat Lay Photography", name: "Flat Lay", desc: "Dilihat dari atas, tata datar", kind: "flatlay" },
    { id: "Ghost Mannequin", name: "Ghost Mannequin", desc: "Bentuk 3D tanpa manekin", kind: "ghost" },
    { id: "Professional Studio Photography", name: "Professional Studio", desc: "Set studio profesional", kind: "studio" },
    { id: "Lifestyle Photography", name: "Lifestyle", desc: "Suasana pemakaian nyata", kind: "lifestyle" },
  ],
  baby: [
    { id: "Minimalist Product Photography", name: "Minimalist Product", desc: "Latar polos, fokus produk", kind: "studio" },
    { id: "Nursery Lifestyle Photography", name: "Nursery Lifestyle", desc: "Suasana kamar bayi", kind: "lifestyle" },
    { id: "Flat Lay Photography", name: "Flat Lay", desc: "Tata letak datar dari atas", kind: "flatlay" },
    { id: "Professional Studio Photography", name: "Professional Studio", desc: "Set studio profesional", kind: "studio" },
    { id: "Product-on-Display Photography", name: "On Display", desc: "Dipajang menonjol", kind: "mannequin" },
  ],
  general: [
    { id: "White Background", name: "White Background", desc: "Latar putih murni", kind: "studio" },
    { id: "Luxury Studio", name: "Luxury Studio", desc: "Nuansa premium gelap", kind: "luxury" },
    { id: "Minimalist Studio", name: "Minimalist Studio", desc: "Sederhana & bersih", kind: "studio" },
    { id: "Lifestyle Scene", name: "Lifestyle Scene", desc: "Skenario penggunaan nyata", kind: "lifestyle" },
    { id: "Commercial Product Photography", name: "Commercial", desc: "Gaya iklan komersial", kind: "commercial" },
  ],
};

export interface ScenePreset {
  id: string;
  name: string;
  swatch: string;
  values: {
    background_color: string;
    background_type: string;
    lighting: string;
    camera_angle: string;
    composition: string;
    props: string;
    mood: string;
  };
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "beige_minimalist",
    name: "Beige Minimalist",
    swatch: "#E9E1D5",
    values: {
      background_color: "#E9E1D5",
      background_type: "Kertas seamless",
      lighting: "Cahaya jendela lembut",
      camera_angle: "Sejajar mata",
      composition: "Tengah minimalis",
      props: "Kain linen",
      mood: "Tenang & bersih",
    },
  },
  {
    id: "clean_white",
    name: "Clean White Studio",
    swatch: "#FFFFFF",
    values: {
      background_color: "#FFFFFF",
      background_type: "Sweep studio",
      lighting: "Softbox merata",
      camera_angle: "Dari depan",
      composition: "Negatif space luas",
      props: "Tanpa props",
      mood: "Profesional",
    },
  },
  {
    id: "luxury_brown",
    name: "Luxury Brown",
    swatch: "#4A3826",
    values: {
      background_color: "#4A3826",
      background_type: "Podium/stand",
      lighting: "Cahaya sisi dramatis",
      camera_angle: "Sudut rendah",
      composition: "Rule of thirds",
      props: "Pedestal batu",
      mood: "Premium & elegan",
    },
  },
  {
    id: "soft_pastel",
    name: "Soft Pastel",
    swatch: "#F6E3DC",
    values: {
      background_color: "#F6E3DC",
      background_type: "Kertas seamless",
      lighting: "Backlight lembut",
      camera_angle: "Dari atas (flat lay)",
      composition: "Flat lay penuh",
      props: "Bunga kering",
      mood: "Lembut & manis",
    },
  },
  {
    id: "natural_lifestyle",
    name: "Natural Lifestyle",
    swatch: "#D8CBB8",
    values: {
      background_color: "#D8CBB8",
      background_type: "Lingkungan nyata",
      lighting: "Golden hour",
      camera_angle: "Sudut 45°",
      composition: "Crop lifestyle",
      props: "Meja kayu, tanaman",
      mood: "Hangat & hidup",
    },
  },
  {
    id: "modern_commercial",
    name: "Modern Commercial",
    swatch: "#F1EDE6",
    values: {
      background_color: "#F1EDE6",
      background_type: "Gradasi halus",
      lighting: "Cahaya studio krisp",
      camera_angle: "Dinamis miring",
      composition: "Negatif space luas",
      props: "Blok geometris",
      mood: "Profesional",
    },
  },
];

export const OPTION_SETS: Record<string, string[]> = {
  background_type: [
    "Studio polos",
    "Sweep studio",
    "Podium/stand",
    "Kertas seamless",
    "Lingkungan nyata",
    "Kayu natural",
    "Gradasi halus",
  ],
  lighting: [
    "Cahaya jendela lembut",
    "Softbox merata",
    "Cahaya sisi dramatis",
    "Golden hour",
    "Cahaya studio krisp",
    "Backlight lembut",
  ],
  camera_angle: ["Sejajar mata", "Dari depan", "Sudut 45°", "Dari atas (flat lay)", "Sudut rendah", "Dinamis miring"],
  composition: [
    "Tengah minimalis",
    "Rule of thirds",
    "Negatif space luas",
    "Flat lay penuh",
    "Crop lifestyle",
    "Berlapis (layered)",
  ],
  mood: ["Tenang & bersih", "Hangat & hidup", "Premium & elegan", "Lembut & manis", "Ceria & fresh", "Profesional"],
};

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 — Katalog Shopee" },
  { value: "3:4", label: "3:4 — Poster / Model" },
  { value: "4:5", label: "4:5 — Feed Sosial" },
  { value: "9:16", label: "9:16 — Story" },
];

export const QUANTITIES = [1, 2, 4, 8];
