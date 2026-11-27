# 01 · Intro a Jev — script del video

> **Cos'è questo file.** Il **copione** del video e del talk: per ogni sezione cosa si dice (🎙️), cosa si vede (🖥️), quale animazione parte (🎬) e le note di montaggio (✂️), in ordine di slide. In fondo c'è la checklist per la registrazione.
> Le spiegazioni approfondite, i numeri e le fonti stanno negli appunti: [01-intro-jev.md](./01-intro-jev.md). Le slide sono in [`slides/`](./slides/).

Basato su [01-intro-jev.md](./01-intro-jev.md). Durata stimata: **12 minuti e mezzo**, più circa 2 minuti e mezzo per il bonus sulle immagini (sezione 9).

Le animazioni sono online su [fb-talks.github.io/jev](https://fb-talks.github.io/jev/) (← / → per passare da una slide all'altra). Questo file è anche la fonte delle **note dello speaker**: ogni slide (tasto N o bottone "Notes") mostra la sezione che contiene il suo link 🎬, quindi le note si modificano solo qui.

Legenda:
- 🎙️ **VOCE**: il parlato (in camera o fuori campo)
- 🖥️ **SCHERMO**: cosa si vede
- ✂️ note di montaggio

---

## 1. Apertura (0:00 – 1:00)

### 00 · Copertina

🎬 **ANIMAZIONE**: [`slides/00-copertina.html`](./slides/00-copertina.html). A sinistra il titolo su due righe, "From Texts / to Decisions", gli autori (Zelda Ailine Luconi & Fabio Biondi) e il pulsante **Start**, che passa alla slide successiva. A destra l'essenza del talk: un paragrafo "per le persone" entra in Jev ed esce come una decisione "per il codice", una probabilità per opzione (offensive 0.92). Dura 10 s. Le probabilità sono illustrative.

🎙️ **VOCE**:
> Slide da mostrare prima di iniziare il talk
> Niente da dire... si inizia con la pro slide

### 01a · Titolo

🎬 **ANIMAZIONE**: [`slides/01a-titolo.html`](./slides/01a-titolo.html). "Jev" scritto a mano, sotto una barra che si riempie fino a 0.92, intorno arrivano i quattro tipi di domanda (noul, choice, score, box), poi "It doesn't write. It decides." Dura 9 s.

🎙️ **VOCE**:
> Negli ultimi anni ci siamo abituati a modelli che **scrivono**: fai una domanda e ti rispondono con un paragrafo.
> Ma nel nostro codice, molto spesso, un paragrafo non ci serve. Ci serve una **decisione**: questo commento è offensivo? Questo ticket va al supporto o alle vendite? In questa email c'è un ordine?
> Per questo motivo sta iniziando a prendere piede una nuova famiglia di modelli, i **decision model**.
> Oggi partiamo da **Jev**, e vediamo anche la novità di queste settimane: **Gemini Decision API** di Google.
> Il materiale è nato su Jev, ma Gemini Decision è praticamente identico: i concetti valgono per tutti e due, e in generale per tutti i decision model disponibili oggi, locali o in cloud.

### 01d · Hook (0:00 – 0:30)

🎙️ **VOCE**:
> Partiamo da un commento sotto un nostro post: "Who taught you to code? Useless post.", cioè "Chi ti ha insegnato a programmare? Post inutile."
> Vogliamo automatizzare l'analisi di questi commenti, per rispondere o fare un'azione di conseguenza.
> A sinistra c'è quello che facciamo di solito: lo diamo a un LLM, un Gemini Flash o un Claude Opus, e gli chiediamo se è offensivo. Lui ci scrive un paragrafo, educato e pieno di "dipende dal contesto", e la risposta vera è lì in mezzo. Ci tocca leggerla, o farne il parsing, e aspettare che finisca di scrivere: qualche secondo, e un po' di token in output.
> Quello che vediamo in azione a destra, invece, non è un LLM che vi scrive un paragrafo per dirvi che il commento è offensivo.
> È un modello che vi risponde con un numero: offensivo, all'ottanta per cento. In pochi millisecondi anziché secondi, e con zero token in output.
> Tra i più noti troviamo **Jev** e **Gemini Decision API**, e oggi vediamo cosa sono, come si usano e, soprattutto, come fanno a "sapere" che una frase è un insulto.

✂️ Nel video, sulla demo `/1-jev/demo1`: Jev circa 250 ms contro 3.140 ms dell'LLM, 96 token in output contro 0. Sono numeri di una singola esecuzione: se li citi dal vivo, leggili dalla demo.

⏸ 1.9s
>

✂️ Titolo a schermo: **"Un LLM scrive. Jev sceglie."**

🗑️ **TO DELETE** — con l'hook spostato in apertura, prima di 01c, questa nota non è più vera.

✂️ Con l'apertura, Jev è già presentato in 01c: "Si chiama Jev" si può accorciare in "Ecco Jev in azione".

🎬 **ANIMAZIONE**: [`slides/01d-hook.html`](./slides/01d-hook.html). Lo stesso commento analizzato da un LLM (che scrive un paragrafo) e da Jev (che risponde 80% in un istante), poi il titolo. Dura 12 s, poi si ferma sul titolo.

### 01b · Speaker

🎬 **ANIMAZIONE**: [`slides/01b-speaker.html`](./slides/01b-speaker.html). Le due foto dentro cerchi disegnati a mano (rosa a sinistra, blu a destra), una "&" in mezzo, i nomi con una freccia a mano verso ogni cerchio, poi ruolo e competenze sotto le foto. Dura 12 s.

✂️ 🚧 Segnaposto da completare: nomi, ruoli, competenze, e le foto in `slides/_shared/img/speaker-left.jpg` e `speaker-right.jpg` (quadrate, almeno 400×400). Finché mancano, nei cerchi compaiono le iniziali.

🎙️ **VOCE**:
> _da scrivere: chi siamo, in due frasi_

---

## 2. Cos'è Jev (1:00 – 2:45)

### 01c · LLM vs Jev

🗑️ **TO DELETE** — stesso messaggio dell'animazione di 01d (LLM scrive un paragrafo, Jev risponde con un numero) e di 01e (scrivere o scegliere): è il terzo confronto LLM vs Jev in un minuto.

🎬 **ANIMAZIONE**: [`slides/01c-jev.html`](./slides/01c-jev.html). Uno schema disegnato, quasi senza testo. Sopra: dati → LLM → un paragrafo (righe grigie) → va bene per una persona ✓, ma per il codice è un "?". Sotto: dati → Jev → un numero, 0.92 → il codice lo usa ✓ → branch, sort, route. Poi "An LLM writes for people. Jev answers your code." Dura 14 s.

🎙️ **VOCE**:
> Con un LLM: gli date i vostri dati e vi risponde con un paragrafo. Perfetto se a leggerlo è una persona.
> Ma se a usarlo è il vostro **codice**, il software che analizza i commenti e agisce di conseguenza, quel paragrafo è un problema: dovete chiedergli un formato preciso, per esempio un JSON con un output strutturato, fare il parsing, e sperare che sia sempre giusto.

⏸ 6.0s
> Con un decision model, come Jev o Gemini Decision API: stessi dati, ma niente testo. Risponde con un numero, zero novantadue, e il codice lo usa subito: per un `if`, per ordinare, per smistare.
> Un LLM scrive per le persone. **Un decision model risponde al vostro codice.**

### 01e · Scrivere o scegliere

🎬 **ANIMAZIONE**: [`slides/01e-classificatori.html`](./slides/01e-classificatori.html). A sinistra un modello generativo che scrive righe di testo, a destra un classificatore (in rosa) che sceglie "spam" al 97%; sotto, tre classificatori di tutti i giorni; chiude "Jev is a classifier, but you give it the options on every request". Dura 14 s.

🎙️ **VOCE**:
> Prima di dirvi cos'è Jev, o un decision model, un passo indietro. I modelli di AI fanno, a grandi linee, due mestieri.
> Ci sono i modelli **generativi**, come gli LLM: **scrivono**. Producono testo libero, una parola alla volta.

⏸ 2.9s
> E ci sono i modelli **discriminativi**, i **classificatori**: **scelgono**. Gli date un testo, e vi dicono a quale opzione appartiene, con una probabilità. Questa mail è spam al 97%.

⏸ 6.3s
> Li usate da anni senza saperlo: il filtro antispam, il sentiment delle recensioni, le schede di Gmail. Ognuno addestrato per un solo compito.
> Jev, come Gemini Decision API, è un classificatore. Ma con una differenza: **le opzioni gliele date voi**, a ogni richiesta.

### 02 · Cos'è Jev

🎬 **ANIMAZIONE**: [`slides/02-cos-e.html`](./slides/02-cos-e.html)

🎙️ **VOCE** (in camera):
> Jev è un modello di **TypeSafe AI**, una startup di San Francisco nata nel 2024. È uscito in early access a settembre 2026; Gemini Decision API è arrivato subito dopo, e i due parlano più o meno la stessa lingua.
>
> Il nome Jev non è un acronimo, ma deriva dall'economista e logico ottocentesco William Stanley Jevons. 
> La startup TypeSafe AI ha scelto questo nome per via del celebre Paradosso di Jevons. In economia, questo principio dimostra che quando il progresso tecnologico rende l'uso di una risorsa più efficiente (riducendone i costi), il consumo totale di quella risorsa tende ad aumentare anziché diminuire, poiché si aprono infinite nuove possibilità di utilizzo.
> Ve lo racconto perché rende bene l'idea del potenziale: se una decisione costa quasi niente, inizierete a usarla ovunque.
>
> Tecnicamente Jev è un **modello discriminativo**. Non genera testo: classifica, o stima un valore.
> Per ogni domanda vi restituisce una **distribuzione di probabilità** sulle opzioni che gli passate voi. E basta.
>
> TypeSafe lo chiama un modello **"System One"**, come il Sistema 1 di Kahneman: il pensiero veloce, intuitivo. Quello che usate quando riconoscete una faccia, vedete una persona e sapete subito chi è. Non quando fate una moltiplicazione, dove dovete ragionarci.

✂️ Nel video dici che Gemini Decision è uscito "a ottobre": l'annuncio di Google è dell'11 novembre 2026 (come in 07c). Qui ho scritto "subito dopo" per non fissare una data.

🗑️ **TO DELETE** — la tabella LLM/Jev ripete 01c e 01e: è il quarto confronto LLM vs Jev in due minuti, e la slide 02 non la mostra.

🖥️ **SCHERMO**: slide con due colonne.

| LLM | Jev |
|---|---|
| genera testo | sceglie tra opzioni |
| "Il commento sembra offensivo perché…" | `offensive: 0.80` |

🎙️ **VOCE**:

### 02a · Tre modi di classificare

🎬 **ANIMAZIONE**: [`slides/02a-tre-modi.html`](./slides/02a-tre-modi.html). Tre colonne: classificatore classico, LLM con un prompt, Jev (in rosa); le prime due si attenuano, chiude "A decision model: a classifier you don't train". Dura 16 s.

🎙️ **VOCE**:
> Se avete già classificato del testo, l'avete fatto in due modi.
> Con un **classificatore classico**: raccogliete un dataset etichettato, lo addestrate, ed è veloce ed economico. Ma le etichette sono fisse: se aggiungete una categoria, si riaddestra.

⏸ 3.6s
> Oppure con un **LLM e un prompt**: flessibile, ma vi risponde con del testo da interpretare e validare, ed è soprattutto lento e caro.

⏸ 7.4s
> I decision model, come Jev, stanno in mezzo: **non dovete addestrarli**. Gli date le categorie a ogni richiesta, come in un prompt, e vi risponde con un valore tipizzato e le probabilità, come un classificatore.
> Questa categoria di modelli si chiama **decision model**. "System One" è il nome che gli dà TypeSafe e Google lo chiama invece Gemini Decision API.
> Attenzione: "non dovete addestrarlo" non vuol dire che non sia addestrato. Il linguaggio lo conosce già, e come fa lo vediamo più avanti. Quello che non serve è addestrarlo sui **vostri** dati.

---

## 3. Dove usarlo (2:45 – 3:30)

🎬 **ANIMAZIONE**: [`slides/05-casi-uso.html`](./slides/05-casi-uso.html)

🖥️ **SCHERMO**: due colonne di icone che compaiono una alla volta.

🎙️ **VOCE**:
> Analizziamo un po' di casi d'uso in cui si potrebbe sfruttare uno di questi modelli.
> Pensate a tutte le micro-decisioni ad alto volume.
>
> In un **CMS**: moderazione dei commenti, classificazione degli articoli per sezione o per le preferenze del lettore, una checklist pre-pubblicazione con tante domande sì/no in parallelo, una per ogni regola editoriale.

⏸ 3.8s
> In un **CRM**: smistamento di ticket ed email, un punteggio sul form contatti, per esempio quanto è urgente una richiesta, deduplicazione dei contatti, rischio di abbandono in un batch notturno, oppure la "next best action": l'azione migliore da proporre dopo quelle che l'utente ha appena fatto, scelta da un insieme chiuso.
>
> In tutti questi casi non vi serve una frase, un paragrafo di risposta. Vi serve **un tipo, un numero e una confidenza**.

### 05c · Ricerca immobiliare: dalla frase ai filtri

🎬 **ANIMAZIONE**: [`slides/05c-immobiliare-chiavi.html`](./slides/05c-immobiliare-chiavi.html). Diagramma, niente codice, in quattro passi da sinistra a destra: la textarea con la richiesta ("I want to buy…") e i candidati evidenziati dalle regole → cinque domande chiuse, ognuna con "not stated", due con la loro istruzione; le opzioni di "Buy or rent?" mostrano la chiave (`sale`, `rent`) con la descrizione sotto, e una legenda spiega chi legge cosa → Jev sceglie (una chiamata) → il modulo dei filtri compilato, che mostra "Buy" al visitatore ma passa `sale` alla ricerca. Le probabilità e il numero di annunci sono illustrativi. Dura 20 s.

🎙️ **VOCE**:
> Un esempio concreto che ho applicato di recente: un sito in cui c'è una ricerca, dove il visitatore scrive quello che cerca in una frase. (Leggere frase: "voglio comprare un appartamento a Bologna, Santo Stefano, massimo 200 mila euro, almeno 90 metri quadri e un balcone")
> Potrei darla tutta a un LLM e farmi restituire i filtri. Ma sono secondi di attesa, e un costo che pesa su migliaia di ricerche.

⏸ 5.1s
> Possiamo invece ipotizzare regole semplici che estrapolano possibili valori. 
> Città e zone, importi, superfici, le stanze nominate. Così a Jev non chiediamo di inventare niente: i candidati li prepariamo noi.
> A Jev facciamo solo **domande a risposta chiusa**: vuole comprare o affittare? Il prezzo massimo è 100.000 o 200.000? Vuole un balcone? Ogni domanda ha anche la risposta "la frase non lo dice", così Jev non è costretto a forzare un valore. E sulle cose che la frase non tocca non facciamo domande: una sola chiamata, veloce ed economica.

⏸ 9.9s
> Le risposte sicure e valide diventano i filtri della ricerca normale, una normalissima query al database: possiamo lanciarla subito, oppure mostrare i filtri al visitatore, che li vede e li può correggere, aggiungere o togliere. Gli annunci arrivano dalla stessa ricerca della lista immobili. E la frase va dal browser a Jev con la chiave del visitatore: il nostro server riceve solo i filtri.
>
> E se il database si aspetta un valore preciso? Non c'è niente da forzare: quel valore non lo scrive Jev, lo decidiamo noi in anticipo.
> Ogni opzione ha due parti: la **chiave**, il valore che usa la ricerca, per esempio `sale`, e la **descrizione**, "la persona vuole comprare", che legge solo Jev.
> Scrivo "voglio comprare": Jev legge la descrizione e risponde con la chiave `sale`. Non può rispondere "compra" o "acquisto": sceglie tra le nostre chiavi, oppure "la frase non lo dice". Una risposta fuori elenco verrebbe scartata.
> "Buy" nel modulo è solo l'etichetta per il visitatore. Alla ricerca arriva `sale`, lo stesso valore che la lista immobili si aspetta già.
> Le regole trovano i candidati, Jev sceglie una delle nostre chiavi, e la ricerca è quella di sempre.

---

## 4. Come si usa: state + domande (3:30 – 5:15)

### 03a · State + domande

🎙️ **VOCE**:
> Prendiamo uno di questi casi: lo smistamento dei ticket di supporto. Un cliente scrive che ha pagato due volte, e vuole una risposta oggi.

⏸ 1.9s
> Usarlo è semplice. Gli mandate due cose.
> Uno **state**: il testo da valutare, qui il messaggio del cliente. Può essere una stringa, un oggetto JSON o un array.
> E una o più **domande**. Tutte a scelta multipla: quale team lo deve gestire? Quanto è frustrato il cliente? Va risolto oggi?

⏸ 4.6s
> Il JSON di risultato contiene le tre risposte: il reparto è billing, la frustrazione è alta ma il cliente non è arrabbiato, e l'urgenza è al novantadue per cento. Tra un attimo vediamo come ci arriva.

🎬 **ANIMAZIONE**: [`slides/03a-state-domande.html`](./slides/03a-state-domande.html). Il ticket di supporto come flusso: state e tre domande entrano in Jev in parallelo, escono tre risposte.

### 03b · I tre tipi di domanda

🎬 **ANIMAZIONE**: [`slides/03b-tipi-domanda.html`](./slides/03b-tipi-domanda.html). I tre tipi, una card alla volta, ognuna con un mini esempio dal ticket.

🖥️ **SCHERMO**: tabella dei tre tipi, che appare una riga alla volta.

| Tipo | Cosa fa | Restituisce |
|---|---|---|
| `noul` | vero / falso | `noul`: probabilità del "sì" (0–1) |
| `choice` | un'opzione da una lista **non ordinata** | `choice` (l'opzione scelta), `probabilities`, `confidence` |
| `score` | una posizione su una scala **ordinata** | `score` (media pesata dei livelli), `probabilities`, `confidence` |

