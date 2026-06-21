# MusicSimple — version Vercel + GitHub + comptes

MusicSimple est une version hébergeable du lecteur musical, pensée pour être déployée sur **Vercel** depuis **GitHub**.

## Fonctionnalités

- Interface MusicSimple responsive PC/mobile
- Création de compte / connexion avec Supabase Auth
- Sauvegarde de playlists dans le compte utilisateur
- Ajout de musiques dans les playlists
- Bibliothèque utilisateur
- File d'attente locale
- Recherche de musiques via YouTube Data API
- Player intégré YouTube
- Fallback demo si la clé YouTube n'est pas encore configurée

> Note importante : pour une app publique, l'utilisation de YouTube doit respecter les conditions d'utilisation de YouTube. Cette version utilise l'embed officiel YouTube plutôt que de télécharger/streamer directement les fichiers audio.

---

## 1. Créer le projet Supabase

1. Va sur https://supabase.com
2. Crée un nouveau projet.
3. Ouvre **SQL Editor**.
4. Copie/colle le contenu de :

```txt
supabase/schema.sql
```

5. Exécute le SQL.

Cela crée les tables :

- `playlists`
- `playlist_tracks`
- `favorites`
- `recently_played`

avec les règles RLS pour que chaque utilisateur ne voie que ses données.

---

## 2. Variables d'environnement

Crée un fichier `.env.local` en local :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
YOUTUBE_API_KEY=ta_cle_youtube_data_api
```

Sur Vercel, mets les mêmes variables dans :

```txt
Project Settings -> Environment Variables
```

### Où trouver les clés Supabase

Dans Supabase :

```txt
Project Settings -> API
```

Tu prends :

- Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
- anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Clé YouTube Data API

Dans Google Cloud :

1. Crée un projet Google Cloud.
2. Active **YouTube Data API v3**.
3. Crée une API key.
4. Mets-la dans `YOUTUBE_API_KEY`.

Sans cette clé, l'app marche avec des morceaux de démo.

---

## 3. Lancer en local

```bash
npm install
npm run dev
```

Puis ouvre :

```txt
http://localhost:3000
```

---

## 4. Mettre sur GitHub

Dans le dossier du projet :

```bash
git init
git add .
git commit -m "Initial MusicSimple Vercel app"
git branch -M main
git remote add origin https://github.com/TON_COMPTE/musicsimple.git
git push -u origin main
```

---

## 5. Déployer sur Vercel

1. Va sur https://vercel.com
2. Clique **Add New Project**
3. Importe le repo GitHub `musicsimple`
4. Ajoute les variables d'environnement
5. Clique **Deploy**

À chaque push GitHub, Vercel redéploie automatiquement.

---

## 6. Roadmap possible

Après cette base, on peut ajouter :

- playlists publiques/privées
- modification du nom des playlists
- suppression d'un titre dans une playlist
- drag & drop sauvegardé en base
- favoris façon Spotify
- historique d'écoute
- page profil
- abonnement / Stripe
- recherche avancée albums/artistes
- mode PWA installable mobile
