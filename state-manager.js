/**
 * Gestionnaire d'état global avec pattern Observer
 * Permet une gestion centralisée et réactive de l'état de l'application
 * @version 8.0
 */

class StateManager {
    constructor() {
        this.state = {
            // Mode actuel
            currentMode: 'normal',
            currentTab: 'mode-normal',
            
            // Authentification
            auth: {
                username: '',
                accessCode: '',
                isRemembered: false,
                isAuthenticated: false
            },
            
            // Données patient
            patient: {
                numeroDossier: '',
                nomPatient: ''
            },
            
            // Enregistrements
            recordings: {
                normal: {
                    partie1: null,
                    partie2: null,
                    partie3: null,
                    partie4: null
                },
                test: {
                    partie1: null,
                    partie2: null,
                    partie3: null
                },
                dmi: {
                    partie1: null,
                    partie2: null,
                    partie3: null,
                    partie4: null
                }
            },
            
            // État d'enregistrement
            recording: {
                isRecording: false,
                isPaused: false,
                currentSection: null,
                duration: 0,
                stream: null,
                mediaRecorder: null
            },
            
            // UI State
            ui: {
                isLoading: false,
                loadingMessage: '',
                theme: 'light',
                installPromptEvent: null
            },
            
            // Auto-save
            autoSave: {
                isEnabled: true,
                lastSaveTime: null,
                isSaving: false,
                isDirty: false
            },
            
            // Network
            network: {
                isOnline: navigator.onLine,
                lastChecked: Date.now()
            },
            
            // Errors
            errors: []
        };
        
        this.observers = new Map();
        this.history = [];
        this.maxHistory = 50;
        
        // Bind methods
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.getState = this.getState.bind(this);
        this.setState = this.setState.bind(this);
        this.resetState = this.resetState.bind(this);
        
        // Listen to network changes
        window.addEventListener('online', () => this.updateNetwork(true));
        window.addEventListener('offline', () => this.updateNetwork(false));
    }
    
    /**
     * S'abonner aux changements d'état
     * @param {string} key - Clé de l'état à surveiller (ex: 'auth.username')
     * @param {Function} callback - Fonction appelée lors du changement
     * @returns {Function} Fonction de désabonnement
     */
    subscribe(key, callback) {
        if (!this.observers.has(key)) {
            this.observers.set(key, new Set());
        }
        
        this.observers.get(key).add(callback);
        
        // Retourne une fonction de désabonnement
        return () => this.unsubscribe(key, callback);
    }
    
    /**
     * Se désabonner des changements d'état
     * @param {string} key - Clé de l'état
     * @param {Function} callback - Fonction à retirer
     */
    unsubscribe(key, callback) {
        if (this.observers.has(key)) {
            this.observers.get(key).delete(callback);
        }
    }
    