🎙️ **VOCE**:
> Ci sono tre tipi di domanda.
> **noul**: sì o no. Vi dà la probabilità del sì: "questa mail è spam?", sì al novantadue per cento. Quel numero è anche un grado di sicurezza, e in base a quello decidete se agire in automatico o far intervenire una persona.

🖥️ **SCHERMO**: sotto ogni card compaiono i campi che Jev restituisce ("Jev returns").

🎙️ **VOCE**:
⏸ 5.7s
> **choice**: una opzione da una lista, senza un ordine. Per esempio: reparto vendite, tecnico o pagamenti.

⏸ 11.0s
>
> **score**: una posizione su una scala ordinata. Per esempio: da "calmo" a "molto arrabbiato". Qui il cursore cade vicino al centro, "frustrato ma educato", appena spostato verso l'arrabbiato.
>
> Sotto ogni tipo vedete i campi che Jev vi restituisce: `noul`, `choice` o `score`, e per choice e score anche **probabilities** e **confidence**. Tra poco vediamo cosa contengono, con un esempio vero.

### 03c · La chiamata più semplice

🎬 **ANIMAZIONE**: [`slides/03c-noul-base.html`](./slides/03c-noul-base.html). Il client più semplice possibile: si evidenziano import e client, lo state (il commento della hook), l'unica domanda `noul`, poi `console.log` e a destra la risposta `0.80` con la barra. Finale: "One state, one question, one number." Dura 16 s.

