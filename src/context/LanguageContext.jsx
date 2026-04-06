import { createContext, useContext, useState, useCallback } from 'react';

const LANG_KEY = 'palmora_lang';

const translations = {
  en: {
    // Bottom Nav
    nav_dashboard: 'Dashboard',
    nav_analysis: 'Analysis',
    nav_report: 'Report',
    nav_settings: 'Settings',

    // Dashboard
    hi: 'Hi 👋',
    welcome_to: 'Welcome to',
    health: 'Health',
    uptime: 'Uptime',
    connected: 'Connected',
    plant_age: 'Plant Age',
    days: 'Days',
    my_fields: 'My Fields',
    ai_analysis: 'AI Analysis',
    tap_to_analyze: '✨ Tap to analyze',
    analyzing: 'Analyzing...',
    ai_analysis_desc: "Run a live analysis of your plantation's current health, sensor data, and harvest timeline.",
    harvest_progress: 'Harvest Progress',
    days_left: 'days left',
    day: 'Day',
    of: 'of',
    sensor_history: 'Sensor History',
    soil: 'Soil',
    uv: 'UV',
    no_data: 'No data',
    select_date_range: 'Select a date range above',
    power_system: 'Power System',
    charging: 'Charging',
    battery: 'Battery',
    solar: 'Solar',
    notifications: 'Notifications',
    no_notifications: 'No notifications',

    // Analysis
    ai_insights: 'AI Insights',
    live: 'Live',
    zone_overview: 'Zone Overview',
    zones: 'zones',
    area: 'Area',
    trees: 'Trees',
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    humidity: 'Humidity',
    canopy_coverage: 'Canopy Coverage Optimal',
    soil_moisture_alert: 'Soil Moisture Alert',
    pest_activity: 'Pest Activity Detected',
    harvest_forecast: 'Harvest Forecast',
    generating_insight: 'Generating insight…',
    smart_insights: 'Smart plantation insights',

    // Report
    report_title: 'Report',
    ai_generated: 'AI-generated plantation analysis',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    auto_summarize: 'Auto Summarize Analysis',
    generate: 'Generate',
    generating_report: 'Generating AI report…',
    current_progress: 'Current Progress',
    issues: 'Issues',
    future_plan: 'Future Plan',
    ask_plantation: 'Ask about your plantation...',

    // Settings
    settings_title: 'Settings',
    system_config: 'System Configuration',
    sprinkler_control: 'Sprinkler Control',
    auto_irrigation: 'Auto Irrigation',
    auto_irrigation_desc: 'AI-based automatic sprinkler activation',
    push_notifications: 'Push Notifications',
    receive_alerts: 'Receive alerts and updates',
    alert_history: 'Alert History',
    alerts: 'alerts',
    system: 'System',
    refresh_interval: 'Refresh Interval',
    language: 'Language',
    network_status: 'Network Status',
    firmware: 'Firmware',
    reset: 'Reset',
    about_desc: 'Precision AI-powered Land & Moisture Optimization for Resilient Agriculture',
    irrigating: 'Irrigating...',
    standby: 'Standby',

    // Account
    account: 'Account Settings',
    personal_info: 'Personal Information',
    full_name: 'Full Name',
    email: 'Email Address',
    plantation_setup: 'Plantation Setup',
    plant_type: 'Plant Type',
    planted_date: 'Planted Date',
    save_changes: 'Save Changes',
    saved: '✓ Saved',
    your_avatar: 'Your Avatar',
    plant_photo: 'Plant Photo',
    change: 'Change',
    password: 'Password',
    reset_password: 'Reset Password',
    password_reset_initiated: 'Password reset initiated. Please enter your new password.',
    changes_saved: 'Changes Saved',

    // AI Chatbot
    ask_ai: 'Ask PALMORA AI...',
    ai_greeting: 'Hello! I am PALMORA AI. How can I help you optimize your plantation today?',
    type_message: 'Type a message...',

    // Onboarding
    continue: 'Continue',
    get_started: 'Get Started',
  },

  id: {
    // Bottom Nav
    nav_dashboard: 'Beranda',
    nav_analysis: 'Analisis',
    nav_report: 'Laporan',
    nav_settings: 'Pengaturan',

    // Dashboard
    hi: 'Hai 👋',
    welcome_to: 'Selamat datang di',
    health: 'Kesehatan',
    uptime: 'Waktu Aktif',
    connected: 'Terhubung',
    plant_age: 'Umur Tanaman',
    days: 'Hari',
    my_fields: 'Ladang Saya',
    ai_analysis: 'Analisis AI',
    tap_to_analyze: '✨ Ketuk untuk analisis',
    analyzing: 'Menganalisis...',
    ai_analysis_desc: 'Jalankan analisis langsung kesehatan perkebunan, data sensor, dan jadwal panen Anda.',
    harvest_progress: 'Progres Panen',
    days_left: 'hari lagi',
    day: 'Hari',
    of: 'dari',
    sensor_history: 'Riwayat Sensor',
    soil: 'Tanah',
    uv: 'UV',
    no_data: 'Tidak ada data',
    select_date_range: 'Pilih rentang tanggal di atas',
    power_system: 'Sistem Daya',
    charging: 'Mengisi',
    battery: 'Baterai',
    solar: 'Surya',
    notifications: 'Notifikasi',
    no_notifications: 'Tidak ada notifikasi',

    // Analysis
    ai_insights: 'Wawasan AI',
    live: 'Langsung',
    zone_overview: 'Gambaran Zona',
    zones: 'zona',
    area: 'Luas',
    trees: 'Pohon',
    healthy: 'Sehat',
    warning: 'Peringatan',
    critical: 'Kritis',
    humidity: 'Kelembapan',
    canopy_coverage: 'Tutupan Kanopi Optimal',
    soil_moisture_alert: 'Peringatan Kelembaban Tanah',
    pest_activity: 'Aktivitas Hama Terdeteksi',
    harvest_forecast: 'Prakiraan Panen',
    generating_insight: 'Membuat wawasan…',
    smart_insights: 'Wawasan perkebunan cerdas',

    // Report
    report_title: 'Laporan',
    ai_generated: 'Analisis perkebunan berbasis AI',
    week: 'Minggu',
    month: 'Bulan',
    year: 'Tahun',
    auto_summarize: 'Ringkasan Analisis Otomatis',
    generate: 'Buat',
    generating_report: 'Membuat laporan AI…',
    current_progress: 'Progres Saat Ini',
    issues: 'Masalah',
    future_plan: 'Rencana Kedepan',
    ask_plantation: 'Tanya tentang perkebunan Anda...',

    // Settings
    settings_title: 'Pengaturan',
    system_config: 'Konfigurasi Sistem',
    sprinkler_control: 'Kontrol Sprinkler',
    auto_irrigation: 'Irigasi Otomatis',
    auto_irrigation_desc: 'Aktivasi sprinkler otomatis berbasis AI',
    push_notifications: 'Notifikasi Push',
    receive_alerts: 'Terima peringatan dan pembaruan',
    alert_history: 'Riwayat Peringatan',
    alerts: 'peringatan',
    system: 'Sistem',
    refresh_interval: 'Interval Penyegaran',
    language: 'Bahasa',
    network_status: 'Status Jaringan',
    firmware: 'Firmware',
    reset: 'Reset',
    about_desc: 'Optimalisasi Lahan & Kelembaban Berbasis AI untuk Pertanian Tangguh',
    irrigating: 'Menyiram...',
    standby: 'Siaga',

    // Account
    account: 'Pengaturan Akun',
    personal_info: 'Informasi Pribadi',
    full_name: 'Nama Lengkap',
    email: 'Alamat Email',
    plantation_setup: 'Pengaturan Perkebunan',
    plant_type: 'Jenis Tanaman',
    planted_date: 'Tanggal Tanam',
    save_changes: 'Simpan Perubahan',
    saved: '✓ Tersimpan',
    your_avatar: 'Avatar Anda',
    plant_photo: 'Foto Tanaman',
    change: 'Ubah',
    password: 'Kata Sandi',
    reset_password: 'Atur Ulang Sandi',
    password_reset_initiated: 'Penyetelan ulang sandi dimulai. Silakan masukkan sandi baru Anda.',
    changes_saved: 'Perubahan Disimpan',

    // AI Chatbot
    ask_ai: 'Tanya PALMORA AI...',
    ai_greeting: 'Halo! Saya PALMORA AI. Bagaimana saya dapat membantu Anda mengoptimalkan perkebunan Anda hari ini?',
    type_message: 'Ketik pesan...',

    // Onboarding
    continue: 'Lanjutkan',
    get_started: 'Mulai',
  },

  ms: {
    // Bottom Nav
    nav_dashboard: 'Papan Pemuka',
    nav_analysis: 'Analisis',
    nav_report: 'Laporan',
    nav_settings: 'Tetapan',

    // Dashboard
    hi: 'Hai 👋',
    welcome_to: 'Selamat datang ke',
    health: 'Kesihatan',
    uptime: 'Masa Aktif',
    connected: 'Disambung',
    plant_age: 'Umur Pokok',
    days: 'Hari',
    my_fields: 'Ladang Saya',
    ai_analysis: 'Analisis AI',
    tap_to_analyze: '✨ Ketik untuk analisis',
    analyzing: 'Menganalisis...',
    ai_analysis_desc: 'Jalankan analisis langsung kesihatan ladang, data sensor, dan garis masa tuaian anda.',
    harvest_progress: 'Kemajuan Tuaian',
    days_left: 'hari lagi',
    day: 'Hari',
    of: 'daripada',
    sensor_history: 'Sejarah Sensor',
    soil: 'Tanah',
    uv: 'UV',
    no_data: 'Tiada data',
    select_date_range: 'Pilih julat tarikh di atas',
    power_system: 'Sistem Kuasa',
    charging: 'Mengecas',
    battery: 'Bateri',
    solar: 'Solar',
    notifications: 'Pemberitahuan',
    no_notifications: 'Tiada pemberitahuan',

    // Analysis
    ai_insights: 'Wawasan AI',
    live: 'Langsung',
    zone_overview: 'Gambaran Zon',
    zones: 'zon',
    area: 'Kawasan',
    trees: 'Pokok',
    healthy: 'Sihat',
    warning: 'Amaran',
    critical: 'Kritikal',
    humidity: 'Kelembapan',
    canopy_coverage: 'Liputan Kanopi Optimum',
    soil_moisture_alert: 'Amaran Kelembapan Tanah',
    pest_activity: 'Aktiviti Perosak Dikesan',
    harvest_forecast: 'Ramalan Tuaian',
    generating_insight: 'Menjana wawasan…',
    smart_insights: 'Wawasan ladang pintar',

    // Report
    report_title: 'Laporan',
    ai_generated: 'Analisis ladang dijana AI',
    week: 'Minggu',
    month: 'Bulan',
    year: 'Tahun',
    auto_summarize: 'Ringkasan Analisis Auto',
    generate: 'Jana',
    generating_report: 'Menjana laporan AI…',
    current_progress: 'Kemajuan Semasa',
    issues: 'Isu',
    future_plan: 'Pelan Masa Hadapan',
    ask_plantation: 'Tanya tentang ladang anda...',

    // Settings
    settings_title: 'Tetapan',
    system_config: 'Konfigurasi Sistem',
    sprinkler_control: 'Kawalan Pemercik',
    auto_irrigation: 'Pengairan Auto',
    auto_irrigation_desc: 'Pengaktifan pemercik automatik berasaskan AI',
    push_notifications: 'Pemberitahuan Tolak',
    receive_alerts: 'Terima amaran dan kemas kini',
    alert_history: 'Sejarah Amaran',
    alerts: 'amaran',
    system: 'Sistem',
    refresh_interval: 'Selang Segar Semula',
    language: 'Bahasa',
    network_status: 'Status Rangkaian',
    firmware: 'Perisian Tegar',
    reset: 'Set Semula',
    about_desc: 'Pengoptimuman Tanah & Kelembapan Berkuasa AI untuk Pertanian Berdaya Tahan',
    irrigating: 'Menyiram...',
    standby: 'Sedia',

    // Account
    account: 'Tetapan Akaun',
    personal_info: 'Maklumat Peribadi',
    full_name: 'Nama Penuh',
    email: 'Alamat E-mel',
    plantation_setup: 'Persediaan Ladang',
    plant_type: 'Jenis Pokok',
    planted_date: 'Tarikh Tanam',
    save_changes: 'Simpan Perubahan',
    saved: '✓ Disimpan',
    your_avatar: 'Avatar Anda',
    plant_photo: 'Foto Pokok',
    change: 'Tukar',
    password: 'Kata Laluan',
    reset_password: 'Tetapkan Semula Laluan',
    password_reset_initiated: 'Penetapan semula laluan dimulakan. Sila masukkan kata laluan baharu anda.',
    changes_saved: 'Perubahan Disimpan',

    // AI Chatbot
    ask_ai: 'Tanya PALMORA AI...',
    ai_greeting: 'Sapaan! Saya PALMORA AI. Bagaimanakah saya boleh membantu anda mengoptimumkan ladang anda hari ini?',
    type_message: 'Taip mesej...',

    // Onboarding
    continue: 'Teruskan',
    get_started: 'Mula',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  const t = useCallback((key, fallback) => {
    return translations[lang]?.[key] || translations.en[key] || fallback || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
