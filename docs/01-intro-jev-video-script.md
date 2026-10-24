# 01 · Intro a Jev — script del video

Basato su [01-intro-jev.md](./01-intro-jev.md). Durata stimata: **9–10 minuti**.

Le animazioni sono online su [fb-talks.github.io/jev](https://fb-talks.github.io/jev/) (← / → per passare da una slide all'altra).

Legenda:
- 🎙️ **VOCE**: il parlato (in camera o fuori campo)
- 🖥️ **SCHERMO**: cosa si vede
- ✂️ note di montaggio

---

## 0. Hook (0:00 – 0:30)

🖥️ **SCHERMO**: `/1-jev/demo1`. Scrivo "Who taught you to code? Useless post." e clicco **Analyze**. Compare "Offensive: 80%" circa (valore reale: 79–81%).

🎙️ **VOCE**:
> Questo non è un LLM per darvi una risposta testuale o che vi scrive un paragrafo per dirvi che il commento è offensivo.
> È un modello che vi risponde con un numero: offensivo, all'ottanta per cento. In pochi millisecondi anziché secondi o minuti.
> Si chiama **Jev**, e oggi vediamo cos'è, come si usa e, soprattutto, come fa a "sapere" che una frase è un insulto.

✂️ Titolo a schermo: **"Un LLM scrive. Jev sceglie."**

🎬 **ANIMAZIONE**: [`01-intro/00-hook.html`](./01-intro/00-hook.html). Lo stesso commento analizzato da un LLM (che scrive un paragrafo) e da Jev (che risponde 80% in un istante), poi il titolo. Dura 12 s, poi si ferma sul titolo.

---

## 1. Cos'è Jev (0:30 – 1:45)

🎬 **ANIMAZIONE**: [`01-intro/01-cos-e.html`](./01-intro/01-cos-e.html)

🎙️ **VOCE** (in camera):
> Jev è un modello di **TypeSafe AI**, una startup di San Francisco nata nel 2024. È uscito in early access a settembre 2026.
>
>Il nome Jev non è un acronimo, ma deriva dall'economista e logico ottocentesco William Stanley Jevons. 
> La startup TypeSafe AI ha scelto questo nome per via del celebre Paradosso di Jevons. In economia, questo principio dimostra che quando il progresso tecnologico rende l'uso di una risorsa più efficiente (riducendone i costi), il consumo totale di quella risorsa tende ad aumentare anziché diminuire, poiché si aprono infinite nuove possibilità di utilizzo

🖥️ **SCHERMO**: slide con due colonne.

| LLM | Jev |
|---|---|
| genera testo | sceglie tra opzioni |
| "Il commento sembra offensivo perché…" | `offensive: 0.80` |

🎙️ **VOCE**:
> Tecnicamente Jev è un **modello discriminativo**. Non genera testo: classifica, o stima un valore.
> Per ogni domanda vi restituisce una **distribuzione di probabilità** sulle opzioni che gli passate voi. E basta.
>
> E a differenza dei classificatori classici, **non dovete addestrarlo sui vostri dati**. Gli date le categorie al momento della richiesta, proprio come fareste con un prompt.
>
> TypeSafe lo chiama un modello **"System One"**, come il Sistema 1 di Kahneman: il pensiero veloce, intuitivo. Quello che usate quando riconoscete una faccia, non quando fate una moltiplicazione.

---

## 2. Come si usa: state + domande (1:45 – 3:30)

### 02a · State + domande

🎙️ **VOCE**:
> Usarlo è semplice. Gli mandate due cose.
> Uno **state**: il testo da valutare. Può essere una stringa, un oggetto JSON o un array.
> E una o più **domande**. Tutte a scelta multipla.

🎬 **ANIMAZIONE**: [`01-intro/02a-state-domande.html`](./01-intro/02a-state-domande.html). Il ticket di supporto come flusso: state e tre domande entrano in Jev in parallelo, escono tre risposte.

### 02b · I tre tipi di domanda

🎬 **ANIMAZIONE**: [`01-intro/02b-tipi-domanda.html`](./01-intro/02b-tipi-domanda.html). I tre tipi, una card alla volta, ognuna con un mini esempio dal ticket.

🖥️ **SCHERMO**: tabella dei tre tipi, che appare una riga alla volta.

| Tipo | Cosa fa | Restituisce |
|---|---|---|
| `noul` | vero / falso | `noul`: probabilità del "sì" (0–1) |
| `choice` | un'opzione da una lista **non ordinata** | `choice` (l'opzione scelta), `probabilities`, `confidence` |
| `score` | una posizione su una scala **ordinata** | `score` (media pesata dei livelli), `probabilities`, `confidence` |