    /**
     * Notifier les observateurs
     * @param {string} key - Clé qui a changé
     * @param {*} newValue - Nouvelle valeur
     * @param {*} oldValue - Ancienne valeur
     */
    notify(key, newValue, oldValue) {
        // Notifier les observateurs spécifiques
        if (this.observers.has(key)) {
            this.observers.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`Error in observer for ${key}:`, error);
                }
            });
        }
        
        // Notifier les observateurs généraux (wildcard)
        if (this.observers.has('*')) {
            this.observers.get('*').forEach(callback => {
                try {
                    callback(this.state, key);
                } catch (error) {
                    console.error('Error in wildcard observer:', error);
                }
            });
        }
    }
    
    /**
     * Obtenir l'état actuel ou une partie de l'état
     * @param {string} [path] - Chemin vers une valeur spécifique (ex: 'auth.username')
     * @returns {*}
     */
    getState(path) {
        if (!path) return Utils.deepClone(this.state);
        
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }
    
    /**
     * Mettre à jour l'état
     * @param {string} path - Chemin vers la valeur à mettre à jour
     * @param {*} value - Nouvelle valeur
     */
    setState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        // Récupérer l'objet parent
        let current = this.state;
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        // Sauvegarder l'ancienne valeur
        const oldValue = current[lastKey];
        
        // Mettre à jour la valeur
        current[lastKey] = value;
        
        // Ajouter à l'historique
        this.addToHistory(path, oldValue, value);
        
        // Notifier les observateurs
        this.notify(path, value, oldValue);
        
        // Marquer comme dirty pour auto-save
        this.setState('autoSave.isDirty', true);
    }
    
    /**
     * Mettre à jour plusieurs valeurs à la fois
     * @param {Object} updates - Objet contenant les chemins et valeurs
     */
    setMultiple(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            this.setState(path, value);
        });
    }
    
    /**
     * Réinitialiser l'état
     * @param {string} [section] - Section à réinitialiser (optionnel)
     */
    resetState(section) {
        if (section) {
            const defaultState = this.getDefaultState();
            this.setState(section, defaultState[section]);
        } else {
            this.state = this.getDefaultState();
            this.history = [];
            this.notify('*', this.state, null);
        }
    }
    
    /**
     * Obtenir l'état par défaut
     * @returns {Object}
     */
    getDefaultState() {
        return {
            currentMode: 'normal',
            currentTab: 'mode-normal',
            auth: {
                username: '',
                accessCode: '',
                isRemembered: false,
                isAuthenticated: false
            },
            patient: {
                numeroDossier: '',
                nomPatient: ''
            },
            recordings: {
                normal: { partie1: null, partie2: null, partie3: null, partie4: null },
                test: { partie1: null, partie2: null, partie3: null },
                dmi: { partie1: null, partie2: null, partie3: null, partie4: null }
            },
            recording: {
                isRecording: false,
                isPaused: false,
                currentSection: null,
                duration: 0,
                stream: null,
                mediaRecorder: null
            },
            ui: {
                isLoading: false,
                loadingMessage: '',
                theme: 'light',
                installPromptEvent: null
            },
            autoSave: {
                isEnabled: true,
                lastSaveTime: null,
                isSaving: false,
                isDirty: false
            },
            network: {
                isOnline: navigator.onLine,
                lastChecked: Date.now()
            },
            errors: []
        };
    }
    
    /**
     * Ajouter une entrée à l'historique
     * @param {string} path - Chemin modifié
     * @param {*} oldValue - Ancienne valeur
     * @param {*} newValue - Nouvelle valeur
     */
    addToHistory(path, oldValue, newValue) {
        this.history.push({
            path,
            oldValue: Utils.deepClone(oldValue),
            newValue: Utils.deepClone(newValue),
            timestamp: Date.now()
        });
        
        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    /**
     * Obtenir l'historique
     * @param {number} [limit] - Nombre d'entrées à retourner
     * @returns {Array}
     */
    getHistory(limit) {
        if (limit) {
            return this.history.slice(-limit);
        }
        return [...this.history];
    }
    
    /**
     * Annuler le dernier changement
     * @returns {boolean} Succès ou échec
     */
    undo() {
        if (this.history.length === 0) return false;
        
        const lastChange = this.history.pop();
        const keys = lastChange.path.split('.');
        const lastKey = keys.pop();
        
        let current = this.state;
        for (const key of keys) {
            current = current[key];
        }
        
        current[lastKey] = lastChange.oldValue;
        this.notify(lastChange.path, lastChange.oldValue, lastChange.newValue);
        
        return true;
    }
    
    /**
     * Mettre à jour l'état réseau
     * @param {boolean} isOnline - État de connexion
     */
    updateNetwork(isOnline) {
        this.setMultiple({
            'network.isOnline': isOnline,
            'network.lastChecked': Date.now()
        });
    }
    
    /**
     * Ajouter une erreur
     * @param {Error|string} error - Erreur à ajouter
     */
    addError(error) {
        const errorObj = {
            message: error.message || error,
            timestamp: Date.now(),
            stack: error.stack
        };
        
        const errors = this.getState('errors');
        errors.push(errorObj);
        this.setState('errors', errors);
    }
    
    /**
     * Effacer les erreurs
     */
    clearErrors() {
        this.setState('errors', []);
    }
    
    /**
     * Sauvegarder l'état dans localStorage
     * @param {string} [key] - Clé de sauvegarde (par défaut: CONFIG.AUTO_SAVE.STORAGE_KEY)
     */
    saveToStorage(key = CONFIG.AUTO_SAVE.STORAGE_KEY) {
        try {
            const stateToSave = {
                ...this.state,
                savedAt: Date.now(),
                version: CONFIG.VERSION
            };
            
            localStorage.setItem(key, JSON.stringify(stateToSave));
            this.setState('autoSave.lastSaveTime', Date.now());
            this.setState('autoSave.isDirty', false);
            
            return true;
        } catch (error) {
            console.error('Error saving state:', error);
            return false;
        }
    }
    
    /**
     * Charger l'état depuis localStorage
     * @param {string} [key] - Clé de chargement
     * @returns {boolean} Succès ou échec
     */
    loadFromStorage(key = CONFIG.AUTO_SAVE.STORAGE_KEY) {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return false;
            
            const parsed = JSON.parse(saved);
            
            // Vérifier l'expiration
            const age = Date.now() - parsed.savedAt;
            if (age > CONFIG.AUTO_SAVE.EXPIRATION) {
                localStorage.removeItem(key);
                return false;
            }
            
            // Restaurer l'état (sans écraser certaines valeurs)
            const { savedAt, version, ...stateToRestore } = parsed;
            
            Object.entries(stateToRestore).forEach(([path, value]) => {
                if (path !== 'ui' && path !== 'network' && path !== 'recording') {
                    this.state[path] = value;
                }
            });
            
            this.notify('*', this.state, null);
            
            return true;
        } catch (error) {
            console.error('Error loading state:', error);
            return false;
        }
    }
    
    /**
     * Effacer l'état sauvegardé
     * @param {string} [key] - Clé à effacer
     */
    clearStorage(key = CONFIG.AUTO_SAVE.STORAGE_KEY) {
        localStorage.removeItem(key);
    }
}

// Instance singleton
const stateManager = new StateManager();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager, stateManager };
}
