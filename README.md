# Print-docs

Print-Docs est une extension de navigateur qui enrichit l'outil [Docs](https://docs.numerique.gouv.fr) de [la Suite numérique](https://lasuite.numerique.gouv.fr/) en offrant la possibilité d'appliquer sur les documents la charte graphique de l'organisme qui en est l'auteur.

L'extension utilise le standard Manifest v3 et est compatible avec les navigateurs récents qui le supportent (Chrome, Firefox, Edge, Safari).

## Fonctionnement

### Conversion du code HTML
Une fois déclenchée, l'extension parcourt le document Docs, extrait les balises sémantiques (titres, blocs d'alerte, tableau…), puis les convertit dans leurs équivalents HTML. Elle effectue quelques transformations mineures sur le contenu.

L'extension applique les transformations suivantes.

| Style Docs | Bloc sémantique HTML généré | Commentaires |
| ---------- | --------------------------- | ------------ |
| Bloc de code YAML | Aucun ([lecture des métadonnées](#enregistrement-des-métadonnées)) | |
| Titre 1 | `<h2>` | |
| Titre 2 | `<h3>` | |
| Titre 3 | `<h4>` | |
| Titre 4 | `<h5>` | |
| Titre 5 | `<h6>` | |
| Citation | `<blockquote>` | |
| Liste repliable | `<ul>` | |
| Liste à puces | `<ul>` | |
| Liste numérotée | `<ol>` | |
| Paragraphe | `<p>` | |
| Bloc d'alerte | `<div class="block">` | Si le bloc contient un élément en gras, le premier de ces éléments est reporté comme un paramètre data du bloc : `<div class="block" data-blockname="..."` et peut alors être utilisé dans les modèles pour donner un titre au bloc |
| Table | `<table>` | Si les cellules de la première colonne ou de la première ligne contiennent des éléments en gras, les cellules sont identifiées comme titres de lignes ou de colonnes `<th>` |
| Image | `<img>` | La largeur de l'image, si elle est définie manuellement, est transmise dans le document HTML généré. |


### Enregistrement des métadonnées
Les métadonnées sont lues depuis le document principal et ajoutées en attributs data du `body` du document HTML produit, et peuvent donc être réutilisées par les modèles CSS
```html
<body data-title="Les substances perfluoro-alkylées" data-sender="MIV" data-author="P. Dupont">
```

Pour être reconnues, les métadonnées doivent être écrites dans un bloc de code au format Yaml. Elles sont alors présentées comme dans un fichier YAML classique :
```yaml
author: P. Dupont
date: 24 mars 2026
sender: MIV
```

Le titre est une métadonnée particulière. Celui-ci n'est pas lu depuis le bloc Yaml mais depuis le titre du document lui-même. Après cela il est considéré comme toutes les autres métadonnées, avec le nom "title".

### Création d'un sommaire
Une table des matières incluant les titres de niveau 1 et 2 est produite et insérée en début de document, avec le titre « Sommaire » ; cette table est automatiquement affichée sauf si le modèle prévoit de la désactiver au moyen de `div#toc-chapter {display: none}`.

La table des matières est insérée en début de document HTML résultant, juste après l'[extrait de code HTML provenant du modèle](#insertion-de-code-html).

Elle est insérée par le code suivant, qui peut être configuré en CSS :
```html
<div id="toc-chapter">
	<h2>Sommaire</h2>
	<div id="toc">
		<!-- Ici la table des matières -->
	</div>
</div>
```

Des identifiants sont créés pour chaque titre de niveau 1 et 2 pour rendre la table des matières interactive. Ainsi, en cliquant sur une entrée de la table, le navigateur pointe sur le chapitre correspondant.

### Insertion de code HTML
Un extrait de code HTML paramétré dans le modèle peut être inséré en début du document résultant. Celui-ci peut contenir des variables de métadonnées, qui doivent alors être écrites sous la forme `${meta}`, avec `meta` le nom de la métadonnée correspondante. L'extension substitue la valeur des variables à cet extrait de code.

### Pagination
L'extension s'appuie sur [Paged.js](https://pagedjs.org/) pour transformer le contenu HTML en un contenu paginé. Toutes les fonctionnalités CSS Paged media supportées par Paged.js le sont donc aussi par l'extension.

L'extension produit un « aperçu avant impression » directement dans le navigateur. En utilisant la fonctionnalité "Imprimer" du navigateur, le document peut être imprimé directement ou converti en PDF.

Enfin elle ajoute à la page d'aperçu (en haut à gauche) un sélecteur de modèle qui permet de passer rapidement d'un modèle à un autre sur le même document. La liste déroulante permet de choisir entre tous les modèles pré-paramétrés. L'affichage est rafraîchi automatiquement au changement de modèle.

## Utilisation

L'extension ne fonctionne que lorsqu'un document de l'outil Docs de la Suite numérique est affiché dans l'onglet courant. L'icône de l'extension, si elle est épinglée dans la barre d'outils, change alors de couleur pour montrer que l'extension est prête à traiter le document.

La seule action possible est de cliquer sur l'icône. Le navigateur ouvre un nouvel onglet contenant le document mis en page.

## Paramétrage

Une fenêtre de paramétrage de l'extension permet de configurer les modèles disponibles.

Chaque modèle est nommé et comprend deux fichiers :
- une feuille de style CSS, appliquée aux éléments convertis par l'extension
- un extrait de code HTML, inséré dans le document HTML résultant comme indiqué [ci-dessus](#insertion-de-code-html)

Le nom des modèles correspond exactement aux éléments de la liste déroulante figurant lors de la génération d'un document [paginé](#pagination).

Certains modèles de la liste sont pré-configurés par l'administrateur et ne peuvent pas être supprimés par l'utilisateur. Pour préconfigurer ces modèles, ils doivent figurer dans un fichier `base_templates.json` dans le répertoire de base de l'extension. Le fichier représente un objet JSON dont les clefs sont les noms des modèles disponibles, et les valeurs sont des objets comprenant deux entrées:
- `css` : Code CSS du modèle
- `html` : Code HTML à insérer

Le fichier `base_templates.json` peut être simplement produit grâce au bouton d'export de la fenêtre de paramétrage du modèle. Il suffit alors de configurer les modèles grâce à l'interface puis de les exporter dans le répertoire de l'extension. Ces modèles seront alors automatiquement reconnus lors de la mise à jour de l'extension. La seule différence entre les modèles figurant dans `base_templates.json` et ceux paramétrés par l'utilisateur est que les premiers ne peuvent pas être modifiés ou supprimés via l'interface de configuration de l'extension.