🎙️ **VOCE**:
> Ci sono tre tipi di domanda.
> **noul**: sì o no. Vi dà la probabilità del sì.
> **choice**: una opzione da una lista, senza un ordine. Per esempio: reparto vendite, tecnico o pagamenti.
> **score**: una posizione su una scala ordinata. Per esempio: da "calmo" a "molto arrabbiato".

🖥️ **SCHERMO**: sotto ogni card compaiono i campi che Jev restituisce ("Jev returns").

🎙️ **VOCE**:
> Sotto ogni tipo vedete i campi che Jev vi restituisce: `noul`, `choice` o `score`, e per choice e score anche **probabilities** e **confidence**. Tra poco vediamo cosa contengono, con un esempio vero.

### 02c · Il codice del ticket

🎬 **ANIMAZIONE**: [`01-intro/02c-codice.html`](./01-intro/02c-codice.html). Il codice del ticket: si evidenziano lo state e le tre domande mentre ne parlo, poi i tre risultati (ogni risultato riaccende la sua domanda).

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
> Prendiamo un ticket di supporto: "I was charged twice for my payment, reply by today", cioè "mi hanno addebitato il pagamento due volte, rispondete entro oggi".
> Con una sola chiamata gli chiedo tre cose: a quale reparto mandarlo, quanto è frustrato il cliente, e se è urgente.

🖥️ **SCHERMO**: evidenzio le tre righe dei risultati.

```ts
answers.department.choice;   // "billing"
answers.frustration.score;   // 1.04
answers.urgent.noul;         // 0.92
```

🎙️ **VOCE**:
> Reparto: billing. E notate che in TypeScript è tipizzato: è una union delle opzioni che ho scritto io.
> Frustrazione: uno virgola zero quattro, cioè "frustrato ma educato". È una media pesata dei livelli, quindi in altri casi può cadere anche a metà tra due livelli.
> Urgente: novantadue per cento.

### 02d · noul

🎬 **ANIMAZIONE**: [`01-intro/02d-noul.html`](./01-intro/02d-noul.html). Prima di tre slide, una per tipo (in alto a destra noul · choice · score, quello attivo in rosa). A sinistra la domanda `urgent` e la risposta: un solo campo, `noul: 0.92`. A destra la barra a 0.92, un altro ticket a 0.17, la soglia `if (… > 0.8)`.

🎙️ **VOCE**:
> Ma cosa c'è esattamente dentro ogni risposta? Dipende dal tipo di domanda. Partiamo dalla più semplice.
> Una **noul** restituisce un solo numero: la probabilità che la risposta sia sì, da zero a uno. Per questo ticket, zero virgola novantadue. Per un ticket tranquillo, "quando avete un momento, gli abbonamenti annuali hanno uno sconto?", zero virgola diciassette.
> Niente probabilities, niente confidence: il numero stesso dice quanto Jev è sicuro. Vicino a uno, sicuramente sì; vicino a zero, sicuramente no; intorno a metà, non lo sa.
> E dove inizia il "sì" lo decide il vostro codice: per esempio, sopra zero virgola otto avviso il team.

### 02e · choice

🎬 **ANIMAZIONE**: [`01-intro/02e-choice.html`](./01-intro/02e-choice.html). A sinistra la domanda `department` e la risposta con i suoi tre campi, evidenziati uno alla volta. A destra: probabilities (billing 100%), choice = l'opzione più probabile, confidence con due casi reali (questo ticket 1.00; un ticket fuori tema, "Is the Acme T-shirt free with the annual plan?", diviso sales 72 / billing 28 → 0.58) e cosa farne.

🎙️ **VOCE**:
> Una **choice** restituisce tre campi.
> **probabilities**: una scommessa su ogni opzione, con i nomi che ho scritto io. Qui è tutto su billing: cento per cento.
> **choice**: semplicemente l'opzione più probabile. In TypeScript è tipizzata, quindi ci posso fare uno switch.
> **confidence**: quanto la scommessa è concentrata, da zero a uno. Qui è uno, perché è tutta su un'opzione. Ma se arriva un ticket fuori tema, "la T-shirt Acme è gratis con il piano annuale?", nessun team è quello giusto: la scommessa si divide, settantadue per cento sales e ventotto billing, e la confidence scende a zero virgola cinquantotto. Notate che non è la probabilità più alta: misura quanto è concentrata.
> E vi dice **quando fidarvi**: se è alta, il codice può agire da solo; se è bassa, meglio chiedere a una persona. È il pattern che vediamo tra poco.

