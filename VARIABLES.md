# Variables de Knull

Deux façons de régler une variable :

1. **Dans `config.env`** (au démarrage) : `NOM="valeur"`, une par ligne.
2. **Par commande** (à chaud, sans redémarrer) — stockée en base, prioritaire sur `config.env` :
   - `.setvar NOM:valeur` — définir une variable
   - `.getvar NOM` — voir sa valeur
   - `.delvar NOM` — la supprimer
   - `.allvar` — lister toutes les variables définies

Les valeurs `true`/`false` sont du texte. Les listes de numéros/jids sont séparées par des virgules.

---

## 🔑 Essentielles
| Variable | Rôle | Défaut |
|---|---|---|
| `SESSION_ID` | Identifiant de session WhatsApp (créé par Nexora). Vide = scan QR | *(vide)* |
| `SESSION_URL` | Serveur d'où télécharger la session (inutile avec un ID Nexora court/long) | `https://api.levanter.site/json/` |
| `SESSION_NAME` | Nom affiché de la session (logs, menu) | *(= l'ID)* |
| `SUDO` | Numéros admin en plus de toi, séparés par virgule | *(vide)* |
| `PREFIX` | Préfixe des commandes | `^[.,!]` (`.` `,` `!`) |
| `BOT_LANG` | Langue du bot (`en` ou `fr`) | `en` |
| `LANGUAG` | Ancienne variable de langue | `en` |

## 👀 Statut (vues automatiques)
| Variable | Rôle | Défaut |
|---|---|---|
| `AUTO_STATUS_VIEW` | Voir auto les statuts (voir les sous-modes ci-dessous) | `false` |
| `STATUS_VIEW_EMOJI` | Réagir aux statuts avec un emoji. Plusieurs séparés par virgule = tiré au hasard. Ex. `❤️,🔥,😎` | *(aucun)* |
| `STATUS_VIEW_MSG` | Envoyer un message à l'auteur du statut (environ 1 fois sur 2) | *(aucun)* |
| `STATUS_FORWARD_JID` | Transférer les statuts vus vers ce chat/groupe (jid) | *(aucun)* |

**Sous-modes de `AUTO_STATUS_VIEW`** (combinables avec des virgules) :
- `true` ou `all` : voir tous les statuts
- `no-dl` : voir sans télécharger le média
- `hide-view` : voir sans marquer « vu » (discret)
- `&delay` : ajoute un délai aléatoire avant de voir
- `only-view` + numéros : voir **uniquement** ces numéros — ex. `only-view,2250500000000`
- `except-view` + numéros : voir **tous sauf** ces numéros

## ⚙️ Comportement
| Variable | Rôle | Défaut |
|---|---|---|
| `ALWAYS_ONLINE` | Toujours affiché en ligne | *(non défini)* |
| `SEND_READ` | Marquer les messages comme lus | *(non défini)* |
| `REJECT_CALL` | Rejeter les appels entrants | *(non défini)* |
| `AJOIN` | Rejoindre les groupes sur invitation | `false` |
| `CMD_REACTION` | Réaction emoji sur les commandes | `true` |
| `DISABLE_START_MESSAGE` | Ne pas envoyer le message de démarrage | `false` |
| `DISABLE_BOT` | Désactiver le bot dans certains chats (jids) | `null` |
| `PERSONAL_MESSAGE` | Réponse automatique personnelle | `null` |
| `MENTION` | Message/média sur mention | *(vide)* |
| `APPROVE` | Approbation des demandes d'ajout | *(vide)* |
| `WHITE_LIST` | Liste blanche (jids autorisés) | *(vide)* |
| `STICKER_PACKNAME` | Nom du pack de stickers | `❤️,Knull` |
| `MAX_UPLOAD` | Taille max d'envoi (Mo) | `230` |
| `TIMEZONE` (ou `TZ`) | Fuseau horaire | *(non défini)* |
| `VPS` | `true` si sur un VPS (mises à jour) | `false` |
| `AUTO_UPDATE` | **Forcé à `false`** (mises à jour via `.update now`) | `false` |

## 🛡️ Modération / groupes
| Variable | Rôle | Défaut |
|---|---|---|
| `WARN_LIMIT` | Avertissements avant sanction | `3` |
| `WARN_MESSAGE` / `WARN_RESET_MESSAGE` / `WARN_KICK_MESSAGE` | Textes des avertissements | *(textes par défaut)* |
| `ANTILINK_MSG` / `ANTISPAM_MSG` / `ANTIWORDS_MSG` | Messages anti-lien / anti-spam / anti-mots | *(textes par défaut)* |
| `ANTIWORDS` | Mots interdits | `word` |
| `ANTI_BOT` / `ANTI_BOT_MESSAGE` | Expulser les autres bots | `off` |
| `IGNORE_WEB` | Avec `ANTI_BOT` : traiter WhatsApp Web comme un bot | *(non défini)* |
| `ANTI_DELETE` | Anti-suppression de messages | `null` |
| `ANTI_EDIT` | Détecter les messages modifiés | `null` |
| `DELETE_TYPE` / `LIST_TYPE` | Format de suppression / des listes | `` / `text` |
| `GROUP_ADMINS` | Gestion des admins de groupe | *(vide)* |

## 🤖 IA / chatbots
| Variable | Rôle | Défaut |
|---|---|---|
| `GPT` / `MODEL` | Mode et modèle GPT | `free` / `gpt-3.5-turbo` |
| `GROQ_API_KEY` / `GROQ_MODEL` / `GROQ_SYSTEM_MSG` | Groq : clé, modèle, message système | *(vide)* / `openai/gpt-oss-120b` / *(vide)* |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini : clé et modèle | *(vide)* / `gemini-3.6-flash` |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` / `OPENROUTER_SYSTEM_MSG` | OpenRouter : clé, modèle, message système | *(vide)* / `openai/gpt-oss-20b:free` / *(vide)* |
| `BRAINSHOP` | Clé du chatbot BrainShop | *(clé par défaut)* |

## 🌐 Services externes
| Variable | Rôle | Défaut |
|---|---|---|
| `RMBG_KEY` | Clé remove.bg (enlever le fond) | `null` |
| `BING_COOKIE` | Cookie Bing (images) | *(vide)* |
| `YT_COOKIE` | Cookie YouTube | *(non défini)* |
| `TRUECALLER` | Clé Truecaller | *(non défini)* |

## 🔌 Mode API
| Variable | Rôle | Défaut |
|---|---|---|
| `API_MODE` | `false` / `true` / `only` | `false` |
| `API_KEY` | Clé obligatoire pour l'API | *(vide)* |
| `API_PUBLIC_URL` | URL publique (liens média) | *(vide)* |
| `API_WEBHOOK_URL` | Webhook des messages entrants | *(vide)* |
| `PORT` | Port de l'API | `3000` |

## ☁️ Hébergement / base de données
| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | Base PostgreSQL (sinon SQLite local) | *(SQLite local)* |
| `HEROKU_APP_NAME` / `HEROKU_API_KEY` | Redémarrage/MàJ Heroku | *(non défini)* |
| `KOYEB` / `KOYEB_NAME` / `KOYEB_API` | Redémarrage/MàJ Koyeb | *(vide)* |
| `RENDER_NAME` / `RENDER_API_KEY` | Redémarrage/MàJ Render | *(vide)* |

## 🔧 Technique / avancé
| Variable | Rôle | Défaut |
|---|---|---|
| `LOG_MSG` | Journaliser les messages | `false` |
| `BAILEYS_LOG_LVL` | Niveau de log Baileys | `silent` |
| `FORCE_LOGOUT` | Forcer la déconnexion | `false` |
| `BACKUP_FOLDER` | Dossier de sauvegarde | *(non défini)* |
| `NO_PLUGINS` | Ne pas charger les plugins externes | *(non défini)* |
| `SUBS` | Active une fonction liée à un groupe précis | *(non défini)* |

## ⛔ Internes / debug (à ne pas toucher en principe)
`HEROKU_TEST`, `LEVANTER_TEST`, `DEBUG_EVENT`, `DEBUG_RESTART`, `EMIT_OWN_EVENT`, `TEST_MSG`,
`RESTART_CMD`, `STOP_CMD`, `NODE_TLS_REJECT_UNAUTHORIZED`, `PASSWORD`, `PASSWORD_U`,
`AMENU_CACHE_SIZE`, `AMENU_CACHE_TTL`, `NR_CACHE_SIZE`, `NR_CACHE_TTL`,
`XMESSAGE`, `XMESSAGE_TOJID`, `VV`, `L`, `WEB`, `NEXORA_STORE`,
`RENDER_EXTERNAL_URL`, `KOYEB_PUBLIC_DOMAIN`, `KOYEB_SERVICE_NAME`.
