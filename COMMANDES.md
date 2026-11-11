# Commandes de Knull

**230 commandes** réparties en 23 catégories, plus 5 fonctions automatiques.

Tape chaque commande précédée de ton préfixe (par défaut `.`, `,` ou `!`), par exemple `.menu`. Par défaut, les commandes sont **réservées au propriétaire du bot et aux SUDO** (`setsudo`). 🌍 = utilisable par tout le monde · 👥 = uniquement dans un groupe. Pour ouvrir une commande aux autres dans un chat, utilise `zushi`.

## Sommaire

- ⭐ Knull (4)
- 🤖 Gestion du bot (9)
- 🧰 Divers (24)
- 👥 Groupes (30)
- 💬 WhatsApp (17)
- 👤 Profil (7)
- 🔒 Personnel (3)
- ↩️ Réponses automatiques (6)
- 🧠 Intelligence artificielle (7)
- 🔎 Recherche (12)
- ⬇️ Téléchargements (18)
- 🎧 Audio (19)
- 🎬 Vidéo (7)
- 🏷️ Stickers (7)
- 🖼️ Retouche photo (17)
- ✍️ Effets de texte (18)
- 📄 Documents (2)
- ⏰ Planification (3)
- 💰 Budget (5)
- 🎮 Jeux (3)
- ⚙️ Variables de configuration (7)
- 🔑 Permissions (3)
- 🧩 Plugins externes (2)

## ⭐ Knull — 4

| Commande | Description | |
|---|---|---|
| `bonjour` | Répond avec un bonjour. |  |
| `botinfo` | Affiche les informations de Knull. |  |
| `echo` | Répète le texte fourni. |  |
| `heure` | Affiche la date et l’heure actuelles. |  |

## 🤖 Gestion du bot — 9

