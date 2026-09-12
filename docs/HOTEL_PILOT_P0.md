# Piloto Hôtel — P0 passations suivies

## Objectif

Le pilote ibis Nogent centralise dans le module `/hotel` les consignes entre
services. Une consigne non clôturée reste visible au changement d'équipe. La
lecture est nominative et horodatée. Il ne s'agit pas d'une nouvelle
application.

## Périmètre livré

- création d'une passation par service émetteur et service destinataire ;
- priorité normale, urgente ou bloquante ;
- statuts ouvert, en cours, bloqué et terminé ;
- chambre ou zone facultative ;
- équipe matin, soir, nuit ou autre ;
- accusés de lecture nominatifs et horodatés ;
- report automatique tant que le statut n'est pas `done` ;
- contrôle d'accès Supabase par service et accès complet pour la direction ;
- champ `property_code` présent dès le pilote pour préparer le multihôtel.

Le planning et le pointage ne sont pas modifiés : Silae reste la source de
référence RH.

## Ordre d'activation

1. Réactiver le projet Supabase et vérifier qu'une sauvegarde récente existe.
2. Appliquer `supabase/migrations/20260912100557_add_tracked_handovers.sql`.
3. Vérifier les politiques RLS avec un compte direction, deux services
   différents et un compte opérateur chambre.
4. Déployer le code applicatif.
5. Faire un essai contrôlé sur une relève réelle à l'ibis Nogent.

Le code accepte temporairement l'absence des nouvelles tables : la page Hôtel
continue de fonctionner et affiche une liste de passations vide. La migration
doit néanmoins être appliquée avant d'ouvrir la fonction aux équipes.

## Tests d'acceptation

| Profil | Scénario | Résultat attendu |
|---|---|---|
| Direction | Crée une consigne Réception → Technique | Consigne visible dans les deux services |
| Technique | Confirme la lecture | Nom et heure apparaissent sans doublon |
| Technique | Passe la consigne « en cours » puis « terminé » | Statut et date de clôture sont enregistrés |
| Réception | Laisse une consigne ouverte au changement d'équipe | Elle reste dans les éléments ouverts |
| Service non destinataire | Consulte les passations | La consigne n'est pas accessible |
| Opérateur chambre | Tente de créer une passation | Création indisponible |
| Tous profils autorisés | Utilisent mobile et ordinateur | Formulaire et cartes restent lisibles |

## Retour arrière

Le déploiement applicatif peut être annulé sans supprimer les données : les
tables ajoutées restent isolées du reste du module. Ne supprimer les tables
qu'après export des passations et validation écrite de la direction.