🖥️ **SCHERMO**: editor con il codice minimo (è la stessa domanda di `/1-jev/demo1`).

```ts
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const { answers } = await client.systemOne({
  state: "Who taught you to code? Useless post.",
  questions: {
    offensive: noul("The comment is offensive or insulting"),
  },
});

console.log(answers.offensive.noul); // 0.80
```

🎙️ **VOCE**:

> Partiamo dal caso più semplice possibile, una noul, con un esempio di codice. Qui è TypeScript, ma potete usare Python o altri linguaggi, in base agli SDK del decision model che scegliete.
> Importo il client e la funzione `noul` dall'SDK di TypeSafe, e creo il client.

⏸ 1.9s
> Nello state metto il testo da valutare: il commento dell'inizio, "Who taught you to code? Useless post."

⏸ 4.2s
> E faccio una sola domanda, sì o no: il commento è offensivo?

⏸ 6.5s
> La risposta è un numero solo: zero virgola ottanta, cioè ottanta per cento di probabilità che la risposta sia sì. Decisamente offensivo, anche se non estremo.
> E `answers.offensive` è tipizzato: `offensive` è il nome che ho dato io alla domanda.
> Tutto qui: uno state, una domanda, un numero. Adesso vediamo cosa succede con più domande insieme.

✂️ Valore verificato a ottobre 2026 su `/1-jev/demo1` (0.79–0.81): ricontrollarlo prima di registrare.

### 03d · Il codice del ticket

🎬 **ANIMAZIONE**: [`slides/03d-codice.html`](./slides/03d-codice.html). Il codice del ticket: si evidenziano lo state e le tre domande mentre ne parlo, poi i tre risultati (ogni risultato riaccende la sua domanda).

🖥️ **SCHERMO**: editor con l'esempio del ticket di supporto. Evidenzio le parti mentre ne parlo.

```ts
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
```

🎙️ **VOCE**:
> Prendiamo un ticket di supporto: "I was charged twice for my payment, reply by today", cioè il cliente dice: "mi hanno addebitato il pagamento due volte, rispondete entro oggi".

🖥️ **SCHERMO**: evidenzio le tre righe dei risultati.

```ts
answers.department.choice;   // "billing"
answers.frustration.score;   // 1.04
answers.urgent.noul;         // 0.92
```

🎙️ **VOCE**:
⏸ 3.4s
> Con una sola chiamata gli chiedo tre cose: a quale reparto mandarlo, quanto è frustrato il cliente, e se è urgente. Una chiamata invece di tre: anche il costo scende.
> Ogni opzione della choice ha la sua descrizione: billing per pagamenti e abbonamenti, technical per bug e integrazioni, sales per prezzi e vendite. La score invece è un array di livelli, con indici zero, uno, due.
>
> • Reparto: billing (NOTA dietro le quinte: TypeScript è tipizzato: è una union delle opzioni che ho scritto io)
> • Frustrazione: 1,04, cioè "frustrato ma educato". È una media pesata dei livelli, quindi in altri casi può cadere anche a metà tra due livelli.
> • Urgente: novantadue per cento.

### 03e · noul

🎬 **ANIMAZIONE**: [`slides/03e-noul.html`](./slides/03e-noul.html). Prima di tre slide, una per tipo (in alto a destra noul · choice · score, quello attivo in rosa). A sinistra la domanda `urgent` e la risposta: un solo campo, `noul: 0.92`. A destra la barra a 0.92, un altro ticket a 0.17, la soglia `if (… > 0.8)`.

🎙️ **VOCE**:
> Ma cosa c'è esattamente dentro ogni risposta? Dipende dal tipo di domanda. Partiamo dalla più semplice.
> Una **noul** restituisce un solo numero: la probabilità che la risposta sia sì, da zero a uno. Per questo ticket, zero virgola novantadue. Per un ticket tranquillo, "quando avete un momento, gli abbonamenti annuali hanno uno sconto?", zero virgola diciassette.
> Niente probabilities, niente confidence: il numero stesso dice quanto Jev è sicuro. Vicino a uno, sicuramente sì; vicino a zero, sicuramente no; intorno a metà, non lo sa.
> E dove inizia il "sì" lo decide il vostro codice: per esempio, sopra zero virgola otto avviso il team.

⏸ 5.4s
> Facciamo un altra domanda:
> "Quando hai un attimo, dimmi se ci sono sconti per i piani annuali"
> Qui vediamo che l'urgenza è definita molto bassa.

⏸ 9.7s
> Con un banale `if` decidiamo cosa fare: sopra zero virgola otto, notifica immediata al team; sotto, il ticket resta in coda per quando qualcuno risponderà ai messaggi meno urgenti.

### 03f · choice

🎬 **ANIMAZIONE**: [`slides/03f-choice.html`](./slides/03f-choice.html). A sinistra la domanda `department` e la risposta con i suoi tre campi, evidenziati uno alla volta. A destra: probabilities (billing 100%), choice = l'opzione più probabile, confidence con due casi reali (questo ticket 1.00; un ticket fuori tema, "Is the Acme T-shirt free with the annual plan?", diviso sales 72 / billing 28 → 0.58) e cosa farne.

🎙️ **VOCE**:
> Una **choice** restituisce tre campi.

⏸ 1.0s
> **probabilities**: una scommessa su ogni opzione, con i nomi che ho scritto io. Qui è tutto su billing: cento per cento.

