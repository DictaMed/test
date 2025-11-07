/**
 * Module utilitaire pour DictaMed
 * Contient des fonctions helpers réutilisables
 * @version 8.0
 */

const Utils = {
    /**
     * Valide une adresse email
     * @param {string} email - Email à valider
     * @returns {boolean}
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Sanitise une chaîne de caractères pour éviter les injections
     * @param {string} str - Chaîne à sanitiser
     * @returns {string}
     */
    sanitize(str) {
        if (typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Formate une taille de fichier en format lisible
     * @param {number} bytes - Taille en octets
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Formate une durée en format MM:SS
     * @param {number} seconds - Durée en secondes
     * @returns {string}
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Debounce une fonction
     * @param {Function} func - Fonction à debouncer
     * @param {number} delay - Délai en ms
     * @returns {Function}
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle une fonction
     * @param {Function} func - Fonction à throttler
     * @param {number} limit - Limite en ms
     * @returns {Function}
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Attend un certain délai (Promise-based)
     * @param {number} ms - Délai en ms
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Génère un ID unique
     * @returns {string}
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Vérifie si le navigateur supporte une fonctionnalité
     * @param {string} feature - Nom de la fonctionnalité
     * @returns {boolean}
     */
    isSupported(feature) {
        const features = {
            'mediaRecorder': typeof MediaRecorder !== 'undefined',
            'serviceWorker': 'serviceWorker' in navigator,
            'notification': 'Notification' in window,
            'vibration': 'vibrate' in navigator,
            'localStorage': typeof Storage !== 'undefined'
        };
        
        return features[feature] || false;
    },

    /**
     * Copie du texte dans le presse-papiers
     * @param {string} text - Texte à copier
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback pour les navigateurs anciens
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },

    /**
     * Détecte le type d'appareil
     * @returns {string} 'mobile', 'tablet' ou 'desktop'
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    },

    /**
     * Vérifie si l'utilisateur est en ligne
     * @returns {boolean}
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Déclenche un feedback haptique (vibration) si supporté
     * @param {string} type - Type de feedback ('light', 'medium', 'heavy')
     */
    hapticFeedback(type = 'light') {
        if (!this.isSupported('vibration')) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [50, 100, 50]
        };
        
        navigator.vibrate(patterns[type] || patterns.light);
    },

    /**
     * Enregistre une erreur (pour future analytics)
     * @param {Error} error - Erreur à enregistrer
     * @param {object} context - Contexte additionnel
     */
    logError(error, context = {}) {
        console.error('[DictaMed Error]', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // TODO: Envoyer à un service d'analytics en production
    },

    /**
     * Vérifie si un objet est vide
     * @param {object} obj - Objet à vérifier
     * @returns {boolean}
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Deep clone un objet
     * @param {object} obj - Objet à cloner
     * @returns {object}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Convertit une base64 en Blob
     * @param {string} base64 - Chaîne base64
     * @param {string} mimeType - Type MIME
     * @returns {Blob}
     */
    base64ToBlob(base64, mimeType) {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mimeType });
    },

    /**
     * Valide un numéro de téléphone français
     * @param {string} phone - Numéro à valider
     * @returns {boolean}
     */
    isValidPhone(phone) {
        const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        return regex.test(phone);
    },

    /**
     * Obtient la date/heure actuelle en format ISO
     * @returns {string}
     */
    getCurrentTimestamp() {
        return new Date().toISOString();
    },

    /**
     * Formate une date en format français
     * @param {Date|string} date - Date à formater
     * @returns {string}
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Retire les accents d'une chaîne
     * @param {string} str - Chaîne à traiter
     * @returns {string}
     */
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Tronque un texte avec ellipse
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @returns {string}
     */
    truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength - 3) + '...';
    },

    /**
     * Encode une chaîne pour URL
     * @param {string} str - Chaîne à encoder
     * @returns {string}
     */
    encodeForURL(str) {
        return encodeURIComponent(str);
    },

    /**
     * Décode une chaîne depuis URL
     * @param {string} str - Chaîne à décoder
     * @returns {string}
     */
    decodeFromURL(str) {
        return decodeURIComponent(str);
    },

    /**
     * Vérifie si c'est un appareil iOS
     * @returns {boolean}
     */
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },

    /**
     * Vérifie si c'est un appareil Android
     * @returns {boolean}
     */
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    },

    /**
     * Calcule la bande passante approximative
     * @returns {Promise<number>} Vitesse en Mbps
     */
    async estimateBandwidth() {
        if ('connection' in navigator && 'downlink' in navigator.connection) {
            return navigator.connection.downlink;
        }
        return null;
    },

    /**
     * Retries une fonction async avec un nombre de tentatives
     * @param {Function} fn - Fonction async à retry
     * @param {number} retries - Nombre de tentatives
     * @param {number} delay - Délai entre tentatives (ms)
     * @returns {Promise}
     */
    async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) throw error;
            
            await this.sleep(delay);
            return this.retry(fn, retries - 1, delay);
        }
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
