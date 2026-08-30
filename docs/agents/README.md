# Agents autonomes TKC Capital OS

Ce registre fournit des agents portables utilisables dans Codex, ChatGPT ou Claude sans appel API depuis l'application.

## Principe de coût

- aucune clé API requise ;
- aucune dépendance supplémentaire ;
- aucune donnée envoyée automatiquement ;
- les API ne seront ajoutées qu'après validation d'un besoin et de son retour mesurable.

## Utilisation

1. Ouvrir `/ia` dans TKC Capital OS.
2. Choisir l'agent adapté à la mission.
3. Copier le prompt complet.
4. Le coller dans une nouvelle conversation Codex, ChatGPT ou Claude.
5. Ajouter uniquement les informations nécessaires et anonymisées.
6. Vérifier les sources et valider humainement toute action sensible.

## Agents disponibles

1. Directeur de cabinet TKC.
2. Pilote des opérations hôtelières.
3. Contrôleur conformité et preuves.
4. Analyste d'opportunités TKC.
5. Product Owner TKC Capital OS.
6. Agent RH et Droit social.

Les définitions et les prompts sont maintenus dans `lib/agents.ts`, qui constitue la source unique du registre.

## Règles pour l'agent RH et Droit social

L'agent ne se présente jamais comme avocat. Chaque analyse doit préciser sa date, le droit applicable et les sources officielles consultées.

Sources prioritaires :

- Code du travail sur Légifrance ;
- convention collective HCR IDCC 1979 sur le Code du travail numérique ;
- ministère du Travail ;
- CNIL pour les données du personnel.

Une validation par un professionnel humain est requise pour les contentieux, licenciements contestés, transactions, harcèlement, discrimination, accidents graves ou dossiers à fort enjeu financier.

## Protection des données

Ne jamais insérer dans un prompt :

- mots de passe ou clés API ;
- coordonnées bancaires ;
- passeports ou titres de séjour complets ;
- diagnostics et détails médicaux ;
- données clients ou salariés sans nécessité démontrée.

Lorsque l'identité n'est pas nécessaire, utiliser un rôle ou un identifiant interne.
