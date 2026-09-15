# ⚡ HTML in URL

> Écrivez du HTML, du CSS et du JavaScript directement dans votre navigateur et partagez le tout via un simple lien sans aucun serveur !

Projet en ligne : [https://html.pinou007.fr](https://html.pinou007.fr)  
Dépôt GitHub : [https://github.com/Pinou007/html-in-url](https://github.com/Pinou007/html-in-url)  
Ancienne version (conservée) : [https://html.pinou007.fr/old/index.html](https://html.pinou007.fr/old/index.html)

---

## 🌟 Fonctionnalités

1. **Tout dans l'URL & Zéro Serveur (GitHub Pages)** :
   - Tout le code HTML, CSS et JavaScript est compressé avec `CompressionStream('deflate-raw')` puis encodé en `Base64URL`.
   - Zéro base de données, zéro serveur backend : 100% statique et hébergé directement sur GitHub Pages.

2. **Design Flat & Épuré** :
   - Typographie : **Nunito** (Google Fonts).
   - Couleur d'accent : **`#9000d5`** en pur rendu flat (sans effet de glow ni surcharge visuelle).
   - **Thème automatique** sombre / clair s'adaptant directement aux préférences système de votre appareil (`prefers-color-scheme`).

3. **Barre d'URL Simple avec Boutons Pictos** :
   - Champ d'URL transparent avec compteur en direct (`xxx / 2048 car.`).
   - **Copier** : copie instantanément le lien complet dans le presse-papier.
   - **QR Code** : génère un QR Code propre, actif uniquement si l'URL contient **moins de 1024 caractères** pour garantir un scan facile et fiable sur mobile.
   - **Télécharger** : exporte en un clic l'intégralité du projet dans un fichier unique `.html` autonome.

4. **Éditeur de Code avec Onglet Console Intégré** :
   - 4 onglets : **HTML**, **CSS**, **JS**, **Console**.
   - Numérotation des lignes, indentation automatique avec la touche Tab.
   - L'onglet **Console** affiche les logs, avertissements et erreurs JavaScript relayés depuis la zone d'exécution, avec un bouton **Vider**.

5. **Sandbox Hermétique & Sécurisée** :
   - Exécution isolée dans une balise `<iframe sandbox="allow-scripts">` sans `allow-same-origin`.
   - CSP stricte `frame-src 'none'; child-src 'none';` interdisant les iframes imbriquées.
   - Neutralisation des redirections et liens externes (`window.open`, `window.location`, formulaires).
   - Mise à jour automatique de l'aperçu à chaque modification de code.

6. **Affichage Polyvalent (PC & Mobile)** :
   - Bouton de bascule **Éditeur / Aperçu** permettant de passer en plein écran aperçu ou d'afficher le code.
   - Barre de séparation redimensionnable fluide à la souris sur PC (glissement vers la gauche et vers la droite sans blocage).

---

## 📁 Structure du Projet

```
├── index.html        # Nouvelle interface Flat (HTML in URL)
├── style.css         # Styles Flat, thème automatique, Nunito, accent #9000d5
├── js/
│   ├── app.js        # Contrôleur principal, gestion des vues et de la console
│   ├── compress.js   # Moteur de compression Deflate-raw + Base64URL
│   ├── sandbox.js    # Sécurité iframe (CSP, anti-redirection, relais console)
│   └── qrcode.min.js # Bibliothèque autonome de génération QR Code
├── old/              # Ancienne version archivée
│   ├── index.html    # Ancien site (accessible sur /old/index.html)
│   ├── script.js     # Ancien script
│   └── style.css     # Ancien style
├── CNAME             # Configuration du domaine personnalisé html.pinou007.fr
├── 404.html          # Redirection 404 GitHub Pages
└── README.md         # Documentation
```
