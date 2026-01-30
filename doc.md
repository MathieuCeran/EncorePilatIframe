# Documentation du projet

Faire un .env avec ces variables :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= // hyper important, permet de faire des requêtes sans RLS
RESEND_API_KEY=
```

Pour les mails on a utilisé Resend mais libre à toi de changer si tu ne veux pas utiliser Resend, juste modifie le code dans le dossier `lib/resend.ts` (20€ par mois aussi pour beaucoup de mails).

Pour héberger le projet on a utilisé Vercel (je vous conseille vraiment de faire de même c'est 20€ par mois).

Pour Supabase vous n'êtes pas obligés de payer les 25 euros mensuels mais je conseille fortement pour avoir les sauvegardes quotidiennes qui sont super utiles .

Pour les images on a utilisé Vercel Storage mais on va couper le projet Vercel donc re-héberge les images ailleurs (n'oublie pas de modifier le `next.config.ts`).

Il manque les autres événements de tracking à part les pages views (j'ai demandé 3 fois qu'on me donne les événements à tracker + les données à envoyer mais on ne m'a jamais répondu).

Si t'as vraiment un gros truc que tu ne comprends pas envoie-moi un message je vais t'aiguiller.

J'ai fait beaucoup de tests, et je n'ai vu aucun bug mais si vous trouvez un bug, je ne suis plus responsable du code donc il faudra vous débrouiller tout seuls.

inserer 3 roles dans la DB :
admin, client, hostess