### 02f · score

🎬 **ANIMAZIONE**: [`01-intro/02f-score.html`](./01-intro/02f-score.html). A sinistra la domanda `frustration` e la risposta. A destra una tabella: livello · valore · probabilità, poi valore × probabilità, la somma ≈ 1.04 (lo score), il pallino sulla scala, gli intervalli per 2 / 3 / 5 livelli, infine confidence 0.82.

🎙️ **VOCE**:
> Una **score** ha le stesse probabilities e la stessa confidence della choice, più il campo **score**.
> Qui le chiavi delle probabilities non sono nomi ma posizioni: zero, uno, due, nell'ordine in cui ho scritto i livelli. Tre per cento "calmo", ottantanove "frustrato ma educato", otto "molto arrabbiato".
> Lo **score** è la media dei livelli, pesata con le probabilità. Ogni livello vale la sua posizione: moltiplico valore per probabilità, zero, zero virgola ottantanove, zero virgola sedici. Sommo, e ottengo circa uno virgola zero quattro.
> Quindi lo score è una **posizione sulla mia scala**, non una percentuale: "frustrato ma educato", appena spostato verso "molto arrabbiato". E l'intervallo dipende da quanti livelli scrivete: con tre va da zero a due, con cinque da zero a quattro. Se vi serve un valore da zero a uno, dividete per l'ultimo livello, come fa la demo 3 con la tossicità.
> È comodo proprio perché è un numero solo: lo potete ordinare o metterci una soglia. Per esempio, sopra uno virgola cinque passo il ticket a un responsabile.
> E la confidence, zero virgola ottantadue, funziona come nella choice: la scommessa è concentrata, posso fidarmi.

### Due dettagli (in camera)

🎙️ **VOCE** (in camera):
> Due dettagli importanti.
> Primo: **le descrizioni delle opzioni sono il vostro prompt**. Non c'è un system prompt. Se un risultato vi sembra sbagliato, la prima cosa da fare è riscrivere la descrizione.
> Secondo: **le domande sono indipendenti** e vengono risposte in parallelo. Se una dipende dall'altra, per esempio la sottocategoria dopo la categoria, vi servono due chiamate.

---

## 3. Il pattern a tre fasce (3:30 – 4:45)

🎬 **ANIMAZIONE**: [`01-intro/03-tre-fasce.html`](./01-intro/03-tre-fasce.html)

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
> Se è sicuro, agite in automatico. Se è incerto, suggerite e lasciate che una persona confermi con un click. Se è molto incerto, lo mandate in coda manuale, o a un LLM più grande.
> La confidenza diventa una **leva di prodotto**: potete tarare le soglie nel tempo, guardando quante volte gli operatori correggono i suggerimenti.

🖥️ **SCHERMO**: `/1-jev/demo3`. Esempio 2 (il commento sarcastico sulla "ultimate guide"). Analizzo, poi muovo lentamente lo slider "Review from": il badge passa da **Needs review** a **Publish** e viceversa.

🎙️ **VOCE**:
> Questa è la demo di moderazione commenti che trovate nel repository. Guardate: muovo la soglia e la decisione cambia. **Senza richiamare Jev.** Le probabilità ce le abbiamo già; la policy è codice nostro.

✂️ Zoom sul badge mentre cambia.

---

## 4. Dove usarlo (4:45 – 5:30)

🎬 **ANIMAZIONE**: [`01-intro/04-casi-uso.html`](./01-intro/04-casi-uso.html)

🖥️ **SCHERMO**: due colonne di icone che compaiono una alla volta.

🎙️ **VOCE**:
> Dove lo usereste? Pensate a tutte le micro-decisioni ad alto volume.
>
> In un **CMS**: moderazione dei commenti, classificazione degli articoli per sezione o livello del lettore, una checklist pre-pubblicazione con tante domande sì/no in parallelo, una per ogni regola editoriale.
>
> In un **CRM**: smistamento di ticket ed email, lead scoring dal form contatti, deduplicazione dei contatti, rischio di abbandono in un batch notturno, oppure la "next best action" scelta da un insieme chiuso di azioni.
>
> In tutti questi casi non vi serve una frase. Vi serve **un tipo e una confidenza**.

