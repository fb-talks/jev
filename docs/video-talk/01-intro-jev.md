# 01 · Intro a Jev

> **Cos'è questo file.** Gli **appunti di studio** del talk: le spiegazioni complete per capire e rispiegare Jev (come si usa, come "sa" le cose, limiti, costi), con i numeri verificati e le fonti in fondo. Non si legge in video.
> Quello che si dice e si vede, slide per slide, sta nel copione: [01-intro-jev-video-script.md](./01-intro-jev-video-script.md). Le slide sono in [`slides/`](./slides/).

Le sezioni seguono l'ordine delle slide in [`slides/`](./slides/) e del [copione del video](./01-intro-jev-video-script.md): sotto ogni titolo c'è il link alla slide corrispondente. Le slide sono anche online su [fb-talks.github.io/jev](https://fb-talks.github.io/jev/).

---

## 1. Apertura

Dalla [introduzione di TypeSafe](https://docs.typesafe.ai/introduction): Jev è il primo modello "System One", fatto per decisioni veloci e strutturate che il software usa direttamente. Gli LLM producono testo per persone: usarli per decisioni che il codice consuma vuol dire forzarli a scrivere una risposta strutturata e poi fare il parsing. Si manda invece uno state (i dati) e una o più domande tipizzate; tornano valori tipizzati con le probabilità. Le domande sono valutate in parallelo e in isolamento, quindi aggiungerne non rallenta e non peggiora le altre. "No text generation, no parsing."

- Titolo: 🎬 [`slides/01a-titolo.html`](./slides/01a-titolo.html)
- Speaker: 🎬 [`slides/01b-speaker.html`](./slides/01b-speaker.html)
- LLM vs Jev: 🎬 [`slides/01c-jev.html`](./slides/01c-jev.html)
- Hook: 🎬 [`slides/01d-hook.html`](./slides/01d-hook.html)

---

## 2. Cos'è, in una frase

**Un LLM scrive, Jev sceglie.**

🎬 [`slides/01d-hook.html`](./slides/01d-hook.html) · 🎬 [`slides/02-cos-e.html`](./slides/02-cos-e.html)

Jev è un modello di TypeSafe AI, startup di San Francisco fondata nel 2024 e uscita in early access il 15 settembre 2026. Il nome viene dall'economista William Stanley Jevons e dal suo "paradosso": se una risorsa diventa più efficiente, se ne usa di più. L'idea è che un'intelligenza artificiale molto più economica verrà usata ovunque.

Tecnicamente è un **modello discriminativo**: serve a classificare o a stimare valori, non a generare testo. Per ogni domanda restituisce una **distribuzione di probabilità** sulle opzioni che gli passi tu, e basta. I campi `choice`, `score` e `confidence` della risposta derivano da quelle probabilità: per esempio lo `score` è la media dei livelli pesata con le loro probabilità. Arrivano già calcolati dall'API.

A differenza dei classificatori classici **non va addestrato sui tuoi dati**: lavora zero-shot sulle categorie che gli dai al momento della richiesta, proprio come un LLM.

TypeSafe lo chiama un modello **"System One"**, richiamando il "Sistema 1" di Kahneman: il pensiero veloce e intuitivo.

---

## 3. Come si usa: state + domande

Gli mandi due cose:

- uno **state**, cioè l'input da valutare: una stringa, un oggetto JSON o un array di stringhe;
- una o più **questions**, tutte a scelta multipla.

🎬 [`slides/03a-state-domande.html`](./slides/03a-state-domande.html)

### I tre tipi di domanda

🎬 [`slides/03b-tipi-domanda.html`](./slides/03b-tipi-domanda.html)

| Tipo | Cosa fa | Restituisce |
|---|---|---|
| `noul` | vero / falso | probabilità del "sì" (0–1) |
| `choice` | una opzione da una lista **non ordinata** | opzione scelta, probabilità, confidenza |
| `score` | una posizione su una scala **ordinata** | punteggio pesato, probabilità, confidenza |

Cosa contengono i campi della risposta:

- **`noul`**: la probabilità del "sì", da 0 a 1. È l'unico campo;
- **`choice`**: l'opzione scelta, cioè una delle chiavi che hai scritto (in TypeScript è una union delle tue opzioni);
- **`score`**: la media dei livelli pesata con le loro probabilità, quindi può cadere tra due livelli. Ogni livello vale la sua posizione nell'array, partendo da 0: lo score va da 0 a (numero di livelli − 1). Con 3 livelli va da 0 a 2, con 5 da 0 a 4. Per avere un valore da 0 a 1 si divide per l'ultimo livello (la demo 3 fa `toxicity.score / 3`, perché la tossicità ha 4 livelli). Anche le parole dei livelli contano: con lo stesso ticket, "Calm / Angry" dà 0.99 (cioè Angry), tre livelli danno 1.05 ("Frustrated but polite"), cinque livelli danno 2.44, divisi tra "Frustrated but polite" e "Angry";
- **`probabilities`** (choice e score): la probabilità di ogni opzione o livello; sommate fanno 1;
- **`confidence`** (choice e score): quanto Jev è sicuro della risposta, da 0 a 1. L'SDK non pubblica la formula, ma nei dati reali è alta quando la probabilità si concentra su un'opzione (ticket: billing 100%, confidenza 1) e bassa quando è divisa (46% contro 44%, confidenza 0.19). Non coincide con la probabilità più alta;
- **`legend`** (solo score): le descrizioni dei livelli che hai passato.

### L'esempio più semplice: una sola domanda

🎬 [`slides/03c-noul-base.html`](./slides/03c-noul-base.html)

```ts
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const { answers } = await client.systemOne({
  state: "Who taught you to code? Useless post.",
  questions: {
    offensive: noul("The comment is offensive or insulting"),
  },
});

answers.offensive.noul; // 0.80: probabilità del "sì"
```

Uno state, una domanda, un numero. È la stessa domanda di `/1-jev/demo1` (valore reale a ottobre 2026: 0.79–0.81).

### Esempio: un ticket di supporto

🎬 [`slides/03d-codice.html`](./slides/03d-codice.html) · 🎬 [`slides/03e-noul.html`](./slides/03e-noul.html) · 🎬 [`slides/03f-choice.html`](./slides/03f-choice.html) · 🎬 [`slides/03g-score.html`](./slides/03g-score.html)

```ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const { answers } = await client.systemOne({
  state: "I was charged twice for my payment, reply by today!",
  questions: {
    department: choice("Which team should handle it?", {
      billing: "Payments or subscriptions",
      technical: "Bugs or integration issues",
      sales: "Pricing or sales questions",
    }),
    frustration: score("How frustrated is the customer?", [
      "Calm, states the facts",
      "Frustrated but polite",
      "Very angry",
    ]),
    urgent: noul("The message needs action today"),
  },
});

answers.department.choice;   // "billing"  (typed as a union of the options)
answers.frustration.score;   // 1.04      (weighted average: can fall between two levels)
answers.urgent.noul;         // 0.92      (probability of "yes")
```

Valori reali di una chiamata a Jev con questo ticket (ottobre 2026; ripetendola cambiano di un centesimo o due):

- `department`: `"billing"`, probabilità 1, confidenza 1;
- `frustration`: score **1.04**, probabilità 0 → 3%, 1 → 89%, 2 → 8%, confidenza 0.82. Lo score è la media pesata dei livelli: 0 × 0,03 + 1 × 0,89 + 2 × 0,08 ≈ 1,05 (le probabilità sono arrotondate);
- `urgent`: **0.92**.

Due dettagli importanti:

- **le descrizioni delle opzioni sono il tuo "prompt"**: più sono chiare, migliori sono le probabilità;
- **le domande sono indipendenti** e vengono risposte in parallelo. Se una dipende dalla risposta di un'altra (es. sottocategoria dopo la categoria), servono due chiamate in sequenza.

---

## 4. Il pattern a tre fasce

🎬 [`slides/04-tre-fasce.html`](./slides/04-tre-fasce.html)

Il modello dà le probabilità, **la decisione la prende il tuo codice**:

```ts
if (r.confidence >= 0.8)      automatico();      // sicuro: agisci
else if (r.confidence >= 0.5) suggerisci();      // incerto: un umano conferma con un click
else                          codaManuale();     // o escalation a un LLM più grande
```

La confidenza diventa una leva di prodotto: puoi tarare le soglie nel tempo guardando quante volte gli operatori correggono i suggerimenti. La demo di moderazione commenti di questo progetto mostra esattamente questo: muovendo gli slider la decisione cambia **senza richiamare Jev**.

---

## 5. Esempi di utilizzo

🎬 [`slides/05-casi-uso.html`](./slides/05-casi-uso.html)

**CMS**
- moderazione dei commenti (spam, tossicità, dati personali) → la demo di questo progetto
- classificazione automatica degli articoli (sezione, livello del lettore)
- checklist pre-pubblicazione: più `noul` in parallelo, una per regola editoriale
- smistamento dei contenuti inviati dagli utenti (guest post, proposte di talk)

**CRM**
- triage di ticket ed email (reparto, urgenza, frustrazione in una chiamata)
- lead scoring dal form contatti
- deduplicazione dei contatti (solo sulle coppie candidate già filtrate)
- rischio di abbandono (churn) in batch notturno
- "next best action" su un insieme chiuso di azioni

---

## 6. È un LLM? Come fa a "sapere" le cose?

**Non è un LLM nel senso classico, ma è parente stretto.** TypeSafe dice che è basato su transformer, e alcuni osservatori ipotizzano che sia costruito sopra un LLM open-weight o su un'architettura tipo BERT.

Domanda tipica: *come fa a sapere che "SEI BRUTTO" è offensivo, o che il pane ha la mollica?*

🎬 [`slides/06-come-sa.html`](./slides/06-come-sa.html)

La risposta è che **la conoscenza non viene dall'addestramento specifico di Jev, ma da prima**. Ecco i 5 passi, sempre con lo stesso esempio: i passi 1–4 riguardano il **modello linguistico di base** su cui Jev è costruito, solo il passo 5 è l'addestramento di Jev.

> ⚠️ TypeSafe non ha pubblicato i dettagli. Quella che segue è la ricostruzione più probabile, coerente con come funzionano i modelli di questo tipo.

### Passo 1 — Leggere tantissimo testo per indovinare la parola dopo

🎬 [`slides/06a-parola-dopo.html`](./slides/06a-parola-dopo.html)

Il modello di base viene addestrato su un'enorme quantità di testo reale: forum, libri, chat, articoli. Il compito è sempre lo stesso: **indovinare la parola successiva**.

```
"Mi ha detto che sono brutto e ci sono rimasto ___"   → male
"Sei brutto, ma come ti ___"                          → permetti
"Oggi il tempo è brutto, prendo l'___"                → ombrello
```

Nessuno gli ha mai scritto "brutto = offensivo". Però, per indovinare bene, deve **imparare in quali situazioni compaiono le parole**. E "sei brutto" compare quasi sempre vicino a litigi, offese, persone ferite, scuse.

Jev parte da un modello che ha già fatto questo lavoro, e ne **eredita** le conoscenze.

### Passo 2 — Le parole diventano coordinate

🎬 [`slides/06b-coordinate.html`](./slides/06b-coordinate.html)

Dentro il modello ogni parola (in realtà ogni pezzo di parola) diventa una lista di numeri: un punto in uno spazio con migliaia di dimensioni. Le parole usate in contesti simili finiscono **vicine**:

```
        insulto ●  ● idiota
   sei brutto ●      ● stupido          ← "zona offese"
                ● offensivo

                         ● gentile
              ● grazie       ● complimenti   ← "zona cortesia"
```

Il significato è la posizione, e la posizione l'ha imparata dai contesti.

### Passo 3 — Il contesto cambia il significato (attention)

🎬 [`slides/06c-attention.html`](./slides/06c-attention.html)

"Brutto" da solo non è offensivo. Con il meccanismo di **attention** del transformer, ogni parola "guarda" le altre della frase e si aggiorna di conseguenza:

```
"SEI brutto"          → brutto guarda "sei"   → rivolto a una persona → offesa
"il tempo è brutto"   → brutto guarda "tempo" → giudizio sul meteo   → neutro
"che brutto film"     → brutto guarda "film"  → critica a un'opera   → neutro
```

Da sola, "brutto" sta a metà strada. È il contesto a spostarla: vicino a "sei" finisce tra le offese, vicino a "tempo" tra il meteo, vicino a "film" tra le critiche. Stessa parola, tre posti diversi.

### Passo 4 — Anche le tue opzioni sono testo

🎬 [`slides/06d-opzioni.html`](./slides/06d-opzioni.html)

Quando chiedi lo score di tossicità, passi delle descrizioni:

```
0: "Cortese o neutro"
1: "Critico ma rispettoso"
2: "Polemico o sarcastico verso persone"
3: "Insulti, odio o attacchi personali"
```

Anche queste frasi vengono "comprese" con lo stesso meccanismo. Il lavoro diventa **confrontare** la rappresentazione di "SEI BRUTTO" con quella di ogni opzione: è molto più compatibile con la 3 che con la 0. Per questo le descrizioni dei criteri contano così tanto: sono metà del confronto.

### Passo 5 — L'addestramento di Jev insegna a scommettere, non cosa è offensivo

🎬 [`slides/06e-scommettere.html`](./slides/06e-scommettere.html)

Qui entra la parte specifica di TypeSafe: **solo dati sintetici** (generati artificialmente) e un metodo che chiama **RLCD**, *Reinforcement Learning for Calibrated Decisions*. Questo addestramento **non insegna che "brutto" è offensivo**, perché il modello lo sa già dal passo 1. Gli insegna:

- a rispondere **solo** scegliendo tra le opzioni date, invece di scrivere;
- a dare probabilità **oneste** (calibrate): se dice 80%, deve avere ragione circa 8 volte su 10.

🎬 [`slides/06f-scommessa.html`](./slides/06f-scommessa.html)

```
"UGLY!!!"
  0 Cortese         ▏ 0%
  1 Critico         ▏ 4%
  2 Polemico        ██ 10%
  3 Insulti         █████████████████ 86%
```

Valori reali (ottobre 2026, domanda di tossicità di `/1-jev/demo3`). Un insulto diretto come "you're ugly" o "SEI BRUTTO" dà **100%** su Insulti: Jev è sicurissimo. "UGLY!!!", senza un destinatario esplicito, lascia un po' di margine ed è l'esempio usato nelle slide.

### E quando sbaglia?

🎬 [`slides/06g-quando-sbaglia.html`](./slides/06g-quando-sbaglia.html)

Proprio perché ha imparato dai contesti, va in difficoltà quando il contesto è ambiguo:

- una presa in giro tra amici;
- ironia o dialetto;
- un insulto "pulito", senza parole offensive.

Esempio reale (ottobre 2026), con la policy di `/1-jev/demo3`:

| Commento | Polite · Critical · Combative · Insults | Confidenza | Decisione |
|---|---|---|---|
| "UGLY!!!" | 0 · 4 · 10 · 86 | 0.83 | **Reject** (tossicità 2.81 / 3 = 94%) |
| "you absolute muppet, great post 😂" | 6 · 7 · 34 · 53 | 0.32 | **Needs review** (2.33 / 3 = 78%) |

Nel secondo caso le probabilità si sparpagliano e la confidenza scende. È il segnale che nella demo manda il commento **in revisione** invece di decidere da solo.

Ma non sempre va così: "you're ugly lol, love you" viene letto come insulto (77%, confidenza 0.67) e la demo lo **rifiuta**. Lo scherzo non viene riconosciuto, e la confidenza non è abbastanza bassa da segnalarlo. Per questo le soglie vanno tarate su commenti reali.

Vale lo stesso per le conoscenze: Jev sa le stesse cose generiche di un modello linguistico, con gli stessi limiti. Non conosce quello che è successo dopo il suo addestramento, non conosce i tuoi dati se non li metti nello state, e può sbagliare. La differenza è che, quando non è sicuro, **te lo dice con un numero**.

---

## 7. Limiti e costi

### Limiti

🎬 [`slides/07a-limiti.html`](./slides/07a-limiti.html)

- fino a **255 opzioni** per una `choice` e **2–10 livelli** per uno `score`;
- **64k token** in input, di cui 32k per state + domanda più lunga;
- **scatola chiusa**: TypeSafe non ha pubblicato architettura, pesi né paper tecnico;
- le prestazioni dichiarate (70–500 ms, da 40 a 200 volte più veloce degli LLM; il "193,6 volte più veloce, 444,6 volte più economico" della loro home page è, per loro stessa ammissione, la fascia alta dei risultati reali) vengono da test fatti dallo stesso team di TypeSafe, dai loro portatili sulla West Coast. Un paper indipendente su testi di scienze politiche lo trova **alla pari** con gli LLM, più veloce, ma senza grandi vantaggi oltre alla facilità di leggere le probabilità.

**Quindi:** non sostituisce un LLM, lo **affianca** per le micro-decisioni ad alto volume, dove servono un tipo e una confidenza, non una frase.

### Costi e accesso

🎬 [`slides/07b-costi.html`](./slides/07b-costi.html)

- **si paga solo l'input**: **0,042 $ per milione di token**. L'output è gratis: TypeSafe lo definisce "too cheap to meter", troppo economico per misurarlo. Jev non scrive testo token per token, restituisce tutte le probabilità in un colpo solo;
- per confronto, gli LLM costano da 0,20 a 10 $ per milione di token in input, e l'output costa circa 5 volte di più;
- come input conta tutto quello che mandi: lo state, le domande e le descrizioni delle opzioni;
- lo state si paga **una volta per richiesta**, non per domanda: conviene mettere più domande nella stessa chiamata;
- una chiamata piccola sono circa 300 token: centomila commenti moderati sono 30 milioni di token, cioè circa **1,26 $**;
- TypeSafe ammette che non può dimostrare che il prezzo non sia sovvenzionato: la sostenibilità si vedrà nel tempo;
- **nessun piano gratuito**: su **Vercel AI Gateway** la tariffa è la stessa, ma con il solo credito gratuito mensile Jev risponde `403 Free tier users do not have access to this model`. Servono crediti a pagamento (ne basta pochissimo);
- disponibile anche su Cloudflare Workers AI e OpenRouter.

#### Perché Vercel AI Gateway (scelta di questa demo)

- un solo conto e una sola dashboard per tutti i modelli (Jev per decidere, un LLM per scrivere);
- Zero Data Retention e No Training attivabili per richiesta;
- in produzione su Vercel non serve la chiave: si usa il token OIDC;
- si usa l'SDK ufficiale di TypeSafe cambiando solo `baseURL` (`https://ai-gateway.vercel.sh/typesafe`), quindi passare a TypeSafe diretto in futuro è banale.

---

## 8. Chiusura: la versione da 30 secondi

🎬 [`slides/08-chiusura.html`](./slides/08-chiusura.html)

> Immaginate una persona che ha letto miliardi di conversazioni. Nessuno le ha mai spiegato cos'è un'offesa, ma ne ha viste talmente tante che la riconosce dal contesto: è il pre-addestramento del transformer. Poi la si allena a fare solo test a crocette, scommettendo onestamente su ogni risposta: è l'addestramento specifico di Jev. Un LLM vi risponde con un tema, Jev vi dice "risposta D, sicuro all'86%".

---

## 9. Bonus: Jev guarda le immagini

Le immagini sono sperimentali ("Dreamer-ready", non consigliate in produzione): si attivano con l'header `TypeSafe-Danger-Zone-Images: true`. Possono stare nello state, nelle istruzioni di una domanda o nei criteri. Solo PNG o JPEG, lati tra 280 e 1568 px, fino a 16 MiB per immagine; si pagano come token di input.

La domanda `box` restituisce il rettangolo più piccolo che contiene l'oggetto: quattro bordi (`top`, `bottom`, `left`, `right`) come frazioni da 0 a 1 dell'immagine, dall'angolo in alto a sinistra, più una `confidence`. Un box risponde sempre, anche se l'oggetto non c'è: si abbina a una noul che chiede se c'è. Un box copre un solo oggetto, quindi va descritto con precisione.

- Prompt vuoto, cos'è e dov'è: 🎬 [`slides/09-soggetto.html`](./slides/09-soggetto.html)
- Jev vede anche le immagini: 🎬 [`slides/09a-immagini.html`](./slides/09a-immagini.html)
- box, quattro numeri: 🎬 [`slides/09b-box.html`](./slides/09b-box.html)
- C'è? Dov'è? (un box arriva sempre): 🎬 [`slides/09c-sempre-box.html`](./slides/09c-sempre-box.html)
- Descrivi quello che cerchi: 🎬 [`slides/09d-descrivi.html`](./slides/09d-descrivi.html)
- Quanto ci mette, e cosa sapere: 🎬 [`slides/09e-tempi-limiti.html`](./slides/09e-tempi-limiti.html)

---

## 10. In pratica — 🚧 TODO (placeholder)

Sezione da scrivere. Le slide segnaposto, nell'ordine:

- Creare account e API key: 🎬 [`slides/10a-account.html`](./slides/10a-account.html)
- Esempio di codice: 🎬 [`slides/10b-codice.html`](./slides/10b-codice.html)
- Usiamo un gateway come Vercel: 🎬 [`slides/10c-gateway.html`](./slides/10c-gateway.html)
- Demo time: 🎬 [`slides/10d-demo.html`](./slides/10d-demo.html)

---

## Fonti

- [Jev (AI model) – Wikipedia](https://en.wikipedia.org/wiki/Jev_(AI_model))
- [Introducing System One models and Jev – TypeSafe blog](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [Quick start – TypeSafe docs](https://docs.typesafe.ai/introduction/quickstart)
- [Images – TypeSafe docs](https://docs.typesafe.ai/images)
- [Box – TypeSafe docs](https://docs.typesafe.ai/primitives/box)
- [TypeSafe API with AI Gateway – Vercel docs](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)
- [TypeSafe AI's Jev now available on AI Gateway – Vercel](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway)
- [How much does Jev cost? – Flavio Copes](https://flaviocopes.com/jev-pricing/)
- [What Is Jev? – OpenRouter](https://openrouter.ai/blog/insights/what-is-jev/)
- [JEV versus LLMs (paper) – arXiv](https://arxiv.org/pdf/2610.06625)
