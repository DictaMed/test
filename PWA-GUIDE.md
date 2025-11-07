# DictaMed PWA - Instructions d'installation

## 🚀 Progressive Web App

DictaMed est maintenant une PWA (Progressive Web App) complète qui peut être installée sur votre appareil !

## 📱 Installation sur Mobile

### iOS (Safari)
1. Ouvrez le site dans Safari
2. Appuyez sur le bouton "Partager" (icône carré avec flèche vers le haut)
3. Faites défiler et sélectionnez "Sur l'écran d'accueil"
4. Donnez un nom (DictaMed) et appuyez sur "Ajouter"
5. L'application apparaît maintenant sur votre écran d'accueil !

### Android (Chrome)
1. Ouvrez le site dans Chrome
2. Appuyez sur le menu (⋮) en haut à droite
3. Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"
4. Confirmez l'installation
5. L'application est maintenant installée !

## 💻 Installation sur Desktop

### Chrome / Edge
1. Ouvrez le site dans Chrome ou Edge
2. Cliquez sur l'icône "Installer" (⊕) dans la barre d'adresse
3. Ou allez dans Menu → "Installer DictaMed..."
4. Confirmez l'installation
5. L'application s'ouvre dans sa propre fenêtre !

## ✨ Avantages de la PWA

- 📴 **Mode hors ligne** : Accédez au site même sans connexion
- ⚡ **Chargement rapide** : Cache intelligent pour performances optimales
- 🏠 **Écran d'accueil** : Lancez comme une app native
- 📱 **Expérience native** : Interface en plein écran sans barre d'adresse
- 🔄 **Mises à jour auto** : Toujours à jour automatiquement
- 💾 **Économie de données** : Moins de consommation réseau

## 🔧 Tester localement

Pour tester la PWA en local :

```bash
# Installer un serveur HTTP simple
npm install -g http-server

# Lancer le serveur dans le dossier dictamed
cd dictamed
http-server -p 8080

# Ou avec Python
python -m http.server 8080
```

Puis ouvrez : `http://localhost:8080`

⚠️ **Important** : Le Service Worker nécessite HTTPS en production (sauf localhost)

## 📊 Caractéristiques techniques

- **Manifest** : manifest.json avec toutes les spécifications
- **Service Worker** : Stratégie "Network First, fallback to Cache"
- **Icônes** : 8 tailles (72px à 512px)
- **Favicon** : SVG avec dégradés D (bleu) + M (vert)
- **Offline** : Page personnalisée en mode hors ligne
- **Cache** : Gestion intelligente avec mise à jour automatique

## 🎨 Design

- **Thème principal** : Bleu (#2563eb) et Vert (#10b981)
- **Fond** : Dégradé clair (#e0f2fe)
- **Icône** : Logo DictaMed "DM" stylisé

Profitez de DictaMed en mode PWA ! 🎉
