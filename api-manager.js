/**
 * Gestionnaire d'API avec retry, timeout et gestion d'erreurs robuste
 * @version 8.0
 */

class APIManager {
    constructor() {
        this.requestQueue = [];
        this.isProcessing = false;
        this.abortControllers = new Map();
    }
    
    /**
     * Effectue une requête HTTP avec retry automatique
     * @param {string} url - URL de la requête
     * @param {Object} options - Options de la requête
     * @param {number} retries - Nombre de tentatives
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}, retries = CONFIG.API.RETRY_ATTEMPTS) {
        // Créer un AbortController pour timeout
        const controller = new AbortController();
        const requestId = Utils.generateId();
        this.abortControllers.set(requestId, controller);
        
        // Ajouter le signal au options
        options.signal = controller.signal;
        
        // Timeout
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, CONFIG.API.TIMEOUT);
        
        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            this.abortControllers.delete(requestId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            this.abortControllers.delete(requestId);
            
            // Si c'est une erreur d'annulation, ne pas retry
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            // Si plus de retries, throw
            if (retries <= 0) {
                throw error;
            }
            
            // Attendre avant de retry
            await Utils.sleep(CONFIG.API.RETRY_DELAY);
            
            // Retry
            return this.fetchWithRetry(url, options, retries - 1);
        }
    }
    
    /**
     * Envoie les données en mode Normal
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>}
     */
    async sendNormalMode(data) {
        // Validation des données
        this.validateNormalModeData(data);
        
        // Vérifier la connexion
        if (!navigator.onLine) {
            throw new Error('Aucune connexion Internet. Veuillez réessayer plus tard.');
        }
        
        // Préparer les données
        const payload = this.preparePayload(data, 'normal');
        
        // Log pour debug (sans données sensibles)
        console.log('[API] Sending normal mode data:', {
            sections: Object.keys(data.sections || {}),
            timestamp: payload.recordedAt
        });
        
        try {
            const response = await this.fetchWithRetry(
                CONFIG.API.NORMAL_MODE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Version': CONFIG.VERSION,
                        'X-Request-ID': Utils.generateId()
                    },
                    body: JSON.stringify(payload)
                }
            );
            
            const result = await response.json();
            
            // Log succès
            console.log('[API] Normal mode data sent successfully');
            
