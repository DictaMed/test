/**
 * Configuration centralisée de DictaMed
 * @version 8.0
 */

const CONFIG = {
    // Version de l'application
    VERSION: '8.0.0',
    
    // Endpoints API
    API: {
        NORMAL_MODE: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        TEST_MODE: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
        TIMEOUT: 30000, // 30 secondes
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 seconde
    },
    
    // Limites de fichiers
    FILE: {
        MAX_SIZE: 10 * 1024 * 1024, // 10 MB
        ALLOWED_FORMATS: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'],
        PREFERRED_FORMAT: 'audio/mpeg'
    },
    
    // Configuration de l'enregistrement audio
    RECORDING: {
        MAX_DURATION: 600, // 10 minutes
        SAMPLE_RATE: 44100,
        BITS_PER_SAMPLE: 16
    },
    
    // Configuration de l'auto-save
    AUTO_SAVE: {
        INTERVAL: 30000, // 30 secondes
        DEBOUNCE_DELAY: 2000, // 2 secondes
        EXPIRATION: 24 * 60 * 60 * 1000, // 24 heures
        STORAGE_KEY: 'dictamed_autosave'
    },
    
    // Configuration des notifications
    TOAST: {
        DURATION: 5000, // 5 secondes
        MAX_VISIBLE: 3,
        POSITION: 'top-right'
    },
    
    // Configuration PWA
    PWA: {
        CACHE_NAME: 'dictamed-v8.0',
        OFFLINE_PAGE: '/offline.html',
        CACHE_STRATEGY: 'network-first'
    },
    
    // Thèmes
    THEME: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto',
        DEFAULT: 'light'
    },
    
    // Validation
    VALIDATION: {
        MIN_PATIENT_NAME_LENGTH: 2,
        MIN_RECORD_NUMBER_LENGTH: 1,
        MAX_PATIENT_NAME_LENGTH: 100,
        MAX_RECORD_NUMBER_LENGTH: 50
    },
    
    // Contact
    CONTACT: {
        EMAIL: 'DictaMed.SPSS@gmail.com',
        FACEBOOK: 'DictaMed.SPSS',
        RESPONSE_TIME: '48 heures ouvrées'
    },
    
    // Feature flags
    FEATURES: {
        DARK_MODE: true,
        OFFLINE_MODE: true,
        AUTO_SAVE: true,
        HAPTIC_FEEDBACK: true,
        VOICE_COMMANDS: false, // Future feature
        ANALYTICS: false // Future feature
    }
};

// Fonction pour obtenir une valeur de configuration
CONFIG.get = function(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this);
};

// Fonction pour vérifier si une feature est activée
CONFIG.isFeatureEnabled = function(featureName) {
    return this.FEATURES[featureName] === true;
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
