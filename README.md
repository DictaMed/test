# DictaMed - Solution de Dictée Médicale Intelligente

## Description

DictaMed est une application web permettant aux professionnels de santé d'enregistrer des données médicales par dictée vocale et de les transformer en données structurées via Google Sheets et SPSS.

## Fonctionnalités

### Mode Normal
- Authentification sécurisée (identifiant + code d'accès)
- 4 sections d'enregistrement (3 obligatoires + 1 optionnelle)
- Envoi vers webhook N8N sécurisé

### Mode Test
- Démonstration gratuite sans authentification
- 3 sections d'enregistrement
- Lien vers Google Sheet public pour voir les résultats

### Caractéristiques techniques
- Enregistrement audio avec MediaRecorder API
- Détection automatique du format optimal (MP3, WAV, WebM, OGG)
- Timer en temps réel avec animations sophistiquées
- Pause/Reprise d'enregistrement avec feedback visuel
- Validation des formulaires avec alertes colorées
- Design moderne glassmorphism avec effets de profondeur
- Animations fluides et effets de hover 3D
- Design responsive mobile-first (mobile, tablette, desktop)

## Structure du projet

```
dictamed/
├── index.html      # Structure HTML de l'application
├── style.css       # Styles et design
├── script.js       # Logique JavaScript
└── README.md       # Ce fichier
```

## Installation

1. Téléchargez tous les fichiers dans un même dossier
2. Ouvrez `index.html` dans un navigateur moderne
3. Autorisez l'accès au microphone lorsque demandé

## Utilisation

### Pour tester (Mode Test)
1. Cliquez sur l'onglet "Mode Test"
2. Remplissez le numéro de dossier et nom fictifs
3. Enregistrez vos sections (suivez les exemples fournis)
4. Cliquez sur "Envoyer les données Test"
5. Consultez le Google Sheet pour voir les résultats

### Pour utiliser en production (Mode Normal)
1. Contactez l'équipe via l'onglet "Contact"
2. Recevez vos identifiants personnels
3. Connectez-vous dans l'onglet "Mode Normal"
4. Remplissez les informations patient
5. Enregistrez vos sections
6. Envoyez les données

## Compatibilité navigateurs

- ✅ Google Chrome (recommandé)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari

## Endpoints API

- **Mode Test:** `https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed`
- **Mode Normal:** `https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode`

## Format des données envoyées

```json
{
  "mode": "normal" | "test",
  "username": "...",
  "accessCode": "...",
  "NumeroDeDossier": "...",
  "NomDuPatient": "...",
  "recordedAt": "2025-11-07T21:00:00.000Z",
  "sections": {
    "partie1": {
      "audioBase64": "...",
      "fileName": "msgVocal1.mp3",
      "mimeType": "audio/mpeg",
      "format": "mp3"
    }
  }
}
```

## Sécurité

- Conformité RGPD
- Chiffrement des données en Mode Normal
- Authentification personnelle
- Stockage sécurisé des enregistrements

## Contact

- **Email:** DictaMed.SPSS@gmail.com
- **Facebook:** DictaMed.SPSS
- **Délai de réponse:** 48 heures ouvrées

## Licence

© 2025 DictaMed - Tous droits réservés