---

## 5. Come fa a "sapere" le cose? (5:30 – 8:15)

🎬 **ANIMAZIONE**: [`01-intro/05-come-sa.html`](./01-intro/05-come-sa.html). Slide titolo: si disegna un punto interrogativo, poi "How does Jev know things?" e lo spoiler "the knowledge comes from before Jev" (passi 1–4: il modello di base; passo 5: l'addestramento di Jev). Dura 10 s.

🎙️ **VOCE** (in camera):
> La domanda che mi fanno sempre è questa: come fa a sapere che "sei brutto" è offensivo? Nessuno gliel'ha insegnato.
> La risposta è che **la conoscenza non viene dall'addestramento di Jev. Viene da prima.**

✂️ Disclaimer in sovrimpressione: _"TypeSafe non ha pubblicato i dettagli: questa è la ricostruzione più probabile."_

🎙️ **VOCE**:
> Premessa onesta: TypeSafe non ha pubblicato architettura né paper tecnico. Quella che vi racconto è la ricostruzione più probabile, coerente con come funzionano i modelli di questo tipo. Cinque passi.
> I primi quattro non riguardano Jev in sé, ma il **modello linguistico di base** su cui Jev è costruito: è lì che nasce la conoscenza. Solo il quinto è l'addestramento specifico di Jev.

### 05a · Passo 1 — Indovinare la parola dopo

🎬 **ANIMAZIONE**: [`01-intro/05a-parola-dopo.html`](./01-intro/05a-parola-dopo.html)

🖥️ **SCHERMO**: le tre frasi, la parola mancante appare dopo un attimo.

```
"Mi ha detto che sono brutto e ci sono rimasto ___"   → male
"Sei brutto, ma come ti ___"                          → permetti
"Oggi il tempo è brutto, prendo l'___"                → ombrello
```

🎙️ **VOCE**:
> Prima di Jev c'è un modello di base, come quello di un LLM. Questo modello legge un'enorme quantità di testo: forum, libri, chat. Con un solo compito: indovinare la parola successiva.
> Nessuno gli scrive mai "brutto uguale offensivo". Ma per indovinare bene deve imparare **in che situazioni compaiono le parole**. E "sei brutto" compare quasi sempre vicino a litigi, persone ferite, scuse.
> Jev parte da un modello che ha già fatto questo lavoro, quindi **eredita** tutto quello che ha imparato. Ecco perché sa che "sei brutto" è un'offesa senza che nessuno gliel'abbia insegnato.

### 05b · Passo 2 — Le parole diventano coordinate

🎬 **ANIMAZIONE**: [`01-intro/05b-coordinate.html`](./01-intro/05b-coordinate.html)

🖥️ **SCHERMO**: animazione dei punti che si raggruppano in "zona offese" e "zona cortesia".

🎙️ **VOCE**:
> Dentro il modello ogni parola diventa una lista di numeri: un punto in uno spazio con migliaia di dimensioni.
> È difficile da immaginare quindi lo semplifico in questas slide  usando solo 2 dimensioni.
> Le parole usate in contesti simili finiscono vicine. "Insulto", "idiota", "stupido" da una parte. "Grazie", "gentile", "complimenti" dall'altra.
> E "you're ugly" finisce vicino a "insulto" e lontano da "complimenti": ecco perché Jev la riconosce come un'offesa.
> **Il significato è la posizione.**

### 05c · Passo 3 — Il contesto cambia il significato

🎬 **ANIMAZIONE**: [`01-intro/05c-attention.html`](./01-intro/05c-attention.html). A destra la mappa con tre zone (insults, weather, reviews) e "ugly" da sola al centro, in grigio: ambigua. A sinistra le tre frasi, una alla volta, con l'arco di attention: a ogni frase una copia di "ugly" vola in una zona diversa. Finale: "Same word, three places". Dura 16 s.

🖥️ **SCHERMO**: tre frasi, una freccia da "brutto" alla parola che "guarda", e "brutto" che finisce in tre posti diversi della mappa.

```
"SEI brutto"          → guarda "sei"   → rivolto a una persona → offesa
"il tempo è brutto"   → guarda "tempo" → giudizio sul meteo   → neutro
"che brutto film"     → guarda "film"  → critica a un'opera   → neutro
```

🎙️ **VOCE**:
> Ma "brutto" da solo non è offensivo. Con il meccanismo di **attention**, ogni parola guarda le altre della frase e si aggiorna.
> "Sei brutto" è rivolto a una persona. "Il tempo è brutto" parla del meteo. "Che brutto film" è una critica.
> Da sola, "brutto" sta a metà strada. È il contesto a spostarla: vicino a "sei" finisce tra le offese, vicino a "tempo" tra il meteo, vicino a "film" tra le critiche. Stessa parola, tre posti diversi.

### 05d · Passo 4 — Anche le opzioni sono testo

🎬 **ANIMAZIONE**: [`01-intro/05d-opzioni.html`](./01-intro/05d-opzioni.html)

🖥️ **SCHERMO**: i quattro livelli di tossicità; una linea collega "SEI BRUTTO" al livello 3.

🎙️ **VOCE**:
> E le opzioni che passate voi? Anche quelle sono frasi, e vengono comprese con lo stesso meccanismo.
> Il lavoro di Jev diventa un **confronto**: quanto è vicina la frase a "cortese o neutro"? E quanto a "insulti o attacchi personali"?
> Ecco perché le descrizioni contano così tanto: **sono metà del confronto**.

### Passo 5 — Imparare a scommettere

#### 05e · L'addestramento e le due lezioni

🎬 **ANIMAZIONE**: [`01-intro/05e-scommettere.html`](./01-intro/05e-scommettere.html). Il badge dell'addestramento (dati sintetici + RLCD), poi le due lezioni: rispondere solo scegliendo (la matita scrive, viene cancellata, diventa una casella) e probabilità oneste ("se dice 80%" → 10 prove, 8 giuste).

🖥️ **SCHERMO**: l'addestramento e le due lezioni.

🎙️ **VOCE**:
> Qui entra la parte specifica di TypeSafe. Addestrano Jev solo con **dati sintetici** e con un metodo che chiamano **RLCD**: Reinforcement Learning for Calibrated Decisions.
> Questo addestramento non gli insegna cosa è offensivo: lo sa già. Gli insegna due cose.
> A rispondere **solo** scegliendo tra le opzioni, invece di scrivere.
> E a dare probabilità **oneste**: se dice ottanta per cento, deve avere ragione circa otto volte su dieci.

#### 05f · Un esempio reale: "UGLY!!!"

🎬 **ANIMAZIONE**: [`01-intro/05f-scommessa.html`](./01-intro/05f-scommessa.html). L'esempio reale: le quattro barre di "UGLY!!!" che si riempiono, poi "An honest bet on every option." Dura 8 s.

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

### 05g · E quando sbaglia?

🎬 **ANIMAZIONE**: [`01-intro/05g-quando-sbaglia.html`](./01-intro/05g-quando-sbaglia.html)

🖥️ **SCHERMO**: `/1-jev/demo3`. Prima "UGLY!!!": Insults 86%, badge **Reject**. Poi "you absolute muppet, great post 😂": le barre si distribuiscono (6 · 7 · 34 · 53), confidenza 0.32, badge **Needs review**.

✂️ Valori verificati a ottobre 2026: ricontrollarli prima di registrare. Da evitare "you're ugly lol, love you": Jev lo legge come insulto (77%) e la demo lo rifiuta.

🎙️ **VOCE**:
> Proprio perché ragiona sui contesti, va in difficoltà quando il contesto è ambiguo. Uno scherzo tra amici. L'ironia. Un insulto "pulito", senza parolacce.
> In questi casi le probabilità si sparpagliano e la confidenza scende. Ed è esattamente il segnale che manda il commento **in revisione**, invece di decidere da solo.
>
> Jev sa le stesse cose generiche di un modello linguistico, con gli stessi limiti: non sa cosa è successo dopo il suo addestramento, non conosce i vostri dati se non glieli passate, e può sbagliare.
> La differenza è che, quando non è sicuro, **ve lo dice con un numero**.

---

## 6. Limiti e costi (8:15 – 9:15)

### 06a · Limiti

🎬 **ANIMAZIONE**: [`01-intro/06a-limiti.html`](./01-intro/06a-limiti.html). Le quattro card dei limiti (255 opzioni, 2–10 livelli, 64k token, scatola chiusa), poi il paper indipendente e "It doesn't replace an LLM: it works alongside it". Dura 9 s.

🖥️ **SCHERMO**: slide "Limiti", un punto alla volta.

🎙️ **VOCE**:
> Qualche limite da conoscere.
> Fino a 255 opzioni per una choice, da 2 a 10 livelli per uno score.
> 64 mila token in input.
> È una **scatola chiusa**: niente pesi, niente architettura pubblicata.
> E le prestazioni dichiarate, dai 70 ai 500 millisecondi, da 40 a 200 volte più veloce di un LLM, vengono dai test dello stesso team. Lo dicono anche loro: i numeri più alti della home page sono il caso migliore. Un paper indipendente lo trova **alla pari** con gli LLM: più veloce, ma senza grandi vantaggi oltre alle probabilità leggibili.

### 06b · Costi

🎬 **ANIMAZIONE**: [`01-intro/06b-costi.html`](./01-intro/06b-costi.html). Il listino (input $0.042, output $0), il calcolo fino a $1.26, poi lo state pagato una volta per tre domande. Dura 9 s.

🖥️ **SCHERMO**: slide "Costi": prima il listino `input: $0,042 / milione di token` · `output: $0`, poi il calcolo.

🎙️ **VOCE**:
> Sul prezzo, una cosa importante: **si paga solo l'input**. 4 centesimi di dollaro per milione di token. L'output è gratis: TypeSafe dice "too cheap to meter", troppo economico per misurarlo. Jev non scrive testo token per token, restituisce tutte le probabilità in un colpo solo.
> Per confronto, un LLM costa da 20 centesimi a 10 dollari per milione di token in input, e l'output costa circa 5 volte di più.
> E lo state si paga una volta per richiesta, non per domanda: conviene mettere più domande nella stessa chiamata.
> Una chiamata piccola sono circa 300 token. Centomila commenti moderati sono trenta milioni di token: circa un dollaro e venticinque.

### Vercel AI Gateway (nessuna slide)

🖥️ **SCHERMO**: dashboard di Vercel AI Gateway.

🎙️ **VOCE**:
> In questa serie lo uso tramite **Vercel AI Gateway**: un solo conto per tutti i modelli, Zero Data Retention attivabile, e in produzione su Vercel non serve nemmeno la chiave.
> E si usa l'SDK ufficiale di TypeSafe cambiando solo il `baseURL`.
> Una nota pratica: sul mio account con il solo credito gratuito Jev rispondeva con un errore 403. Ho dovuto ricaricare dei crediti a pagamento, ne basta pochissimo.

---

## 7. Chiusura (9:15 – 9:45)

🎬 **ANIMAZIONE**: [`01-intro/07-chiusura.html`](./01-intro/07-chiusura.html)

🎙️ **VOCE** (in camera):
> Riassumendo in trenta secondi.
> Immaginate una persona che ha letto miliardi di conversazioni. Nessuno le ha mai spiegato cos'è un'offesa, ma ne ha viste così tante che la riconosce dal contesto. Quello è il pre-addestramento.
> Poi la allenate a fare solo test a crocette, scommettendo onestamente su ogni risposta. Quello è l'addestramento di Jev.
> **Un LLM vi risponde con un tema. Jev vi dice: risposta D, sicuro all'ottantasei per cento.**

🖥️ **SCHERMO**: la home del progetto con le tre demo.

🎙️ **VOCE**:
> Non sostituisce un LLM: lo affianca, per le micro-decisioni ad alto volume.
> Nel prossimo video partiamo da zero: configuriamo Vercel AI Gateway e scriviamo la prima demo, con una sola domanda. Il link al codice è in descrizione.

✂️ End screen: link al repository e al prossimo video.

---

## Checklist per la registrazione

- [ ] Crediti a pagamento attivi su Vercel AI Gateway (altrimenti le demo rispondono 403)
- [ ] `npm run dev` avviato, tab aperte su `/1-jev/demo1` e `/1-jev/demo3`
- [ ] Ricontrollare in `/1-jev/demo3` "UGLY!!!" (Reject) e "you absolute muppet, great post 😂" (Needs review)
- [x] Il valore dell'hook è quello reale di `/1-jev/demo1` (0.79–0.81, ottobre 2026): ricontrollarlo prima di registrare
- [ ] Slide: tabella LLM vs Jev, tre tipi di domanda, pattern a tre fasce, limiti, costi
- [ ] Animazioni per i passi 2–5 (punti nello spazio, attention, barre)
