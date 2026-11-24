use std::sync::{Mutex, MutexGuard};

use super::{LoadedSettings, Settings, SettingsStore, merge_detected};
use crate::error::AppError;
use crate::shells;

/// Configurações em memória + onde gravá-las.
pub struct SettingsState {
    store: SettingsStore,
    current: Mutex<LoadedSettings>,
}

impl SettingsState {
    /// Carrega o settings.json. Na primeira execução detecta os shells e cria o arquivo.
    pub fn init(store: SettingsStore) -> Self {
        let mut loaded = store.load();
        if loaded.first_run {
            merge_detected(&mut loaded.settings, shells::detect_profiles());
            loaded.settings = loaded.settings.clone().normalize();
            // Se não der para gravar agora, o app segue com as configurações em memória.
            let _ = store.save(&loaded.settings);
        }
        Self {
            store,
            current: Mutex::new(loaded),
        }
    }

    fn lock(&self) -> MutexGuard<'_, LoadedSettings> {
        self.current.lock().unwrap_or_else(|p| p.into_inner())
    }

    pub fn snapshot(&self) -> LoadedSettings {
        self.lock().clone()
    }

    pub fn settings(&self) -> Settings {
        self.lock().settings.clone()
    }

    /// Normaliza, grava e passa a usar as novas configurações.
    pub fn save(&self, settings: Settings) -> Result<Settings, AppError> {
        let settings = settings.normalize();
        self.store.save(&settings)?;
        let mut current = self.lock();
        current.settings = settings.clone();
        current.warning = None;
        Ok(settings)
    }

    /// Roda a detecção de novo e acrescenta o que for novo.
    pub fn redetect(&self) -> Result<Settings, AppError> {
        let detected = shells::detect_profiles();
        let mut settings = self.settings();
        merge_detected(&mut settings, detected);
        self.save(settings)
    }
}