⏸ 7.1s
> **choice**: semplicemente l'opzione più probabile, già pronta: non serve analizzare le probabilities. In TypeScript è tipizzata, quindi ci posso fare uno switch.

⏸ 9.6s
> **confidence**: quanto la scommessa è concentrata, da zero a uno. Qui è uno, perché è tutta su un'opzione.

⏸ 12.6s
> Ma se arriva un ticket fuori tema, "la T-shirt Acme è gratis con il piano annuale?", nessun team è quello giusto: la scommessa si divide, settantadue per cento sales e ventotto billing, e la confidence scende a 0.58. 
> Vi dice **quando fidarvi**: se è alta, vicina a uno, il codice può agire da solo, per esempio passare il ticket al team giusto o mandare al cliente un form. Se è bassa, meglio passare il messaggio a una persona, o a un LLM che sappia gestire la risposta. È il pattern che vediamo tra poco.

### 03g · score

🎬 **ANIMAZIONE**: [`slides/03g-score.html`](./slides/03g-score.html). A sinistra la domanda `frustration` e la risposta. A destra una tabella: livello · valore · probabilità, poi valore × probabilità, la somma ≈ 1.04 (lo score), il pallino sulla scala, gli intervalli per 2 / 3 / 5 livelli, infine confidence 0.82.

🎙️ **VOCE**:
> Una **score** ha le stesse probabilities e la stessa confidence della choice, più il campo **score**.
> Qui le chiavi delle probabilities non sono nomi ma posizioni nell'array, che parte da zero: zero, uno, due, nell'ordine in cui ho scritto i livelli. Tre per cento "calmo", 89 "frustrato ma educato", 8 "molto arrabbiato".

⏸ 1.7s
> Lo **score** è la media dei livelli, pesata con le probabilità. Ogni livello vale la sua posizione: moltiplico valore per probabilità, zero, zero virgola ottantanove, zero virgola sedici. Sommo, e ottengo circa 1.04.

⏸ 9.2s
> Quindi lo score è una **posizione sulla mia scala**, non una percentuale: "frustrato ma educato", appena spostato verso "molto arrabbiato". E l'intervallo dipende da quanti livelli scrivete: con 3 va da 0 a 2, con cinque da 0 a 4. 
> È comodo proprio perché è un numero solo: lo potete ordinare o metterci una soglia. Per esempio, sopra 1.5 passo il ticket a un responsabile.
> E la confidence, 0.82, funziona come nella choice: la scommessa è concentrata, posso fidarmi. Come regola pratica: sopra zero virgola otto mi fido abbastanza, sopra zero virgola nove sono quasi certo.
>
> ---
> NOTA: Se vi serve un valore da zero a uno, dividete per l'ultimo livello, come fa la demo 3 con la tossicità.

### Due dettagli (in camera)

🎙️ **VOCE** (in camera):
> Due dettagli importanti.
> Primo: **le descrizioni delle opzioni sono il vostro prompt**. Non c'è un system prompt. Se un risultato vi sembra sbagliato, la prima cosa da fare è riscrivere la descrizione.
> Secondo: **le domande sono indipendenti** e vengono risposte in parallelo. Se una dipende dall'altra, per esempio la sottocategoria dopo la categoria, vi servono due chiamate.

---

## 5. Il pattern a tre fasce (5:15 – 6:30)

🎬 **ANIMAZIONE**: [`slides/04-tre-fasce.html`](./slides/04-tre-fasce.html)

🎙️ **VOCE**:
> E adesso la parte che secondo me rende Jev interessante per le app vere.
> Il modello vi dà le probabilità. **La decisione la prende il vostro codice.**

🖥️ **SCHERMO**:

```ts
if (r.confidence >= 0.8)      automatico();   // sicuro: agisci
else if (r.confidence >= 0.5) suggerisci();   // incerto: un umano conferma
else                          codaManuale();  // o escalation a un LLM più grande
```

🎙️ **VOCE**:
⏸ 0.1s
> Se è sicuro, agite in automatico. Se è incerto, suggerite e lasciate che una persona confermi con un click la decisione proposta. Se è molto incerto, lo mandate in coda manuale, a una persona, o a un LLM più grande, di quelli che usiamo tutti i giorni, che analizza meglio il testo.

🖥️ **SCHERMO**: `/1-jev/demo3`. Esempio 2 (il commento sarcastico sulla "ultimate guide"). Analizzo, poi muovo lentamente lo slider "Review from": il badge passa da **Needs review** a **Publish** e viceversa.

🎙️ **VOCE**:
⏸ 6.4s
> La confidenza diventa una **leva di prodotto**: potete tarare le soglie nel tempo, guardando i dati, per esempio quante volte gli operatori correggono i suggerimenti. Se 0.8 per l'automatico non funziona, provate 0.75 o 0.85.

⏸ 11.2s
> Muovo la soglia e la decisione cambia. **Senza richiamare Jev.** Le probabilità ce le abbiamo già; la policy è codice nostro. E per cambiarla non tocchiamo niente dell'integrazione con il decision model: solo i valori delle soglie.

✂️ Zoom sul badge mentre cambia.

---

## 6. Come fa a "sapere" le cose? (6:30 – 9:15)