| Commande | Description | |
|---|---|---|
| `backup` | Gérer les opérations de backup : authentifier, valider ou effectuer un backup. |  |
| `gauth` | Gérez l'authentification de l'API Google pour des fonctionnalités telles que la restriction d'âge YouTube, Google Drive, Calendar et Tasks. |  |
| `gupload` | Opérations Google Drive (upload, liste, suppression). |  |
| `reminder` | Gérer les rappels Google Calendar. |  |
| `task` | Gérer vos tâches Google Tasks |  |
| `tog` | Activer ou désactiver une commande du bot. |  |
| `update` | Vérifier les nouvelles mises à jour. Affiche les mises à jour disponibles ou confirme que le bot est à jour. |  |
| `update now` | Mettre à jour le bot vers la dernière version. |  |
| `ytlogin` | Lie un compte YouTube pour que .song / .video puissent télécharger (connexion par code d'appareil). Utilise `.ytlogin`, `.ytlogin status` ou `.ytlogin logout`. |  |

## 🧰 Divers — 24

| Commande | Description | |
|---|---|---|
| `afk` | Définir le statut AFK (Absent du clavier) |  |
| `alive` | Afficher le message de statut de vie du bot avec un texte personnalisé optionnel. |  |
| `avm` | Fusionner des fichiers audio et vidéo en un seul. |  |
| `calc` | calculator |  |
| `delcmd` | pour supprimer cmd |  |
| `fancy` | Créer un texte stylisé à partir du texte donné |  |
| `forward` | Transférer le message répondu à des JID(s) spécifiés |  |
| `getcmd` | pour obtenir cmd |  |
| `help` | — |  |
| `list` | — |  |
| `lydia` | to on off chat bot |  |
| `mention` | Configurer et gérer la fonctionnalité de mention pour des réponses automatisées. |  |
| `menu` | — |  |
| `mforward` | forward replied msg |  |
| `news` | malayalam news |  |
| `ping` | Vérifier le temps de réponse du bot (latence). |  |
| `qr` | Générer un code QR à partir du texte fourni ou décoder un code QR à partir d'une image répondue. |  |
| `reboot` | Redémarrer l'instance du bot en utilisant PM2. |  |
| `rmbg` | Supprime l'arrière-plan de l'image répondue en utilisant l'API remove.bg |  |
| `save` | Transférer le message répondu à vous-même |  |
| `setcmd` | pour définir cmd |  |
| `tts` | text to speach |  |
| `url` | Convertir une image ou une vidéo en URL. Spécifiez éventuellement un paramètre (par ex., 'imgur') pour obtenir l'URL à partir d'un service spécifique. |  |
| `whois` | Affiche la photo de profil et des informations supplémentaires (par ex., à propos, statut) d'un utilisateur ou d'un groupe. |  |

## 👥 Groupes — 30

| Commande | Description | |
|---|---|---|
| `add` | Ajouter un membre aux groupes | 👥 |
| `amute` | Programmer une mise en sourdine automatique du groupe à une heure spécifiée avec un message personnalisé optionnel. | 👥 |
| `antifake` | Activer ou configurer le numéro anti-faux | 👥 |
| `antigm` | Gérer les paramètres anti-mention de groupe 🛡️ |  |
| `antigstatus` | Gérer les paramètres anti-statut de groupe 🛡️ |  |
| `antilink` | Activer ou configurer l'anti-lien | 👥 |
| `antispam` | Manage antispam protection with configurable levels | 👥 |
| `antiword` | Filtrer des mots spécifiques dans le chat de groupe | 👥 |
| `aunmute` | Programmer une réactivation automatique du groupe à une heure spécifiée avec un message personnalisé optionnel. | 👥 |
| `common` | Afficher ou expulser les membres communs dans deux groupes ou plus | 👥 |
| `demote` | Retirer le rôle d'administrateur | 👥 |
| `ginfo` | Afficher les informations du lien d'invitation du groupe |  |
| `goodbye` | Envoyer un message d'au revoir aux membres | 👥 |
| `gpp` | Changer l'icône du groupe | 👥 |
| `gstatus` | Update group status (reply to image, video, or text) |  |
| `inactive` | Identifier ou supprimer les membres inactifs en fonction du nombre de messages ou de la durée d'inactivité. Ajoutez 'kick' pour supprimer les membres. | 👥 |
| `invite` | Obtenir un lien d'invitation de groupe | 👥 |
| `join` | Rejoindre des groupes avec un lien d'invitation |  |
| `kick` | Retirer des membres du groupe. | 👥 |
| `msgs` | Afficher le nombre de messages du groupe pour chaque membre, y compris les totaux individuels et la durée depuis la dernière vue. | 👥 |
| `mute` | Rendre les groupes réservés aux administrateurs uniquement | 👥 |
| `pdm` | Activer ou désactiver les notifications automatiques pour les événements de promotion/rétrogradation dans le groupe. | 👥 |
| `promote` | Donner un rôle d'administrateur | 👥 |
| `reset` | Réinitialiser le compteur de messages pour l'ensemble du groupe ou un membre spécifique. | 👥 |
| `revoke` | Révoquer le lien d'invitation du groupe | 👥 |
| `tag` | Mentionner les membres du groupe selon votre choix. Utilisez 'all' pour mentionner tous les membres, 'admin' pour mentionner uniquement les administrateurs du groupe, 'notadmin' pour mentionner les membres non-administrateurs, ou fournissez un message personnalisé à envoyer avec les mentions. | 👥 |
| `unmute` | Permettre à tous les participants d'envoyer des messages dans le groupe | 👥 |
| `vote` | Lancer un vote dans un groupe WhatsApp. |  |
| `warn` | Avertir un utilisateur dans le chat de groupe. Cette commande augmente le compteur d'avertissements d'un utilisateur. Si le compteur dépasse la limite, l'utilisateur sera expulsé du groupe. Utilisez 'warn reset' pour effacer les avertissements d'un utilisateur. | 👥 |
| `welcome` | Envoyer un message de bienvenue aux nouveaux membres | 👥 |

## 💬 WhatsApp — 17

| Commande | Description | |
|---|---|---|
| `antiedit` | Anti-edit : suit les messages modifiés et affiche leur historique |  |
| `call` | Rejeter automatiquement les appels entrants. |  |
| `caption` | copy or add caption to video or image |  |
| `cinfo` | Obtenir les infos du canal |  |
| `clear` | delete whatsapp chat |  |
| `creact` | Réagir à une chaîne |  |
| `delete` | Anti-suppression : Récupérer les messages supprimés |  |
| `dlt` | Supprimer les messages auxquels on répond |  |
| `doc` | media to doc msg |  |
| `online` | Maintenir le statut de votre compte toujours en ligne. |  |
| `poll` | Crée un sondage avec plusieurs options. |  |
| `react` | Réagir à un message |  |
| `read` | Lecture automatique des messages entrants : tout, privées uniquement (p), groupes uniquement (g), JIDs spécifiques, ou tout sauf les JIDs ignorés. |  |
| `scstatus` | Programmer un statut WhatsApp à envoyer à une heure spécifiée. Utilisez 'contact' pour les contacts importés ou fournissez des JIDs spécifiques. |  |
| `setstatus` | Définir un statut WhatsApp pour des contacts spécifiques ou pour des contacts importés. Répondez à un message (texte, image ou vidéo) pour définir le statut. |  |
| `status` | Gérer automatiquement la visualisation des statuts WhatsApp. |  |
| `vv` | antiViewOnce |  |

## 👤 Profil — 7

| Commande | Description | |
|---|---|---|
| `block` | Bloque l'utilisateur spécifié. |  |
| `fullpp` | Définir une photo de profil en taille réelle. |  |
| `gjid` | Liste tous les JIDs des groupes avec leurs noms de groupe. |  |
| `jid` | Retourne le JID d'un utilisateur ou d'un chat. Vérifie s'il y a un utilisateur mentionné, un message en réponse, ou utilise par défaut le JID du chat actuel. |  |
| `left` | — | 👥 |
| `pp` | Met à jour votre photo de profil en utilisant l'image du message répondu. |  |
| `unblock` | Débloque l'utilisateur spécifié. |  |

## 🔒 Personnel — 3

| Commande | Description | |
|---|---|---|
| `delgreet` | Supprimer le message de salutation personnalisé |  |
| `getgreet` | Récupérer le message de salutation personnalisé |  |
| `setgreet` | Définir un message de salutation personnalisé |  |

## ↩️ Réponses automatiques — 6

| Commande | Description | |
|---|---|---|
| `filter` | Gérer les filtres dans les groupes | 👥 |
| `gfilter` | Gérer les filtres globaux dans les groupes |  |
| `gstop` | Supprimer les gfiltres dans tous les groupes |  |
| `pfilter` | Gérer les filtres globaux dans les chats personnels |  |
| `pstop` | Supprimer les pfiltres dans tous les groupes |  |
| `stop` | Supprimer les filtres dans le chat | 👥 |

## 🧠 Intelligence artificielle — 7

| Commande | Description | |
|---|---|---|
| `bing` | bing ai |  |
| `dall` | dall image generator |  |
| `gemini` | Google Gemini AI - Posez n'importe quelle question ! |  |
| `gpt` | ChatGPT fun |  |
| `groq` | Interagir avec GROQ AI |  |
| `or` | Interagir avec OpenRouter AI (modèles gratuits) |  |
| `upscale` | improve image quality |  |

## 🔎 Recherche — 12

| Commande | Description | |
|---|---|---|
| `emix` | mix emojis |  |
| `emoji` | emojis |  |
| `find` | Find the Song |  |
| `ig` | Insta Profile Search |  |
| `img` | Recherche d'images Pinterest |  |
| `ison` | Vérifier si un numéro de téléphone est enregistré sur WhatsApp. |  |
| `jean` | simple google search |  |
| `movie` | Récupérer des informations détaillées sur un film, y compris l'intrigue complète, depuis l'API OMDB. |  |
| `time` | find time by timeZone or name or shortcode |  |
| `trt` | Traduire un texte en utilisant Google Translate. Spécifiez le code de la langue cible (et éventuellement le code de la langue source) en répondant à un message. |  |
| `weather` | weather info |  |
| `yts` | Search for YouTube videos by query or URL. If a valid YouTube URL is provided, detailed information for the first video is returned. |  |

## ⬇️ Téléchargements — 18

| Commande | Description | |
|---|---|---|
| `apk` | Télécharger un APK depuis APKMirror |  |
| `fb` | Télécharger une vidéo Facebook |  |
| `fullss` | Take web page screenshot |  |
| `insta` | Télécharger des publications, reels et vidéos Instagram. |  |
| `mediafire` | Download mediafire file |  |
| `pinterest` | Télécharger des vidéos ou images Pinterest. |  |
| `play` | Download youtube audio |  |
| `reddit` | Télécharge une vidéo à partir de la publication Reddit spécifiée en utilisant l'URL fournie. |  |
| `song` | Télécharger une chanson depuis YouTube. Si une URL est fournie, la chanson est téléchargée directement ; sinon, une recherche est effectuée et une liste de résultats est générée pour la sélection. |  |
| `spotify` | Télécharge tes morceaux ou playlists préférés 🎧 |  |
| `ss` | Take web page screenshot |  |
| `story` | Télécharger les stories Instagram pour le nom d'utilisateur spécifié. Si plusieurs stories sont disponibles, une liste sera fournie pour la sélection. |  |
| `tiktok` | Télécharger une vidéo TikTok à partir de l'URL fournie. |  |
| `twitter` | Télécharger une vidéo Twitter. Si plusieurs options de qualité sont disponibles, vous serez invité à en choisir une. |  |
| `upload` | Télécharger des médias à partir d'une URL fournie. Pour les URL raccourcies de Google Images, l'URL directe de l'image est récupérée automatiquement. |  |
| `video` | Télécharger une vidéo YouTube. Si une URL directe est fournie, la vidéo est téléchargée ; si une requête de recherche est fournie, une liste de résultats est générée pour la sélection. |  |
| `yta` | Download YouTube audio |  |
| `ytv` | Download YouTube video |  |

## 🎧 Audio — 19

| Commande | Description | |
|---|---|---|
| `avec` | Convertir un clip audio en vidéo. |  |
| `bass` | Modifier les niveaux de basses d'un fichier audio. |  |
| `black` | Convertir un clip audio en une vidéo avec un fond noir. |  |
| `blown` | audio mod |  |
| `cut` | Couper un segment d'un fichier audio ou vidéo. |  |
| `deep` | audio mod |  |
| `earrape` | audio mod |  |
| `fast` | audio mod |  |
| `fat` | audio mod |  |
| `histo` | Convertir l'audio en une vidéo d'histogramme visuel. |  |
| `low` | Modifier la hauteur de l'audio vers une tonalité plus basse. |  |
| `nightcore` | audio mod |  |
| `pitch` | Ajuster la hauteur d'un fichier audio. |  |
| `robot` | audio mod |  |
| `slow` | audio mod |  |
| `smooth` | audio mod |  |
| `treble` | Modifier les niveaux d'aigus d'un fichier audio. |  |
| `tupai` | audio mod |  |
| `vector` | Convertir l'audio en une vidéo de visualisation vectorielle. |  |

## 🎬 Vidéo — 7

| Commande | Description | |
|---|---|---|
| `compress` | Compresser un fichier vidéo pour réduire sa taille. |  |
| `crop` | Recadrer une vidéo aux dimensions spécifiées. |  |
| `merge` | Fusionner plusieurs vidéos en une seule. |  |
| `mp3` | Convertir une vidéo en audio ou un clip audio en note vocale. |  |
| `reverse` | Inverser la lecture d'une vidéo ou d'un clip audio. |  |
| `rotate` | Faire pivoter une vidéo vers la droite, la gauche ou la retourner. |  |
| `trim` | Rogner une vidéo entre les temps de début et de durée spécifiés. |  |

## 🏷️ Stickers — 7

| Commande | Description | |
|---|---|---|
| `circle` | Convertir une image en autocollant circulaire. |  |
| `exif` | Extraire les métadonnées Exif d'un sticker |  |
| `mp4` | Convertir un autocollant animé (WebP) en vidéo MP4. |  |
| `photo` | Convertir un autocollant en image. |  |
| `sticker` | Convertir une image ou une vidéo en autocollant. Répondez à un message image ou vidéo pour générer un autocollant. |  |
| `take` | Modifier le pack d'autocollants en mettant à jour ses métadonnées. Si vous répondez à un autocollant, mettez à jour ses métadonnées de pack. Si vous répondez à un audio, ajoutez des métadonnées (titre, artistes, URL) au fichier. |  |
| `tg` | download telegram sticker |  |

## 🖼️ Retouche photo — 17

| Commande | Description | |
|---|---|---|
| `bloody` | bloody Look Photo editor. |  |
| `bokeh` | bokeh Photo editor. |  |
| `cartoon` | Dramatic Look Photo editor. |  |
| `color` | color Photo editor. |  |
| `dark` | Dramatic Look Photo editor. |  |
| `demon` | demon Look Photo editor. |  |
| `enhance` | horned Look Photo editor. |  |
| `gandm` | Dramatic Look Photo editor. |  |
| `horned` | horned Look Photo editor. |  |
| `kiss` | kiss Photo editor. |  |
| `look` | Dramatic Look Photo editor. |  |
| `makeup` | Dramatic Look Photo editor. |  |
| `pencil` | pencil Photo editor. |  |
| `sketch` | Sketch Photo editor. |  |
| `skull` | Skull Photo editor. |  |
| `wanted` | Wanted Photo editor. |  |
| `zombie` | zombie Look Photo editor. |  |

## ✍️ Effets de texte — 18

| Commande | Description | |
|---|---|---|
| `3d` | Cat text effect |  |
| `angel` | text effect |  |
| `avenger` | text effect |  |
| `blub` | text effect |  |
| `bpink` | Cat text effect |  |
| `cat` | Cat text effect |  |
| `cloud` | text effect |  |
| `glitch` | text effect |  |
| `glitter` | text effect |  |
| `graffiti` | text effect |  |
| `hacker` | Hacker text effect |  |
| `light` | text effect |  |
| `marvel` | text effect |  |
| `neon` | text effect |  |
| `sci` | text effect |  |
| `sign` | text effect |  |
| `tattoo` | text effect |  |
| `watercolor` | Cat text effect |  |

## 📄 Documents — 2

| Commande | Description | |
|---|---|---|
| `page` | Ajouter une image en tant que page à un document PDF. |  |
| `pdf` | Convertir des images en un document PDF. |  |

## ⏰ Planification — 3

| Commande | Description | |
|---|---|---|
| `delschedule` | Supprimer un message programmé en spécifiant le JID cible et l'heure, ou supprimer tous les messages programmés. |  |
| `getschedule` | Récupérer tous les messages programmés pour le chat spécifié. |  |
| `setschedule` | Programmer un message à envoyer automatiquement à une heure spécifiée. Fournissez le(s) JID(s) cible(s) et l'heure (au format minutes-heure-jour-mois ; jour et mois sont optionnels). Répondez au message que vous souhaitez programmer. |  |

## 💰 Budget — 5

| Commande | Description | |
|---|---|---|
| `budget` | Entrée budget par IA - décrivez simplement votre transaction |  |
| `delbudget` | pour supprimer revenu \| dépense |  |
| `expense` | pour définir la dépense |  |
| `income` | pour définir le revenu |  |
| `summary` | pour obtenir le résumé du budget |  |

## 🎮 Jeux — 3

| Commande | Description | |
|---|---|---|
| `tictactoe` | Jouer à un jeu de morpion contre un adversaire. Défiez un utilisateur en le mentionnant, en répondant à son message ou en spécifiant son JID. Utilisez 'tictactoe end' pour terminer le jeu et 'tictactoe restart <jid_opposant>' pour recommencer avec un nouvel adversaire. Le mode par défaut est infini, utilisez 'tictactoe normal' pour le mode normal. |  |
| `wcg` | Jeu de chaîne de mots : Participez en fournissant un mot qui continue la chaîne. Utilisez 'wcg start' pour forcer le démarrage d'un nouveau jeu ou 'wcg end' pour arrêter le jeu actuel. |  |
| `wrg` | Jeu de mots aléatoires : participez à un jeu où vous soumettez des mots en réponse à une invite aléatoire. Utilisez 'wrg start' pour commencer un nouveau jeu ou 'wrg end' pour terminer le jeu. |  |

## ⚙️ Variables de configuration — 7

| Commande | Description | |
|---|---|---|
| `allvar` | Afficher toutes les variables stockées dans l'ordre trié. |  |
| `delsudo` | remove replied or mentioned or given num to sudo |  |
| `delvar` | Supprimer une variable en spécifiant sa clé. |  |
| `getsudo` | show sudos |  |
| `getvar` | Afficher la valeur d'une variable. Fournissez la clé de la variable (insensible à la casse) pour récupérer sa valeur. |  |
| `setsudo` | add replied or mentioned or given num to sudo |  |
| `setvar` | Définir une variable avec une clé et une valeur spécifiques. Utilisez '=' pour séparer la clé de la valeur. |  |

## 🔑 Permissions — 3

| Commande | Description | |
|---|---|---|
| `ope` | Supprime ou désactive les commandes autorisées spécifiées. |  |
| `yami` | Affiche la liste des commandes actuellement autorisées dans ce chat. |  |
| `zushi` | Permet d'activer des commandes spécifiques pour une utilisation par d'autres dans le chat. |  |

## 🧩 Plugins externes — 2

| Commande | Description | |
|---|---|---|
| `plugin` | Installer des plugins externes en fournissant une URL Gist contenant le code du plugin, ou lister tous les plugins installés. |  |
| `remove` | Supprimer des plugins externes en spécifiant le nom du plugin ou supprimer tous les plugins installés. |  |

## ⚡ Fonctions automatiques — 5

Elles réagissent toutes seules aux messages, sans commande.

| Déclencheur | Rôle | Fichier |
|---|---|---|
| text | filterOrLydia | `plugins/filters.js` |
| text | lydia | `plugins/filters.js` |
| text | gfilter | `plugins/gfilters.js` |
| text | pfilter | `plugins/gfilters.js` |
| text | vote | `plugins/vote.js` |
