# Security Toolbox

Une plateforme moderne d'analyse de sécurité centralisée dans une image Docker unique. Cette toolbox permet d'effectuer différents types d'analyses de sécurité et de gérer les rapports de manière intuitive via une interface web.

## Fonctionnalités

- Interface web moderne et intuitive
- Différents types d'analyses de sécurité :
  - Scan réseau
  - Analyse de trafic
  - Tests de vulnérabilité
- Affichage en temps réel des résultats
- Export des rapports (PDF, JSON, CSV)
- Gestion des utilisateurs et des droits d'accès
- Base de données pour le stockage des résultats
- Interface responsive et moderne

## Prérequis

- Docker
- Docker Compose
- Git

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/security-toolbox.git
cd security-toolbox
```

2. Créez un fichier `.env` à la racine du projet :
```bash
SECRET_KEY=votre-clé-secrète
DATABASE_URL=postgresql://postgres:postgres@db:5432/security_toolbox
```

3. Lancez l'application avec Docker Compose :
```bash
docker-compose up --build
```

L'application sera accessible aux adresses suivantes :
- Frontend : http://localhost:3000
- API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

## Utilisation

1. Accédez à l'interface web via http://localhost:3000
2. Connectez-vous avec les identifiants par défaut :
   - Username : admin
   - Password : admin
3. Changez le mot de passe par défaut dans les paramètres du profil

## Structure du Projet

```
security-toolbox/
├── app/                    # Backend FastAPI
│   ├── main.py            # Point d'entrée de l'API
│   ├── models.py          # Modèles de base de données
│   ├── schemas.py         # Schémas Pydantic
│   ├── crud.py            # Opérations CRUD
│   └── security.py        # Gestion de l'authentification
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   └── contexts/      # Contextes React
│   └── public/           # Fichiers statiques
├── docker-compose.yml    # Configuration Docker
├── Dockerfile           # Configuration de l'image Docker
└── requirements.txt     # Dépendances Python
```

## Sécurité

- Toutes les communications sont chiffrées
- Authentification JWT
- Gestion des rôles utilisateurs (RBAC)
- Protection contre les injections SQL
- Validation des entrées utilisateur

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 