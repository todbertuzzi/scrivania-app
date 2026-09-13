# Scrivania App

Applicazione React della Scrivania collaborativa integrata nel plugin WordPress `scrivania-collaborativa-api`.

## Comandi

```bash
npm run dev:local       # sviluppo locale
npm run validate:decks # verifica catalogo e immagini dei mazzi
npm run lint            # controllo statico
npm run build           # validazione catalogo + build di produzione
npm run build:wp        # build + sincronizzazione nel plugin WordPress
```

`build:wp` aggiorna nel plugin:

- il bundle JavaScript e il CSS;
- gli asset statici, eliminando prima gli artefatti generati obsoleti;
- `config/decks.json`, usato dal backend WordPress e dalla dashboard.

Il deploy ignora automaticamente i file `.DS_Store` e si interrompe prima di modificare il plugin se il catalogo o un'immagine risultano incompleti.

## Catalogo dei mazzi

La sorgente unica è [`src/data/decks.json`](src/data/decks.json). React legge direttamente questo file; WordPress usa la copia generata dal comando `build:wp`.

Per aggiungere un mazzo:

1. creare `public/assets/mazzo_ID/`;
2. aggiungere il fronte, l'anteprima e la cartella `cards`;
3. nominare le carte con una sequenza coerente, per esempio `nuovo_mazzo_1.jpg`, `nuovo_mazzo_2.jpg`, ecc.;
4. aggiungere una voce a `decks.json` con un ID intero univoco, `cardImagePattern` contenente `{n}`, `cardCount` e il layout;
5. eseguire `npm run build:wp`;
6. caricare sul server il plugin WordPress aggiornato e verificare una nuova sessione con ogni piano abilitato.

Non cambiare l'ID di un mazzo già usato: l'ID viene salvato nella sessione e resta immutabile. Per ritirare temporaneamente un mazzo impostare `enabled` a `false`; le sessioni storiche devono essere gestite prima della rimozione definitiva dei relativi asset.

## Regole di sessione

- Il mazzo viene scelto dal creatore quando prepara l'invito.
- La sessione salva `impostazioni.mazzoId`; dopo la creazione il mazzo non può essere cambiato.
- Solo il creatore può aggiungere o rimuovere carte. Un editor invitato può manipolare le carte già presenti.
- Il backend verifica nuovamente piano, nonce, ID del mazzo e permessi: i controlli non dipendono soltanto dall'interfaccia React.

## Verifica prima della pubblicazione

Eseguire almeno:

```bash
npm run lint
npm run build:wp
```

Poi provare la creazione di una nuova sessione per entrambi i mazzi, l'accesso di un visualizzatore e di un editor, il refresh dello stato condiviso e il rifiuto per un utente senza piano.