            return result;
            
        } catch (error) {
            Utils.logError(error, { mode: 'normal', endpoint: CONFIG.API.NORMAL_MODE });
            throw new Error(`Échec de l'envoi: ${error.message}`);
        }
    }
    
    /**
     * Envoie les données en mode Test
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>}
     */
    async sendTestMode(data) {
        // Validation des données
        this.validateTestModeData(data);
        
        // Vérifier la connexion
        if (!navigator.onLine) {
            throw new Error('Aucune connexion Internet. Veuillez réessayer plus tard.');
        }
        
        // Préparer les données
        const payload = this.preparePayload(data, 'test');
        
        console.log('[API] Sending test mode data:', {
            sections: Object.keys(data.sections || {}),
            timestamp: payload.recordedAt
        });
        
        try {
            const response = await this.fetchWithRetry(
                CONFIG.API.TEST_MODE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Version': CONFIG.VERSION,
                        'X-Request-ID': Utils.generateId()
                    },
                    body: JSON.stringify(payload)
                }
            );
            
            const result = await response.json();
            
            console.log('[API] Test mode data sent successfully');
            
            return result;
            
        } catch (error) {
            Utils.logError(error, { mode: 'test', endpoint: CONFIG.API.TEST_MODE });
            throw new Error(`Échec de l'envoi: ${error.message}`);
        }
    }
    
    /**
     * Valide les données du mode Normal
     * @param {Object} data - Données à valider
     * @throws {Error} Si validation échoue
     */
    validateNormalModeData(data) {
        if (!data.username || !data.accessCode) {
            throw new Error('Identifiant et code d\'accès requis');
        }
        
        if (!data.NumeroDeDossier || !data.NomDuPatient) {
            throw new Error('Numéro de dossier et nom du patient requis');
        }
        
        if (!data.sections || Object.keys(data.sections).length < 3) {
            throw new Error('Au moins 3 sections d\'enregistrement requises');
        }
        
        // Valider chaque section
        Object.entries(data.sections).forEach(([key, section]) => {
            if (!section.audioBase64) {
                throw new Error(`Section ${key}: audio manquant`);
            }
            if (!section.mimeType) {
                throw new Error(`Section ${key}: type MIME manquant`);
            }
        });
    }
    
    /**
     * Valide les données du mode Test
     * @param {Object} data - Données à valider
     * @throws {Error} Si validation échoue
     */
    validateTestModeData(data) {
        if (!data.NumeroDeDossier || !data.NomDuPatient) {
            throw new Error('Numéro de dossier et nom du patient requis');
        }
        
        if (!data.sections || Object.keys(data.sections).length < 3) {
            throw new Error('Les 3 sections d\'enregistrement sont requises');
        }
        
        // Valider chaque section
        Object.entries(data.sections).forEach(([key, section]) => {
            if (!section.audioBase64) {
                throw new Error(`Section ${key}: audio manquant`);
            }
            if (!section.mimeType) {
                throw new Error(`Section ${key}: type MIME manquant`);
            }
        });
    }
    
    /**
     * Prépare le payload pour l'envoi
     * @param {Object} data - Données brutes
     * @param {string} mode - Mode ('normal' ou 'test')
     * @returns {Object}
     */
    preparePayload(data, mode) {
        const payload = {
            mode: mode,
            recordedAt: Utils.getCurrentTimestamp(),
            clientVersion: CONFIG.VERSION,
            userAgent: navigator.userAgent,
            NumeroDeDossier: Utils.sanitize(data.NumeroDeDossier),
            NomDuPatient: Utils.sanitize(data.NomDuPatient),
            sections: {}
        };
        
        // Ajouter l'authentification pour mode normal
        if (mode === 'normal') {
            payload.username = Utils.sanitize(data.username);
            payload.accessCode = data.accessCode; // Ne pas sanitizer le mot de passe
        }
        
        // Traiter les sections
        Object.entries(data.sections).forEach(([key, section]) => {
            payload.sections[key] = {
                audioBase64: section.audioBase64,
                fileName: section.fileName || `${key}.mp3`,
                mimeType: section.mimeType,
                format: section.format || 'mp3',
                duration: section.duration || 0,
                size: section.size || 0
            };
        });
        
        return payload;
    }
    
    /**
     * Annule toutes les requêtes en cours
     */
    cancelAllRequests() {
        this.abortControllers.forEach(controller => {
            controller.abort();
        });
        this.abortControllers.clear();
    }
    
    /**
     * Vérifie la santé de l'API
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const response = await fetch(CONFIG.API.TEST_MODE, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            
            return response.ok;
        } catch {
            return false;
        }
    }
    
    /**
     * Estime la bande passante disponible
     * @returns {Promise<string>} 'good', 'medium' ou 'poor'
     */
    async estimateConnection() {
        const bandwidth = await Utils.estimateBandwidth();
        
        if (bandwidth === null) return 'unknown';
        if (bandwidth >= 5) return 'good';
        if (bandwidth >= 1) return 'medium';
        return 'poor';
    }
    
    /**
     * Compresse les données audio si nécessaire
     * @param {string} base64Audio - Audio en base64
     * @param {string} mimeType - Type MIME
     * @returns {Promise<Object>} { base64Audio, mimeType, compressionRatio }
     */
    async compressAudioIfNeeded(base64Audio, mimeType) {
        // Calculer la taille
        const size = base64Audio.length * 0.75; // Approximation
        
        // Si moins de 5MB, pas de compression
        if (size < 5 * 1024 * 1024) {
            return { base64Audio, mimeType, compressionRatio: 1 };
        }
        
        // TODO: Implémenter compression audio
        console.log('[API] Audio compression not implemented yet');
        
        return { base64Audio, mimeType, compressionRatio: 1 };
    }
}

// Instance singleton
const apiManager = new APIManager();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIManager, apiManager };
}
