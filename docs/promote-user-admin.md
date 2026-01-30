# Comment promouvoir un utilisateur en admin

Il existe plusieurs méthodes pour promouvoir un utilisateur en admin dans cette application :

## 📊 Structure des rôles

L'application utilise 3 rôles :
- `client` : Utilisateur standard (rôle par défaut)
- `admin` : Administrateur avec tous les droits
- `hostess` : Hôtesse avec des droits limités d'administration

## 🔧 Méthodes de promotion

### 1. Via script SQL (Méthode recommandée)

```bash
# 1. Connectez-vous à votre base Supabase
# 2. Exécutez le script SQL fourni dans scripts/promote-user-to-admin.sql
# 3. Remplacez 'email@example.com' par l'email de l'utilisateur
```

### 2. Via script Node.js

```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Exécuter le script
node scripts/promote-admin.js email@example.com
```

### 3. Via l'API (depuis l'interface admin)

```bash
# Endpoint: POST /api/admin/users/[id]/promote
# Body: { "role_name": "admin" }
# Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

## 🛡️ Sécurité

- Seuls les utilisateurs avec le rôle `admin` peuvent promouvoir d'autres utilisateurs
- Toutes les actions de changement de rôle sont loggées
- Les rôles autorisés sont : `admin`, `client`, `hostess`

## 🚀 Premier admin

Pour créer le tout premier admin (bootstrap) :

1. **Méthode SQL directe** (dans Supabase Dashboard) :
```sql
-- Remplacez 'your-email@example.com' par votre email
UPDATE user_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@example.com');
```

2. **Vérification** :
```sql
SELECT 
    p.email,
    p.first_name,
    p.last_name,
    r.name as role
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE p.email = 'your-email@example.com';
```

## 📝 Notes importantes

- Un utilisateur doit d'abord s'inscrire normalement sur l'application
- Le rôle par défaut est `client` (défini dans la fonction `handle_new_user`)
- La promotion conserve toutes les autres données utilisateur
- Le changement de rôle est immédiat

## 🔍 Vérification des rôles

Pour vérifier le rôle actuel d'un utilisateur :

```sql
SELECT 
    p.email,
    r.name as current_role
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE p.email = 'email@example.com';
```

## 🚨 Dépannage

Si la promotion ne fonctionne pas :

1. Vérifiez que l'utilisateur existe dans la table `profiles`
2. Vérifiez que les rôles existent dans la table `roles`
3. Vérifiez les permissions Supabase RLS
4. Consultez les logs de l'application pour les erreurs

## 🔄 Rétrograder un admin

Pour rétrograder un admin en client :

```sql
UPDATE user_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'client')
WHERE user_id = (SELECT id FROM profiles WHERE email = 'admin@example.com');
```