🎬 **ANIMAZIONE**: [`slides/06-come-sa.html`](./slides/06-come-sa.html). Slide titolo: si disegna un punto interrogativo, poi "How does Jev know things?" e lo spoiler "the knowledge comes from before Jev" (passi 1–4: il modello di base; passo 5: l'addestramento di Jev). Dura 10 s.

🎙️ **VOCE** (in camera):
> La domanda che mi fanno sempre è questa: come fa a sapere che "sei brutto" è offensivo? Nessuno gliel'ha insegnato.
> La risposta è che **la conoscenza non viene dall'addestramento di Jev. Viene da prima.**

✂️ Disclaimer in sovrimpressione: _"TypeSafe non ha pubblicato i dettagli: questa è la ricostruzione più probabile."_

🎙️ **VOCE**:
> Premessa onesta: TypeSafe non ha pubblicato architettura né paper tecnico. Quella che vi racconto è la ricostruzione più probabile, coerente con come funzionano i modelli di questo tipo. Cinque passi.
> I primi quattro non riguardano Jev in sé, ma il **modello linguistico di base** su cui Jev è costruito: è lì che nasce la conoscenza. Solo il quinto è l'addestramento specifico di Jev.

### 06a0 · Passo 1 — Il modello di base legge tutto

🎬 **ANIMAZIONE**: [`slides/06a0-modello-base.html`](./slides/06a0-modello-base.html). Forum, libri e chat entrano in un flusso continuo nel "base model"; a destra il suo unico compito, "Guess the next word", su "Once upon a ___" (time 0.91, day, hill); sotto, "Nobody gives it" labels, rules, definitions, barrati. Chiude: "To guess well, it must learn in which situations words appear". Il flusso continua a scorrere anche quando la slide si ferma. Dura 14 s.

🎙️ **VOCE**:
> Prima di Jev c'è un modello di base, come quello di un LLM. Questo modello legge un'enorme quantità di testo: forum, libri, chat. Con un solo compito: indovinare la parola successiva.
> Nessuno gli dà etichette, regole o definizioni. Ma per indovinare bene deve imparare **in che situazioni compaiono le parole**.

### 06a · Passo 1 — Indovinare la parola dopo

🎬 **ANIMAZIONE**: [`slides/06a-parola-dopo.html`](./slides/06a-parola-dopo.html)

🖥️ **SCHERMO**: le tre frasi, la parola mancante appare dopo un attimo.

```
"Mi ha detto che sono brutto e ci sono rimasto ___"   → male
"Sei brutto, ma come ti ___"                          → permetti
"Oggi il tempo è brutto, prendo l'___"                → ombrello
```

🎙️ **VOCE**:
> Nessuno gli scrive mai "brutto uguale offensivo". Eppure "sei brutto" compare quasi sempre vicino a litigi, persone ferite, scuse.
> I decision model, Jev compreso, partono da un modello che ha già fatto questo lavoro, quindi **eredita** tutto quello che ha imparato. Ecco perché sa che "sei brutto" è un'offesa senza che nessuno gliel'abbia insegnato.

### 06b · Passo 2 — Le parole diventano coordinate

🎬 **ANIMAZIONE**: [`slides/06b-coordinate.html`](./slides/06b-coordinate.html)

🖥️ **SCHERMO**: animazione dei punti che si raggruppano in "zona offese" e "zona cortesia".

🎙️ **VOCE**:
> Dentro il modello ogni parola diventa una lista di numeri: un punto in uno spazio con migliaia di dimensioni.
> È difficile da immaginare, quindi lo semplifico in questa slide usando solo 2 dimensioni.
> Le parole usate in contesti simili finiscono vicine. "Insulto", "idiota", "stupido" da una parte. "Grazie", "gentile", "complimenti" dall'altra.
> E "you're ugly" finisce vicino a "insulto" e lontano da "complimenti": ecco perché Jev la riconosce come un'offesa.
> **Il significato è la posizione.**

### 06c · Passo 3 — Il contesto cambia il significato

🎬 **ANIMAZIONE**: [`slides/06c-attention.html`](./slides/06c-attention.html). A destra la mappa con tre zone (insults, weather, reviews) e "ugly" da sola al centro, in grigio: ambigua. A sinistra le tre frasi, una alla volta, con l'arco di attention: a ogni frase una copia di "ugly" vola in una zona diversa. Finale: "Same word, three places". Dura 16 s.

🖥️ **SCHERMO**: tre frasi, una freccia da "brutto" alla parola che "guarda", e "brutto" che finisce in tre posti diversi della mappa.

```
"SEI brutto"          → guarda "sei"   → rivolto a una persona → offesa
"il tempo è brutto"   → guarda "tempo" → giudizio sul meteo   → neutro
"che brutto film"     → guarda "film"  → critica a un'opera   → neutro
```

🎙️ **VOCE**:
> Ma "brutto" da solo non è offensivo: si può usare anche in un contesto simpatico. Con il meccanismo di **attention**, ogni parola guarda le altre della frase e si aggiorna.
> "Sei brutto" è rivolto a una persona. "Il tempo è brutto" parla del meteo. "Che brutto film" è una critica.
> Da sola, "brutto" sta a metà strada. È il contesto a spostarla: vicino a "sei" finisce tra le offese, vicino a "tempo" tra il meteo, vicino a "film" tra le critiche. Stessa parola, tre posti diversi.

### 06d · Passo 4 — Anche le opzioni sono testo

🎬 **ANIMAZIONE**: [`slides/06d-opzioni.html`](./slides/06d-opzioni.html)

🖥️ **SCHERMO**: i quattro livelli di tossicità; una linea collega "SEI BRUTTO" al livello 3.

🎙️ **VOCE**:
> E le opzioni che passate voi? Anche quelle sono frasi, come "educato o neutro" o "critico ma rispettoso", e vengono comprese con lo stesso meccanismo.
> Il lavoro di Jev diventa un **confronto**: quanto è vicina la frase a "cortese o neutro"? E quanto a "insulti o attacchi personali"?
> Ecco perché le descrizioni contano così tanto: **sono metà del confronto**.

### Passo 5 — Imparare a scommettere

#### 06e · L'addestramento e le due lezioni

🎬 **ANIMAZIONE**: [`slides/06e-scommettere.html`](./slides/06e-scommettere.html). Il badge dell'addestramento (dati sintetici + RLCD), poi le due lezioni: rispondere solo scegliendo (la matita scrive, viene cancellata, diventa una casella) e probabilità oneste ("se dice 80%" → 10 prove, 8 giuste).

🖥️ **SCHERMO**: l'addestramento e le due lezioni.

🎙️ **VOCE**:
> Qui entra la parte specifica di TypeSafe. Addestrano Jev solo con **dati sintetici** e con un metodo che chiamano **RLCD**: Reinforcement Learning for Calibrated Decisions.
> Questo addestramento non gli insegna cosa è offensivo: lo sa già. Gli insegna due cose.
> A rispondere **solo** scegliendo tra le opzioni, invece di scrivere.
> E a dare probabilità **oneste**: se dice ottanta per cento, deve avere ragione circa otto volte su dieci.

#### 06f · Un esempio reale: "UGLY!!!"

🎬 **ANIMAZIONE**: [`slides/06f-scommessa.html`](./slides/06f-scommessa.html). L'esempio reale: le quattro barre di "UGLY!!!" che si riempiono, poi "An honest bet on every option." Dura 8 s.

🖥️ **SCHERMO**: le barre che si riempiono.

```
"UGLY!!!"
  0 Cortese         ▏ 0%
  1 Critico         ▏ 4%
  2 Polemico        ██ 10%
  3 Insulti         █████████████████ 86%
```

🎙️ **VOCE**:
> Un esempio reale. Su "you're ugly" Jev è sicuro al cento per cento: nessun dubbio. Su "UGLY!!!", che non dice a chi è rivolto, lascia un po' di margine: ottantasei per cento insulti, dieci polemico, quattro critico. Non risponde sempre "sicurissimo": scommette in proporzione a quanto è chiaro il testo.

### 06g · E quando sbaglia?

🎬 **ANIMAZIONE**: [`slides/06g-quando-sbaglia.html`](./slides/06g-quando-sbaglia.html)

🖥️ **SCHERMO**: `/1-jev/demo3`. Prima "UGLY!!!": Insults 86%, badge **Reject**. Poi "you absolute muppet, great post 😂": le barre si distribuiscono (6 · 7 · 34 · 53), confidenza 0.32, badge **Needs review**.

✂️ Valori verificati a ottobre 2026: ricontrollarli prima di registrare. Da evitare "you're ugly lol, love you": Jev lo legge come insulto (77%) e la demo lo rifiuta.

🎙️ **VOCE**:
> Proprio perché ragiona sui contesti, va in difficoltà quando il contesto è ambiguo. Uno scherzo tra amici. L'ironia. Un insulto "pulito", senza parolacce.
> In questi casi le probabilità si sparpagliano e la confidenza scende, anche di molto. Ed è esattamente il segnale che manda il commento **in revisione**, invece di decidere da solo.
> Come questo: c'è la risata, non si capisce se sta scherzando. Meglio una persona, o un LLM che lo interpreti.
>
> Jev sa le stesse cose generiche di un modello linguistico, con gli stessi limiti: non sa cosa è successo dopo il suo addestramento, non conosce i vostri dati se non glieli passate, e può sbagliare.
> La differenza è che, quando non è sicuro, **ve lo dice con un numero**.

---

## 7. Limiti e costi (9:15 – 10:15)

### 07a · Limiti

🎬 **ANIMAZIONE**: [`slides/07a-limiti.html`](./slides/07a-limiti.html). Le quattro card dei limiti (255 opzioni, 2–10 livelli, 64k token, scatola chiusa), poi il paper indipendente e "It doesn't replace an LLM: it works alongside it". Dura 9 s.

🖥️ **SCHERMO**: slide "Limiti", un punto alla volta.

🎙️ **VOCE**:
> Qualche limite da conoscere, tenendo conto che cambiano quasi di settimana in settimana.
> Fino a 255 opzioni per una choice, da 2 a 10 livelli per uno score.
> 64 mila token in input.
> È una **scatola chiusa**: niente pesi, niente architettura pubblicata.
> E le prestazioni dichiarate, dai 70 ai 500 millisecondi, da 40 a 200 volte più veloce di un LLM, vengono dai test dello stesso team. Lo dicono anche loro: i numeri più alti della home page sono il caso migliore. Nel mio uso, comunque, i tempi sono quelli. Un paper indipendente lo trova **alla pari** con gli LLM in qualità: più veloce, ma senza grandi vantaggi oltre alle probabilità leggibili.
> E ci sono compiti che solo un LLM sa fare: bisogna capire quando un decision model è la scelta giusta. Più avanti li mettiamo a confronto su compiti che sanno fare bene tutti e due.

✂️ Nel video dici che i limiti valgono "grosso modo" anche per Gemini Decision: le 255 opzioni coincidono, ma Gemini accetta fino a 256K token di input (non 64K) e fino a 1.000 domande per richiesta. Qui i numeri restano quelli di Jev; nel video conviene correggere o tagliare quel passaggio.

### 07b · Costi

🎬 **ANIMAZIONE**: [`slides/07b-costi.html`](./slides/07b-costi.html). Il listino (input $0.042, output $0), il calcolo fino a $1.26, poi lo state pagato una volta per tre domande. Dura 9 s.

🖥️ **SCHERMO**: slide "Costi": prima il listino `input: $0,042 / milione di token` · `output: $0`, poi il calcolo.

🎙️ **VOCE**:
> Sul prezzo, una cosa importante: **si paga solo l'input**. E in un LLM l'output è di solito la parte più cara. 4 centesimi di dollaro per milione di token. L'output è gratis: TypeSafe dice "too cheap to meter", troppo economico per misurarlo. Jev non scrive testo token per token, restituisce tutte le probabilità in un colpo solo.
> Per confronto, un LLM costa da 20 centesimi a 10 dollari per milione di token in input, e l'output costa circa 5 volte di più.
> E lo state si paga una volta per richiesta, non per domanda: conviene mettere più domande nella stessa chiamata.
> Una chiamata piccola sono circa 300 token: circa un millesimo di centesimo. Centomila commenti moderati sono trenta milioni di token: circa un dollaro e venticinque. Con un LLM parliamo di decine o centinaia di dollari.

✂️ Nel video dici che una domanda costa "0.00004, 0.0003": con 300 token a $0.042 per milione sono circa $0.0000126, cioè un millesimo di centesimo. Il conto è nella riga sopra.

### 07c · Non solo Jev

🎬 **ANIMAZIONE**: [`slides/07c-non-solo-jev.html`](./slides/07c-non-solo-jev.html). Tre schede affiancate: Jev, Liquid AI d1 / d1-ultra e Google Gemini Decision 1 ("NEW"). Sotto, una riga: gli stessi tre tipi di domanda (noul, choice, score). Poi due avvertenze: le immagini di d1-ultra pagate per domanda e i benchmark dei produttori. Chiude "A new category: decision models". Dura 14 s.

🎙️ **VOCE**:
> Jev non è più l'unico. A fine settembre **Liquid AI** ha pubblicato **d1**, e a metà ottobre **d1-ultra**, che legge anche le immagini: d1 costa meno e risponde un po' peggio, d1-ultra il contrario. E l'11 novembre è arrivato anche **Google**, con **Gemini Decision 1** e la sua **Decisions API**: testo, immagini, audio, video e PDF.
> Tutti e tre usano **gli stessi tre tipi di domanda**: noul, choice e score. Con Liquid funziona perfino l'SDK di TypeSafe, cambiando il `baseURL`; Google ha il suo SDK.
> I prezzi: Jev e d1-ultra costano 4 centesimi per milione di token in input, Gemini 10 centesimi. Output gratis per tutti. Una differenza: d1-ultra fa pagare le immagini **per ogni domanda**, Jev e Gemini l'input una volta per richiesta.
> E i benchmark in cui "siamo i primi" li fanno i produttori: lo dicono sia Liquid sia Google.
> Il punto è un altro: sta nascendo una **categoria**, e i tipi di domanda di Jev stanno diventando uno standard.

### Vercel AI Gateway (nessuna slide)

🖥️ **SCHERMO**: dashboard di Vercel AI Gateway.

🎙️ **VOCE**:
> In questa serie lo uso tramite **Vercel AI Gateway**: un solo conto per tutti i modelli, Zero Data Retention attivabile, e in produzione su Vercel non serve nemmeno la chiave.
> E si usa l'SDK ufficiale di TypeSafe cambiando solo il `baseURL`.
> Una nota pratica: sul mio account con il solo credito gratuito Jev rispondeva con un errore 403. Ho dovuto ricaricare dei crediti a pagamento, ne basta pochissimo.

---

## 8. Chiusura (10:15 – 10:45)

🎬 **ANIMAZIONE**: [`slides/08-chiusura.html`](./slides/08-chiusura.html)

🎙️ **VOCE** (in camera):
> Riassumendo in trenta secondi.
> Immaginate una persona che ha letto miliardi di conversazioni. Nessuno le ha mai spiegato cos'è un'offesa, ma ne ha viste così tante che la riconosce dal contesto. Quello è il pre-addestramento.
> Poi la allenate a fare solo test a crocette, scommettendo onestamente su ogni risposta. Quello è l'addestramento di Jev.
> **Un LLM vi risponde con un tema. Jev vi dice: risposta D, sicuro all'ottantasei per cento.**
> E sia chiaro: non sostituisce un LLM.

🖥️ **SCHERMO**: la home del progetto con i tre gruppi di demo: Jev, Jev e Gemini, Jev e le immagini.

🎙️ **VOCE**:
> Non sostituisce un LLM: lo affianca, per le micro-decisioni ad alto volume.

✂️ End screen: link al repository e al prossimo video. Il bonus sulle immagini (sezione 9) viene dopo: in montaggio va dopo l'end screen, oppure la frase "Nel prossimo video…" si sposta alla fine della sezione 9.

---

## 9. Bonus: Jev guarda le immagini (10:45 – 13:15)

Sezione bonus, dopo la chiusura. Demo: `/3-jev-images/demo1`. Valori verificati a ottobre 2026: ricontrollarli prima di registrare.

### 09 · Prompt vuoto: cos'è, e dov'è?

🎬 **ANIMAZIONE**: [`slides/09-soggetto.html`](./slides/09-soggetto.html). Il codice della route della demo (tre domande sulla stessa foto: `found`, `where`, `what`) e la risposta di Jev sulla foto del cane: il box sul cane, "dog" con probabilità 1 e tutte le altre etichette a 0. Dura 16 s.

🖥️ **SCHERMO**: `/3-jev-images/demo1`, foto del cane, campo vuoto, **Find it**: compare "dog · 100%" sul box.

🎙️ **VOCE**:
> I decision model non leggono solo testo ma anche immagini. In Jev è sperimentale; Gemini Decision le supporta già nella sua API, e con le immagini Google lavora da tempo.
> In questa demo carico una foto e non scrivo niente. Il codice chiede a Jev tre cose sul "soggetto principale": c'è? Dov'è? E cos'è, scegliendo da una lista: cane, gatto, persona, auto…

⏸ 6.1s
> Risposta: un rettangolo intorno al cane, e "dog", probabilità uno. Tutte le altre etichette a zero.
> Attenzione: Jev non inventa il nome. Sceglie dalla **vostra** lista, come una choice qualsiasi.
> E nella lista mettete sempre anche un'opzione "non lo so" o "niente di tutto questo", con le immagini come con il testo: senza, il modello è costretto a spingere verso una delle altre, e arrivano i falsi positivi.

✂️ Nel video Gemini Decision sulle immagini non l'avevi ancora provato: "le supporta già nella sua API" resta vero, ma evita di dire che funziona meglio finché non l'hai provato.

### 09a · Jev vede anche le immagini

🎬 **ANIMAZIONE**: [`slides/09a-immagini.html`](./slides/09a-immagini.html). La foto del cane e la chiamata: l'header sperimentale, `state: image(photo)`, poi la domanda nuova `box`; il box si posa sull'occhio. Dura 14 s.

🖥️ **SCHERMO**: `/3-jev-images/demo1`, clicco la foto del cane, scrivo "eye" e premo **Find it**.

🎙️ **VOCE**:
> Vediamo la chiamata. È la stessa di sempre. Cambiano due cose: un header, perché le immagini sono ancora sperimentali, e lo state, che adesso è una foto.
> E c'è un tipo di domanda nuovo, **box**: dove si trova quello che cerco?

### 09b · box: quattro numeri

🎬 **ANIMAZIONE**: [`slides/09b-box.html`](./slides/09b-box.html). I quattro bordi tracciati uno alla volta sulla foto (top 0.37, bottom 0.46, left 0.48, right 0.56), il box che ne nasce, confidence 0.72, poi la conversione in percentuali CSS. Dura 16 s.

🎙️ **VOCE**:
> La risposta di un box sono quattro numeri: i bordi del rettangolo più piccolo che contiene l'oggetto.
> Non sono pixel: sono frazioni dell'immagine, da 0 a 1, partendo dall'angolo in alto a sinistra. Top e bottom sull'altezza, left e right sulla larghezza.
> Nella pagina basta moltiplicarli per cento e usarli come percentuali CSS: il box resta al suo posto a qualsiasi dimensione. Con gli stessi numeri potete anche ritagliare l'oggetto.
> E c'è una confidence, quanto Jev è sicuro di quel rettangolo.

### 09c · C'è? Dov'è?

🎬 **ANIMAZIONE**: [`slides/09c-sempre-box.html`](./slides/09c-sempre-box.html). Un'immagine con decine di oggetti di casa, scrivo "A clock": il box si posa sull'orologio (confidence 0.93) e il resto si scurisce; la noul dice 0.99; poi l'`if` del codice e il controesempio "a cat" (0.01, not found). Dura 15 s.

🖥️ **SCHERMO**: nella demo, l'immagine degli oggetti (quarta miniatura), scrivo "A clock". Poi "a cat".

✂️ L'immagine è ingrandita 3× (1260×1050): all'originale 420×350 il box era largo dalla finestra alla TV, confidenza 0.45. Un buon esempio di "immagini piccole, box imprecisi".

🎙️ **VOCE**:
> Decine di oggetti, e chiedo: un orologio. Il box lo trova, confidenza novantatré per cento.
> Nella stessa chiamata c'è anche una noul: l'immagine contiene un orologio? Novantanove per cento.
> Perché chiederlo, se il box l'ha già trovato? Perché un box risponde **sempre**. Chiedete un gatto in questa immagine, e un rettangolo arriva lo stesso, da qualche parte. La noul invece dice uno per cento.
> E il codice decide: sopra il cinquanta per cento usiamo il box, sotto scriviamo "not found".

### 09d · Descrivi quello che cerchi

🎬 **ANIMAZIONE**: [`slides/09d-descrivi.html`](./slides/09d-descrivi.html). Tre prompt sulla stessa foto: "the main subject of the image" (box largo, 0.20), "the white car" (0.82), "the brown car" (0.43); poi due consigli dalla documentazione. Dura 16 s.

🖥️ **SCHERMO**: nella demo, foto delle auto: prima campo vuoto (soggetto principale), poi "the white car", poi "the brown car".

🎙️ **VOCE**:
> Un box copre un solo oggetto. Se ce ne sono due simili, Jev deve indovinare quale volete.
> "Il soggetto principale": box largo, confidenza venti per cento, non ha idea di quale sia. "L'auto bianca": il box si stringe, ottantadue per cento. "L'auto marrone": quarantatré, anche perché non è proprio marrone. Più la descrizione è vaga, più il box è incerto.
> Quindi: una domanda per oggetto, descritto con precisione. E se l'oggetto è piccolo, prima si ritaglia la zona e poi si chiede di nuovo.

✂️ Non serve "on the left / on the right": il colore basta. "The main subject" senza "of the image" dà un box già stretto (0.32–0.42), meno efficace. Da evitare "the rusty car": found scende sotto il 50%.

### 09e · Quanto ci mette, e cosa sapere

🎬 **ANIMAZIONE**: [`slides/09e-tempi-limiti.html`](./slides/09e-tempi-limiti.html). I tempi misurati (446–844 ms, una volta 2380 ms) e quattro cose da sapere: sperimentale, PNG o JPEG, 280–1568 px per lato, pagato come input. Dura 14 s.

🎙️ **VOCE**:
> Una foto, tre domande, una chiamata: analizzando cinque immagini di fila, di solito tra quattrocento e ottocento millisecondi l'una, qualche volta due secondi. Molto meno di un LLM, e abbastanza per un'interfaccia.
> Ma è ancora sperimentale: TypeSafe non la consiglia in produzione. Solo PNG o JPEG, lati tra 280 e 1568 pixel, e l'immagine si paga come token di input.
> E questi limiti cambiano con le versioni del modello e da un fornitore all'altro: controllate la documentazione di quello che usate.

---

## 10. In pratica: Jev + Gemini

Le sette demo del gruppo `/2-jev-and-gemini`: per ognuna il flusso e il codice che lo realizza. Ogni passo del diagramma illumina il blocco di codice corrispondente. Due impaginazioni alternate: orizzontale (diagramma a sinistra, codice a destra: 10a, 10d, 10f) e verticale (diagramma sopra, codice sotto: 10b, 10c, 10e, 10g).

### 10 · Come combinare Decision Models + LLM

🎬 **ANIMAZIONE**: [`slides/10-combinare.html`](./slides/10-combinare.html). Separatore della serie: titolo grande al centro, poi i due pezzi entrano dai lati e si uniscono con un "+": l'LLM (es. Gemini Flash) scrive righe di testo, il decision model (es. Jev) riempie una barra fino a 0.92. Sotto, "writes" e "decides". Dura 12 s.

🎙️ **VOCE**:
> Come si combinano un decision model e un LLM? Ognuno fa quello che sa fare: l'LLM scrive, il decision model decide, con un numero che il nostro codice può controllare.
> Non c'è un ordine fisso: a volte il decision model viene prima, a volte dopo. Uso Gemini Flash come LLM e Jev come decision model, ma vale con qualsiasi coppia: Gemini Flash con Gemini Decision, un modello di Anthropic con un decision model di terze parti. Contano i concetti.
> Nelle prossime demo li mettiamo insieme in quattro modi: l'LLM scrive e Jev controlla, l'LLM propone e Jev sceglie, Jev fa da guardia prima dell'LLM, e Jev smista, chiamando l'LLM solo quando serve.

### 10a · Gemini riscrive, Jev conferma

🎬 **ANIMAZIONE**: [`slides/10a-riscrive.html`](./slides/10a-riscrive.html). A sinistra il flusso dall'alto in basso: commento → Jev misura (0.78) → Gemini riscrive → Jev misura di nuovo (0.11) → prima e dopo. Una freccia tratteggiata torna da "Jev misura di nuovo" a "Gemini riscrive" ("still high? rewrite again"): è il loop possibile, non è nel codice della demo. A destra il codice di `/2-jev-and-gemini/demo1`, un blocco per passo. Dura 18 s.

🎙️ **VOCE**:
> Primo esempio: un commento maleducato, "Chi ti ha insegnato a programmare? Questo post è inutile."

⏸ 2.0s
> Jev misura quanto è offensivo, con una noul: 78%.

⏸ 4.2s
> Sopra una soglia, diciamo 0.7, lo passiamo a Gemini, che lo riscrive in tono educato, mantenendo il senso della critica.

⏸ 6.5s
> Ma non è detto che l'LLM abbia fatto un buon lavoro. Allora Jev rifà **la stessa domanda** sul testo nuovo: undici per cento.

⏸ 8.5s
> E se il numero restasse sopra 0.7? Lo rimandiamo a Gemini, e il loop si chiude da solo.
> Gemini scrive, Jev dimostra con un numero che la riscrittura ha funzionato. E il codice è tutto qui: una domanda, due chiamate a Jev e una a Gemini.

✂️ Tolto "con la stessa chiave del gateway": adesso Gemini usa la sua chiave tramite `@google/genai`, non il gateway di Vercel. Lo snippet della slide è ancora quello vecchio: passa `prompt` invece di `text` (l'errore che noti nel video), usa `generateText` e il commento "same AI Gateway". Da aggiornare all'SDK `@google/genai`.

### 10b · Gemini risponde, Jev valuta

🎬 **ANIMAZIONE**: [`slides/10b-risponde.html`](./slides/10b-risponde.html). In alto il flusso da sinistra a destra: messaggio del cliente → Gemini scrive → Jev valuta → verdetto "hold it". Sotto, a sinistra le domande per Jev (una choice e uno score), a destra le due chiamate di `/2-jev-and-gemini/demo2`. Dura 18 s.

🎙️ **VOCE**:
> Secondo esempio: un cliente scrive al supporto

⏸ 2.1s
> e Gemini prepara la risposta.

⏸ 4.0s
> Prima che parta, Jev la controlla con due domande: la risposta affronta davvero il problema, è generica, un classico boilerplate, o è fuori tema? Una **choice**. E come tratta il cliente: con educazione ed empatia, neutrale e un po' freddo, rude, o tossico? Uno **score** su quattro livelli.
> Jev vede tutti e due i testi, il messaggio e la risposta: la pertinenza ha senso solo rispetto alla richiesta.
> Qui la risposta è generica e scortese: "generic", e tono 2.74: su una scala da 0, educato, a 3, tossico, è quasi tossico. Non si manda: si rifà scrivere e si rivaluta.

### 10c · Gemini propone, Jev sceglie

🎬 **ANIMAZIONE**: [`slides/10c-propone.html`](./slides/10c-propone.html). Verticale. Commento → Gemini propone 3 risposte come dati → tre "Jev scores" in parallelo (0.50, 0.74, 1.00) → "highest score?" → la risposta migliore, "detailed". Sotto, la chiamata a Gemini con structured output e le tre chiamate a Jev con `Promise.all`. Dura 18 s.

🎙️ **VOCE**:
> Immaginiamo l'utente che inserisce un commento in un blog e vogliamo una risposta automatica tramite un LLM.

⏸ 2.0s
> Invece di correggere una bozza, ne faccio scrivere tre a Gemini: una secca, una cordiale, una dettagliata. Come dati strutturati (output schema), niente testo da interpretare.

⏸ 3.6s
> Jev le valuta tutte e tre **in parallelo**, con la stessa domanda: quanto è utile questa risposta?
> Il tempo richiesto per l'operazione non è la somma ma quello della più lenta.

⏸ 6.9s
> Otteniamo tre punteggi, zero virgola cinquanta, settantaquattro e uno, e il nostro codice tiene quella con il punteggio più alto.

### 10d · Email to Data: Jev fa da guardia, Gemini estrae

🎬 **ANIMAZIONE**: [`slides/10d-email.html`](./slides/10d-email.html). Orizzontale. Email → Jev controlla (1.00) → "P > 0.50?" → sì: bloccata. Il ramo "no" (Gemini estrae → JSON) resta attenuato, come il blocco di codice di Gemini: è la strada non presa. Dura 18 s.

🎙️ **VOCE**:
> Qui Jev fa da guardia contro il **prompt injection**. Gemini trasforma un'email in dati: date, importi, azioni. Ma un'email può contenere testo nascosto che dà ordini all'AI, ordini che non vogliamo che segua.

⏸ 2.1s
> Allora prima la legge Jev, con una choice: è una normale email, o contiene istruzioni nascoste per un assistente AI? Qui il rischio è al cento per cento.

⏸ 4.0s
> La decisione è nel nostro codice, una soglia leggibile. Sopra la soglia, la richiesta viene bloccata: l'email **non arriva mai a Gemini**, zero token.

⏸ 7.6s
> Sotto la soglia, invece, Gemini estrae i dati dall'email e prepara la risposta.

### 10e · Jev contro Gemini su 20 siti

🎬 **ANIMAZIONE**: [`slides/10e-siti.html`](./slides/10e-siti.html). Verticale. URL → scraping una volta → Decision Model e LLM classificano lo stesso testo in parallelo → confronto di tempi e accordo. Sotto, i criteri condivisi (types, sectors, levels) con due frecce rosa verso i due snippet: a sinistra Jev (domande e `systemOne`), a destra solo Gemini Flash (schema e `generateText`); sotto ogni card una barra: il Decision Model arriva in un decimo del tempo (illustrativo, non misurato). Dura 18 s.

🎙️ **VOCE**:
> Un confronto onesto: venti home page, lette una volta sola. Jev e Gemini ricevono lo stesso testo e le stesse tre domande: tipo di sito, settore, quanto è commerciale.
> Partono insieme, ognuno con il suo cronometro. L'unica differenza è il modello: chi è più veloce, e quanto sono d'accordo?
> Nelle mie prove Jev decide in tre-otto decimi di secondo per sito, l'LLM in qualche secondo, a volte dieci o venti. E i costi seguono: frazioni di centesimo da una parte, molto di più dall'altra.

✂️ Tempi dal video, non misurati in modo sistematico: se li citi, rileggili dalla demo `/2-jev-and-gemini/demo5`. Nel video dici anche che sull'animazione "ho accelerato troppo l'LLM": la barra resta illustrativa.

### 10f · Valutazione di un CSV: Jev contro Gemini

🎬 **ANIMAZIONE**: [`slides/10f-csv.html`](./slides/10f-csv.html). Orizzontale. Riga del CSV → DM e LLM rispondono → la stessa policy (`decide()`) trasforma le risposte in una decisione → confronto con la decisione attesa. A destra: 1 · le tre domande (una per tipo), 2 · i due modelli sulla stessa riga, 3 · la policy `decide()` (rischio massimo + soglie) e `decide(...) === row.expected` per entrambi. Dura 18 s.

🎙️ **VOCE**:
> Un CSV di commenti, ognuno con la decisione che avrebbe preso un moderatore umano.
> Tre domande, una per tipo: una choice per lo spam, uno score per la tossicità, una noul per i dati personali.
> E la **policy sta nel nostro codice**, non nel modello: ogni risposta diventa un rischio da zero a uno, e le soglie decidono pubblica, rivedi o rifiuta. Le regole le scrivete voi. La stessa policy per tutti e due i modelli: chi è d'accordo più spesso con l'umano?
> Sulle venti righe che ho scritto io, il decision model è d'accordo con me circa nove volte su dieci. E dove era incerto Jev, ero incerto anch'io: lì la strada giusta è la revisione umana.

✂️ "Nove volte su dieci" è dal video: verificarlo sulla demo `/2-jev-and-gemini/demo6` prima di citarlo dal vivo.

### 10g · Smart router: Jev smista, Gemini solo quando serve

🎬 **ANIMAZIONE**: [`slides/10g-router.html`](./slides/10g-router.html). Verticale. "Where is my order?" → Jev classifica (0.99, ~0.3 s) → "simple and P ≥ 0.50?" → sì: template, 0 token. Il ramo Gemini resta attenuato. Sotto, la choice sull'intento e il routing nel codice. Dura 18 s.

🎙️ **VOCE**:
> Ultimo esempio: una casella di supporto. Molti messaggi sono semplici: dov'è il mio ordine, come cambio la password.
> Jev classifica ogni messaggio in circa tre decimi di secondo: un saluto, lo stato di un ordine, un reset della password. Se l'intento è semplice e Jev è abbastanza sicuro, risponde un template, o un'azione: per il reset, un link alla pagina giusta. Zero token.
> Tutto il resto, o quando Jev non è sicuro, va a Gemini. E se la confidenza è bassissima, una terza strada: una persona.
> Gemini solo quando serve.

### 10h · 🚧 TODO — Demo time

🎬 **ANIMAZIONE**: [`slides/10h-demo.html`](./slides/10h-demo.html). Placeholder: icona e titolo. Dura 6 s.

🎙️ **VOCE**:
> _da scrivere_

---

## 11. Sommario

### 11 · Takeaways

🎬 **ANIMAZIONE**: [`slides/11-sommario.html`](./slides/11-sommario.html). Cinque punti, uno alla volta: l'LLM scrive e il Decision Model decide; tre tipi di domanda (noul, choice, score); la policy sta nel nostro codice; veloce ed economico; meglio insieme, DM + LLM. Poi il titolo di chiusura: "It doesn't replace an LLM: it works alongside it". Dura 16 s.

🎙️ **VOCE**:
> Riassumendo. Un LLM scrive, un decision model decide: una risposta con la sua probabilità.
> Tre tipi di domanda: noul, choice e score.
> La policy sta nel nostro codice, non nel prompt: sono soglie sulle probabilità.
> È veloce ed economico: si paga solo l'input.
> E insieme funzionano meglio: il decision model controlla, sceglie, fa da guardia e smista. L'LLM solo quando serve.
> Sono esempi semplici, ma lo schema si applica quasi ovunque.
> Non sostituisce un LLM: lo affianca, e spesso lavorano a braccetto.

---

## Checklist per la registrazione

- [ ] Crediti a pagamento attivi su Vercel AI Gateway (altrimenti le demo rispondono 403)
- [ ] `npm run dev` avviato, tab aperte su `/1-jev/demo1` e `/1-jev/demo3`
- [ ] Slide speaker (01b): nomi, ruoli, competenze e foto al posto dei segnaposto
- [ ] Prima di pubblicare: verificare la licenza dell'immagine degli oggetti di casa (09c, demo immagini)
- [ ] Bonus immagini: tab aperta su `/3-jev-images/demo1`, ricontrollare "eye" sul cane, "A clock" e "a cat" sugli oggetti, "the white car" sulle auto
- [ ] Ricontrollare in `/1-jev/demo3` "UGLY!!!" (Reject) e "you absolute muppet, great post 😂" (Needs review)
- [x] Il valore dell'hook è quello reale di `/1-jev/demo1` (0.79–0.81, ottobre 2026): ricontrollarlo prima di registrare
- [ ] Slide: tabella LLM vs Jev, tre tipi di domanda, pattern a tre fasce, limiti, costi
- [ ] Animazioni per i passi 2–5 (punti nello spazio, attention, barre)
